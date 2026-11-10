import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { animate, motion, easeInOut, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { Star } from 'lucide-react'
import { DISPLAY_FONT, SERIF_FONT } from '@/lib/projects'
import ArcCarousel from '@/components/ArcCarousel'
import { DOME_DEPTH_SVH } from '@/lib/dome'

/* =====================================================================
   Featured Projects – "Award Winning Work"
   • black from the first frame; it rises over the pinned Manifesto stage with its whole top edge bent into a dome (50% rounded) from the first frame
   • a banner (the heading) stays pinned while the project list rises into it
   • as the list rises: the subtitle fades out and the stacked "Award / Winning / Work"
     heading widens into ONE line, centred at the top
   • arc card carousel: project cards ride a big wheel (hub off the left edge); scroll / drag to rotate
   ===================================================================== */

const WORDS = ['Award', 'Winning', 'Work']

// Section hand-off: this section is pulled up over the last RISE (100svh) of the pinned Manifesto stage
// (marginTop below ↔ RISE_SVH in Manifesto.jsx). Its top edge is a dome (see lib/dome.js); the Manifesto's stats are
// pushed up by it as it arrives and bend along the same curve (see TunnelStats).
const LOCK_AT = 0.92 // rise progress at which the section counts as "locked in" and its content enters
const EASE = [0.22, 1, 0.36, 1]

// ── Banner → list hand-off ───────────────────────────────────────────────────────────────────────────────────────────
// The banner is pinned (sticky) to the top of the screen. The project list starts below the fold and scrolls up into it.
const HOLD_SVH = 12 // scroll (svh) the full banner is held on its own before the list starts to peek in
const ZONE_SVH = 24 // svh kept clear at the top for the one-line heading (and the nav above it) – the list stops rising right below it
const NAV_CLEAR_PX = 92 // the heading never goes above this line: the fixed pill nav ends at ~64px, plus a gap
const MORPH_END = 0.85 // share of the list's rise by which the heading has finished morphing into one line
const SUBTITLE_FADE_END = 0.25 // share of the list's rise by which the subtitle has faded out
const WIDTH_SMALL = 0.84 // final one-line heading width as a share of screen width (< 640px)
const WIDTH_WIDE = 0.5 // …and from 640px up – "subtle", not edge to edge
const STAR_SHRINK_TO = 0.38 // final scale of the star badge
// Second move: once the project list has scrolled up by SETTLE_START of its own length (the carousel is under way), the one-line
// heading folds back into three lines, right-aligned, and tucks in under the star at the right edge – at the SAME size it has
// as the one-line heading. The move itself is a slow eased animation (SETTLE_SECONDS) that is triggered at that point, so its speed
// does not depend on how fast the visitor scrolls.
const SETTLE_START = 0.1 // fraction of the whole project list that has scrolled up when the move starts
const SETTLE_SECONDS = 2.6 // how long the move to the right takes – slow and subtle
const SETTLE_BACK_SECONDS = 0.25 // …and the move back to the left (scrolling up towards the Manifesto): a quick snap, so the slow animation never runs while the page is being scrolled away
const SETTLE_GAP_PX = 16 // gap between the star and the tucked-in heading

const HEADING_SIZE = 'clamp(2.8rem, 10.5vw, 10rem)'

const seg = (p, a, b) => { const t = Math.min(1, Math.max(0, (p - a) / (b - a))); return t * t * (3 - 2 * t) }

/* One word of the heading. It sits in a single-line row (its natural layout); a scroll-linked offset pulls it back into the
   stacked, left-aligned layout at progress 0 and releases it into the row at progress 1. */
function Word({ i, word, mp, q, tick, geo, elRef }) {
  // The morph is sequenced so the words never collide: first each word slides sideways along its own line (p 0 → .55),
  // and only then do the lines lift into a single row (p .45 → 1). A straight diagonal path made them overlap mid-way.
  // The second move (q 0 → 1) runs the other way round: the words first drop onto their own lines, still in a row
  // (q 0 → .55), and only then slide sideways to line up on the right edge (q .45 → 1).
  const x = useTransform([mp, q, tick], ([p, qq]) => {
    const g = geo.current
    const x1 = -(g.left[i] || 0) * (1 - seg(p, 0, 0.55))
    const xRight = -(g.left[i] || 0) + (g.maxW - (g.widths[i] || 0)) // stacked, right edges aligned
    return x1 + (xRight - x1) * seg(qq, 0.45, 1)
  })
  const y = useTransform([mp, q, tick], ([p, qq]) => {
    const g = geo.current
    const y1 = g.pitch * i * (1 - seg(p, 0.45, 1))
    return y1 + (g.pitch * i - y1) * seg(qq, 0, 0.55)
  })
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

function Stage({ entered, rise, settle, height }) {
  const reduced = useReducedMotion()
  const layerRef = useRef(null)
  const boxRef = useRef(null)
  const padRef = useRef(null)
  const starRef = useRef(null)
  const rowRef = useRef(null)
  const wordEls = useRef([])
  // measured geometry of the heading morph (px) – read inside the transforms, so no re-render is needed when it changes
  const geo = useRef({ left: [0, 0, 0], widths: [0, 0, 0], maxW: 0, pitch: 0, dx: 0, dy: 0, scale: 1, s2: 0.25, dx2: 0, dy2: 0 })
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
      const finalTop = NAV_CLEAR_PX // one-line heading rests below the fixed nav, with a gap
      // second move: where the three short right-aligned lines go (right edge, just under the star)
      const widths = wordEls.current.map((el) => (el ? el.offsetWidth : 0))
      const maxW = Math.max(0, ...widths)
      const padRight = padRef.current ? parseFloat(getComputedStyle(padRef.current).paddingRight) || 0 : 0
      const starEl = starRef.current
      const starShown = !!starEl && starEl.offsetParent !== null
      const targetTop = finalTop + (starShown ? starEl.offsetWidth * STAR_SHRINK_TO + SETTLE_GAP_PX : 0)
      const s2 = scale // keeps the one-line heading's size
      geo.current = {
        widths,
        maxW,
        s2,
        dx2: vw - padRight - maxW * s2 - (br.left - lr.left),
        dy2: targetTop - (br.top - lr.top),
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

  // 0 → 1 while the list rises into the banner (drives the heading morph and the subtitle fade)
  const mp = useTransform(rise, [0, MORPH_END], reduced ? [1, 1] : [0, 1], { ease: easeInOut })
  // the second move: 0 → 1 once the project carousel starts to scroll
  const q = useTransform(settle, [0, 1], reduced ? [1, 1] : [0, 1])
  const headScale = useTransform([mp, q, tick], ([p, qq]) => {
    const g = geo.current
    const base = 1 + (g.scale - 1) * p
    return base + (g.s2 - base) * seg(qq, 0, 1)
  })
  const headX = useTransform([mp, q, tick], ([p, qq]) => {
    const g = geo.current
    return g.dx * p + (g.dx2 - g.dx * p) * seg(qq, 0, 1)
  })
  const headY = useTransform([mp, q, tick], ([p, qq]) => {
    const g = geo.current
    return g.dy * p + (g.dy2 - g.dy * p) * seg(qq, 0, 1)
  })
  const starY = useTransform([mp, tick], ([p]) => geo.current.dy * p) // the star only makes the first move
  const starScale = useTransform(mp, [0, 1], [1, STAR_SHRINK_TO])
  const subtitleOpacity = useTransform(rise, [0, SUBTITLE_FADE_END], reduced ? [0, 0] : [1, 0])

  const state = entered && fontsReady ? 'show' : 'hidden'
  return (
    // sticky: stays pinned to the top of the screen while the list scrolls up over it
    <div ref={layerRef} className="sticky top-0" style={{ height, color: '#fff', fontFamily: DISPLAY_FONT }}>

      <div className="absolute inset-x-0 top-0 overflow-hidden" style={{ height: '100svh' }}>
        <div aria-hidden="true" style={{ height: NAV_CLEAR_PX }} />

        <div ref={padRef} className="flex items-start justify-between gap-6 px-5 sm:px-10 lg:px-[7%]">
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
                  willChange: 'transform',
                }}
              >
                {WORDS.map((w, i) => (
                  <Word key={w} i={i} word={w} mp={mp} q={q} tick={tick} geo={geo} elRef={(el) => { wordEls.current[i] = el }} />
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

          <motion.div ref={starRef} style={{ scale: starScale, y: starY, transformOrigin: '100% 0%' }} className="hidden shrink-0 sm:block">
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
  // heading zone (ZONE_SVH from the top). Drives the heading morph.
  const listRef = useRef(null)
  const { scrollYProgress: rise } = useScroll({ target: listRef, offset: ['start end', `start ${ZONE_SVH}%`] })
  // second move of the heading: triggered once the list has scrolled up by SETTLE_START of its own height (counted from the moment
  // it arrived at the heading zone), then played as a slow eased animation – forwards or back – whatever the scroll speed
  const { scrollY } = useScroll()
  const settle = useMotionValue(0)
  const wantSettle = useRef(0)
  // The list's page position and height are measured only when the layout changes (load, resize, content size change) and cached –
  // reading them on every scroll event forced a layout calculation per frame.
  const listBox = useRef({ top: 0, height: 0, ok: false })
  const measureList = () => {
    const el = listRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    listBox.current = { top: r.top + window.scrollY, height: r.height, ok: true }
  }
  const checkSettle = (y) => {
    if (!listBox.current.ok) measureList()
    const { top, height } = listBox.current
    if (!height) return
    const arrived = top - (ZONE_SVH / 100) * window.innerHeight // page scroll at which the list's top reached the heading zone
    const want = y > arrived + SETTLE_START * height ? 1 : 0
    if (want === wantSettle.current) return
    wantSettle.current = want
    window.dispatchEvent(new Event('fp-settle')) // the carousel's buttons re-measure while the heading moves
    animate(settle, want, want ? { duration: reduced ? 0 : SETTLE_SECONDS, ease: [0.45, 0.05, 0.55, 0.95] } : { duration: reduced ? 0 : SETTLE_BACK_SECONDS, ease: [0.25, 0.1, 0.25, 1] })
  }
  useMotionValueEvent(scrollY, 'change', checkSettle)
  useEffect(() => {
    measureList()
    checkSettle(window.scrollY)
    const ro = new ResizeObserver(() => { measureList(); checkSettle(window.scrollY) })
    ro.observe(document.documentElement)
    if (listRef.current) ro.observe(listRef.current)
    return () => ro.disconnect()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // The banner / heading is exactly one screen tall and stays pinned (sticky) for the WHOLE height of the section – through
  // the list's arrival and the entire pinned carousel. It only lets go when the list ends, and the two scroll away together.
  const stageHeight = '100svh'
  // list top sits HOLD_SVH below the fold when the banner is first pinned
  const listMargin = `${HOLD_SVH}svh`

  return (
    <section
      id="projects"
      ref={ref}
      // transparent on purpose (the pinned Manifesto stage sits behind it).
      // negative margin = the part of Manifesto's pinned scroll this section rises over (keep in sync with RISE_SVH there)
      style={{ position: 'relative', zIndex: 10, marginTop: '-100svh', color: '#fff', fontFamily: DISPLAY_FONT, overflowX: 'clip' }}
    >
      {/* pitch black from the start; top corners rounded 50% × DOME_DEPTH_SVH, so the whole top edge is a dome */}
      <div style={{ background: '#000', borderTopLeftRadius: `50% ${DOME_DEPTH_SVH}svh`, borderTopRightRadius: `50% ${DOME_DEPTH_SVH}svh` }}>
        <Stage entered={entered} rise={rise} settle={settle} height={stageHeight} />

        {/* the project list rises up into the pinned banner */}
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