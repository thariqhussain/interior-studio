import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)
// mobile browsers resize the viewport as the URL bar shows/hides – don't rebuild the pin for that
ScrollTrigger.config({ ignoreMobileResize: true })

/* =====================================================================
   Hero section – scroll-scrubbed image sequence (single file)
   Needs: gsap (already installed).

   The hero is pinned while you scroll; scroll position picks a point in a
   144-frame sequence (public/hero-frames, extracted from interior_hero.mp4) that
   is painted onto a <canvas>. Why frames instead of <video>: seeking a video
   (one keyframe, async seeks) makes the motion step; decoded frames can be drawn
   instantly, in both directions, and cross-faded for sub-frame smoothness.

   Easing: the scroll position is eased (soft in/out at both ends) and chased with
   an exponential smoother, so the building glides instead of ticking forward.
   ===================================================================== */

const FRAMES = 145        // frames in /hero-frames/{lg,sm}/f0001.webp …
const SCROLL_SCREENS = 3  // how many screens of scrolling play the whole sequence
const IRIS_START = 0.6    // screens of scroll (the preloader's text dispersal) before the wipe starts
const IRIS_SCREENS = 1.2  // screens of scroll the wipe takes to finish (was 0.6 – now half the speed; keep Preloader.jsx + App.jsx in sync)
const SMOOTHING = 0.085   // 0–1, lower = floatier catch-up to the scroll position
const EDGE_EASE = 0.65    // 0 = linear playback, 1 = full smoothstep (slow start & finish)
const LOAD_THREADS = 6

const frameUrl = (set, i) => `/hero-frames/${set}/f${String(i + 1).padStart(4, '0')}.webp`
const smooth = (p) => p * p * (3 - 2 * p)
const easeProgress = (p) => p + (smooth(p) - p) * EDGE_EASE

/* load order: first/last frame, then ever finer strides, so scrubbing works before everything arrived */
function loadOrder() {
  const seen = new Set()
  const order = []
  const add = (i) => { if (i >= 0 && i < FRAMES && !seen.has(i)) { seen.add(i); order.push(i) } }
  add(0)
  add(FRAMES - 1)
  for (const stride of [24, 12, 6, 3, 1]) for (let i = 0; i < FRAMES; i += stride) add(i)
  return order
}

/* ---------------------------------------------------------------------
   Chapter titles. Keyed to the FRAME NUMBER (not to scroll), so each title belongs to
   what the camera is showing. window = [first frame, last frame] the chapter is on screen.
   NOTE: the wording below is placeholder copy – replace with the studio's own.
   --------------------------------------------------------------------- */
const CHAPTERS = [
  { n: '01', title: 'Arrival', caption: 'Timber, stone and glass, set low into the land.', window: [2, 38] },
  { n: '02', title: 'Threshold', caption: 'One line of glazing between outside and in.', window: [41, 74] },
  { n: '03', title: 'Light', caption: 'Warm, indirect, and never in the way.', window: [78, 121] },
  { n: '04', title: 'Home', caption: 'Rooms drawn first, then built with care.', window: [125, Infinity], cta: true },
]

const FADE_FRAMES = 4
const clamp01 = (v) => Math.min(1, Math.max(0, v))
/* 0 → 1 → 0 as the frame position moves through [a, b] */
const visibility = (pos, [a, b]) => clamp01((pos - a) / FADE_FRAMES) * clamp01((b - pos) / FADE_FRAMES)

const WIPE_LEAN = 0.28  // how far the wipe edge leans, as a fraction of the larger screen side (0 = vertical edge)

/* clip-path: a diagonal edge sweeping left → right, revealing the video behind it.
   The lean is sized from the screen so the angle stays pleasant on phones and tablets too. */
function wipeGeom(t, w, h) {
  const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2 // easeInOutCubic
  const skew = Math.min(70, ((WIPE_LEAN * Math.max(w, h)) / w) * 100) // % of the width
  const x = -skew + e * (100 + 2 * skew) // edge's centre line travels fully off-screen to off-screen
  return { skew, x, e }
}
function wipePath(t, w, h) {
  const { skew, x } = wipeGeom(t, w, h)
  return `polygon(0% 0%, ${(x + skew).toFixed(3)}% 0%, ${(x - skew).toFixed(3)}% 100%, 0% 100%)`
}

