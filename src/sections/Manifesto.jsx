import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, easeInOut, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { DISPLAY_FONT } from '@/lib/projects'
import BACKGROUND_IMAGES from 'virtual:manifesto-images'

/* =====================================================================
   Manifesto section – ELENA VOSS hero → "shrink onto a floating wall of landscape cards"
   Phase 1  the hero sits in a small frame that expands to (almost) full screen.
   Phase 2  the hero card shrinks to the middle of the screen while a blurred,
            oversized wall of floating landscape cards behind it settles into focus;
            the page nav fades in on top.
   Pinned with a sticky stage; progress comes from framer-motion's useScroll.
   ===================================================================== */

const WALL_OPACITY = 0.5
const CAROUSEL_START = 0.85 // the wall only drifts once the card has shrunk this far (0 → 1); paused before that
const MODEL_SRC = '/male_model.png' // background removed from male_model.jpeg
// Pinned scroll budget (svh). The stage stays pinned for ANIM + HOLD + RISE:
//   ANIM  – the manifesto's own animation (frame expands → card shrinks onto the wall)
//   HOLD  – the finished wall keeps drifting for a beat before anything covers it
//   RISE  – FeaturedProjects rises over the stage with its arch (its marginTop must equal -RISE_SVH)
const ANIM_SVH = 210
const HOLD_SVH = 40
const RISE_SVH = 100
const PIN_SVH = ANIM_SVH + HOLD_SVH + RISE_SVH
const WALL_STOP_RAW = (ANIM_SVH + HOLD_SVH) / PIN_SVH // raw scroll progress where the next section starts covering the wall → pause it
const lerp = (a, b, t) => a + (b - a) * t
const clamp01 = (v) => Math.min(1, Math.max(0, v))

/* ---------- background: floating landscape cards, tilted in 3D, drifting diagonally ----------
   • one tile of COLS × ROWS cards is repeated 3× in both directions; the whole grid translates by exactly
     one tile (-33.333%) so the loop is seamless
   • PERF: the grid sits on ONE plane tilted in 3D under a CSS perspective; the plane is flattened
     (no preserve-3d), so the browser composites it as a single texture. Cards only get cheap 2D
     transforms (small rotate + scale for "depth"), no shadows, no blend modes, no per-card animation
   • no extra dependencies – pure CSS + one keyframe animation, paused by the same `running` flag
   • images come from the virtual:manifesto-images folder; until it has photos, vibrant generated
     landscape illustrations are used instead
   ------------------------------------------------------------------------------------------ */

const COLS = 3 // cards per tile (horizontal)  – raise (and add palettes/photos) for more variety
const ROWS = 3 // cards per tile (vertical)
const REPEAT = 3 // tile repeats in each direction (3 = seamless loop + enough overscan)
const CELL_W = 32 // layout units: 1u = 1cqw (or .5625cqh on tall/portrait screens)
const CELL_H = 38
const CARD_W = 27
const CARD_H = 34
const DRIFT_SECONDS = 75 // time to travel one tile – bigger = calmer
const PLANE_TILT = 'rotateX(24deg) rotateY(-16deg) rotateZ(-10deg) scale(1.15)'

const u = (n) => `calc(var(--u) * ${n})`

const WALL_CSS = `
@keyframes mf-drift { from { transform: translate3d(0,0,0) } to { transform: translate3d(-33.3333%, -33.3333%, 0) } }
@media (prefers-reduced-motion: reduce) { .mf-drift { animation: none !important } }
`

