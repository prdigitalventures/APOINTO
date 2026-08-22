function niceMax(n: number) {
  if (n <= 1) return 1;
  const pow = 10 ** Math.floor(Math.log10(n));
  const scaled = n / pow;
  const step = scaled <= 2 ? 2 : scaled <= 5 ? 5 : 10;
  return step * pow;
}

export function Sparkline({
  values,
  color,
  className,
}: {
  values: number[];
  color: string;
  className?: string;
}) {
  const w = 88;
  const h = 28;
  const max = Math.max(1, ...values);
  const min = Math.min(0, ...values);
  const span = Math.max(1, max - min);
  const pts = values
    .map((v, i) => {
      const x = values.length <= 1 ? w / 2 : (i / (values.length - 1)) * w;
      const y = h - 2 - ((v - min) / span) * (h - 4);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  const last = values[values.length - 1] ?? 0;
  const lastX = values.length <= 1 ? w / 2 : w;
  const lastY = h - 2 - ((last - min) / span) * (h - 4);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className} aria-hidden>
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" points={pts} />
      <circle cx={lastX} cy={lastY} r="2.4" fill={color} />
    </svg>
  );
}

export function GroupedBarChart({
  labels,
  series,
}: {
  labels: string[];
  series: Array<{ label: string; color: string; values: number[] }>;
}) {
  const w = 640;
  const h = 260;
  const pad = { t: 16, r: 12, b: 36, l: 36 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const max = niceMax(Math.max(1, ...series.flatMap((s) => s.values)));
  const n = Math.max(1, labels.length);
  const groupW = innerW / n;
  const barGap = 3;
  const barW = Math.min(18, (groupW - 10 - barGap * (series.length - 1)) / series.length);
  const ticks = 4;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-64 w-full" role="img" aria-label="Owners versus customers joined">
      {Array.from({ length: ticks + 1 }, (_, i) => {
        const y = pad.t + (innerH * i) / ticks;
        const val = Math.round(max * (1 - i / ticks));
        return (
          <g key={i}>
            <line x1={pad.l} x2={w - pad.r} y1={y} y2={y} className="stroke-gray-100 dark:stroke-gray-800" />
            <text x={pad.l - 8} y={y + 4} textAnchor="end" className="fill-gray-400 text-[10px]">
              {val}
            </text>
          </g>
        );
      })}
      {labels.map((label, i) => {
        const gx = pad.l + i * groupW + (groupW - series.length * barW - barGap * (series.length - 1)) / 2;
        return (
          <g key={label + i}>
            {series.map((s, si) => {
              const v = s.values[i] || 0;
              const bh = (v / max) * innerH;
              const x = gx + si * (barW + barGap);
              const y = pad.t + innerH - bh;
              return (
                <rect
                  key={s.label}
                  x={x}
                  y={y}
                  width={barW}
                  height={Math.max(v > 0 ? 4 : 0, bh)}
                  rx={4}
                  fill={s.color}
                >
                  <title>{`${label} ${s.label}: ${v}`}</title>
                </rect>
              );
            })}
            <text
              x={pad.l + i * groupW + groupW / 2}
              y={h - 12}
              textAnchor="middle"
              className="fill-gray-500 text-[9px]"
            >
              {n > 14 && i % 3 !== 0 ? '' : label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function AreaLineChart({
  labels,
  series,
  className = 'h-64 w-full',
}: {
  labels: string[];
  series: Array<{ label: string; color: string; values: number[] }>;
  className?: string;
}) {
  const w = 720;
  const h = 260;
  const pad = { t: 16, r: 16, b: 36, l: 36 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const max = niceMax(Math.max(1, ...series.flatMap((s) => s.values)));
  const n = Math.max(1, labels.length);
  const xAt = (i: number) => pad.l + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const yAt = (v: number) => pad.t + innerH - (v / max) * innerH;
  const ticks = 4;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className} role="img" aria-label="Bookings and shops over time">
      <defs>
        {series.map((s, i) => (
          <linearGradient key={s.label} id={`area-${i}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={s.color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={s.color} stopOpacity="0.02" />
          </linearGradient>
        ))}
      </defs>
      {Array.from({ length: ticks + 1 }, (_, i) => {
        const y = pad.t + (innerH * i) / ticks;
        const val = Math.round(max * (1 - i / ticks));
        return (
          <g key={i}>
            <line x1={pad.l} x2={w - pad.r} y1={y} y2={y} className="stroke-gray-100 dark:stroke-gray-800" />
            <text x={pad.l - 8} y={y + 4} textAnchor="end" className="fill-gray-400 text-[10px]">
              {val}
            </text>
          </g>
        );
      })}
      {series.map((s, si) => {
        const line = s.values.map((v, i) => `${xAt(i)},${yAt(v)}`).join(' ');
        const area = `${xAt(0)},${pad.t + innerH} ${line} ${xAt(n - 1)},${pad.t + innerH}`;
        return (
          <g key={s.label}>
            <polygon points={area} fill={`url(#area-${si})`} />
            <polyline
              points={line}
              fill="none"
              stroke={s.color}
              strokeWidth={si === 0 ? 2.6 : 2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {s.values.map((v, i) => (
              <circle key={i} cx={xAt(i)} cy={yAt(v)} r={n > 14 ? 0 : 3} fill={s.color}>
                <title>{`${labels[i]} ${s.label}: ${v}`}</title>
              </circle>
            ))}
          </g>
        );
      })}
      {labels.map((label, i) => (
        <text key={label + i} x={xAt(i)} y={h - 12} textAnchor="middle" className="fill-gray-500 text-[9px]">
          {n > 14 && i % 3 !== 0 ? '' : label}
        </text>
      ))}
    </svg>
  );
}

export function DonutChart({
  segments,
  centerLabel,
  centerValue,
}: {
  segments: Array<{ label: string; value: number; color: string }>;
  centerLabel: string;
  centerValue: string | number;
}) {
  const size = 220;
  const r = 68;
  const c = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.value, 0);
  let offset = 0;
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
      <svg viewBox={`0 0 ${size} ${size}`} className="h-44 w-44" role="img" aria-label="Live versus not-live shops">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          className="stroke-gray-100 dark:stroke-gray-800"
          strokeWidth="22"
        />
        {segments.map((seg) => {
          const frac = total === 0 ? 0 : seg.value / total;
          const dash = frac * c;
          const el = (
            <circle
              key={seg.label}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth="22"
              strokeDasharray={`${dash} ${c - dash}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            >
              <title>{`${seg.label}: ${seg.value}`}</title>
            </circle>
          );
          offset += dash;
          return el;
        })}
        <text
          x={size / 2}
          y={size / 2 - 6}
          textAnchor="middle"
          className="fill-gray-900 text-2xl font-bold dark:fill-white"
        >
          {centerValue}
        </text>
        <text x={size / 2} y={size / 2 + 16} textAnchor="middle" className="fill-gray-500 text-[11px]">
          {centerLabel}
        </text>
      </svg>
      <ul className="space-y-2 text-sm">
        {segments.map((seg) => (
          <li key={seg.label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: seg.color }} />
            <span className="text-gray-600 dark:text-gray-300">{seg.label}</span>
            <span className="ml-auto font-semibold tabular-nums">{seg.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
