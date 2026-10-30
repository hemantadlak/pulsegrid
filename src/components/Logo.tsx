// PULSEGRID Logo component with animated ECG line
export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const fontSize = size === 'lg' ? 32 : size === 'md' ? 20 : 16
  const svgHeight = size === 'lg' ? 28 : 20

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1 }}>
        <span style={{ color: 'var(--accent-blue)' }}>PULSE</span>
        <span style={{ color: 'var(--text-primary)' }}>GRID</span>
      </span>
      <svg
        width={svgHeight * 3}
        height={svgHeight}
        viewBox="0 0 60 20"
        fill="none"
        style={{ overflow: 'visible' }}
      >
        <polyline
          points="0,10 8,10 12,2 16,18 20,10 26,10 30,4 34,16 38,10 60,10"
          stroke="var(--accent-blue)"
          strokeWidth="1.8"
          fill="none"
          className="ecg-line"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}