// subtle texture: fine film grain + a faint dot grid
const GRAIN = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .6 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`

/* ---------- generated landscape illustrations (used until real photos are dropped in) ---------- */

const PALETTES = [
  { name: 'sunset',  sky: ['#2b1055', '#d4418e', '#ff9a3c'], sun: ['#fff3b0', 0.68, 0.52], ridges: ['#7b2d8e', '#4a1a6b', '#1d0b35'] },
  { name: 'alpine',  sky: ['#0f4c81', '#4aa3df', '#bfe9ff'], sun: ['#ffffff', 0.25, 0.3],  ridges: ['#7aa2c8', '#3e6a96', '#183a5c'] },
  { name: 'forest',  sky: ['#0b3d2e', '#2e8b57', '#c9f2a5'], sun: ['#fff7b8', 0.78, 0.4],  ridges: ['#2f8f5b', '#146c43', '#073b27'] },
  { name: 'desert',  sky: ['#7a1f1f', '#e8643a', '#ffd27a'], sun: ['#fff1c9', 0.4, 0.55],  ridges: ['#c2542d', '#8f3a1f', '#4a1c10'] },
  { name: 'aurora',  sky: ['#04122e', '#0f7a6d', '#7dffb3'], sun: ['#d9fff0', 0.2, 0.2],   ridges: ['#16425b', '#0c2a40', '#050f1c'] },
  { name: 'ocean',   sky: ['#021b4d', '#0a74da', '#7de3ff'], sun: ['#ffffff', 0.7, 0.35],  ridges: ['#1b8fc4', '#0e5a8f', '#062c4d'] },
  { name: 'lavender',sky: ['#3a1c71', '#8e6bd9', '#ffc3e8'], sun: ['#fff0fa', 0.3, 0.45],  ridges: ['#9a6fd0', '#6a45a6', '#33205e'] },
  { name: 'autumn',  sky: ['#4a1d0a', '#e07a1f', '#ffe08a'], sun: ['#fffbe0', 0.62, 0.48], ridges: ['#c8601a', '#8a3d10', '#40200a'] },
  { name: 'tropics', sky: ['#00525c', '#19c3a5', '#fff59a'], sun: ['#ffffff', 0.5, 0.5],   ridges: ['#13a589', '#0a7a68', '#04423a'] },
]

function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function ridgePath(rand, base, amp, steps) {
  const dx = 300 / steps
  let d = `M0 380 L0 ${base}`
  for (let i = 1; i <= steps; i++) {
    const peak = i % 2 ? 0.45 + rand() * 0.55 : rand() * 0.25
    d += ` L${(i * dx).toFixed(1)} ${(base - peak * amp).toFixed(1)}`
  }
  return `${d} L300 380 Z`
}

function landscapeSrc(p, seed) {
  const rand = rng(seed * 977 + 13)
  const [sunColor, sx, sy] = p.sun
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 380' preserveAspectRatio='xMidYMid slice'>` +
    `<defs><linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='${p.sky[0]}'/><stop offset='.55' stop-color='${p.sky[1]}'/><stop offset='1' stop-color='${p.sky[2]}'/></linearGradient>` +
    `<radialGradient id='g'><stop offset='0' stop-color='${sunColor}' stop-opacity='.95'/><stop offset='.35' stop-color='${sunColor}' stop-opacity='.35'/><stop offset='1' stop-color='${sunColor}' stop-opacity='0'/></radialGradient></defs>` +
    `<rect width='300' height='380' fill='url(%23s)'/>` +
    `<circle cx='${sx * 300}' cy='${sy * 380}' r='110' fill='url(%23g)'/>` +
    `<circle cx='${sx * 300}' cy='${sy * 380}' r='20' fill='${sunColor}'/>` +
    `<path d='${ridgePath(rand, 250, 120, 9)}' fill='${p.ridges[0]}'/>` +
    `<path d='${ridgePath(rand, 292, 100, 8)}' fill='${p.ridges[1]}'/>` +
    `<path d='${ridgePath(rand, 335, 70, 7)}' fill='${p.ridges[2]}'/>` +
    `</svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg).replace(/%2523/g, '%23')}`
}

const LANDSCAPE_SRCS = PALETTES.map((p, i) => landscapeSrc(p, i + 1))

/* ---------- the wall ---------- */

