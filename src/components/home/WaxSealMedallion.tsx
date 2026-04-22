"use client";

import type { SealData } from "@/lib/wiki/key-dates";

/**
 * Burgundy wax-seal medallion overlaid on the hero for Tier-1 family events
 * (birthdays, wedding anniversary). Static — no animation — with a warm
 * gold-and-burgundy glow baked into the drop-shadow stack. Accessible via
 * aria-label; no interaction.
 */
export function WaxSealMedallion({ data }: { data: SealData }) {
  const aria = `${data.subjectLabel}, ${data.accessibleDate}. ${data.centerNumber} ${data.centerLabel}.`;

  return (
    <div className="wax-seal" role="img" aria-label={aria}>
      <svg
        viewBox="0 0 180 180"
        width="160"
        height="160"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <radialGradient id="wax-seal-fill" cx="38%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#b64040" />
            <stop offset="45%" stopColor="#8b2c2c" />
            <stop offset="100%" stopColor="#4d1414" />
          </radialGradient>
          <radialGradient id="wax-seal-sheen" cx="30%" cy="22%" r="50%">
            <stop offset="0%" stopColor="rgba(255,235,200,0.45)" />
            <stop offset="100%" stopColor="rgba(255,235,200,0)" />
          </radialGradient>
          <path
            id="wax-seal-ring-top"
            d="M 32 90 A 58 58 0 0 1 148 90"
            fill="none"
          />
        </defs>

        {/* Scalloped outer edge — tiny petal bumps around the wax */}
        <g className="wax-seal-edge" fill="#5a1818">
          {Array.from({ length: 24 }).map((_, i) => {
            const angle = (i / 24) * Math.PI * 2;
            const cx = 90 + Math.cos(angle) * 82;
            const cy = 90 + Math.sin(angle) * 82;
            return <circle key={i} cx={cx} cy={cy} r="4.5" />;
          })}
        </g>

        <circle cx="90" cy="90" r="80" fill="#5a1818" />
        <circle cx="90" cy="90" r="77" fill="url(#wax-seal-fill)" />
        <circle cx="90" cy="90" r="77" fill="url(#wax-seal-sheen)" />

        {/* Decorative inner rings */}
        <circle
          cx="90"
          cy="90"
          r="68"
          fill="none"
          stroke="#d4a843"
          strokeOpacity="0.55"
          strokeWidth="1"
        />
        <circle
          cx="90"
          cy="90"
          r="64"
          fill="none"
          stroke="#d4a843"
          strokeOpacity="0.25"
          strokeWidth="0.5"
        />

        {/* Subject name running along the top arc */}
        <text className="wax-seal-ring-text" fill="#f5e8c8">
          <textPath
            href="#wax-seal-ring-top"
            startOffset="50%"
            textAnchor="middle"
          >
            {data.subjectLabel}
          </textPath>
        </text>

        {/* Small flourish between ring text and center */}
        <text
          x="90"
          y="58"
          textAnchor="middle"
          className="wax-seal-flourish"
          fill="#d4a843"
        >
          ✦
        </text>

        {/* Center stamped number + label */}
        <text
          x="90"
          y="105"
          textAnchor="middle"
          className="wax-seal-number"
          fill="#f5e8c8"
        >
          {data.centerNumber}
        </text>
        <text
          x="90"
          y="122"
          textAnchor="middle"
          className="wax-seal-label"
          fill="#f5e8c8"
        >
          {data.centerLabel}
        </text>

        {/* Date line across the bottom */}
        <text
          x="90"
          y="148"
          textAnchor="middle"
          className="wax-seal-date"
          fill="#f5e8c8"
        >
          {data.dateLabel}
        </text>
      </svg>
    </div>
  );
}
