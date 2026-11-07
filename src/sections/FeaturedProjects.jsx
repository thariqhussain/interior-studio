import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, easeInOut, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { ArrowUpRight, Star } from 'lucide-react'
import { ACCENT, DISPLAY_FONT, PROJECTS, ProjectArt, SERIF_FONT } from '@/lib/projects'

/* =====================================================================
   Featured Projects – "Award Winning Work"
   • vibrant accent banner that stays pinned while the project list rises into it
   • as the list rises: the red gradient fades to pitch black, the subtitle fades out and
     the stacked "Award / Winning / Work" heading widens into ONE line, centred at the top
   • split screen: interactive project list (left) + live preview card (right)
   ===================================================================== */

const glass = {
  background: 'rgba(255,255,255,0.14)',
  border: '1px solid rgba(255,255,255,0.25)',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
}

const WORDS = ['Award', 'Winning', 'Work']

// Section hand-off: this section is pulled up over the last RISE (100svh) of the pinned Manifesto stage
// (marginTop below ↔ RISE_SVH in Manifesto.jsx). It peeks in with a gentle curve that keeps getting rounder for the whole
// rise – it never straightens out; once the section reaches the top it simply scrolls away with its arch intact.
const ARCH_START = 6 // svh – vertical radius of the arch when the section first peeks in (gentle)
const ARCH_END = 26 // svh – roundest point, reached as the section reaches the top (bigger = deeper / rounder)
const OVERSCAN = 15 // % of the screen width the arch ellipse extends past each side – keeps its ends off-screen
const LOCK_AT = 0.92 // rise progress at which the section counts as "locked in" and its content enters
const EASE = [0.22, 1, 0.36, 1]

// ── Banner → list hand-off ───────────────────────────────────────────────────────────────────────────────────────────
// The red banner is pinned (sticky) to the top of the screen. The project list starts below the fold and scrolls up into it.
const HOLD_SVH = 12 // scroll (svh) the full red banner is held on its own before the list starts to peek in (lets the arch scroll away)
const ZONE_SVH = 17 // svh kept clear at the top for the one-line heading – the list stops rising right below it
const MORPH_END = 0.85 // share of the list's rise by which the heading has finished morphing into one line
const SUBTITLE_FADE_END = 0.25 // share of the list's rise by which the subtitle has faded out
const WIDTH_SMALL = 0.84 // final one-line heading width as a share of screen width (< 640px)
const WIDTH_WIDE = 0.5 // …and from 640px up – "subtle", not edge to edge
const STAR_SHRINK_TO = 0.38 // final scale of the star badge

// the exact plate gradient of the ELENA VOSS hero card (Manifesto.jsx) – keep the two in sync
const HERO_GRADIENT =
  'radial-gradient(55% 45% at 6% 82%, rgba(255,140,60,.75), transparent 70%), radial-gradient(60% 50% at 95% 6%, rgba(255,120,50,.6), transparent 70%), linear-gradient(180deg, #c8431f 0%, #a52716 48%, #3d0f08 100%)'

const HEADING_SIZE = 'clamp(2.8rem, 10.5vw, 10rem)'

/* One word of the heading. It sits in a single-line row (its natural layout); a scroll-linked offset pulls it back into the
   stacked, left-aligned layout at progress 0 and releases it into the row at progress 1. */
function Word({ i, word, mp, tick, geo, elRef }) {
  const x = useTransform([mp, tick], ([p]) => -(geo.current.left[i] || 0) * (1 - p))
  const y = useTransform([mp, tick], ([p]) => geo.current.pitch * i * (1 - p))
  return (
    <motion.span ref={elRef} className="block" variants={{ hidden: {}, show: {} }} style={{ x, y }}>
      <span className="block overflow-hidden pb-[0.06em]">
        <motion.span
          className="block will-change-transform"
          variants={{ hidden: { y: '55%', opacity: 0 }, show: { y: 0, opacity: 1 } }}
          transition={{ duration: 1, ease: EASE }}
          style={word === 'Work' ? { fontFamily: SERIF_FONT, fontStyle: 'italic', fontWeight: 400, letterSpacing: '-0.02em' } : undefined}
        >
          {word}
        </motion.span>
      </span>
    </motion.span>
  )
}