function Wall({ running }) {
  const sources = BACKGROUND_IMAGES.length ? BACKGROUND_IMAGES : LANDSCAPE_SRCS

  // one tile of card descriptors – reused for every repeat, so the loop stays seamless
  const tile = useMemo(() => {
    const rand = rng(7)
    const span = (n) => (rand() - 0.5) * 2 * n
    return Array.from({ length: COLS * ROWS }, (_, i) => ({
      src: sources[i % sources.length],
      rz: span(4),
      depth: span(0.09), // scale ±9% → cheap fake depth
      stagger: i % COLS === 1, // middle column sits half a card lower → brick-like, floating layout
    }))
  }, [sources])

  // warm up: decode every image once, off the main thread, before the wall first becomes visible
  useEffect(() => {
    sources.forEach((src) => {
      const img = new Image()
      img.src = src
      img.decode?.().catch(() => {})
    })
  }, [sources])

  const state = running ? 'running' : 'paused'
  const cells = []
  for (let r = 0; r < ROWS * REPEAT; r++) {
    for (let c = 0; c < COLS * REPEAT; c++) {
      const t = tile[(r % ROWS) * COLS + (c % COLS)]
      cells.push(
        <div
          key={`${r}-${c}`}
          className="grid place-items-center"
          style={{
            width: u(CELL_W),
            height: u(CELL_H),
            transform: t.stagger ? `translateY(${u(CELL_H / 2)})` : undefined,
          }}
        >
          <div
            className="relative overflow-hidden"
            style={{
              width: u(CARD_W),
              height: u(CARD_H),
              borderRadius: u(2.4),
              transform: `rotate(${t.rz}deg) scale(${1 + t.depth})`,
              boxShadow: '0 0 0 1px rgba(255,255,255,.08)', // hairline only – blurred shadows are expensive ×81
              background: '#111',
            }}
          >
            <img src={t.src} alt="" draggable={false} decoding="async" className="h-full w-full select-none object-cover" />
          </div>
        </div>,
      )
    }
  }

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ '--u': 'max(1cqw, 0.5625cqh)', contain: 'paint', isolation: 'isolate' }}>
      <style>{WALL_CSS}</style>

      {/* deep dark base + subtle texture */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(120% 90% at 50% 40%, #15151a 0%, #0b0b0c 70%)' }} />
      <div className="absolute inset-0 opacity-[.05]" style={{ backgroundImage: GRAIN, backgroundSize: '160px 160px' }} />
      <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,.08) 1px, transparent 1.2px)', backgroundSize: '22px 22px' }} />

      {/* 3D plane: perspective on the parent, tilt on the plane, diagonal drift on the grid */}
      <div className="absolute inset-0" style={{ perspective: u(100), perspectiveOrigin: '50% 50%' }}>
        <div className="absolute inset-0" style={{ transformStyle: 'flat', transform: PLANE_TILT }}>
          <div
            className="mf-drift absolute grid will-change-transform"
            style={{
              left: `calc(50% - ${u(CELL_W * COLS)})`,
              top: `calc(50% - ${u(CELL_H * ROWS)})`,
              gridTemplateColumns: `repeat(${COLS * REPEAT}, ${u(CELL_W)})`,
              animation: `mf-drift ${DRIFT_SECONDS}s linear infinite`,
              animationPlayState: state,
            }}
          >
            {cells}
          </div>
        </div>
      </div>

      {/* vignette – keeps the edges deep dark so the hero card stays the focus */}
      <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(75% 70% at 50% 50%, transparent 35%, rgba(11,11,12,.85) 100%)' }} />
    </div>
  )
}

/* ---------- section ---------- */

