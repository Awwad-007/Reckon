import { useState } from 'react';
import { buildTimeline, generateReminder, fireBrowserNotification, generateICS, downloadICS, type TimedTask } from '../assistant/automation';
import { getPersonalizationNote } from '../assistant/personalization';
import type { Task } from '../agents/fallbackData';

interface Props {
  finalTaskList: Task[];
}

export default function AssistantPanel({ finalTaskList }: Props) {
  const [timeline, setTimeline] = useState<TimedTask[] | null>(null);

  const handleActivate = () => {
    const built = buildTimeline(finalTaskList);
    setTimeline(built);
    const reminder = generateReminder(built);
    fireBrowserNotification(reminder);
  };

  const handleDownload = () => {
    if (!timeline) return;
    downloadICS(generateICS(timeline));
  };

  const note = getPersonalizationNote();

  return (
    <div className="bg-[#1D1F26] border border-[#2A2D38] px-6 py-5 mt-8">
      <p className="font-mono-label text-[11px] tracking-widest uppercase text-[#5FA8A0] mb-3">
        Assistant — Execution Layer
      </p>

      <p className="text-sm text-[#F5F3EE] italic mb-4">{note}</p>

      {!timeline ? (
        <button
          onClick={handleActivate}
          className="font-mono-label text-xs tracking-widest uppercase
                     bg-[#5FA8A0] text-[#14151A] px-5 py-2.5 hover:bg-[#7BC3BA] transition-colors"
        >
          Execute Ruling
        </button>
      ) : (
        <>
          <div className="space-y-2 mb-4">
            {timeline.map(t => (
              <div key={t.id} className="flex justify-between text-sm text-[#F5F3EE]">
                <span>{t.title}</span>
                <span className="font-mono-label text-[11px] text-[#6B6E7A]">
                  {t.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {' – '}
                  {t.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
          <button
            onClick={handleDownload}
            className="font-mono-label text-xs tracking-widest uppercase
                       border border-[#5FA8A0] text-[#5FA8A0] px-5 py-2.5
                       hover:bg-[#5FA8A0] hover:text-[#14151A] transition-colors"
          >
            Download Schedule (.ics)
          </button>
        </>
      )}
    </div>
  );
}