function Stage({ entered, rise, height }) {
  const reduced = useReducedMotion()
  const layerRef = useRef(null)
  const boxRef = useRef(null)
  const rowRef = useRef(null)
  const wordEls = useRef([])
  // measured geometry of the heading morph (px) – read inside the transforms, so no re-render is needed when it changes
  const geo = useRef({ left: [0, 0, 0], pitch: 0, dx: 0, dy: 0, scale: 1 })
  const tick = useMotionValue(0)

  useLayoutEffect(() => {
    const measure = () => {
      const layer = layerRef.current
      const box = boxRef.current
      const row = rowRef.current
      if (!layer || !box || !row) return
      const lr = layer.getBoundingClientRect()
      const br = box.getBoundingClientRect()
      const vw = lr.width
      const fontSize = parseFloat(getComputedStyle(row).fontSize)
      const rowWidth = row.offsetWidth // width of "Award Winning Work" on one line at the full size
      const scale = Math.min(1, (vw * (vw < 640 ? WIDTH_SMALL : WIDTH_WIDE)) / rowWidth)
      const finalTop = Math.min(32, Math.max(14, vw * 0.024)) // same top offset the old pinned heading used
      geo.current = {
        left: wordEls.current.map((el) => (el ? el.offsetLeft : 0)),
        pitch: 0.96 * fontSize, // one stacked line = line-height .9em + .06em padding
        dx: (vw - rowWidth * scale) / 2 - (br.left - lr.left), // → horizontally centred
        dy: finalTop - (br.top - lr.top), // → top of the screen
        scale,
      }
      tick.set(tick.get() + 1)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(layerRef.current)
    ro.observe(rowRef.current)
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure)
    return () => ro.disconnect()
  }, [tick])

  // 0 → 1 while the list rises into the banner
  const mp = useTransform(rise, [0, MORPH_END], reduced ? [1, 1] : [0, 1], { ease: easeInOut })
  const headScale = useTransform([mp, tick], ([p]) => 1 + (geo.current.scale - 1) * p)
  const headX = useTransform([mp, tick], ([p]) => geo.current.dx * p)
  const headY = useTransform([mp, tick], ([p]) => geo.current.dy * p)
  const starScale = useTransform(mp, [0, 1], [1, STAR_SHRINK_TO])
  const subtitleOpacity = useTransform(rise, [0, SUBTITLE_FADE_END], reduced ? [0, 0] : [1, 0])
  // red gradient → pitch black, finished exactly when the whole list has arrived
  const blackOpacity = useTransform(rise, [0, 1], [0, 1])

  const state = entered ? 'show' : 'hidden'
  return (
    // sticky: stays pinned to the top of the screen while the list scrolls up over it
    <div ref={layerRef} className="sticky top-0" style={{ height, color: '#fff', fontFamily: DISPLAY_FONT }}>
      <div aria-hidden="true" className="absolute inset-x-0 top-0" style={{ height: '100svh', background: HERO_GRADIENT }} />
      <motion.div aria-hidden="true" className="absolute inset-x-0 top-0" style={{ height: '100svh', background: '#000', opacity: blackOpacity }} />

      <div className="absolute inset-x-0 top-0 overflow-hidden" style={{ height: '100svh' }}>
        <div aria-hidden="true" className="h-14 sm:h-20 lg:h-24" />
        {/* keeps the heading clear of the arch's shoulders now that the curve stays deep at the top */}
        <div aria-hidden="true" style={{ height: `${Math.round(ARCH_END * 0.3)}svh` }} />

        <div className="flex items-start justify-between gap-6 px-5 sm:px-10 lg:px-[7%]">
          <div className="min-w-0 flex-1">
            {/* reserves the height of the three stacked lines */}
            <div ref={boxRef} style={{ fontSize: HEADING_SIZE, height: '2.88em' }}>
              <motion.h2
                ref={rowRef}
                className="font-extrabold"
                initial="hidden"
                animate={state}
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.14, delayChildren: 0.05 } } }}
                style={{
                  position: 'relative',
                  display: 'flex',
                  width: 'max-content',
                  gap: '0.26em',
                  whiteSpace: 'nowrap',
                  lineHeight: 0.9,
                  letterSpacing: '-0.045em',
                  scale: headScale,
                  x: headX,
                  y: headY,
                  transformOrigin: '0% 0%',
                }}
              >
                {WORDS.map((w, i) => (
                  <Word key={w} i={i} word={w} mp={mp} tick={tick} geo={geo} elRef={(el) => { wordEls.current[i] = el }} />
                ))}
              </motion.h2>
            </div>
            <motion.div style={{ opacity: subtitleOpacity }}>
              <motion.p
                initial={{ opacity: 0, y: 24 }}
                animate={entered ? { opacity: 0.8, y: 0 } : { opacity: 0, y: 24 }}
                transition={{ duration: 0.9, ease: EASE, delay: 0.55 }}
                className="mt-6 max-w-md text-sm font-medium sm:text-base"
              >
                Selected collaborations with studios and brands that care how things look, move and feel.
              </motion.p>
            </motion.div>
          </div>

          <motion.div style={{ scale: starScale, y: headY, transformOrigin: '100% 0%' }} className="hidden shrink-0 sm:block">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={entered ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.9, ease: EASE, delay: 0.35 }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
                className="grid place-items-center rounded-full"
                style={{ width: 'clamp(90px, 12vw, 170px)', height: 'clamp(90px, 12vw, 170px)', background: '#fff', color: '#c8431f' }}
              >
                <Star className="h-1/2 w-1/2" fill="currentColor" strokeWidth={0} />
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

