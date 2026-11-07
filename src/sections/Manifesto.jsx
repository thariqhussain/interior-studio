import { useEffect, useRef } from 'react'
import { motion, easeInOut, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { DISPLAY_FONT, ProjectArt, SERIF_FONT } from '@/lib/projects'
import BACKGROUND_IMAGES from 'virtual:manifesto-images'

/* =====================================================================
   Manifesto section – ELENA VOSS hero → "shrink onto a wall of sites"
   Phase 1  the hero sits in a small frame that expands to (almost) full screen.
   Phase 2  the hero card shrinks to the middle of the screen while a blurred,
            oversized wall of website mock-ups behind it settles into focus;
            the page nav fades in on top.
   Pinned with a sticky stage; progress comes from framer-motion's useScroll.
   ===================================================================== */

const WALL_OPACITY = 0.7
const MODEL_SRC = '/male_model_cutout.png' // background removed from male_model.jpeg
const lerp = (a, b, t) => a + (b - a) * t

/* ---------- website mock-ups (stand-ins for real project screenshots) ---------- */

const NAV = 'absolute inset-x-0 top-0 flex items-center justify-between'

function Highland() {
  return (
    <>
      <div className="absolute inset-0"><ProjectArt variant="aether" /></div>
      <div className={NAV} style={{ padding: '3cqw 4cqw', fontSize: '1.7cqw', fontWeight: 600, letterSpacing: '.18em' }}>
        <span>HIGHLAND</span><span style={{ opacity: .7 }}>SELECT OFFICE SPACE · CONTACT US</span>
      </div>
      <div className="absolute left-[4cqw] top-1/2 font-medium" style={{ fontSize: '9cqw', letterSpacing: '.12em', transform: 'translateY(-10%)' }}>HIGHLAND</div>
      <div className="absolute right-[4cqw] top-[18%] text-right" style={{ fontSize: '2cqw', letterSpacing: '.12em', lineHeight: 1.1 }}>WHERE FUTURE<br />GAINS MOMENTUM</div>
    </>
  )
}

function Aagma() {
  return (
    <div className="absolute inset-0" style={{ background: '#f4f1ec', color: '#161616' }}>
      <div className="absolute left-[4cqw] top-[5cqw] font-bold" style={{ fontSize: '2.6cqw' }}>Aagma</div>
      <div className="absolute left-[4cqw] top-[34%] w-[52%]" style={{ fontFamily: SERIF_FONT, fontStyle: 'normal', fontWeight: 700, fontSize: '4.6cqw', lineHeight: 1.08 }}>
        We make furniture that’s flexible, and playful, to fit modern life
      </div>
      <div className="absolute bottom-0 right-0 flex h-[52%] w-[40%] gap-[1cqw]">
        {[['aure', 0], ['grain', 0], ['veloce', 120]].map(([v, h], i) => (
          <div key={i} className="h-full flex-1 overflow-hidden"><ProjectArt variant={v} hue={h} /></div>
        ))}
      </div>
    </div>
  )
}

function Nexora() {
  return (
    <div className="absolute inset-0" style={{ background: '#0c0c0d' }}>
      <div className={NAV} style={{ padding: '3cqw 4cqw', fontSize: '1.7cqw' }}>
        <span className="font-semibold">Nexora</span>
        <span style={{ opacity: .75 }}>Platform · Use cases · Resources · Company</span>
        <span className="rounded-full px-[2cqw] py-[.7cqw] font-semibold text-black" style={{ background: '#f4ff4a' }}>Book a demo</span>
      </div>
      <div className="absolute left-[4cqw] top-[34%] font-semibold" style={{ fontSize: '6.6cqw', lineHeight: 1, letterSpacing: '-.03em' }}>
        Code Secured.<br /><span className="ml-[22cqw]">Ship Faster.</span>
      </div>
      <div className="absolute -bottom-[4cqw] right-[8cqw] h-[22cqw] w-[22cqw] overflow-hidden rounded-full opacity-90"><ProjectArt variant="grain" /></div>
    </div>
  )
}

function Sky() {
  return (
    <>
      <div className="absolute inset-0"><ProjectArt variant="aether" hue={-12} /></div>
      <div className={NAV} style={{ padding: '3cqw 4cqw', fontSize: '1.5cqw' }}>
        <span className="font-semibold">Assistance</span>
        <span style={{ opacity: .8 }}>SOLUTIONS · PLATFORM · CASE STUDIES · ABOUT</span>
        <span className="rounded-full px-[1.8cqw] py-[.6cqw] font-semibold" style={{ background: '#6a3cff' }}>REQUEST DEMO</span>
      </div>
      <div className="absolute bottom-[8%] left-[4cqw] font-bold" style={{ fontSize: '5cqw', letterSpacing: '.02em' }}>RISK WORK</div>
    </>
  )
}

function Studio() {
  return (
    <>
      <div className="absolute inset-0"><ProjectArt variant="aure" /></div>
      <div className={NAV} style={{ padding: '3cqw 4cqw', fontSize: '1.7cqw', color: '#2a1410' }}>
        <span className="font-bold">Auré Studio</span><span>Work · About · Contact</span>
      </div>
      <div className="absolute bottom-[7%] left-[4cqw] font-bold" style={{ fontSize: '7cqw', lineHeight: 1, letterSpacing: '-.03em', color: '#fff3e3' }}>Light, framed.</div>
    </>
  )
}

function Veloce() {
  return (
    <>
      <div className="absolute inset-0"><ProjectArt variant="veloce" /></div>
      <div className={NAV} style={{ padding: '3cqw 4cqw', fontSize: '1.7cqw', letterSpacing: '.18em' }}>
        <span className="font-semibold">VELOCE</span><span style={{ opacity: .7 }}>MODELS · EXPERIENCE · RESERVE</span>
      </div>
      <div className="absolute left-[4cqw] top-[16%] font-semibold" style={{ fontSize: '5.6cqw', lineHeight: 1, letterSpacing: '-.02em' }}>Drive<br />the future.</div>
    </>
  )
}

/* ---------- background carousel: two columns drifting in opposite directions ---------- */

const MOCKS = [Studio, Highland, Aagma, Nexora, Sky, Veloce]
const CARD_H = 40 // cqh
const GAP = 5 // cqh
const LOOP_SECONDS_PER_CARD = 9 // slower = calmer

const CAROUSEL_CSS = `
@keyframes mf-up   { from { transform: translateY(0) }    to { transform: translateY(-50%) } }
@keyframes mf-down { from { transform: translateY(-50%) } to { transform: translateY(0) } }
@media (prefers-reduced-motion: reduce) { .mf-track { animation: none !important } }
`

function Column({ items, x, dir, offset }) {
  // the list is rendered twice so the loop is seamless (the track moves by exactly one copy = 50%)
  const loop = [...items, ...items]
  const seconds = items.length * LOOP_SECONDS_PER_CARD
  return (
    <div className="absolute top-0" style={{ left: `${x}cqw`, width: '45cqw' }}>
      <div
        className="mf-track flex flex-col will-change-transform"
        style={{
          gap: `${GAP}cqh`,
          marginTop: `${offset}cqh`,
          paddingBottom: `${GAP}cqh`,
          animation: `${dir === 'up' ? 'mf-up' : 'mf-down'} ${seconds}s linear infinite`,
        }}
      >
        {loop.map((item, i) => (
          <div
            key={i}
            className="relative shrink-0 overflow-hidden text-white"
            style={{ height: `${CARD_H}cqh`, containerType: 'size', background: '#111', fontFamily: DISPLAY_FONT }}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  )
}

function Wall() {
  // real images when the folder has them, generated website mock-ups until then
  const cards = BACKGROUND_IMAGES.length
    ? BACKGROUND_IMAGES.map((src, i) => <img key={src} src={src} alt="" draggable={false} loading={i < 6 ? 'eager' : 'lazy'} className="h-full w-full select-none object-cover" />)
    : MOCKS.map((Site, i) => <Site key={i} />)
  const colA = cards.filter((_, i) => i % 2 === 0)
  const colB = cards.filter((_, i) => i % 2 === 1)
  return (
    <div className="absolute inset-0">
      <style>{CAROUSEL_CSS}</style>
      <Column items={colA} x={3.7} dir="up" offset={-12} />
      <Column items={colB.length ? colB : colA} x={51.3} dir="down" offset={-30} />
    </div>
  )
}

/* ---------- section ---------- */

export default function Manifesto() {
  const ref = useRef(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })

  const INTRO = 0.3 // 0 → INTRO: frame expands · INTRO → 1: card shrinks onto the wall
  const open = useTransform(scrollYProgress, [0, INTRO], reduced ? [1, 1] : [0, 1], { ease: easeInOut })
  const p = useTransform(scrollYProgress, [INTRO, 1], [0, 1], { clamp: true })
  const shrink = useTransform(p, [0, 0.72], reduced ? [1, 1] : [0, 1], { ease: easeInOut })

  // card size as % of the stage (same aspect as the screen): 42 → 90 → 50
  const size = useTransform([open, shrink], ([o, s]) => lerp(lerp(42, 90, o), 50, s))
  const cardW = useTransform(size, (v) => `${v}%`)
  const cardRadius = useTransform(open, (v) => lerp(28, 14, v))
  const contentScale = useTransform(size, (v) => v / 100)

  const frameHint = useTransform(open, [0, 0.25], [1, 0])
  // intro: the small card is softly blurred under the "BUILT WITH SCALE" title; as the card
  // comes closer the card sharpens while the title blurs out and disappears
  const cardBlur = useTransform(open, [0, 0.75], [9, 0])
  const cardBlurFilter = useTransform(cardBlur, (b) => (b > 0.05 ? `blur(${b}px)` : 'none'))
  const titleOpacity = useTransform(open, [0, 0.45], [1, 0])
  const titleBlur = useTransform(open, [0, 0.45], [0, 18])
  const titleFilter = useTransform(titleBlur, (b) => `blur(${b}px)`)
  const titleScale = useTransform(open, [0, 0.6], [1, 1.12])
  const cardNav = useTransform(shrink, [0, 0.25], [1, 0])
  const wallOpacity = useTransform(open, [0.55, 1], [0, WALL_OPACITY]) // images at 70% over the black stage = dimmed in black
  const wallScale = useTransform(shrink, [0, 1], reduced ? [1, 1] : [1.5, 1])
  const wallBlur = useTransform(shrink, [0, 0.8], reduced ? [0, 0] : [14, 0], { clamp: true })
  const wallFilter = useTransform(wallBlur, (b) => `blur(${b}px)`)
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
    <section id="manifesto" ref={ref} style={{ height: '310svh', position: 'relative', background: '#0b0b0c' }}>
      <div
        className="sticky top-0 h-[100svh] w-full overflow-hidden text-white"
        style={{ background: '#0b0b0c', fontFamily: DISPLAY_FONT, containerType: 'size' }}
      >
        {/* wall of website mock-ups: oversized + blurred at first, settles into focus */}
        <motion.div style={{ opacity: wallOpacity, scale: wallScale, filter: wallFilter }} className="absolute inset-0 will-change-transform">
          <Wall />
        </motion.div>

        {/* hero card – static plate; the text and the model float above it and follow the mouse */}
        <motion.div
          className="absolute left-1/2 top-1/2 z-10"
          style={{
            width: cardW,
            height: cardW,
            x: '-50%',
            y: '-50%',
            filter: cardBlurFilter,
          }}
        >
          {/* back plate */}
          <motion.div
            className="absolute inset-0 overflow-hidden"
            style={{
              borderRadius: cardRadius,
              background:
                'radial-gradient(55% 45% at 6% 82%, rgba(255,140,60,.75), transparent 70%), radial-gradient(60% 50% at 95% 6%, rgba(255,120,50,.6), transparent 70%), linear-gradient(180deg, #c8431f 0%, #a52716 48%, #3d0f08 100%)',
              boxShadow: '0 40px 120px -30px rgba(0,0,0,.7)',
            }}
          />

          {/* text layer (mid depth) – laid out at full screen size, scaled to fit the card */}
          <motion.div
            className="pointer-events-none absolute left-1/2 top-1/2"
            style={{ width: '100cqw', height: '100cqh', x: '-50%', y: '-50%', scale: contentScale }}
          >
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
          <motion.div
            className="pointer-events-none absolute left-1/2 top-1/2"
            style={{ width: '100cqw', height: '100cqh', x: '-50%', y: '-50%', scale: contentScale }}
          >
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
                filter: 'drop-shadow(0 28px 36px rgba(30,4,0,.55)) drop-shadow(0 0 2px rgba(255,190,150,.35))',
              }}
              className="absolute bottom-0 left-[6%] h-[64%] w-[94%] select-none object-contain object-bottom sm:left-[29%] sm:h-[92%] sm:w-auto"
            />
          </motion.div>
        </motion.div>

        {/* intro title */}
        <motion.h2
          aria-hidden={false}
          style={{ opacity: titleOpacity, filter: titleFilter, scale: titleScale }}
          className="pointer-events-none absolute inset-x-0 top-1/2 z-20 -translate-y-1/2 px-[6%] text-center font-extrabold uppercase"
        >
          <span
            style={{
              display: 'block',
              fontSize: 'clamp(2rem, 8.5cqw, 9rem)',
              lineHeight: 0.95,
              letterSpacing: '-0.03em',
              textShadow: '0 8px 60px rgba(0,0,0,.55)',
            }}
          >
            Built with scale
          </span>
        </motion.h2>

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
