import { useId } from 'react'

/* Shared data + generated artwork for the portfolio sections (Manifesto grid and
   Featured Projects). Everything is vector, so no image assets are needed – swap
   <ProjectArt> for real <img> thumbnails whenever you have them. */

export const DISPLAY_FONT = '"Bricolage Grotesque", system-ui, -apple-system, "Segoe UI", sans-serif'
export const SERIF_FONT = '"Instrument Serif", "Playfair Display", Georgia, serif'
export const ACCENT = '#c6ff3d'

export const PROJECTS = [
  { id: 'aure', variant: 'aure', name: 'Auré Studio', role: 'Photography / Art Direction', year: '2025', blurb: 'A warm, editorial identity for a light-driven photography studio.' },
  { id: 'veloce', variant: 'veloce', name: 'Veloce', role: 'Automotive / Brand Experience', year: '2025', blurb: 'Launch experience that makes a hypercar feel like it is already moving.' },
  { id: 'grain', variant: 'grain', name: 'Grain Studio', role: 'Fashion / Creative Direction', year: '2024', blurb: 'Tactile, film-grain campaign system for an independent fashion house.' },
  { id: 'aether', variant: 'aether', name: 'Aether', role: 'Architecture / Digital Identity', year: '2024', blurb: 'Digital identity and portfolio for a studio that draws with light.' },
]

/* ---------- artwork ---------- */

function Aure() {
  return (
    <>
      <defs>
        <linearGradient id="aure-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffd9b0" />
          <stop offset="1" stopColor="#e2704a" />
        </linearGradient>
      </defs>
      <rect width="400" height="400" fill="url(#aure-bg)" />
      <circle cx="200" cy="170" r="118" fill="#fff3e3" opacity=".92" />
      <circle cx="200" cy="170" r="72" fill="none" stroke="#2a1410" strokeWidth="10" />
      <circle cx="200" cy="170" r="34" fill="#2a1410" />
      <circle cx="188" cy="158" r="9" fill="#fff3e3" opacity=".8" />
      <rect y="300" width="400" height="100" fill="#2a1410" />
      <rect x="40" y="326" width="120" height="8" rx="4" fill="#ffd9b0" />
      <rect x="40" y="346" width="70" height="8" rx="4" fill="#ffd9b0" opacity=".5" />
    </>
  )
}

function Veloce() {
  return (
    <>
      <defs>
        <linearGradient id="vel-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#14080a" />
          <stop offset="1" stopColor="#8f1118" />
        </linearGradient>
      </defs>
      <rect width="400" height="400" fill="url(#vel-bg)" />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <polygon key={i} points={`${-40 + i * 70},400 ${20 + i * 70},400 ${220 + i * 70},0 ${160 + i * 70},0`} fill="#fff" opacity={0.04 + i * 0.012} />
      ))}
      <path d="M30 262 C 80 200, 150 178, 230 180 C 300 182, 350 215, 372 262 Z" fill="#f2f2f2" />
      <path d="M118 214 C 150 196, 210 192, 254 200 L 300 230 L 140 230 Z" fill="#14080a" opacity=".85" />
      <circle cx="108" cy="266" r="26" fill="#14080a" stroke="#f2f2f2" strokeWidth="6" />
      <circle cx="298" cy="266" r="26" fill="#14080a" stroke="#f2f2f2" strokeWidth="6" />
      <rect x="0" y="300" width="400" height="3" fill="#fff" opacity=".25" />
    </>
  )
}

