'use client';

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  theme?: 'light' | 'dark';
  showWordmark?: boolean;
  showSubbrand?: boolean;
}

export default function Logo({
  size = 'sm',
  theme = 'light',
  showWordmark = true,
  showSubbrand = false,
}: LogoProps) {
  const configs = {
    xs: { iconSize: 20, iconR: 4,  fontSize: 12, subSize: 7  },
    sm: { iconSize: 28, iconR: 6,  fontSize: 14, subSize: 8  },
    md: { iconSize: 36, iconR: 8,  fontSize: 18, subSize: 9  },
    lg: { iconSize: 56, iconR: 12, fontSize: 24, subSize: 10 },
  };

  const c = configs[size];
  const s = c.iconSize;
  const isDark = theme === 'dark';

  // Colors
  const bg          = isDark ? '#ffffff' : '#0a0a0a';
  const fg          = isDark ? '#0a0a0a' : '#ffffff';
  const textPrimary = isDark ? '#ffffff' : '#0a0a0a';
  const textSecondary = isDark
    ? 'rgba(255,255,255,0.5)'
    : 'rgba(10,10,10,0.45)';

  // Bar dimensions scaled to icon size
  const barW = Math.max(3, Math.round(s * 0.13));
  const gap  = Math.max(2, Math.round(s * 0.10));
  const cx   = s / 2;

  // Three bars — short, medium, tall
  const bar1H = Math.round(s * 0.30);
  const bar2H = Math.round(s * 0.48);
  const bar3H = Math.round(s * 0.70);
  const barY  = Math.round(s * 0.82);

  const x1 = cx - barW - gap - barW / 2 - 1;
  const x2 = cx - barW / 2;
  const x3 = cx + gap + barW / 2 + 1;

  // Arrow points above bar3
  const arrowY = barY - bar3H - Math.round(s * 0.08);
  const arrowH = Math.round(s * 0.14);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: showWordmark ? Math.round(s * 0.35) : 0,
      }}
    >
      {/* Icon mark */}
      <svg
        width={s}
        height={s}
        viewBox={`0 0 ${s} ${s}`}
        fill="none"
        aria-hidden="true"
      >
        {/* Background */}
        <rect width={s} height={s} rx={c.iconR} fill={bg} />

        {/* Bar 1 — short */}
        <rect
          x={x1 - barW / 2}
          y={barY - bar1H}
          width={barW}
          height={bar1H}
          rx={Math.max(1, barW * 0.3)}
          fill={fg}
          opacity={0.35}
        />

        {/* Bar 2 — medium */}
        <rect
          x={x2 - barW / 2}
          y={barY - bar2H}
          width={barW}
          height={bar2H}
          rx={Math.max(1, barW * 0.3)}
          fill={fg}
          opacity={0.65}
        />

        {/* Bar 3 — tall */}
        <rect
          x={x3 - barW / 2}
          y={barY - bar3H}
          width={barW}
          height={bar3H}
          rx={Math.max(1, barW * 0.3)}
          fill={fg}
          opacity={1}
        />

        {/* Upward chevron arrow */}
        <path
          d={`M ${x1} ${arrowY + arrowH} L ${cx} ${arrowY} L ${x3 + barW / 2} ${arrowY + arrowH}`}
          stroke={fg}
          strokeWidth={Math.max(1.2, s * 0.045)}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>

      {/* Wordmark */}
      {showWordmark && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <span
            style={{
              fontFamily: 'var(--font-sans, system-ui, sans-serif)',
              fontSize: c.fontSize,
              fontWeight: 500,
              color: textPrimary,
              letterSpacing: '-0.3px',
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
            }}
          >
            Signal to Startup
          </span>
          {showSubbrand && (
            <span
              style={{
                fontFamily: 'var(--font-sans, system-ui, sans-serif)',
                fontSize: c.subSize,
                fontWeight: 400,
                color: textSecondary,
                letterSpacing: '1.8px',
                lineHeight: 1,
                whiteSpace: 'nowrap',
              }}
            >
              BY ENTREPAÍNEUR
            </span>
          )}
        </div>
      )}
    </div>
  );
}
