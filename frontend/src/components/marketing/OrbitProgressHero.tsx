import { useEffect, useState } from 'react';
import { Wallet, Link as LinkIcon, CheckCircle2 } from 'lucide-react';

type OrbitProgressHeroProps = {
  className?: string;
};

type StepNode = {
  id: string;
  label: string;
  sublabel: string;
  icon: typeof Wallet;
};

const STEPS: StepNode[] = [
  {
    id: 'address',
    label: 'Public Address',
    sublabel: 'GCFX...9Q2K',
    icon: Wallet,
  },
  {
    id: 'payment-link',
    label: 'Payment Link',
    sublabel: 'link2pay.app/pay/l2p_7X',
    icon: LinkIcon,
  },
  {
    id: 'status',
    label: 'Payment Status',
    sublabel: 'Confirmed  •  5s',
    icon: CheckCircle2,
  },
];

/* ── layout constants ── */
const W = 860;
const H = 340;
const CY = H / 2 + 6;
const NODE_X = [140, 430, 720];
const ORBIT_R = [68, 74, 68];
const ICON_R = 28;

/* ── orbiting particles per node ── */
const PARTICLES = [
  [
    { angle: 30, r: 58, size: 3.5 },
    { angle: 135, r: 62, size: 2.8 },
    { angle: 240, r: 56, size: 3.2 },
    { angle: 310, r: 64, size: 2.4 },
  ],
  [
    { angle: 15, r: 64, size: 3.6 },
    { angle: 110, r: 68, size: 3 },
    { angle: 210, r: 62, size: 2.6 },
    { angle: 300, r: 70, size: 2.8 },
  ],
  [
    { angle: 50, r: 58, size: 3.2 },
    { angle: 170, r: 62, size: 3.4 },
    { angle: 260, r: 56, size: 2.6 },
    { angle: 340, r: 64, size: 3 },
  ],
];

export default function OrbitProgressHero({ className }: OrbitProgressHeroProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [trail, setTrail] = useState<boolean[]>([true, false, false]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const sequence = [
      { step: 0, trail: [true, false, false] },
      { step: 0, trail: [true, true, false] },
      { step: 1, trail: [true, true, false] },
      { step: 1, trail: [true, true, true] },
      { step: 2, trail: [true, true, true] },
    ];

    let tick = 0;
    const interval = window.setInterval(() => {
      tick = (tick + 1) % sequence.length;
      setActiveStep(sequence[tick].step);
      setTrail(sequence[tick].trail);
    }, 1800);

    return () => window.clearInterval(interval);
  }, []);

  const containerClassName = ['ohero', className].filter(Boolean).join(' ');

  return (
    <figure
      className={containerClassName}
      role="img"
      aria-label="Payment flow: Public Address to Payment Link to Payment Status"
    >
      <svg
        className="ohero-svg"
        viewBox={`0 0 ${W} ${H}`}
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <filter id="oh-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="oh-line-glow" x="-20%" y="-50%" width="140%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <radialGradient id="oh-node-glow">
            <stop offset="0%" stopColor="hsl(175 75% 45%)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="hsl(175 75% 45%)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* ── background ambient blobs ── */}
        <circle cx={NODE_X[0]} cy={CY} r={130} fill="hsl(175 75% 45% / 0.035)" />
        <circle cx={NODE_X[1]} cy={CY} r={140} fill="hsl(175 75% 45% / 0.025)" />
        <circle cx={NODE_X[2]} cy={CY} r={130} fill="hsl(175 75% 45% / 0.035)" />

        {/* ── connectors ── */}
        {[0, 1].map((i) => {
          const x1 = NODE_X[i] + ORBIT_R[i] + 6;
          const x2 = NODE_X[i + 1] - ORBIT_R[i + 1] - 6;
          const lit = trail[i + 1];
          return (
            <g key={`conn-${i}`}>
              <line
                x1={x1} y1={CY} x2={x2} y2={CY}
                className="ohero-connector-bg"
              />
              <line
                x1={x1} y1={CY} x2={x2} y2={CY}
                className={`ohero-connector ${lit ? 'is-lit' : ''}`}
                filter="url(#oh-line-glow)"
              />
              <polygon
                points={`${x2 - 2},${CY - 6} ${x2 + 8},${CY} ${x2 - 2},${CY + 6}`}
                className={`ohero-arrow ${lit ? 'is-lit' : ''}`}
              />
              {lit && (
                <circle r="4" className="ohero-traveler" filter="url(#oh-line-glow)">
                  <animateMotion
                    dur="1.6s"
                    repeatCount="indefinite"
                    path={`M${x1},${CY} L${x2},${CY}`}
                  />
                </circle>
              )}
            </g>
          );
        })}

        {/* ── step nodes ── */}
        {STEPS.map((step, i) => {
          const cx = NODE_X[i];
          const isActive = activeStep === i;
          const isReached = trail[i];
          const Icon = step.icon;

          return (
            <g key={step.id} className={`ohero-node ${isActive ? 'is-active' : ''} ${isReached ? 'is-reached' : ''}`}>
              {/* ambient glow */}
              {isReached && (
                <circle cx={cx} cy={CY} r={ORBIT_R[i] + 24} fill="url(#oh-node-glow)" className="ohero-ambient" />
              )}

              {/* orbit ring */}
              <circle
                cx={cx} cy={CY} r={ORBIT_R[i]}
                className="ohero-orbit-ring"
                style={{ transformOrigin: `${cx}px ${CY}px` }}
              />

              {/* orbiting particles */}
              {PARTICLES[i].map((p, pi) => (
                <circle
                  key={pi}
                  cx={cx + p.r * Math.cos((p.angle * Math.PI) / 180)}
                  cy={CY + p.r * Math.sin((p.angle * Math.PI) / 180)}
                  r={p.size}
                  className="ohero-particle"
                  style={{
                    transformOrigin: `${cx}px ${CY}px`,
                    animationDelay: `${pi * -3}s`,
                    animationDuration: `${9 + pi * 2.5}s`,
                  }}
                />
              ))}

              {/* inner circles */}
              <circle cx={cx} cy={CY} r={ICON_R + 8} className="ohero-inner-ring" />
              <circle cx={cx} cy={CY} r={ICON_R} className="ohero-icon-bg" />

              {/* icon */}
              <foreignObject x={cx - 14} y={CY - 14} width={28} height={28}>
                <Icon
                  style={{
                    width: 24,
                    height: 24,
                    margin: '2px',
                    color: isReached ? 'hsl(175 75% 45%)' : 'hsl(215 15% 55%)',
                    transition: 'color 0.4s ease',
                  }}
                />
              </foreignObject>

              {/* label above */}
              <text
                x={cx} y={CY - ORBIT_R[i] - 22}
                textAnchor="middle"
                className="ohero-label"
              >
                {step.label}
              </text>

              {/* sublabel below */}
              <text
                x={cx} y={CY + ORBIT_R[i] + 32}
                textAnchor="middle"
                className="ohero-sublabel"
              >
                {step.sublabel}
              </text>

              {/* step badge */}
              <circle cx={cx + ICON_R + 4} cy={CY - ICON_R - 4} r={11} className="ohero-step-badge" />
              <text
                x={cx + ICON_R + 4} y={CY - ICON_R + 0.5}
                textAnchor="middle"
                className="ohero-step-num"
              >
                {i + 1}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
