import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { motion, easeInOut, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { Star } from 'lucide-react'
import { DISPLAY_FONT, SERIF_FONT } from '@/lib/projects'
import ArcCarousel from '@/components/ArcCarousel'

/* =====================================================================
   Featured Projects – "Award Winning Work"
   • vibrant accent banner that stays pinned while the project list rises into it
   • as the list rises: the red gradient stays as it is, the subtitle fades out and
     the stacked "Award / Winning / Work" heading widens into ONE line, centred at the top
   • arc card carousel: project cards ride a big wheel (hub off the left edge); scroll / drag to rotate
   ===================================================================== */

const WORDS = ['Award', 'Winning', 'Work']

// Section hand-off: this section is pulled up over the last RISE (100svh) of the pinned Manifesto stage
// (marginTop below ↔ RISE_SVH in Manifesto.jsx). It peeks in with a gentle curve that keeps getting rounder for the whole
// rise – it never straightens out; once the section reaches the top it simply scrolls away with its arch intact.
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
  // The morph is sequenced so the words never collide: first each word slides sideways along its own line (p 0 → .55),
  // and only then do the lines lift into a single row (p .45 → 1). A straight diagonal path made them overlap mid-way.
  const seg = (p, a, b) => { const t = Math.min(1, Math.max(0, (p - a) / (b - a))); return t * t * (3 - 2 * t) }
  const x = useTransform([mp, tick], ([p]) => -(geo.current.left[i] || 0) * (1 - seg(p, 0, 0.55)))
  const y = useTransform([mp, tick], ([p]) => geo.current.pitch * i * (1 - seg(p, 0.45, 1)))
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
  const measureRef = useRef(null)
  const [fontsReady, setFontsReady] = useState(false)

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
    measureRef.current = measure
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(layerRef.current)
    ro.observe(rowRef.current)
    // The heading is measured in the real fonts only: until Bricolage Grotesque + Instrument Serif have loaded it stays
    // hidden, so it can never flash in a fallback font (tight letter-spacing makes those letters overlap) and then snap
    // into place when the web font swaps in.
    let alive = true
    const done = () => { if (alive) { measure(); setFontsReady(true) } }
    if (document.fonts && document.fonts.load) {
      Promise.all([document.fonts.load('800 100px "Bricolage Grotesque"'), document.fonts.load('italic 400 100px "Instrument Serif"')])
        .then(() => document.fonts.ready)
        .then(done, done)
    } else done()
    const fallback = setTimeout(done, 3000) // never leave the heading hidden if the font request stalls
    return () => { alive = false; clearTimeout(fallback); ro.disconnect() }
  }, [tick])

  // re-measure once more right before the heading is revealed, so the first frame already has the final geometry
  useEffect(() => { if (entered) measureRef.current?.() }, [entered])

  // 0 → 1 while the list rises into the banner
  // red gradient → pitch black, finished exactly when the whole list has arrived
  const blackOpacity = useTransform(rise, [0, 1], [0, 1])
  const mp = useTransform(rise, [0, MORPH_END], reduced ? [1, 1] : [0, 1], { ease: easeInOut })
  const headScale = useTransform([mp, tick], ([p]) => 1 + (geo.current.scale - 1) * p)
  const headX = useTransform([mp, tick], ([p]) => geo.current.dx * p)
  const headY = useTransform([mp, tick], ([p]) => geo.current.dy * p)
  const starScale = useTransform(mp, [0, 1], [1, STAR_SHRINK_TO])
  const subtitleOpacity = useTransform(rise, [0, SUBTITLE_FADE_END], reduced ? [0, 0] : [1, 0])

  const state = entered && fontsReady ? 'show' : 'hidden'
  return (
    // sticky: stays pinned to the top of the screen while the list scrolls up over it
    <div ref={layerRef} className="sticky top-0" style={{ height, color: '#fff', fontFamily: DISPLAY_FONT }}>
      <div aria-hidden="true" className="absolute inset-x-0 top-0" style={{ height: '100svh', background: HERO_GRADIENT }} />
      <motion.div aria-hidden="true" className="absolute inset-x-0 top-0" style={{ height: '100svh', background: '#000', opacity: blackOpacity, willChange: 'opacity' }} />

      <div className="absolute inset-x-0 top-0 overflow-hidden" style={{ height: '100svh' }}>
        <div aria-hidden="true" className="h-14 sm:h-20 lg:h-24" />

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

export default function FeaturedProjects() {
  // 0 → 1 while the section's top edge travels from the bottom of the screen to the top (used to time the heading's entrance)
  const ref = useRef(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'start start'] })

  // content entrance: latches once when the section locks into place (also covers landing mid-page via an anchor link)
  const [entered, setEntered] = useState(false)
  useMotionValueEvent(scrollYProgress, 'change', (v) => { if (v >= LOCK_AT) setEntered(true) })
  useEffect(() => { if (scrollYProgress.get() >= LOCK_AT || reduced) setEntered(true) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // list rise: 0 when the list's top edge enters at the bottom of the screen → 1 when it has come all the way up to the
  // heading zone (ZONE_SVH from the top). Drives the red → black fade and the heading morph.
  const listRef = useRef(null)
  const { scrollYProgress: rise } = useScroll({ target: listRef, offset: ['start end', `start ${ZONE_SVH}%`] })

  // The banner / heading is exactly one screen tall and stays pinned (sticky) for the WHOLE height of the section – through
  // the list's arrival and the entire pinned carousel. It only lets go when the list ends, and the two scroll away together.
  const stageHeight = '100svh'
  // list top sits HOLD_SVH below the fold when the banner is first pinned
  const listMargin = `${HOLD_SVH}svh`

  return (
    <section
      id="projects"
      ref={ref}
      // transparent on purpose: the pinned Manifesto stage must show through the arch's corners.
      // negative margin = the part of Manifesto's pinned scroll this section rises over (keep in sync with RISE_SVH there)
      style={{ position: 'relative', zIndex: 10, marginTop: '-100svh', color: '#fff', fontFamily: DISPLAY_FONT, overflowX: 'clip' }}
    >
      {/* plain, square-edged section – no rounded top */}
      <div style={{ background: '#000' }}>
        <Stage entered={entered} rise={rise} height={stageHeight} />

        {/* transparent: the red banner shows through while the list rises, then turns pitch black behind it */}
        <div
          ref={listRef}
          className="relative z-10 pb-10 pt-4 sm:pb-16"
          style={{ marginTop: listMargin }}
        >
          <ArcCarousel />
        </div>
      </div>
    </section>
  )
}