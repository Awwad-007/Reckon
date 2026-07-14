import { useState } from 'react';

interface Props {
  reason: string;
}

export default function WhyThisTooltip({ reason }: Props) {
  const [open, setOpen] = useState(false);

  if (!reason) return null;

  return (
    <span className="relative inline-block">
      <button
        onClick={() => setOpen(o => !o)}
        onBlur={() => setOpen(false)}
        className="font-mono-label text-[10px] tracking-widest uppercase
                   text-[#7C6FE0] border border-[#7C6FE0] px-2 py-0.5
                   hover:bg-[#7C6FE0] hover:text-[#14151A] transition-colors"
      >
        Why?
      </button>
      {open && (
        <div
          className="absolute z-10 top-full left-0 mt-2 w-64 bg-[#1D1F26]
                     border border-[#2A2D38] px-4 py-3 shadow-lg"
        >
          <p className="text-xs text-[#F5F3EE] leading-relaxed">{reason}</p>
        </div>
      )}
    </span>
  );
}
