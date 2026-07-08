import type { Task } from '../agents/fallbackData';

export interface TimedTask extends Task {
  start: Date;
  end: Date;
}

export interface Reminder {
  taskId: string;
  title: string;
  message: string;
}

export function buildTimeline(updatedTaskList: Task[]): TimedTask[] {
  const order = { high: 0, med: 1, low: 2 };
  const active = updatedTaskList
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

export function fireBrowserNotification(reminder: Reminder | null): void {
  if (!reminder) return;
  if (!('Notification' in window)) {
    console.warn('Browser notifications not supported.');
    return;
  }
  if (Notification.permission === 'granted') {
    new Notification('Reckon', { body: reminder.message });
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(perm => {
      if (perm === 'granted') new Notification('Reckon', { body: reminder.message });
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