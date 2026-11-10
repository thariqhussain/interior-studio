import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)
// mobile browsers resize the viewport as the URL bar shows/hides – don't rebuild the pin for that
ScrollTrigger.config({ ignoreMobileResize: true })

/* =====================================================================
   Hero section – a walkthrough in three short clips (public/hero-videos, re-encoded from public/assets/preloader/video1–3.mp4).
   Layout (top → bottom): heading | full-width video band, exactly 70% of the screen height, no gaps, square | description + controls.
   • After the preloader's diagonal wipe the hero is an ordinary section: nothing to scroll through. NOTHING PLAYS until the visitor
     presses Next or Previous – the first room rests on its last frame, with its heading and description showing.
   • Next / Prev buttons (also ← / → keys and the dots) move between the rooms. Each clip plays the camera move into its room and
     rests on its last frame; the room's heading and description fade in as it settles.
   • Two <video> layers cross-fade; the next clip is preloaded in the idle one. Clips only play while the hero is on screen.
   • Only the wipe is scroll-driven: the stage stays pinned for IRIS_START + IRIS_SCREENS screens (keep Preloader.jsx and App.jsx in sync).
   ===================================================================== */

const IRIS_START = 0.6
const IRIS_SCREENS = 1.2

/* NOTE: the wording is placeholder copy – replace it with what the studio did in each room. */
const ROOMS = [
  { n: '01', title: 'Living Room', caption: 'Layered timber, stone and concealed lighting around an open study wall.' },
  { n: '02', title: 'Master Bedroom', caption: 'A calm suite: upholstered headboard wall, stone fireplace and a view of the lake.' },
  { n: '03', title: 'Kitchen', caption: 'Dark joinery, a long island and one dining table for the whole family.' },
]
const N = ROOMS.length
const clipUrl = (i) => `/hero-videos/room${i + 1}.mp4`
const posterUrl = (i) => `/hero-videos/room${i + 1}.webp`
const restPosterUrl = (i) => `/hero-videos/room${i + 1}-end.webp` // the last frame of a clip: what the first room shows before anything plays
const FADE_MS = 500
const TEXT_BEFORE_END = 0.8 // seconds before a clip ends that its text starts to appear

const clamp01 = (v) => Math.min(1, Math.max(0, v))
/* Wipe: a straight horizontal edge sweeping top → bottom. Done with TRANSFORMS only (no clip-path, which would repaint the
   videos and text every frame): a panel with overflow:hidden slides down from above the screen while its content slides up by the
   same amount, so the content stays put and is uncovered from the top. */
const easeWipe = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2) // easeInOutCubic