const CSS = `
.hv-stage {
  position: relative;
  z-index: 40;
  width: 100%;
  height: 100svh;
  overflow: hidden;
  color: #f4f4f2;
}
/* the wipe's clip-path lives on this inner layer */
.hv-clip { position: absolute; inset: 0; overflow: hidden; background: #0d0d0e; }
.hv-canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
.hv-title {
  position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0;
  overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
}
.hv-shade {
  position: absolute; inset: 0; pointer-events: none;
  background: linear-gradient(to top, rgba(0,0,0,.55), transparent 48%);
}
.hv-ui { position: absolute; inset: 0; pointer-events: none; opacity: 0; transition: opacity .5s ease; }
.hv-ui--on { opacity: 1; }
.hv-sans { font-family: "Bricolage Grotesque", system-ui, -apple-system, "Segoe UI", sans-serif; }

/* chapter title block (lower left) */
.hv-chap { position: absolute; left: clamp(18px, 4.2vw, 64px); bottom: clamp(56px, 11vh, 120px); max-width: min(40em, 88%); color: #fff;
  opacity: var(--v, 0); transform: translateY(calc((1 - var(--v, 0)) * 22px)); filter: blur(calc((1 - var(--v, 0)) * 7px));
  text-shadow: 0 2px 30px rgba(0,0,0,.4); }
.hv-chap .num { display: flex; align-items: center; gap: 12px; margin-bottom: clamp(8px, 1.6vh, 16px);
  font: 500 clamp(10px, .8vw, 12px) / 1 "Bricolage Grotesque", system-ui, sans-serif; letter-spacing: .2em; text-transform: uppercase; }
.hv-chap .num i { display: block; width: 36px; height: 1px; background: rgba(255,255,255,.75); }
.hv-chap h3 { margin: 0; font: 400 clamp(3.4rem, 10.5vw, 11.5rem) / .92 "Instrument Serif", Georgia, serif; letter-spacing: -.025em; }
.hv-chap p { margin: clamp(10px, 2vh, 20px) 0 0; max-width: 24em; opacity: .92;
  font: 400 clamp(.9rem, 1.25vw, 1.2rem) / 1.45 "Bricolage Grotesque", system-ui, sans-serif; }
.hv-cta { display: inline-flex; align-items: center; gap: 10px; margin-top: clamp(14px, 2.4vh, 26px); padding: 12px 22px; border-radius: 999px;
  background: #fff; color: #0d0d0e; text-decoration: none; text-shadow: none; transition: transform .25s ease;
  font: 500 clamp(.8rem, 1vw, .95rem) / 1 "Bricolage Grotesque", system-ui, sans-serif; }
.hv-cta:hover { transform: translateX(4px); }
.hv-prog { position: absolute; left: 50%; transform: translateX(-50%); bottom: clamp(18px, 4vh, 40px); display: flex; align-items: center; gap: 12px; color: rgba(255,255,255,.85);
  font: 500 clamp(10px, .78vw, 12px) / 1 "Bricolage Grotesque", system-ui, sans-serif; letter-spacing: .16em; text-transform: uppercase; text-shadow: 0 1px 12px rgba(0,0,0,.5); }
.hv-prog .track { width: clamp(70px, 9vw, 130px); height: 1px; background: rgba(255,255,255,.3); }
.hv-prog .fill { height: 100%; background: #fff; transform-origin: left; transform: scaleX(0); }

.hv-hint {
  position: absolute; left: 50%; bottom: clamp(16px, 4vh, 44px); transform: translateX(-50%);
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  font: 500 clamp(0.72rem, 1.1vw, 0.95rem) / 1 system-ui, -apple-system, "Segoe UI", sans-serif;
  letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,.75);
  pointer-events: none; white-space: nowrap;
}
.hv-hint i { display: block; width: 1px; height: 28px; background: linear-gradient(rgba(255,255,255,.75), transparent); }
@media (max-width: 640px) { .hv-prog { display: none; } }
`

