import { useState } from 'react';

interface Props {
  isOpen: boolean;
  overriddenPoint: string;
  overriddenTaskId: string;
  relevantAgentKey: string;
  onSubmitReason: (reason: string) => void;
  onClose: () => void;
  enforcerResponse: string | null;
  isLoading: boolean;
  onOverrideOutcome?: (outcome: 'conceded' | 'overrode_anyway') => void;
}

export default function OverrideModal({
  isOpen,
  overriddenPoint,
  relevantAgentKey,
  onSubmitReason,
  onClose,
  enforcerResponse,
  isLoading,
  onOverrideOutcome,
}: Props) {
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center px-4 z-50">
      <div className="bg-[#1D1F26] border border-[#2A2D38] max-w-lg w-full px-7 py-6">
        <p className="font-mono-label text-[11px] tracking-widest uppercase text-[#E8A33D] mb-3">
          Contesting the Ruling
        </p>
        <p className="font-display text-base text-[#F5F3EE] mb-5">
          "{overriddenPoint}"
        </p>

        {!enforcerResponse && (
          <>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="State your grounds for objection."
              rows={3}
              disabled={isLoading}
              className="w-full bg-[#14151A] text-[#F5F3EE] placeholder-[#6B6E7A]
                         border border-[#2A2D38] px-4 py-3 text-sm
                         focus:outline-none focus:border-[#E8A33D] resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => onSubmitReason(reason)}
                disabled={isLoading || !reason.trim()}
                className="font-mono-label text-xs tracking-widest uppercase
                           bg-[#E8A33D] text-[#14151A] px-5 py-2.5
                           disabled:opacity-40 hover:bg-[#F0B65C] transition-colors"
              >
                {isLoading ? 'Reviewing…' : 'Submit Objection'}
              </button>
              <button
                onClick={onClose}
                className="font-mono-label text-xs tracking-widest uppercase
                           text-[#6B6E7A] px-5 py-2.5 hover:text-[#F5F3EE] transition-colors"
              >
                Withdraw
              </button>
            </div>
          </>
        )}

        {enforcerResponse && (
          <>
            <p className="text-sm text-[#F5F3EE] leading-relaxed border-l-2 border-[#5FA8A0] pl-4 py-1 mb-5">
              {enforcerResponse}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { onOverrideOutcome?.('conceded'); onClose(); }}
                className="font-mono-label text-xs tracking-widest uppercase
                           bg-[#F5F3EE] text-[#14151A] px-5 py-2.5 hover:bg-[#5FA8A0] transition-colors"
              >
                Concede
              </button>
              <button
                onClick={() => { onOverrideOutcome?.('overrode_anyway'); onClose(); }}
                className="font-mono-label text-xs tracking-widest uppercase
                           text-[#6B6E7A] px-5 py-2.5 hover:text-[#F5F3EE] transition-colors"
              >
                Override Anyway
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}