function Grain({ uid }) {
  return (
    <>
      <defs>
        <filter id={`gr-${uid}`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="4" />
          <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .55 0" />
        </filter>
      </defs>
      <rect width="400" height="400" fill="#dcd2c2" />
      {[
        [30, '#2b2b2b', 250], [110, '#b8452e', 330], [190, '#f2ead9', 210], [270, '#2b2b2b', 290], [340, '#b8452e', 170],
      ].map(([x, c, h], i) => (
        <rect key={i} x={x} y={400 - h} width="58" height={h} fill={c} />
      ))}
      <circle cx="200" cy="110" r="46" fill="#f2ead9" />
      <rect width="400" height="400" filter={`url(#gr-${uid})`} opacity=".7" />
    </>
  )
}

function Aether() {
  return (
    <>
      <defs>
        <linearGradient id="aet-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0b1630" />
          <stop offset="1" stopColor="#4a83bd" />
        </linearGradient>
      </defs>
      <rect width="400" height="400" fill="url(#aet-bg)" />
      {Array.from({ length: 9 }).map((_, i) => (
        <line key={`v${i}`} x1={i * 50} y1="0" x2={i * 50} y2="400" stroke="#fff" opacity=".08" />
      ))}
      {Array.from({ length: 9 }).map((_, i) => (
        <line key={`h${i}`} x1="0" y1={i * 50} x2="400" y2={i * 50} stroke="#fff" opacity=".08" />
      ))}
      <circle cx="300" cy="96" r="38" fill="#e9f3ff" opacity=".9" />
      <g fill="none" stroke="#e9f3ff" strokeWidth="3">
        <rect x="60" y="170" width="70" height="230" />
        <rect x="130" y="110" width="90" height="290" fill="#e9f3ff" fillOpacity=".12" />
        <rect x="220" y="210" width="80" height="190" />
        <path d="M130 110 L175 70 L220 110" />
      </g>
    </>
  )
}

/** Generated artwork. `hue` rotates the colours so one design can fill several tiles. */
export function ProjectArt({ variant = 'aure', hue = 0, className = '' }) {
  const uid = useId().replace(/:/g, '')
  const art = { aure: <Aure />, veloce: <Veloce />, grain: <Grain uid={uid} />, aether: <Aether /> }[variant]
  return (
    <svg
      viewBox="0 0 400 400"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      style={{ display: 'block', width: '100%', height: '100%', filter: hue ? `hue-rotate(${hue}deg)` : undefined }}
      aria-hidden="true"
    >
      {art}
    </svg>
  )
}

/** Stylised warm portrait: person in red sunglasses, drawn in vector. */
export function PortraitArt({ className = '' }) {
  return (
    <svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" className={className} style={{ display: 'block', width: '100%', height: '100%' }} role="img" aria-label="Stylised portrait of a person wearing red sunglasses">
      <defs>
        <radialGradient id="pt-bg" cx=".5" cy=".38" r=".85">
          <stop offset="0" stopColor="#ffb25e" />
          <stop offset=".5" stopColor="#e8552f" />
          <stop offset="1" stopColor="#4a0f2c" />
        </radialGradient>
        <radialGradient id="pt-glow" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#ffe3b0" stopOpacity=".75" />
          <stop offset="1" stopColor="#ffe3b0" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="pt-skin" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f0b48a" />
          <stop offset="1" stopColor="#c47a52" />
        </linearGradient>
        <linearGradient id="pt-lens" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff3b3b" />
          <stop offset="1" stopColor="#8d0716" />
        </linearGradient>
      </defs>
      <rect width="400" height="500" fill="url(#pt-bg)" />
      <circle cx="200" cy="220" r="210" fill="url(#pt-glow)" />
      {/* jacket / shoulders */}
      <path d="M20 500 C 30 400, 100 366, 200 366 C 300 366, 370 400, 380 500 Z" fill="#1b0f14" />
      <path d="M150 372 L200 450 L250 372 Z" fill="#f4e6d3" />
      {/* neck */}
      <path d="M168 300 L168 372 C 190 392, 210 392, 232 372 L232 300 Z" fill="#b8693f" />
      {/* hair back */}
      <path d="M118 210 C 110 100, 170 60, 206 60 C 262 60, 296 110, 286 214 C 280 160, 120 160, 118 210 Z" fill="#1a0c0a" />
      {/* face */}
      <ellipse cx="202" cy="224" rx="84" ry="102" fill="url(#pt-skin)" />
      {/* fringe */}
      <path d="M118 200 C 120 118, 190 92, 240 108 C 276 120, 288 160, 286 204 C 262 150, 190 140, 118 200 Z" fill="#1a0c0a" />
      {/* sunglasses */}
      <g>
        <rect x="124" y="204" width="68" height="46" rx="18" fill="url(#pt-lens)" />
        <rect x="210" y="204" width="68" height="46" rx="18" fill="url(#pt-lens)" />
        <rect x="190" y="215" width="22" height="7" rx="3" fill="#2a0508" />
        <path d="M124 218 L96 210 M278 218 L306 210" stroke="#2a0508" strokeWidth="6" strokeLinecap="round" />
        <path d="M136 214 L160 214 L146 232 Z" fill="#fff" opacity=".35" />
        <path d="M222 214 L246 214 L232 232 Z" fill="#fff" opacity=".35" />
      </g>
      {/* nose + lips */}
      <path d="M202 250 C 196 270, 194 280, 204 284" fill="none" stroke="#a8603a" strokeWidth="4" strokeLinecap="round" />
      <path d="M176 306 C 190 298, 214 298, 228 306 C 214 322, 190 322, 176 306 Z" fill="#b33a3a" />
      {/* rim light */}
      <path d="M286 180 C 292 230, 276 292, 236 318" fill="none" stroke="#ffd2a1" strokeWidth="5" opacity=".6" strokeLinecap="round" />
    </svg>
  )
}