export default function Hero() {
  const stageRef = useRef(null)
  const canvasRef = useRef(null)
  const hintRef = useRef(null)
  const uiRef = useRef(null)

  useLayoutEffect(() => {
    const stage = stageRef.current
    const canvas = canvasRef.current
    if (!stage || !canvas) return

    const ctx2d = canvas.getContext('2d', { alpha: false })
    ctx2d.imageSmoothingQuality = 'high'
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const set = window.innerWidth <= 820 ? 'sm' : 'lg'

    const frames = new Array(FRAMES).fill(null)
    let alive = true
    let target = 0   // scroll progress 0..1 (raw)
    let current = 0  // smoothed progress
    let raf = 0
    let last = 0
    let st

    /* nearest frame that has already loaded */
    const nearest = (i) => {
      for (let d = 0; d < FRAMES; d++) {
        if (frames[i - d]) return frames[i - d]
        if (frames[i + d]) return frames[i + d]
      }
      return null
    }

    /* ---- chapter titles, shown by frame number ---- */
    const chapEls = [...stage.querySelectorAll('[data-chap]')]
    const fillEl = stage.querySelector('[data-fill]')
    const clipEl = stage.querySelector('[data-clip]')

    const updateCaptions = (pos) => {
      chapEls.forEach((el, i) => {
        const v = visibility(pos, CHAPTERS[i].window)
        el.style.setProperty('--v', v.toFixed(3))
        el.style.visibility = v > 0.001 ? 'visible' : 'hidden'
        if (CHAPTERS[i].cta) el.style.pointerEvents = v > 0.6 ? 'auto' : 'none'
      })
      if (fillEl) fillEl.style.transform = `scaleX(${(pos / (FRAMES - 1)).toFixed(4)})`
    }

    const cover = (img) => {
      const cw = canvas.width
      const ch = canvas.height
      const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight)
      const w = img.naturalWidth * s
      const h = img.naturalHeight * s
      ctx2d.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h)
    }

    /* paint a (fractional) frame position: the frame, cross-faded into the next one */
    const draw = (progress) => {
      const pos = easeProgress(progress) * (FRAMES - 1)
      updateCaptions(pos)
      const i = Math.min(FRAMES - 1, Math.floor(pos))
      const a = pos - i
      const A = nearest(i)
      if (!A) return
      cover(A)
      if (a > 0.02 && i + 1 < FRAMES) {
        const B = nearest(i + 1)
        if (B && B !== A) {
          ctx2d.globalAlpha = a
          cover(B)
          ctx2d.globalAlpha = 1
        }
      }
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(stage.clientWidth * dpr)
      canvas.height = Math.round(stage.clientHeight * dpr)
      draw(current)
    }

    const tick = (now) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60
      last = now
      const k = 1 - Math.pow(1 - SMOOTHING, dt * 60)
      current = Math.abs(target - current) < 0.00005 ? target : current + (target - current) * k
      draw(current)
      if (current === target) { raf = 0; last = 0 } else raf = requestAnimationFrame(tick)
    }
    const kick = () => { if (!raf) { last = 0; raf = requestAnimationFrame(tick) } }

    /* preload the sequence (progressively, a few at a time) */
    const order = loadOrder()
    let cursor = 0
    const worker = async () => {
      while (alive && cursor < order.length) {
        const i = order[cursor++]
        const img = new Image()
        img.decoding = 'async'
        img.src = frameUrl(set, i)
        try { await img.decode() } catch { continue }
        if (!alive) return
        frames[i] = img
        if (i === 0) resize()
        else if (!raf) draw(reduced ? 0.5 : current)
      }
    }
    for (let t = 0; t < LOAD_THREADS; t++) worker()
    if (reduced) frames.length && (target = current = 0.5)

    const ro = new ResizeObserver(resize)
    ro.observe(stage)

    /* scroll (px) → iris radius (the black hole holding the hero) and video progress */
    const apply = (scroll) => {
      const vh = stage.offsetHeight // stable (svh) – the same unit the preloader uses
      const iris = clamp01((scroll / vh - IRIS_START) / IRIS_SCREENS)
      // diagonal wipe: a slanted edge sweeps across and uncovers the video
      const W = stage.offsetWidth
      const H = stage.offsetHeight
      clipEl.style.clipPath = wipePath(iris, W, H)
      // the picture pushes forward while the wipe sweeps
      canvas.style.transform = `scale(${1.2 - 0.2 * iris})`
      // the building only starts moving once the wipe has finished
      target = clamp01((scroll / vh - IRIS_START - IRIS_SCREENS) / SCROLL_SCREENS)
      if (hintRef.current) hintRef.current.style.opacity = String(iris < 1 ? 0 : Math.max(0, 1 - target * 10))
      uiRef.current?.classList.toggle('hv-ui--on', iris >= 1)
      kick()
    }

    if (!reduced) {
      clipEl.style.clipPath = wipePath(0, stage.offsetWidth, stage.offsetHeight)
      st = ScrollTrigger.create({
        trigger: stage,
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
        start: 'top top',
        end: () => `+=${(IRIS_START + IRIS_SCREENS + SCROLL_SCREENS) * stage.offsetHeight}`,
        invalidateOnRefresh: true,
        onUpdate: (self) => apply(self.scroll()),
      })
      apply(st.scroll())
      current = target
    }

    return () => {
      alive = false
      cancelAnimationFrame(raf)
      st?.kill()
      ro.disconnect()
    }
  }, [])

  return (
    <section
      id="hero"
      className="section"
      style={{ display: 'block', position: 'relative', height: 'auto', minHeight: 0, padding: 0, overflow: 'visible', borderBottom: 'none' }}
    >
      <style>{CSS}</style>
      <div className="hv-stage" ref={stageRef}>
        <div className="hv-clip" data-clip>
        <canvas ref={canvasRef} className="hv-canvas" aria-hidden="true" />
        <div className="hv-shade" />
        <h1 className="hv-title">Hero</h1>
        <div ref={uiRef} className="hv-ui hv-sans" aria-hidden="false">
          {CHAPTERS.map((c) => (
            <div key={c.n} className="hv-chap" data-chap>
              <div className="num"><span>{c.n}</span><i /><span style={{ opacity: 0.6 }}>0{CHAPTERS.length}</span></div>
              <h3>{c.title}</h3>
              <p>{c.caption}</p>
              {c.cta && <a className="hv-cta" href="#contact">Start a project <span aria-hidden="true">→</span></a>}
            </div>
          ))}
          <div className="hv-prog">
            <span>Walkthrough</span>
            <span className="track"><span className="fill" data-fill style={{ display: 'block' }} /></span>
          </div>
        </div>
        <div ref={hintRef} className="hv-hint">
          <span>Scroll</span>
          <i />
        </div>
        </div>
      </div>
    </section>
  )
}