const CSS = `
.hv-stage { position: relative; z-index: 40; width: 100%; height: 100svh; overflow: hidden; color: #f4f4f2; }
/* the wipe's clip-path lives on this inner layer. Rows: heading zone (15%) | video band (70%) | description zone (15%) */
.hv-panel { position: absolute; inset: 0; overflow: hidden; will-change: transform; }
.hv-clip { position: absolute; inset: 0; background: #0d0d0e; display: grid; grid-template-rows: 15fr 70fr 15fr; will-change: transform; }
.hv-sans { font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
.hv-band { position: relative; overflow: hidden; background: #000; }
.hv-vwrap { position: absolute; inset: 0; will-change: transform; }
.hv-vid { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0; transition: opacity ${FADE_MS}ms ease; }
.hv-title { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
.hv-top, .hv-bottom { position: relative; padding: 0 clamp(28px, 5vw, 84px); }
.hv-top { display: flex; align-items: flex-end; padding-bottom: clamp(14px, 2.4vh, 28px); }
.hv-bottom { display: flex; align-items: center; justify-content: center; }
.hv-slot { position: relative; }
.hv-slot > .hv-text { position: absolute; left: 0; bottom: 0; pointer-events: none; visibility: hidden; transition: visibility 0s linear .7s; }
.hv-bottom .hv-slot > .hv-text { top: 50%; bottom: auto; transform: translateY(-50%); }
.hv-slot > .hv-text[data-on] { visibility: visible; transition-delay: 0s; }
/* heading: plain solid text in the default system font – nothing here forces a repaint */
.hv-h { margin: 0; font-weight: 700; font-size: clamp(3rem, 6vw, 6.6rem); line-height: 1; letter-spacing: -.035em; white-space: nowrap; color: #fff; }
/* each room's text fades and rises as ONE layer (opacity + transform only, so it runs on the GPU) */
.hv-text { opacity: 0; transform: translate3d(0, 16px, 0); will-change: opacity, transform;
  transition: opacity .45s ease, transform .55s cubic-bezier(.22,1,.36,1), visibility 0s linear .55s; }
.hv-text[data-on] { opacity: 1; transform: none; transition-delay: 0s; }
.hv-desc { position: absolute; left: 0; right: 0; bottom: 0; height: 34%; pointer-events: none; background: linear-gradient(to top, rgba(0,0,0,.6), transparent); }
.hv-slot.hv-desc > .hv-text { left: 50%; translate: -50% 0; bottom: clamp(20px, 4.5vh, 46px); width: min(36em, 88%); text-align: center; }
.hv-desc .hv-p { margin: 0; max-width: 31em; color: rgba(255,255,255,.7); font-size: clamp(.9rem, 1.08vw, 1.05rem); line-height: 1.55; }
/* controls: segmented progress + circular Previous + a pill Next that names the room it leads to */
.hv-ctl { flex: none; display: flex; align-items: center; gap: 22px; }
.hv-btn:focus-visible { outline: 2px solid #fff; outline-offset: 3px; }
.hv-btn { display: inline-flex; align-items: center; justify-content: center; gap: 10px; height: 48px; border-radius: 999px; cursor: pointer; color: #fff;
  transition: background-color .3s, color .3s, transform .3s cubic-bezier(.22,1,.36,1), border-color .3s; }
.hv-btn svg { width: 18px; height: 18px; flex: none; transition: transform .3s cubic-bezier(.22,1,.36,1); }
.hv-btn:active { transform: scale(.96); }
.hv-prev { width: 48px; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.16); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }
.hv-prev:hover { background: rgba(255,255,255,.16); border-color: rgba(255,255,255,.3); }
.hv-prev:hover svg { transform: translateX(-2px); }
.hv-next { position: relative; padding: 0 8px 0 22px; background: #fff; color: #0d0d0e; border: 0; font: 600 14px / 1 system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; letter-spacing: -.01em; }
.hv-next small { font-weight: 500; font-size: 13px; color: rgba(13,13,14,.5); }
.hv-next b { display: grid; place-items: center; width: 32px; height: 32px; border-radius: 99px; background: #0d0d0e; color: #fff; transition: background-color .3s; }
.hv-next:hover b svg { transform: translateX(2px); }
.hv-next:hover { background: #ffe9dc; }
/* before anything has been played, Next breathes softly to say "press me" */
.hv-next[data-idle]::after { content: ""; position: absolute; inset: -5px; border-radius: 999px; border: 1px solid rgba(255,255,255,.55); animation: hv-ping 2.2s cubic-bezier(.22,1,.36,1) infinite; pointer-events: none; }
@keyframes hv-ping { 0% { opacity: .9; transform: scale(.96); } 100% { opacity: 0; transform: scale(1.12); } }
@media (prefers-reduced-motion: reduce) { .hv-vid, .hv-p, .hv-btn { transition: none; } .hv-next[data-idle]::after { animation: none; } }
`

const Chevron = ({ dir }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={dir === 'left' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} />
  </svg>
)

