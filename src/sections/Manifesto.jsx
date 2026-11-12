import { useEffect, useRef, useState } from 'react'
import { motion, easeInOut, easeOut, useInView, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { DISPLAY_FONT } from '@/lib/projects'
import PerspectiveTunnelStage, { TunnelStats } from '@/components/ui/perspective-tunnel-stage'
import GlyphZoom from '@/components/ui/glyph-zoom'
import { scrollToTarget } from '@/lib/useSmoothScroll'

/* =====================================================================
   Manifesto section – one pinned stage, four beats (all driven by the same scroll progress):
   1. the "studio in numbers" scene plays first: photos fly past in a 3D tunnel, then the stats count up
   2. "BUILT WITH SCALE" appears. Its letters are windows onto the ELENA VOSS screen
   3. the camera zooms into one letter (components/ui/glyph-zoom) until the letter fills the screen: that is the ELENA VOSS
      screen. Its content then builds up in stages (headline lines, model, labels). The stats stay along the bottom, IN FRONT
      of it, and remain on it
   4. the screen rests for a beat while the next section (FeaturedProjects) rises over it – its dome-shaped top edge pushes
      the stats up and bends them along its curve
   Pinned with a sticky stage; progress comes from framer-motion's useScroll.
   ===================================================================== */

/* ---------- Elena Voss screen: warm amber studio look (colours sampled from the reference design) ----------
   Edges are a deep burnt orange (#893c02 … #803e03), a big bright amber glow sits left of the head (#f58937 … #f7b055), the right side
   and the bottom fall off into dark brown (#4d2401). All of it is static gradients: no blur, no filters. */
const EL_FONT = 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
const GIANT_WORD = 'INTERIORS' // the huge pale word behind the model (swap for any word or a name)
const PLATE =
  'radial-gradient(46% 54% at 29% 63%, #f7913c 0%, rgba(247,145,60,.88) 20%, rgba(226,112,30,.5) 50%, transparent 78%),' +
  'radial-gradient(34% 40% at 54% 40%, rgba(240,150,60,.42), transparent 72%),' + // soft light behind the head
  'linear-gradient(270deg, rgba(55,22,2,.55) 0%, transparent 38%),' + // the right side falls away
  'linear-gradient(0deg, rgba(28,11,1,.85) 0%, rgba(60,26,3,.5) 14%, transparent 34%),' + // dark floor under the shoulders
  'linear-gradient(180deg, #8f3f03 0%, #b04e06 36%, #a84b06 62%, #6a3003 100%)'
const AVATARS = ['#e9b077', '#c97b3a', '#8f4a1a']

const MODEL_SRC = '/male_model.png' // background removed from male_model.jpeg

// "Studio in numbers" figures – placeholders, replace with the studio's real numbers
const STATS = [
  { value: 12, suffix: '+', label: 'Years of practice' },
  { value: 240, suffix: '+', label: 'Projects delivered' },
  { value: 85, suffix: 'k', label: 'Sq. ft. designed' },
  { value: 98, suffix: '%', label: 'Happy clients' },
]

// Pinned scroll budget (svh). The stage stays pinned for the sum of these:
const NUMBERS_SVH = 150 // the numbers scene plays (tunnel → stats)
const TITLE_SVH = 60 // after the numbers scene: the word's intro finishes and holds, ready for the zoom
const WORD_AT = 0.85 // "BUILT WITH SCALE" starts to appear when the numbers scene is 85% through, while it is finishing
const ZOOM_SVH = 210 // the camera flies into a letter (long and slow, so the zoom feels subtle)
const BUILD_AT = 0.85 // share of the zoom after which the screen's content starts to build (the zoom's last stretch is empty)
const BUILD_SVH = 55 // the Elena Voss screen's content builds up piece by piece
const HOLD_SVH = 45 // the full screen rests for a beat
const RISE_SVH = 100 // FeaturedProjects rises over the stage (its marginTop must equal -RISE_SVH)
const PIN_SVH = NUMBERS_SVH + TITLE_SVH + ZOOM_SVH * BUILD_AT + BUILD_SVH + HOLD_SVH + RISE_SVH
const at = (svh) => svh / PIN_SVH // scroll progress (0 → 1) at a given point of the pin
const NUMBERS_END = at(NUMBERS_SVH)
const TITLE_END = at(NUMBERS_SVH + TITLE_SVH)
const WORD_START = NUMBERS_SVH * WORD_AT // (svh)
const ZOOM_END = at(NUMBERS_SVH + TITLE_SVH + ZOOM_SVH)
const BUILD_START = at(NUMBERS_SVH + TITLE_SVH + ZOOM_SVH * BUILD_AT)
const BUILD_END = at(NUMBERS_SVH + TITLE_SVH + ZOOM_SVH * BUILD_AT + BUILD_SVH)
const RISE_START = at(NUMBERS_SVH + TITLE_SVH + ZOOM_SVH * BUILD_AT + BUILD_SVH + HOLD_SVH) // when FeaturedProjects starts to rise
const STATS_BOTTOM_SVH = 91 // bottom of the stats row, in svh from the top of the screen (just under the labels)

/* ---------- section ---------- */

export default function Manifesto() {
  const ref = useRef(null)
  const reduced = useReducedMotion()
  const { scrollYProgress: rawProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })

  // the numbers scene is only mounted while it can be seen: armed when the section is about to scroll in, switched off
  // again once "BUILT WITH SCALE" has replaced it (and back on if the visitor scrolls back up)
  const armed = useInView(ref, { once: true, margin: '0px 0px 150% 0px' })
  const live = useInView(ref) // true only while the section is on screen
  const [numbersOn, setNumbersOn] = useState(true)
  useMotionValueEvent(rawProgress, 'change', (v) => setNumbersOn(v < TITLE_END + 0.02))
  // mounted once (when first about to be seen) and then only hidden with display:none – scrolling back up never rebuilds the 3D scene
  const showNumbers = armed && !reduced

  // beat 4 – FeaturedProjects rises over the stage; its top line reaches the stats and pushes them up, so they stay just
  // above the line instead of being covered. The line's height (svh from the top of the screen) is linear in the scroll
  // because the stage is pinned and the next section is pulled up by exactly RISE_SVH.
  // phones: there is no room above the stats for the rising edge to push them through, so they fade out as the edge arrives
  const isPhone = typeof window !== 'undefined' && window.matchMedia('(max-width: 639px)').matches
  const statsFade = useTransform(rawProgress, [RISE_START, RISE_START + (1 - RISE_START) * 0.4], isPhone ? [1, 0] : [1, 1])
  const edge = useTransform(rawProgress, (r) => 100 * (1 - Math.min(1, Math.max(0, (r - RISE_START) / (1 - RISE_START)))))

  // beat 1 – the numbers scene (its own progress drives the tunnel and the stats)
  const tunnel = useTransform(rawProgress, [0, NUMBERS_END], [0, 1], { clamp: true })
  // beat 2 – the numbers scene gives way to the word, whose letters are filled with the Elena screen
  const numbersOpacity = useTransform(rawProgress, [at(WORD_START + 6), at(NUMBERS_SVH + 12)], [1, 0])
  const wordIn = useTransform(rawProgress, [at(WORD_START), at(WORD_START + 14)], [0, 1]) // the layer itself fades in quickly…
  const intro = useTransform(rawProgress, [at(WORD_START + 8), at(NUMBERS_SVH + 32)], [0, 1], { clamp: true }) // …while the letters rise and the light sweeps
  // beat 3 – the camera zooms into a letter
  const zoom = useTransform(rawProgress, [TITLE_END, ZOOM_END], [0, 1], { clamp: true })
  // …and the content of the screen builds: 0 → 1 over the build stretch
  const open = useTransform(rawProgress, [BUILD_START, BUILD_END], reduced ? [1, 1] : [0, 1], { ease: easeInOut })
  // staged content: each piece has its own window, so the screen feels built rather than faded in
  const lineY1 = useTransform(open, [0.15, 0.45], ['112%', '0%'], { ease: easeOut })
  const lineY2 = useTransform(open, [0.23, 0.53], ['112%', '0%'], { ease: easeOut })
  const lineY3 = useTransform(open, [0.31, 0.61], ['112%', '0%'], { ease: easeOut })
  const modelRise = useTransform(open, [0.2, 0.7], ['14%', '0%'], { ease: easeOut })
  const modelFade = useTransform(open, [0.2, 0.5], [0, 1])
  const detailsFade = useTransform(open, [0.6, 0.85], [0, 1]) // side labels, in-card nav
  // "Selected work" cue appears once the screen is complete
  const cue = useTransform(open, [0.9, 1], [0, 1])

  // mouse-move tilt + parallax (-0.5 … 0.5, smoothed)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 90, damping: 20, mass: 0.6 })
  const sy = useSpring(my, { stiffness: 90, damping: 20, mass: 0.6 })
  useEffect(() => {
    if (reduced || !live) return // no mouse tracking (and no spring updates) while the section is off screen
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
  }, [mx, my, reduced, live])
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

  const go = (to) => (e) => { e.preventDefault(); scrollToTarget(to) }
  const bodyText = 'text-[.92rem] leading-[1.5] sm:text-[length:clamp(.68rem,.88cqw,1rem)] sm:leading-[1.55]'

  const card = (
    <div className="absolute inset-0" style={{ fontFamily: EL_FONT }}>
      {/* the amber studio plate */}
      <div className="absolute inset-0 overflow-hidden" style={{ background: PLATE }} />

      {/* giant pale word, behind the model: thin letters, white at the top fading out downwards */}
      <motion.div aria-hidden="true" style={{ opacity: modelFade }} className="pointer-events-none absolute inset-0 flex justify-center">
        <span
          className="absolute top-[54%] select-none whitespace-nowrap text-[17.5cqw] sm:top-[41%] sm:text-[17.4cqw]"
          style={{
            fontWeight: 200,
            lineHeight: 1,
            letterSpacing: '0.03em',
            background: 'linear-gradient(180deg, rgba(255,255,255,.96) 18%, rgba(255,255,255,.3) 88%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          {GIANT_WORD}
        </span>
      </motion.div>

      {/* text layer (mid depth) */}
      <motion.div className="pointer-events-none absolute inset-0">
        {/* top left: headline, paragraph and button */}
        <motion.div style={{ x: textX, y: textY, rotateX: textRotX, rotateY: textRotY, transformPerspective: 1200 }} className="absolute left-[6%] top-[calc(11%+20px)] w-[88%] sm:left-[3.6%] sm:top-[16%] sm:w-[30%]">
          <h2
            className="text-[clamp(1.5rem,7.4vw,1.9rem)] text-white sm:text-[length:clamp(1.05rem,2.05cqw,2.5rem)]"
            style={{ fontWeight: 400, lineHeight: 1.12, letterSpacing: '0.01em', textTransform: 'uppercase' }}
          >
            {[['Give your brand', lineY1], ['a space it can', lineY2], ['actually live into', lineY3]].map(([t, y]) => (
              <span key={t} className="-mb-[0.1em] block overflow-hidden pb-[0.1em]">
                <motion.span className="block will-change-transform" style={{ y }}>{t}</motion.span>
              </span>
            ))}
          </h2>
          <motion.div style={{ opacity: detailsFade }}>
            <p className={`mt-3 max-w-[21em] text-white/90 sm:mt-[1.5cqw] ${bodyText}`}>
              From considered <b className="font-semibold">layouts to the last detail</b>, your team can trust. And from first principles to production-ready drawings.
            </p>
            <a
              href="#projects"
              onClick={go('#projects')}
              className="pointer-events-auto mt-4 inline-flex items-center rounded-full bg-[#9a0f28] px-5 py-2 text-sm font-light text-white transition-colors hover:bg-[#b3142f] sm:mt-[1.4cqw] sm:px-[2.1cqw] sm:py-[.72cqw] sm:text-[length:clamp(.7rem,1.02cqw,1.2rem)]"
            >
              Read More
            </a>
          </motion.div>
        </motion.div>

        {/* top right: studio title and paragraph */}
        <motion.div style={{ x: badgeX, y: badgeY }} className="absolute right-[3.6%] top-[15%] hidden w-[27%] text-right text-white sm:block">
          <p style={{ fontSize: 'clamp(1.5rem, 3.7cqw, 4.6rem)', fontWeight: 300, lineHeight: 1.02, letterSpacing: '0.01em', textTransform: 'uppercase' }}>
            {[['Interior', lineY1], ['Studio', lineY2]].map(([t, y]) => (
              <span key={t} className="-mb-[0.1em] block overflow-hidden pb-[0.1em]">
                <motion.span className="block will-change-transform" style={{ y }}>{t}</motion.span>
              </span>
            ))}
          </p>
          <motion.p style={{ opacity: detailsFade }} className={`ml-auto mt-[1.2cqw] max-w-[23em] text-white/90 ${bodyText}`}>
            Elena Voss is an <b className="font-semibold">interior design studio</b> that treats every room as a story, not a layout. <b className="font-semibold">We design for people</b> who want spaces that feel like them, planned from the first sketch down to the smallest detail.
          </motion.p>
        </motion.div>

        {/* bottom right: glass card (translucent amber panel with a light edge – no backdrop blur, which would be repainted constantly under the moving model) */}
        <motion.div
          style={{
            opacity: detailsFade,
            left: '83.6%',
            top: '72.5%',
            width: '13%',
            background: 'linear-gradient(160deg, rgba(190,120,70,.5), rgba(120,55,15,.42))',
            borderColor: 'rgba(255,210,160,.38)',
            boxShadow: 'inset 0 1px 0 rgba(255,225,190,.35)',
          }}
          className="absolute hidden rounded-[1.1cqw] border p-[1.05cqw] text-white lg:block"
        >
          <div className="flex items-start justify-between gap-[.8cqw]">
            <p className="font-normal" style={{ fontSize: 'clamp(.7rem, 1.02cqw, 1.2rem)', lineHeight: 1.2 }}>
              Your Partner in
              <br />
              Interior Design
            </p>
            <a
              href="#projects"
              onClick={go('#projects')}
              aria-label="See our work"
              className="pointer-events-auto grid shrink-0 place-items-center rounded-full bg-black text-white transition-transform hover:scale-110"
              style={{ width: '1.7cqw', height: '1.7cqw' }}
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: '55%', height: '55%' }}><path d="M4.5 11.5l7-7M5.5 4.5h6v6" /></svg>
            </a>
          </div>
          <p className="mt-[.7cqw] text-white/85" style={{ fontSize: 'clamp(.6rem, .72cqw, .85rem)', lineHeight: 1.45 }}>
            Concept, drawings and build, handled by one small team.
          </p>
          <div className="mt-[.9cqw] flex items-center gap-[.6cqw]">
            <span className="flex">
              {AVATARS.map((c, i) => (
                <span key={c} className="grid place-items-center rounded-full border text-[0px]" style={{ width: '1.5cqw', height: '1.5cqw', marginLeft: i ? '-.45cqw' : 0, background: c, borderColor: 'rgba(255,235,210,.85)' }}>·</span>
              ))}
            </span>
            <span style={{ fontSize: 'clamp(.58rem, .7cqw, .82rem)', lineHeight: 1.25 }} className="text-white/90">
              100+ happy
              <br />
              clients
            </span>
          </div>
        </motion.div>
      </motion.div>

      {/* model layer (front) – lifted off the plate; warm rim light comes from the plate's glow behind it */}
      <motion.div style={{ y: modelRise, opacity: modelFade }} className="pointer-events-none absolute inset-0 flex items-end justify-center">
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
            filter: 'drop-shadow(0 22px 40px rgba(70,28,2,.5))',
          }}
          className="max-sm:h-auto max-sm:w-[195%] max-sm:max-w-none select-none object-contain object-bottom sm:h-[92%] sm:w-auto"
        />
      </motion.div>
    </div>
  )

  return (
    <section id="manifesto" ref={ref} style={{ height: `${PIN_SVH + 100}svh`, position: 'relative', background: '#000' }}>
      <div
        className="sticky top-0 h-[100svh] w-full overflow-hidden text-white"
        style={{ background: '#000', fontFamily: DISPLAY_FONT, containerType: 'size' }}
      >
        {/* everything but the stats lives in this layer (the stats sit above it, in front) */}
        <motion.div className="absolute inset-0 z-10">
          {/* beat 1: the numbers scene (mounted only while it can be seen) */}
          {showNumbers && (
            <motion.div style={{ opacity: numbersOpacity, display: numbersOn ? 'block' : 'none' }} className="absolute inset-0 z-0">
              <PerspectiveTunnelStage progress={tunnel} active={live && numbersOn} />
            </motion.div>
          )}

          {/* beats 2–3: the word, filled with the Elena Voss screen; the camera flies into one of its letters until that
              screen fills the display. (With reduced motion the screen is simply shown.) */}
          {reduced ? (
            <div className="absolute inset-0 z-10">{card}</div>
          ) : (
            <motion.div style={{ opacity: wordIn }} className="absolute inset-0 z-10">
              <GlyphZoom progress={zoom} intro={intro} word="BUILT WITH SCALE">
                {card}
              </GlyphZoom>
            </motion.div>
          )}

          {/* cue */}
          <motion.div style={{ opacity: cue }} className="pointer-events-none absolute inset-x-0 bottom-[3%] z-40 flex justify-center">
            <span
              className="flex items-center gap-2 rounded-full px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-white"
              style={{ background: 'rgba(11,11,12,.7)', border: '1px solid rgba(255,255,255,.2)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
            >
              Selected work
              <ChevronDown className="h-4 w-4 animate-bounce" />
            </span>
          </motion.div>
        </motion.div>

        {/* beat 3b: the stats stay along the bottom, in front of the Elena card (z-15: above the layer below). Mounted for the
            rest of the section – they live on the card until the next section rises over it. */}
        {armed && (
          <motion.div style={{ opacity: statsFade }} className="pointer-events-none absolute inset-0 z-[15]">
            <TunnelStats progress={tunnel} stats={STATS} edge={edge} edgeStop={STATS_BOTTOM_SVH} />
          </motion.div>
        )}
      </div>
    </section>
  )
}
