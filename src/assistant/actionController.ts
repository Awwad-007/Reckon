// ActionController: the automation "driver" for Reckon.
//
// It does NOT call the LLM (that's apiClient.ts's job) and it does NOT
// reason about the dilemma (that's orchestrator.ts's job). It receives
// an already-validated FinalDecision — the same typed object App.tsx
// builds via buildFinalDecision() — and decides which primitives from
// assistant/automation.ts to run, and when.
//
// Risk tiering:
//   AUTO    -> reversible, local-only, no external communication. Fires
//              immediately, no user confirmation needed.
//   CONFIRM -> touches something outside the app's own state (the user's
//              real calendar, or a message drafted to another real
//              person). Never auto-fires; always staged for one-tap
//              approval in the UI.

import {
  buildTimeline,
  generateReminder,
  fireBrowserNotification,
  generateICS,
  buildFocusSession,
  generateSuggestedMessage,
  analyzeChanges,
  type TaskItem,
  type TimedTask,
  type Reminder,
} from '../assistant/automation';
import type { Verdict } from '../agents/fallbackData';

export interface FinalDecisionLike {
  decision: string;
  taskList: TaskItem[];
  originalTaskList: TaskItem[];
  confidence: number;
  rationale: string;
}

export type ActionRisk = 'auto' | 'confirm';

export interface ActionIntent {
  id: string;
  label: string;
  risk: ActionRisk;
  /** Executes the action and returns a short human-readable result string. */
  run: () => string;
}

export interface DispatchResult {
  timeline: TimedTask[];
  reminder: Reminder | null;
  /** Actions already executed (risk: 'auto'), with their result messages. */
  completed: { id: string; label: string; result: string }[];
  /** Actions staged and awaiting explicit user confirmation (risk: 'confirm'). */
  pending: ActionIntent[];
  /** Populated only when processVerdict() was called with a contested task id. */
  compromise: CompromiseProposal | null;
}

export interface CompromiseProposal {
  taskId: string;
  originalTask: TaskItem;
  /** A scaled-down version of the task — the middle ground between "keep as-is" and "fully bumped". */
  proposedTask: TaskItem;
  note: string;
}

function toTimedTasks(tasks: TaskItem[]): TimedTask[] {
  const now = new Date();
  return tasks.map(t => ({ ...t, start: now, end: now }));
}

/**
 * Classify + execute. Call this once per verdict (normal path in
 * App.handleSubmit, and again in handleOverrideOutcome — both converge
 * on buildFinalDecision(), so both can call this the same way).
 */
export function dispatch(decision: FinalDecisionLike): DispatchResult {
  const timeline = buildTimeline(toTimedTasks(decision.taskList));
  const reminder = generateReminder(timeline);
  const { kept, deferred } = analyzeChanges(decision.originalTaskList, decision.taskList);

  const completed: DispatchResult['completed'] = [];

  // --- AUTO tier: local, reversible, silent-by-default ---
  const autoIntents: ActionIntent[] = [
    {
      id: 'notify-next-task',
      label: 'Reminder for next task',
      risk: 'auto',
      run: () => {
        fireBrowserNotification(reminder);
        return reminder ? `Notified: ${reminder.message}` : 'No task to remind — nothing scheduled.';
      },
    },
    {
      id: 'focus-session',
      label: 'Focus session for top priority',
      risk: 'auto',
      run: () => {
        const session = buildFocusSession(kept);
        return session
          ? `Focus session prepared: ${session.task} (${session.duration} min)`
          : 'No focus-worthy task found.';
      },
    },
  ];

  autoIntents.forEach(intent => {
    completed.push({ id: intent.id, label: intent.label, result: intent.run() });
  });

  // --- CONFIRM tier: writes to the user's real calendar, or drafts a
  // message that goes to another real person. Never auto-fired. ---
  const pending: ActionIntent[] = [];

  pending.push({
    id: 'calendar-ics',
    label: 'Add today\'s plan to your calendar (.ics)',
    risk: 'confirm',
    run: () => generateICS(timeline),
  });

  const suggestedMessage = generateSuggestedMessage(deferred, kept);
  if (suggestedMessage) {
    pending.push({
      id: 'suggested-message',
      label: `Send update about "${suggestedMessage.taskTitle}"`,
      risk: 'confirm',
      run: () => suggestedMessage.message,
    });
  }

  return { timeline, reminder, completed, pending, compromise: null };
}

/**
 * Compromise Negotiation path: called when the user contests a specific
 * task rather than the whole verdict. Instead of a binary "keep it
 * bumped" vs "fully restore it", this proposes a scaled-down middle
 * ground — same task, reduced time — for the user to accept, reject, or
 * take back to the enforcer.
 *
 * This never runs automatically; it's only produced when processVerdict()
 * is called with a contestedTaskId, and always lands in `pending` for
 * confirmation like any other CONFIRM-tier action.
 */
export function negotiateCompromise(
  contestedTaskId: string,
  verdict: Verdict,
  originalTaskList: TaskItem[]
): CompromiseProposal | null {
  const originalTask = originalTaskList.find(t => t.id === contestedTaskId);
  if (!originalTask) return null;

  const currentTask = verdict.updatedTaskList.find(t => t.id === contestedTaskId);
  const wasBumped = currentTask?.status === 'bumped';
  const halfTime = Math.max(5, Math.round(originalTask.estTimeMin / 2));

  const proposedTask: TaskItem = { ...originalTask, estTimeMin: halfTime, status: 'pending' };

  const note = wasBumped
    ? `Compromise: keep "${originalTask.title}" on today's list, scaled to ${halfTime} min, instead of dropping it entirely.`
    : `Compromise: trim "${originalTask.title}" to ${halfTime} min to free up room without fully bumping it.`;

  return { taskId: contestedTaskId, originalTask, proposedTask, note };
}

/**
 * Master entry point: takes raw orchestrator output (a Verdict) plus the
 * original task list, and drives the same auto/confirm dispatch as
 * dispatch() above. Pass contestedTaskId when the user is disputing one
 * specific task — that triggers the Compromise Negotiation path, staged
 * as a pending confirm action rather than applied automatically.
 */
export function processVerdict(
  verdict: Verdict,
  originalTaskList: TaskItem[],
  contestedTaskId?: string
): DispatchResult {
  const decision: FinalDecisionLike = {
    decision: verdict.chosenOption,
    taskList: verdict.updatedTaskList,
    originalTaskList,
    confidence: verdict.rejectedOptions.length <= 1 ? 0.85 : 0.6,
    rationale: verdict.contextRationale,
  };

  const result = dispatch(decision);

  if (!contestedTaskId) return result;

  const compromise = negotiateCompromise(contestedTaskId, verdict, originalTaskList);
  if (!compromise) return result;

  const compromiseIntent: ActionIntent = {
    id: `compromise-${contestedTaskId}`,
    label: `Accept compromise on "${compromise.originalTask.title}"`,
    risk: 'confirm',
    run: () => compromise.note,
  };

  return {
    ...result,
    compromise,
    pending: [...result.pending, compromiseIntent],
  };
}

export const ActionController = { dispatch, processVerdict, negotiateCompromise };
