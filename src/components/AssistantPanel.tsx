import { useState } from 'react';
import { buildFocusSession, analyzeChanges, downloadICS, type TaskItem } from '../assistant/automation';
import { getPersonalizationNote } from '../assistant/personalization';
import type { DispatchResult, ActionIntent } from '../actions/actionController';

interface FinalDecision {
  decision: string;
  taskList: TaskItem[];
  originalTaskList: TaskItem[];
  confidence: number;
  rationale: string;
}

interface Props {
  finalDecision: FinalDecision;
  actionResult: DispatchResult | null;
}

export default function AssistantPanel({ finalDecision, actionResult }: Props) {
  const [confirmedResults, setConfirmedResults] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedPlan, setCopiedPlan] = useState(false);

  const note = getPersonalizationNote();

  // Verdict has landed but ActionController hasn't dispatched yet (shouldn't
  // happen in practice since App.tsx dispatches synchronously, but keeps
  // this component safe to render defensively).
  if (!actionResult) {
    return (
      <div className="bg-[#1D1F26] border border-[#2A2D38] px-6 py-5 mt-8">
        <p className="font-mono-label text-[11px] tracking-widest uppercase text-[#5FA8A0] mb-3">
          Action Center
        </p>
        <p className="text-sm text-[#F5F3EE] italic">{note}</p>
      </div>
    );
  }

  const { changes, kept, deferred } = analyzeChanges(finalDecision.originalTaskList, finalDecision.taskList);
  const focusSession = buildFocusSession(kept);
  const timeline = actionResult.timeline;
  const totalMinutes = kept.reduce((sum, t) => sum + t.estTimeMin, 0);
  const lastTask = timeline[timeline.length - 1];
  const estimatedCompletion = lastTask
    ? lastTask.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  const copyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(prev => (prev === id ? null : prev)), 1500);
  };

  const copyPlanToClipboard = () => {
    const text = "Today's Plan\n" + kept.map((t, i) => `${i + 1}. ${t.title}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedPlan(true);
    setTimeout(() => setCopiedPlan(false), 1500);
  };

  const handleConfirm = (intent: ActionIntent) => {
    const result = intent.run();
    setConfirmedResults(prev => ({ ...prev, [intent.id]: result }));
    if (intent.id === 'calendar-ics') {
      downloadICS(result);
    }
  };

  return (
    <div className="bg-[#1D1F26] border border-[#2A2D38] px-6 py-5 mt-8">
      <p className="font-mono-label text-[11px] tracking-widest uppercase text-[#5FA8A0] mb-3">
        Action Center
      </p>
      <p className="text-sm text-[#F5F3EE] italic mb-5">{note}</p>

      <div className="border-t border-[#2A2D38] pt-4 mb-5">
        <p className="font-mono-label text-[11px] tracking-widest uppercase text-[#F5F3EE] mb-3">
          Actions
        </p>
        <div className="space-y-3">
          {/* Auto-fired, already executed by ActionController */}
          {actionResult.completed.map(c => (
            <div key={c.id} className="flex items-start justify-between gap-3 text-sm">
              <div>
                <p className="text-[#F5F3EE]">{c.label}</p>
                <p className="text-[#6B6E7A] text-xs mt-0.5">{c.result}</p>
              </div>
              <span className="font-mono-label text-[10px] tracking-widest uppercase text-[#5FA8A0] shrink-0 pt-0.5">
                Done
              </span>
            </div>
          ))}

          {/* Higher-stakes actions: staged, wait for explicit confirmation */}
          {actionResult.pending.map(intent => {
            const confirmed = confirmedResults[intent.id];
            return (
              <div key={intent.id} className="text-sm">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[#F5F3EE]">{intent.label}</p>
                  {confirmed ? (
                    <span className="font-mono-label text-[10px] tracking-widest uppercase text-[#5FA8A0] shrink-0 pt-0.5">
                      Done
                    </span>
                  ) : (
                    <button
                      onClick={() => handleConfirm(intent)}
                      className="font-mono-label text-[10px] tracking-widest uppercase shrink-0
                                 border border-[#5FA8A0] text-[#5FA8A0] px-3 py-1
                                 hover:bg-[#5FA8A0] hover:text-[#14151A] transition-colors"
                    >
                      Confirm
                    </button>
                  )}
                </div>

                {confirmed && intent.id === 'suggested-message' && (
                  <div className="mt-2 bg-[#14151A] border border-[#2A2D38] px-4 py-3">
                    <p className="text-sm text-[#F5F3EE] whitespace-pre-wrap mb-2">{confirmed}</p>
                    <button
                      onClick={() => copyText(intent.id, confirmed)}
                      className="font-mono-label text-xs tracking-widest uppercase
                                 border border-[#7C6FE0] text-[#7C6FE0] px-4 py-2
                                 hover:bg-[#7C6FE0] hover:text-[#14151A] transition-colors"
                    >
                      {copiedId === intent.id ? 'Copied' : 'Copy Message'}
                    </button>
                  </div>
                )}

                {confirmed && intent.id === 'calendar-ics' && (
                  <p className="text-xs text-[#6B6E7A] mt-1">Downloaded reckon-schedule.ics</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="border-t border-[#2A2D38] pt-4 mb-5">
        <div className="flex justify-between items-center mb-3">
          <p className="font-mono-label text-[11px] tracking-widest uppercase text-[#F5F3EE]">
            Today's Plan
          </p>
          <button
            onClick={copyPlanToClipboard}
            className="font-mono-label text-[10px] tracking-widest uppercase text-[#5FA8A0] hover:text-[#7BC3BA]"
          >
            {copiedPlan ? 'Copied' : 'Copy Plan'}
          </button>
        </div>
        <ol className="space-y-1.5 text-sm text-[#F5F3EE] list-decimal list-inside">
          {kept.map(t => <li key={t.id}>{t.title}</li>)}
        </ol>
        <p className="text-xs text-[#6B6E7A] mt-2">
          {totalMinutes} minutes reserved{estimatedCompletion ? ` — estimated completion ${estimatedCompletion}` : ''}
        </p>
      </div>

      <div className="border-t border-[#2A2D38] pt-4 mb-5">
        <p className="font-mono-label text-[11px] tracking-widest uppercase text-[#F5F3EE] mb-3">
          Today's Checklist
        </p>
        <div className="space-y-1.5 text-sm text-[#F5F3EE]">
          {kept.map(t => (
            <p key={t.id} className="flex items-center gap-2">
              <span className="w-3 h-3 border border-[#5FA8A0] inline-block shrink-0" /> {t.title}
            </p>
          ))}
        </div>
        {deferred.length > 0 && (
          <>
            <p className="font-mono-label text-[10px] tracking-widest uppercase text-[#6B6E7A] mt-4 mb-1">
              Deferred
            </p>
            {deferred.map(t => (
              <p key={t.id} className="text-sm text-[#6B6E7A] line-through">{t.title}</p>
            ))}
          </>
        )}
      </div>

      <div className="border-t border-[#2A2D38] pt-4 mb-5">
        <p className="font-mono-label text-[11px] tracking-widest uppercase text-[#F5F3EE] mb-3">
          Changes Made
        </p>
        <div className="space-y-1 text-sm text-[#F5F3EE]">
          {changes.map((c, i) => <p key={i}>• {c}</p>)}
          {changes.length === 0 && <p className="text-[#6B6E7A]">No changes — plan was already optimal.</p>}
        </div>
      </div>

      {focusSession && (
        <div className="border-t border-[#2A2D38] pt-4 mb-5">
          <p className="font-mono-label text-[11px] tracking-widest uppercase text-[#E8A33D] mb-3">
            Focus Session
          </p>
          <div className="bg-[#14151A] border border-[#2A2D38] px-4 py-3 space-y-2">
            <p className="text-sm text-[#F5F3EE] font-medium">{focusSession.task}</p>
            <p className="text-sm text-[#6B6E7A]">{focusSession.duration} minutes</p>
            <div className="pt-1 space-y-0.5">
              {focusSession.recommendations.map((r, i) => (
                <p key={i} className="text-xs text-[#6B6E7A]">• {r}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      <p className="border-t border-[#2A2D38] pt-5 text-sm text-[#6B6E7A] text-center italic">
        Your day has been reorganized. You're ready to start.
      </p>
    </div>
  );
}
