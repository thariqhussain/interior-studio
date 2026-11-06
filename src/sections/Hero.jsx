import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/* =====================================================================
   Hero section – scroll-scrubbed video, rendered frame by frame (single file)
   Needs: gsap (already installed).

   The hero is pinned while you scroll; scroll position picks the exact
   video frame, which is painted onto a <canvas> (no flicker between seeks).

   Video: put interior_hero.mp4 in /public  → served at /interior_hero.mp4
   (or import it from src/assets and pass that URL to VIDEO_SRC).
   Tip: use the all-keyframe version of the file for perfectly smooth
   scrubbing in both directions.
   ===================================================================== */

const VIDEO_SRC = '/interior_hero.mp4'
const FPS = 24            // frame rate of the video
const SCROLL_SCREENS = 3  // how many screens of scrolling play the whole video
const SMOOTHING = 0.18    // 0–1, lower = floatier catch-up to the scroll position

const CSS = `
.hv-stage {
  position: relative;
  width: 100%;
  height: 100svh;
  min-height: 480px;
  overflow: hidden;
  background: #0d0d0e;
  color: #f4f4f2;
}
.hv-canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
.hv-video { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }
.hv-title {
  position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0;
  overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
}
.hv-shade {
  position: absolute; inset: 0; pointer-events: none;
  background: linear-gradient(to top, rgba(0,0,0,.35), transparent 35%);
}
.hv-hint {
  position: absolute; left: 50%; bottom: clamp(16px, 4vh, 44px); transform: translateX(-50%);
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  font: 500 clamp(0.72rem, 1.1vw, 0.95rem) / 1 system-ui, -apple-system, "Segoe UI", sans-serif;
  letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,.75);
  pointer-events: none; white-space: nowrap;
}
.hv-hint i { display: block; width: 1px; height: 28px; background: linear-gradient(rgba(255,255,255,.75), transparent); }
`

export default function Hero() {
  const stageRef = useRef(null)
  const canvasRef = useRef(null)
  const videoRef = useRef(null)
  const hintRef = useRef(null)

  useLayoutEffect(() => {
    const stage = stageRef.current
    const canvas = canvasRef.current
    const video = videoRef.current
    if (!stage || !canvas || !video) return

    const ctx2d = canvas.getContext('2d', { alpha: false })
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let ready = false
    let target = 0   // scroll progress 0..1
    let current = 0  // smoothed progress
    let raf = 0
    let last = 0
    let st

    /* paint the video's current frame onto the canvas, "cover" fitted */
    const draw = () => {
      if (!video.videoWidth) return
      const cw = canvas.width
      const ch = canvas.height
      const s = Math.max(cw / video.videoWidth, ch / video.videoHeight)
      const w = video.videoWidth * s
      const h = video.videoHeight * s
      ctx2d.drawImage(video, (cw - w) / 2, (ch - h) / 2, w, h)
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(stage.clientWidth * dpr)
      canvas.height = Math.round(stage.clientHeight * dpr)
      draw()
    }

    /* frame time for a progress value, snapped to an exact frame */
    const frameTime = (p) => {
      const frames = Math.max(1, Math.round(video.duration * FPS) - 1)
      return (Math.round(p * frames) + 0.01) / FPS
    }

    const tick = (now) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60
      last = now
      const k = 1 - Math.pow(1 - SMOOTHING, dt * 60)
      current = Math.abs(target - current) < 0.0003 ? target : current + (target - current) * k

      if (ready) {
        const t = Math.min(frameTime(current), video.duration - 0.001)
        if (!video.seeking && Math.abs(video.currentTime - t) > 0.5 / FPS) video.currentTime = t
      }

      const settled = current === target && ready &&
        !video.seeking && Math.abs(video.currentTime - frameTime(target)) <= 0.5 / FPS
      if (settled) { raf = 0; last = 0 } else raf = requestAnimationFrame(tick)
    }
    const kick = () => { if (!raf) { last = 0; raf = requestAnimationFrame(tick) } }

    const onSeeked = () => draw()
    const onReady = () => {
      ready = true
      resize()
      // iOS Safari only seeks a video that has started playing at least once
      video.play().then(() => video.pause()).catch(() => {})
      if (reduced) { video.currentTime = frameTime(0.5); return }
      kick()
    }

    video.addEventListener('seeked', onSeeked)
    video.addEventListener('loadeddata', onReady, { once: true })
    if (video.readyState >= 2) onReady()

    const ro = new ResizeObserver(resize)
    ro.observe(stage)

    if (!reduced) {
      st = ScrollTrigger.create({
        trigger: stage,
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
        start: 'top top',
        end: `+=${SCROLL_SCREENS * 100}%`,
        onUpdate: (self) => {
          target = self.progress
          if (hintRef.current) hintRef.current.style.opacity = String(Math.max(0, 1 - self.progress * 10))
          kick()
        },
      })
      target = current = st.progress
    }

    return () => {
      cancelAnimationFrame(raf)
      st?.kill()
      ro.disconnect()
      video.removeEventListener('seeked', onSeeked)
      video.removeEventListener('loadeddata', onReady)
    }
  }, [])

  return (
    <section
      id="hero"
      className="section"
      style={{ display: 'block', position: 'relative', height: 'auto', minHeight: 0, padding: 0, overflow: 'visible' }}
    >
      <style>{CSS}</style>
      <div className="hv-stage" ref={stageRef}>
        <video
          ref={videoRef}
          className="hv-video"
          src={VIDEO_SRC}
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
          tabIndex={-1}
        />
        <canvas ref={canvasRef} className="hv-canvas" aria-hidden="true" />
        <div className="hv-shade" />
        <h1 className="hv-title">Hero</h1>
        <div ref={hintRef} className="hv-hint">
          <span>Scroll</span>
          <i />
        </div>
      </div>
    </section>
  )
}