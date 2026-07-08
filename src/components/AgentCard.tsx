interface Props {
  agentName: string;
  reasoning: string;
  colorTheme: 'blue' | 'green' | 'purple';
}

const THEME_MAP = {
  blue:   { color: '#E8A33D', label: 'EXHIBIT A — EFFICIENCY' },
  green:  { color: '#5FA8A0', label: 'EXHIBIT B — WELLBEING' },
  purple: { color: '#7C6FE0', label: 'EXHIBIT C — CONSEQUENCE' },
};

export default function AgentCard({ agentName, reasoning, colorTheme }: Props) {
  const theme = THEME_MAP[colorTheme];

  return (
    <div
      className="bg-[#1D1F26] border-l-2 px-5 py-4 flex-1 min-w-[220px]"
      style={{ borderColor: theme.color }}
    >
      <p
        className="font-mono-label text-[11px] tracking-widest uppercase mb-2"
        style={{ color: theme.color }}
      >
        {theme.label}
      </p>
      <p className="font-display text-sm text-[#F5F3EE] leading-relaxed">
        {reasoning}
      </p>
    </div>
  );
}