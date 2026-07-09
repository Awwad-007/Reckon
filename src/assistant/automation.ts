export interface TaskItem {
  id: string;
  title: string;
  estTimeMin: number;
  urgency: 'low' | 'med' | 'high';
  status: 'pending' | 'done' | 'bumped';
}

export function analyzeChanges(originalTasks: TaskItem[], finalTaskList: TaskItem[]) {
  const changes: string[] = [];
  const kept: TaskItem[] = [];
  const deferred: TaskItem[] = [];

  finalTaskList.forEach(task => {
    const original = originalTasks.find(t => t.id === task.id);
    if (!original) return;

    if (task.status === 'bumped') {
      deferred.push(task);
      changes.push(`Deferred "${original.title}"`);
    } else {
      kept.push(task);
      if (original.estTimeMin !== task.estTimeMin) {
        changes.push(`Adjusted "${task.title}" from ${original.estTimeMin} to ${task.estTimeMin} minutes`);
      }
      if (original.title !== task.title) {
        changes.push(`Modified "${original.title}" to "${task.title}"`);
      }
    }
  });

  const originalOrder = originalTasks.map(t => t.id);
  const firstKept = kept[0];
  if (firstKept && originalOrder.indexOf(firstKept.id) > 0) {
    changes.push(`Moved "${firstKept.title}" to the first work block`);
  }

  return { changes, kept, deferred };
}

export interface TimedTask {
  id: string;
  title: string;
  estTimeMin: number;
  urgency: 'low' | 'med' | 'high';
  status: 'pending' | 'done' | 'bumped';
  start: Date;
  end: Date;
}

export interface Reminder {
  taskId: string;
  title: string;
  message: string;
}

export function buildTimeline(taskList: TimedTask[]): TimedTask[] {
  const order = { high: 0, med: 1, low: 2 };
  const active = taskList
    .filter(t => t.status !== 'bumped')
    .sort((a, b) => order[a.urgency] - order[b.urgency]);

  let cursor = new Date();
  return active.map(task => {
    const start = new Date(cursor);
    const end = new Date(cursor.getTime() + task.estTimeMin * 60000);
    cursor = end;
    return { ...task, start, end };
  });
}

export function generateReminder(timeline: TimedTask[]): Reminder | null {
  if (!timeline.length) return null;
  const next = timeline[0];
  return {
    taskId: next.id,
    title: next.title,
    message: `Next up: ${next.title} — starts now, est. ${next.estTimeMin} min.`,
  };
}

export function fireBrowserNotification(reminder: Reminder | null, onStatusChange?: (status: 'granted' | 'denied' | 'unsupported') => void): void {
  if (!reminder) return;

  if (!('Notification' in window)) {
    onStatusChange?.('unsupported');
    return;
  }

  if (Notification.permission === 'granted') {
    new Notification('Reckon', { body: reminder.message });
    onStatusChange?.('granted');
  } else if (Notification.permission === 'denied') {
    onStatusChange?.('denied');
  } else {
    Notification.requestPermission().then(perm => {
      if (perm === 'granted') {
        new Notification('Reckon', { body: reminder.message });
        onStatusChange?.('granted');
      } else {
        onStatusChange?.('denied');
      }
    });
  }
}

export function generateICS(timeline: TimedTask[]): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const toICSDate = (d: Date) =>
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;

  const events = timeline.map(t =>
    `BEGIN:VEVENT\nSUMMARY:${t.title}\nDTSTART:${toICSDate(t.start)}\nDTEND:${toICSDate(t.end)}\nEND:VEVENT`
  ).join('\n');

  return `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Reckon//EN\n${events}\nEND:VCALENDAR`;
}

export function downloadICS(icsString: string, filename = 'reckon-schedule.ics'): void {
  const blob = new Blob([icsString], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}