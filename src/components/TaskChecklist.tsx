import { getDeadlineBadge, type TaskItem } from '../assistant/automation';
import WhyThisTooltip from './WhyThisTooltip';

interface Props {
  kept: TaskItem[];
  /** From analyzeChanges(originalTaskList, taskList).changes — used to find a per-task reason. */
  changes: string[];
  onReschedule?: (taskId: string) => void;
}

function findReason(task: TaskItem, changes: string[]): string | null {
  return changes.find(c => c.includes(task.title)) ?? null;
}

// Placeholder — wire this to real calendar/task-store logic later.
// Kept as a plain function so it's easy to swap for a real implementation
// without changing the component's props contract.
function rescheduleToTomorrow(taskId: string): void {
  console.log(`[placeholder] Moving task ${taskId} to tomorrow.`);
}

export default function TaskChecklist({ kept, changes, onReschedule }: Props) {
  const handleReschedule = onReschedule ?? rescheduleToTomorrow;

  return (
    <div className="space-y-2">
      {kept.map(task => {
        const badge = getDeadlineBadge(task);
        const reason = findReason(task, changes);

        return (
          <div key={task.id} className="flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 border border-[#5FA8A0] inline-block shrink-0" />
              <span className="text-[#F5F3EE]">{task.title}</span>
              {badge && (
                <span
                  className="font-mono-label text-[9px] tracking-widest uppercase
                             bg-[#E8A33D] text-[#14151A] px-1.5 py-0.5"
                >
                  {badge.label}
                </span>
              )}
              {reason && <WhyThisTooltip reason={reason} />}
            </div>
            <button
              onClick={() => handleReschedule(task.id)}
              className="font-mono-label text-[10px] tracking-widest uppercase
                         text-[#6B6E7A] hover:text-[#F5F3EE] transition-colors shrink-0"
            >
              Quick-Reschedule
            </button>
          </div>
        );
      })}
    </div>
  );
}