export default function Hero() {
  const stageRef = useRef(null)
  const wrapRef = useRef(null)
  const vids = useRef([null, null])
  const api = useRef({})
  const [index, setIndex] = useState(0)
  const [textOn, setTextOn] = useState(true)
  const [started, setStarted] = useState(false)

  useLayoutEffect(() => {
    const stage = stageRef.current
    const wrap = wrapRef.current
    const panelEl = stage?.querySelector('[data-panel]')
    const clipEl = stage?.querySelector('[data-clip]')
    if (!stage || !wrap || !clipEl || !panelEl) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const st = { room: 0, front: 0, seen: false, iris: reduced ? 1 : 0, token: 0, wantPlay: false }
    const front = () => vids.current[st.front]
    const idle = () => vids.current[1 - st.front]

    const load = (v, i) => {
      if (v.dataset.room === String(i)) return
      v.dataset.room = String(i)
      v.poster = posterUrl(i)
      v.src = clipUrl(i)
      v.load()
    }
    const rest = (v) => {
      const go = () => { if (isFinite(v.duration)) v.currentTime = Math.max(0, v.duration - 0.05) }
      v.readyState >= 1 ? go() : v.addEventListener('loadedmetadata', go, { once: true })
    }
    const sync = () => {
      const v = front()
      if (!v || reduced) return
      if (st.wantPlay && st.seen && st.iris > 0.25) { if (!v.ended && v.paused) v.play().catch(() => {}) } else if (!v.paused) v.pause()
    }
    const onTime = (v) => {
      if (v !== front() || !isFinite(v.duration)) return
      if (v.ended || v.currentTime >= v.duration - TEXT_BEFORE_END) setTextOn(true)
    }

    const go = (to) => {
      const next = ((to % N) + N) % N
      if (next === st.room) return
      st.wantPlay = true
      setStarted(true)
      warm()
      const my = ++st.token
      st.room = next
      setIndex(next)
      setTextOn(false)
      const incoming = idle()
      const outgoing = front()
      load(incoming, next)
      const reveal = () => {
        if (my !== st.token) return
        incoming.style.opacity = '1'
        outgoing.style.opacity = '0'
        st.front = 1 - st.front
        setTimeout(() => {
          if (my !== st.token) return
          outgoing.pause()
          load(outgoing, (next + 1) % N)
        }, FADE_MS + 60)
        if (reduced) setTextOn(true)
      }
      if (reduced) {
        rest(incoming)
        incoming.addEventListener('loadeddata', reveal, { once: true })
        if (incoming.readyState >= 2) reveal()
      } else {
        incoming.currentTime = 0
        incoming.addEventListener('playing', reveal, { once: true })
        incoming.play().catch(() => {})
      }
    }
    api.current.go = go
    api.current.step = (d) => go(st.room + d)

    const [v0, v1] = vids.current
    v0.style.opacity = '1'
    v0.poster = restPosterUrl(0) // a still of the first room's last frame – nothing is loaded or decoded until the wipe starts
    vids.current.forEach((v) => { v.addEventListener('timeupdate', () => onTime(v)); v.addEventListener('ended', () => onTime(v)) })
    setTextOn(true)
    // starts loading the first clip (seeking it to its last frame, so it matches the still) and preloads the second
    let warmed = false
    const warm = () => {
      if (warmed) return
      warmed = true
      v0.dataset.room = '0'
      v0.src = clipUrl(0)
      v0.load()
      rest(v0) // the first room waits on its last frame until Next / Previous is pressed
      load(v1, 1)
    }
    if (reduced) warm()

    const io = new IntersectionObserver(([e]) => { st.seen = e.isIntersecting; sync() }, { threshold: 0.25 })
    io.observe(stage)
    const onKey = (e) => {
      if (!st.seen || st.iris < 1) return
      if (e.key === 'ArrowRight') go(st.room + 1)
      else if (e.key === 'ArrowLeft') go(st.room - 1)
    }
    window.addEventListener('keydown', onKey)

    let pin
    // the stage height is measured once (and on resize) – reading it on every scroll update would force a layout each frame
    let H = stage.offsetHeight
    const ro = new ResizeObserver(() => { H = stage.offsetHeight })
    ro.observe(stage)
    let lastIris = -1
    const apply = (scroll) => {
      st.iris = clamp01((scroll / H - IRIS_START) / IRIS_SCREENS)
      if (st.iris !== lastIris) {
        lastIris = st.iris
        const rest = (1 - easeWipe(st.iris)) * 100 // % of the screen still covered
        panelEl.style.transform = `translate3d(0, ${-rest}%, 0)`
        clipEl.style.transform = `translate3d(0, ${rest}%, 0)`
        wrap.style.transform = `scale(${1.2 - 0.2 * st.iris})` // the picture pushes forward while the wipe sweeps
        if (st.iris > 0.02) warm() // the clips only start loading once the wipe has begun
      }
      sync()
    }
    if (!reduced) {
      panelEl.style.transform = 'translate3d(0, -100%, 0)'
      clipEl.style.transform = 'translate3d(0, 100%, 0)'
      pin = ScrollTrigger.create({
        trigger: stage, pin: true, pinSpacing: true, anticipatePin: 1, start: 'top top',
        end: () => `+=${(IRIS_START + IRIS_SCREENS) * H}`,
        invalidateOnRefresh: true,
        onUpdate: (self) => apply(self.scroll()),
      })
      apply(pin.scroll())
    }
    return () => {
      st.token++
      io.disconnect()
      window.removeEventListener('keydown', onKey)
      pin?.kill()
      ro.disconnect()
      vids.current.forEach((v) => v && v.pause())
    }
  }, [])


  const live = (i) => (textOn && index === i ? '' : undefined)

  return (
    <section
      id="hero"
      className="section"
      style={{ display: 'block', position: 'relative', height: 'auto', minHeight: 0, padding: 0, overflow: 'visible', borderBottom: 'none' }}
    >
      <style>{CSS}</style>
      <div className="hv-stage hv-sans" ref={stageRef}>
        <div className="hv-panel" data-panel>
        <div className="hv-clip" data-clip>
          <h1 className="hv-title">Hero</h1>

          {/* top: label + heading */}
          <div className="hv-top">
            <div className="hv-slot" style={{ width: '100%', height: '100%' }} aria-live="polite">
              {ROOMS.map((r, i) => (
                <div key={r.n} className="hv-text" data-on={live(i)} aria-hidden={live(i) === undefined}>
                  <h2 className="hv-h">{r.title}</h2>
                </div>
              ))}
            </div>
          </div>

          {/* middle: the video, full width, exactly 50% of the screen height */}
          <div className="hv-band">
            <div className="hv-vwrap" ref={wrapRef}>
              {[0, 1].map((k) => (
                <video key={k} ref={(el) => { vids.current[k] = el }} className="hv-vid" muted playsInline preload="none" aria-hidden="true" disablePictureInPicture />
              ))}
            </div>
            {/* description: inside the video, bottom middle, over a soft dark gradient */}
            <div className="hv-slot hv-desc" aria-live="polite">
              {ROOMS.map((r, i) => (
                <div key={r.n} className="hv-text" data-on={live(i)} aria-hidden={live(i) === undefined}>
                  <p className="hv-p">{r.caption}</p>
                </div>
              ))}
            </div>
          </div>

          {/* bottom: controls, centred */}
          <div className="hv-bottom">
            <div className="hv-ctl">
              <button type="button" className="hv-btn hv-prev" aria-label="Previous room" onClick={() => api.current.step?.(-1)}><Chevron dir="left" /></button>
              <button type="button" className="hv-btn hv-next" data-idle={started ? undefined : ''} aria-label={`Next room: ${ROOMS[(index + 1) % N].title}`} onClick={() => api.current.step?.(1)}>
                <span>Next</span>
                <small>{ROOMS[(index + 1) % N].title}</small>
                <b><Chevron dir="right" /></b>
              </button>
            </div>
          </div>
        </div>
        </div>
      </div>
    </section>
  )
}