function Preview({ project }) {
  // the project's own artwork leads a small bento grid of related imagery
  const others = PROJECTS.filter((p) => p.id !== project.id)
  return (
    <motion.div
      key={project.id}
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.98 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-2.5 sm:gap-3"
    >
      <div className="relative col-span-2 row-span-2 overflow-hidden rounded-2xl">
        <ProjectArt variant={project.variant} />
        <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-3 rounded-2xl p-3 text-white sm:inset-x-4 sm:bottom-4 sm:p-4" style={glass}>
          <div>
            <div className="text-lg font-bold sm:text-2xl" style={{ letterSpacing: '-0.02em' }}>{project.name}</div>
            <div className="text-xs opacity-80 sm:text-sm">{project.role}</div>
          </div>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-black" style={{ background: ACCENT }}>
            <ArrowUpRight className="h-5 w-5" />
          </span>
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl"><ProjectArt variant={others[0].variant} hue={30} /></div>
      <div className="overflow-hidden rounded-2xl"><ProjectArt variant={others[1].variant} hue={-30} /></div>
      <div className="overflow-hidden rounded-2xl"><ProjectArt variant={others[2].variant} hue={90} /></div>
      <div className="flex flex-col justify-between rounded-2xl p-3 text-white sm:p-4" style={glass}>
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] opacity-70 sm:text-xs">{project.year}</span>
        <span className="text-xs leading-snug opacity-90 sm:text-sm">{project.blurb}</span>
      </div>
      <div className="grid place-items-center overflow-hidden rounded-2xl text-black" style={{ background: ACCENT }}>
        <span className="text-3xl font-extrabold sm:text-5xl" style={{ letterSpacing: '-0.05em' }}>
          0{PROJECTS.findIndex((p) => p.id === project.id) + 1}
        </span>
      </div>
    </motion.div>
  )
}