export default function Manifesto() {
  const ref = useRef(null)
  const reduced = useReducedMotion()
  const { scrollYProgress: rawProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  // re-mapped so every timing below stays exactly as before; stays at 1 (wall paused) while the next section rises over it
  const scrollYProgress = useTransform(rawProgress, [0, ANIM_SVH / PIN_SVH], [0, 1])

  const INTRO = 0.3 // 0 → INTRO: frame expands · INTRO → 1: card shrinks onto the wall
  const open = useTransform(scrollYProgress, [0, INTRO], reduced ? [1, 1] : [0, 1], { ease: easeInOut })
  const p = useTransform(scrollYProgress, [INTRO, 1], [0, 1], { clamp: true })
  const shrink = useTransform(p, [0, 0.72], reduced ? [1, 1] : [0, 1], { ease: easeInOut })

  // the card wall only drifts while the card is (almost) fully shrunk and the stage is still pinned – paused otherwise to keep scrolling smooth
  const [wallRunning, setWallRunning] = useState(false)
  const syncWall = () => setWallRunning(shrink.get() >= CAROUSEL_START && rawProgress.get() < WALL_STOP_RAW)
  useMotionValueEvent(shrink, 'change', syncWall)
  useMotionValueEvent(rawProgress, 'change', syncWall)
  useEffect(() => { syncWall() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // card size as % of the stage (same aspect as the screen): 42 → 90 → 50
  const size = useTransform([open, shrink], ([o, s]) => lerp(lerp(42, 90, o), 50, s))
  // the card is laid out ONCE at full size and only ever scaled (transform = no layout / repaint per frame)
  const contentScale = useTransform(size, (v) => v / 100)
  const cardRadius = useTransform(open, (v) => lerp(28, 14, v))
  const plateRadius = useTransform([cardRadius, contentScale], ([r, sc]) => r / sc) // keeps the visual radius constant under scale

  const frameHint = useTransform(open, [0, 0.25], [1, 0])
  // intro: the small card is softly blurred under the "BUILT WITH SCALE" title; as the card
  // comes closer the card sharpens while the title splits apart and exits left / right
  const cardBlur = useTransform(open, [0, 0.75], [9, 0])
  const cardBlurFilter = useTransform([cardBlur, contentScale], ([b, sc]) => (b > 0.05 ? `blur(${b / sc}px)` : 'none'))
  // title splits down the middle: the left half slides off to the left, the right half to the right
  const splitLeft = useTransform(open, [0, 0.6], ['0%', '-60%'])
  const splitRight = useTransform(open, [0, 0.6], ['0%', '60%'])
  const splitOpacity = useTransform(open, [0.5, 0.6], [1, 0]) // already off-screen by then – just un-paints it
  // orange light seam: each half travels 60% of the stage width, so the gap between the cut edges is 1.2 × the stage width at
  // full split. The glow body is a stage-wide bar scaled on X (compositor-only), so its edges always sit on the two cut edges.
  const seamGap = useTransform(open, [0, 0.6], [0, 1.2])
  // lights up the moment the title starts to open, stays while the gap widens, and is gone with the title
  const seamOpacity = useTransform(open, [0, 0.05, 0.4, 0.58], [0, 1, 1, 0])
  const cardNav = useTransform(shrink, [0, 0.25], [1, 0])
  // wall visibility (fade-in, then dimmed to WALL_OPACITY) is done by one flat black veil on top – animating opacity or
  // blur on the whole 80-card subtree would force it to be re-composited / re-rendered every scroll frame
  const veil = useTransform([open, shrink], ([o, sh]) => 1 - WALL_OPACITY * clamp01((o - 0.55) / 0.45) * lerp(0.45, 1, clamp01(sh / 0.8)))
  const wallScale = useTransform(shrink, [0, 1], reduced ? [1, 1] : [1.5, 1])
  const pageNav = useTransform(p, [0.5, 0.78], [0, 1])
  const cue = useTransform(p, [0.74, 0.9], [0, 1])

  // mouse-move tilt + parallax (-0.5 … 0.5, smoothed)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 90, damping: 20, mass: 0.6 })
  const sy = useSpring(my, { stiffness: 90, damping: 20, mass: 0.6 })
  useEffect(() => {
    if (reduced) return
    const move = (e) => {
      mx.set(e.clientX / window.innerWidth - 0.5)
      my.set(e.clientY / window.innerHeight - 0.5)
    }
    const leave = () => { mx.set(0); my.set(0) }
    window.addEventListener('mousemove', move)
    document.addEventListener('mouseleave', leave)
    return () => {
      window.removeEventListener('mousemove', move)
      document.removeEventListener('mouseleave', leave)
    }
  }, [mx, my, reduced])
  // only the text and the model react to the mouse (the card and the background stay still)
  const textRotY = useTransform(sx, (v) => v * 4)
  const textRotX = useTransform(sy, (v) => v * -3)
  const modelRotY = useTransform(sx, (v) => v * 7)
  const modelRotX = useTransform(sy, (v) => v * -5)
  const textX = useTransform(sx, (v) => v * -34)
  const textY = useTransform(sy, (v) => v * -20)
  const badgeX = useTransform(sx, (v) => v * -52)
  const badgeY = useTransform(sy, (v) => v * -30)
  const modelX = useTransform(sx, (v) => v * 30)
  const modelY = useTransform(sy, (v) => v * 12)

  const pill = 'text-[clamp(.8rem,1.15cqw,1.2rem)]'
  const logoStyle = { fontSize: 'clamp(1.05rem, 1.95cqw, 2.4rem)' }
  const Logo = () => (
    <span className="whitespace-nowrap tracking-[-0.01em]" style={logoStyle}>
      ELENA<span style={{ opacity: 0.6 }}>VOSS</span>
    </span>
  )

  return (
    <section id="manifesto" ref={ref} style={{ height: `${PIN_SVH + 100}svh`, position: 'relative', background: '#0b0b0c' }}>
      <div
        className="sticky top-0 h-[100svh] w-full overflow-hidden text-white"
        style={{ background: '#0b0b0c', fontFamily: DISPLAY_FONT, containerType: 'size' }}
      >
        {/* floating card wall: oversized + veiled at first, settles into view */}
        <motion.div style={{ scale: wallScale }} className="absolute inset-0 will-change-transform">
          <Wall running={wallRunning} />
        </motion.div>
        <motion.div aria-hidden="true" style={{ opacity: veil, background: '#0b0b0c' }} className="pointer-events-none absolute inset-0" />

        {/* hero card – static plate; the text and the model float above it and follow the mouse */}
        <motion.div
          className="absolute inset-0 z-10"
          style={{ scale: contentScale, filter: cardBlurFilter, willChange: 'transform' }}
        >
          {/* back plate */}
          <motion.div
            className="absolute inset-0 overflow-hidden"
            style={{
              borderRadius: plateRadius,
              background:
                'radial-gradient(55% 45% at 6% 82%, rgba(255,140,60,.75), transparent 70%), radial-gradient(60% 50% at 95% 6%, rgba(255,120,50,.6), transparent 70%), linear-gradient(180deg, #c8431f 0%, #a52716 48%, #3d0f08 100%)',
              boxShadow: '0 40px 120px -30px rgba(0,0,0,.7)',
            }}
          />

          {/* text layer (mid depth) – laid out at full screen size, scaled to fit the card */}
          <motion.div className="pointer-events-none absolute inset-0">
            <motion.div style={{ x: textX, y: textY, rotateX: textRotX, rotateY: textRotY, transformPerspective: 1200 }} className="absolute left-[6%] top-[20%] right-[8%] sm:top-[34%]">
              <h2
                style={{
                  fontSize: 'clamp(3.1rem, 8.2cqw, 10.5rem)',
                  fontWeight: 500,
                  lineHeight: 1.02,
                  letterSpacing: '-0.025em',
                  textShadow: '0 6px 50px rgba(60,10,0,.35)',
                }}
              >
                Visualise
                <br />
                Your Mind
                <br />
                in Motion
              </h2>
            </motion.div>

            <motion.p
              style={{ x: badgeX, y: badgeY, fontSize: 'clamp(.8rem, 1.5cqw, 1.7rem)', lineHeight: 1.2 }}
              className="absolute right-[4.5%] top-[37%] hidden max-w-[12em] text-right font-medium sm:block"
            >
              Award winning
              <br />
              Designs
            </motion.p>
            <motion.p
              style={{ x: badgeX, y: badgeY, fontSize: 'clamp(.8rem, 1.5cqw, 1.7rem)', lineHeight: 1.2 }}
              className="absolute right-[4.5%] top-[64%] hidden max-w-[12em] text-right font-medium sm:block"
            >
              Creative
              <br />
              Web Designer
            </motion.p>
            <p className="absolute left-[6%] right-[6%] top-[41%] flex justify-between text-[.8rem] font-medium leading-tight sm:hidden">
              <span>Award winning<br />Designs</span>
              <span className="text-right">Creative<br />Web Designer</span>
            </p>

            {/* in-card nav (fades as the card shrinks) */}
            <motion.header style={{ opacity: cardNav }} className="absolute inset-x-0 top-0 flex items-center justify-between px-[5%] pt-[3.2%]">
              <a href="#manifesto" className="pointer-events-auto"><Logo /></a>
              <a
                href="#contact"
                className={`pointer-events-auto flex items-center gap-[.7em] rounded-full bg-white px-[1.4em] py-[.8em] font-medium text-black transition-transform hover:scale-[1.04] sm:px-[2.1em] sm:py-[1.05em] ${pill}`}
              >
                <span className="h-[.45em] w-[.45em] rounded-full bg-black" />
                Get in Touch
              </a>
            </motion.header>
          </motion.div>

          {/* model layer (front) – original colours, lifted off the plate; head breaks out of the card's top edge */}
          <motion.div className="pointer-events-none absolute inset-0 flex items-end justify-center">
            <motion.img
              src={MODEL_SRC}
              alt="Portrait of a model in a black blazer"
              draggable={false}
              style={{
                x: modelX,
                y: modelY,
                rotateX: modelRotX,
                rotateY: modelRotY,
                transformPerspective: 1200,
                filter: 'drop-shadow(0 28px 36px rgba(30,4,0,.55))', // one shadow instead of two (bake it into the PNG for zero cost)
              }}
              className="h-[64%] w-[94%] select-none object-contain object-bottom sm:h-[92%] sm:w-auto"
            />
          </motion.div>
        </motion.div>

        {/* intro title – cut at 50%: the left half exits left, the right half exits right */}
        <motion.h2 aria-label="Built with scale" style={{ opacity: splitOpacity }} className="pointer-events-none absolute inset-0 z-20">
          {[
            { x: splitLeft, clip: 'inset(0 calc(50% - .5px) 0 0)' },
            { x: splitRight, clip: 'inset(0 0 0 calc(50% - .5px))' },
          ].map((half, i) => (
            <motion.span
              key={i}
              aria-hidden="true"
              className="absolute inset-x-0 top-1/2 block px-[6%] text-center font-extrabold uppercase will-change-transform"
              style={{
                x: half.x,
                y: '-50%',
                clipPath: half.clip,
                fontSize: 'clamp(2rem, 8.5cqw, 9rem)',
                lineHeight: 0.95,
                letterSpacing: '-0.03em',
                textShadow: '0 8px 60px rgba(0,0,0,.55)',
              }}
            >
              Built with scale
            </motion.span>
          ))}
        </motion.h2>

        {/* orange light seam – a hair-thin line of light at the split that widens with the gap, as if the card's glow
            were pushing the two halves apart. Sits just above the title (z-20) and under the nav (z-30). */}
        <motion.div aria-hidden="true" style={{ opacity: seamOpacity }} className="pointer-events-none absolute inset-0 z-[21]">
          <div
            className="absolute inset-0"
            style={{
              // fades out toward the top and bottom edges so it reads as a beam of light, not a divider
              WebkitMaskImage: 'linear-gradient(to bottom, transparent 4%, #000 28%, #000 72%, transparent 96%)',
              maskImage: 'linear-gradient(to bottom, transparent 4%, #000 28%, #000 72%, transparent 96%)',
            }}
          >
            {/* glow body: fills the gap between the halves, hottest on the centre line, softly fading into the cut edges */}
            <motion.div
              className="absolute inset-y-0 left-0 w-full will-change-transform"
              style={{
                scaleX: seamGap,
                transformOrigin: '50% 50%',
                background:
                  'linear-gradient(90deg, rgba(255,96,24,0) 0%, rgba(255,112,36,.5) 28%, rgba(255,150,70,.85) 50%, rgba(255,112,36,.5) 72%, rgba(255,96,24,0) 100%)',
              }}
            />
            {/* core: the thin white-hot filament with a wide orange halo */}
            <div
              className="absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2"
              style={{
                background: 'linear-gradient(to bottom, rgba(255,226,184,0), #ffe3bd 30%, #fff1dc 50%, #ffe3bd 70%, rgba(255,226,184,0))',
                boxShadow: '0 0 10px 2px rgba(255,150,64,.95), 0 0 36px 8px rgba(255,110,36,.6), 0 0 110px 26px rgba(255,90,24,.3)',
              }}
            />
          </div>
        </motion.div>

        {/* page nav (appears over the wall once the card has shrunk) */}
        <motion.header
          style={{ opacity: pageNav }}
          className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-between px-[3.5%] pb-[4cqh] pt-[2.6cqh]"
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10"
            style={{
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
              background: 'linear-gradient(to bottom, rgba(11,11,12,.55), transparent)',
              maskImage: 'linear-gradient(to bottom, #000 55%, transparent)',
              WebkitMaskImage: 'linear-gradient(to bottom, #000 55%, transparent)',
            }}
          />
          <a href="#manifesto" className="pointer-events-auto"><Logo /></a>
          <a
            href="#contact"
            className={`pointer-events-auto flex items-center gap-[.7em] rounded-full bg-white px-[1.4em] py-[.8em] font-medium text-black transition-transform hover:scale-[1.04] sm:px-[2.1em] sm:py-[1.05em] ${pill}`}
          >
            <span className="h-[.45em] w-[.45em] rounded-full bg-black" />
            Get in Touch
          </a>
        </motion.header>

        {/* hints */}
        <motion.div style={{ opacity: frameHint }} className="pointer-events-none absolute inset-x-0 bottom-[5%] z-40 flex flex-col items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-white/60">
          <span>Scroll</span>
          <ChevronDown className="h-4 w-4 animate-bounce" />
        </motion.div>
        <motion.div style={{ opacity: cue }} className="pointer-events-none absolute inset-x-0 bottom-[3%] z-40 flex justify-center">
          <span
            className="flex items-center gap-2 rounded-full px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-white"
            style={{ background: 'rgba(11,11,12,.7)', border: '1px solid rgba(255,255,255,.2)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
          >
            Selected work
            <ChevronDown className="h-4 w-4 animate-bounce" />
          </span>
        </motion.div>
      </div>
    </section>
  )
}