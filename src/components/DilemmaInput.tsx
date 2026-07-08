import { useState } from 'react';

interface Props {
  onSubmit: (text: string) => void;
  isLoading: boolean;
}

export default function DilemmaInput({ onSubmit, isLoading }: Props) {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    if (!text.trim() || isLoading) return;
    onSubmit(text.trim());
  };

  return (
    <div className="max-w-2xl mx-auto">
      <p className="font-mono-label text-xs tracking-widest text-[#7C6FE0] mb-3 uppercase">
        Case Submission
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="State your dilemma. Be specific — the swarm argues on facts, not vibes."
        rows={4}
        disabled={isLoading}
        className="w-full bg-[#1D1F26] text-[#F5F3EE] placeholder-[#6B6E7A]
                   border border-[#2A2D38] rounded-none px-5 py-4 font-inter text-[15px]
                   focus:outline-none focus:border-[#7C6FE0] transition-colors
                   disabled:opacity-50 resize-none"
      />
      <button
        onClick={handleSubmit}
        disabled={isLoading || !text.trim()}
        className="mt-4 font-mono-label text-xs tracking-widest uppercase
                   bg-[#F5F3EE] text-[#14151A] px-6 py-3
                   hover:bg-[#E8A33D] transition-colors
                   disabled:opacity-40 disabled:hover:bg-[#F5F3EE]"
      >
        {isLoading ? 'The Swarm Is Deliberating…' : 'Submit for Ruling'}
      </button>
    </div>
  );
}