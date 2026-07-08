interface RejectedOption {
  option: string;
  reason: string;
}

interface Props {
  chosenOption: string;
  rejectedOptions: RejectedOption[];
  onOverrideClick: () => void;
}

export default function VerdictCard({ chosenOption, rejectedOptions, onOverrideClick }: Props) {
  return (
    <div className="bg-[#F5F3EE] text-[#14151A] px-8 py-7 mt-8">
      <p className="font-mono-label text-[11px] tracking-widest uppercase text-[#6B6E7A] mb-3">
        Ruling
      </p>
      <p className="font-display text-2xl leading-snug mb-6">
        {chosenOption}
      </p>

      <p className="font-mono-label text-[11px] tracking-widest uppercase text-[#6B6E7A] mb-2 mt-6 border-t border-[#D8D4C9] pt-4">
        Struck From The Record — Not Erased
      </p>
      <div className="space-y-2">
        {rejectedOptions.map((r, i) => (
          <p key={i} className="text-sm text-[#5A5D68]">
            <span className="line-through decoration-[#B5B0A2]">{r.option}</span>
            {' — '}
            <span className="italic">{r.reason}</span>
          </p>
        ))}
      </div>

      <button
        onClick={onOverrideClick}
        className="mt-6 font-mono-label text-xs tracking-widest uppercase
                   border border-[#14151A] px-5 py-2.5
                   hover:bg-[#14151A] hover:text-[#F5F3EE] transition-colors"
      >
        Contest This Ruling
      </button>
    </div>
  );
}