export default function FeaturedProjects() {
  const [active, setActive] = useState(0)
  const project = PROJECTS[active]

  // scroll-linked arch reveal: 0 → 1 while the section's top edge travels from the bottom of the screen to the top.
  // The arch gets steadily rounder the closer the section gets (no flattening at the end). Its ellipse is OVERSCAN% wider
  // than the screen on both sides, so the ends – where an ellipse turns vertical and would read as harsh corners – are
  // never on screen: you only ever see the smooth crown of the curve.
  const ref = useRef(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'start start'] })
  const arch = useTransform(scrollYProgress, [0, 1], reduced ? [0, 0] : [ARCH_START, ARCH_END], { ease: easeInOut })
  const archRadius = useTransform(arch, (h) => `50% 50% 0 0 / ${h}svh ${h}svh 0 0`)

  // content entrance: latches once when the section locks into place (also covers landing mid-page via an anchor link)
  const [entered, setEntered] = useState(false)
  useMotionValueEvent(scrollYProgress, 'change', (v) => { if (v >= LOCK_AT) setEntered(true) })
  useEffect(() => { if (scrollYProgress.get() >= LOCK_AT || reduced) setEntered(true) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // list rise: 0 when the list's top edge enters at the bottom of the screen → 1 when it has come all the way up to the
  // heading zone (ZONE_SVH from the top). Drives the red → black fade and the heading morph.
  const listRef = useRef(null)
  const { scrollYProgress: rise } = useScroll({ target: listRef, offset: ['start end', `start ${ZONE_SVH}%`] })

  // The pinned banner is as tall as "heading zone + list" (at least one screen), so once the list has arrived the pin
  // releases and heading + list scroll away together without overlapping.
  const [listH, setListH] = useState(0)
  useLayoutEffect(() => {
    const el = listRef.current
    if (!el) return undefined
    const update = () => setListH(el.offsetHeight)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const stageHeight = `max(100svh, calc(${ZONE_SVH}svh + ${listH}px))`
  // list top sits HOLD_SVH below the fold when the banner is first pinned
  const listMargin = `calc(${100 + HOLD_SVH}svh - ${stageHeight})`

  return (
    <section
      id="projects"
      ref={ref}
      // transparent on purpose: the pinned Manifesto stage must show through the arch's corners.
      // negative margin = the part of Manifesto's pinned scroll this section rises over (keep in sync with RISE_SVH there)
      style={{ position: 'relative', zIndex: 10, marginTop: '-100svh', color: '#fff', fontFamily: DISPLAY_FONT, overflowX: 'clip' }}
    >
      {/* wider than the screen (negative margin) and padded back in, so the arch's ends stay off-screen */}
      <motion.div
        style={{ borderRadius: archRadius, background: '#000', marginInline: `-${OVERSCAN}%`, paddingInline: `${OVERSCAN}%` }}
        className="overflow-clip"
      >
        <Stage entered={entered} rise={rise} height={stageHeight} />

        {/* transparent: the red banner shows through while the list rises, then turns pitch black behind it */}
        <div
          ref={listRef}
          className="relative z-10 grid gap-10 px-5 pb-14 pt-4 sm:px-10 sm:pb-20 lg:grid-cols-2 lg:gap-16 lg:px-[7%] lg:pb-24"
          style={{ marginTop: listMargin }}
        >
          {/* project list */}
          <ul className="flex flex-col" onMouseLeave={() => undefined}>
            {PROJECTS.map((p, i) => {
              const on = i === active
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    onClick={() => setActive(i)}
                    aria-pressed={on}
                    className="group relative flex w-full items-center gap-4 border-t py-6 text-left transition-colors sm:gap-6 sm:py-8"
                    style={{ borderColor: 'rgba(255,255,255,.14)' }}
                  >
                    {/* highlight bar */}
                    <motion.span
                      aria-hidden="true"
                      className="absolute inset-0 -z-0 rounded-xl"
                      initial={false}
                      animate={{ opacity: on ? 1 : 0, x: on ? 0 : -12 }}
                      transition={{ duration: 0.3 }}
                      style={{ background: 'linear-gradient(90deg, rgba(198,255,61,.14), transparent 80%)' }}
                    />
                    <span className="relative text-sm font-semibold tabular-nums sm:text-base" style={{ color: on ? ACCENT : 'rgba(255,255,255,.4)' }}>
                      0{i + 1}
                    </span>
                    <span className="relative flex-1">
                      <span
                        className="block font-extrabold transition-all duration-300"
                        style={{
                          fontSize: 'clamp(1.8rem, 4.2vw, 3.4rem)',
                          lineHeight: 1,
                          letterSpacing: '-0.035em',
                          color: on ? '#fff' : 'rgba(255,255,255,.38)',
                          transform: on ? 'translateX(10px)' : 'none',
                        }}
                      >
                        {p.name}
                      </span>
                      <span className="mt-2 block text-xs sm:text-sm" style={{ color: on ? 'rgba(255,255,255,.75)' : 'rgba(255,255,255,.3)' }}>
                        {p.role}
                      </span>
                    </span>
                    <ArrowUpRight
                      className="relative h-6 w-6 shrink-0 transition-all duration-300 sm:h-7 sm:w-7"
                      style={{ color: ACCENT, opacity: on ? 1 : 0, transform: on ? 'none' : 'translate(-8px, 8px)' }}
                    />
                  </button>
                </li>
              )
            })}
            <li className="border-t" style={{ borderColor: 'rgba(255,255,255,.14)' }} aria-hidden="true" />
          </ul>

          {/* preview */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            <div className="relative w-full overflow-hidden rounded-3xl p-2.5 sm:p-3" style={{ aspectRatio: '1 / 1', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.12)' }}>
              <div className="relative h-full w-full">
                <AnimatePresence mode="wait">
                  <Preview project={project} />
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  )
}