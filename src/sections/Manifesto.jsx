import { Children, useCallback, useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/* =====================================================================
   Manifesto section – ScrollExpand (single-file version)
   Needs: gsap (already installed). Only used for window-scroll pinning.

   ScrollExpand: a framed piece of media that opens up to fill the whole
   stage as you scroll, then reveals its content.
     • useWindowScroll  → the page scroll drives it (stage is pinned)
     • default          → wheel / touch / arrow keys inside the frame drive
                          it, and the page scrolls on once it is fully open
   ===================================================================== */

const CSS = `
.se-stage {
  container-type: size;
  position: relative;
  width: 100%;
  display: grid;
  place-items: center;
  overflow: hidden;
  isolation: isolate;
  background: #0d0d0e;
  color: #f4f4f2;
}
.se-stage--window { height: 100svh; min-height: 560px; }
.se-stage--inline { height: 100%; min-height: 320px; overscroll-behavior: contain; }
.se-stage:focus-visible { outline: 2px solid rgba(255,255,255,.6); outline-offset: -4px; }

.se-frame {
  position: relative;
  display: grid;
  place-items: center;
  overflow: hidden;
  background: #1a1a1c;
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 30px 80px -24px rgba(0, 0, 0, 0.85);
  will-change: width, height;
}
.se-media { position: absolute; inset: 0; transform-origin: center; will-change: transform; }
.se-media img,
.se-media video { display: block; width: 100%; height: 100%; object-fit: cover; user-select: none; }
.se-scrim { position: absolute; inset: 0; background: #08080a; pointer-events: none; }

.se-title {
  position: relative;
  z-index: 2;
  margin: 0;
  padding: 0 6cqw;
  text-align: center;
  font-family: "Instrument Serif", "Playfair Display", "Iowan Old Style", Georgia, serif;
  font-weight: 500;
  font-size: clamp(1.8rem, 6.2cqw, 5.6rem);
  line-height: 1;
  letter-spacing: -0.03em;
  color: #f7f7f5;
  will-change: transform, opacity;
}

.se-content {
  position: absolute;
  inset: 0;
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: clamp(10px, 2cqh, 22px);
  padding: 0 clamp(20px, 10cqw, 160px);
  text-align: center;
  opacity: 0;
  will-change: transform, opacity;
}
.se-content h1,
.se-content h2,
.se-content h3 {
  margin: 0;
  font-family: "Instrument Serif", "Playfair Display", "Iowan Old Style", Georgia, serif;
  font-weight: 500;
  font-size: clamp(1.7rem, 5cqw, 4.6rem);
  line-height: 1.02;
  letter-spacing: -0.03em;
  color: #f7f7f5;
}
.se-content p {
  margin: 0;
  max-width: 34em;
  font: 400 clamp(0.85rem, 1.4cqw, 1.25rem) / 1.7 system-ui, -apple-system, "Segoe UI", sans-serif;
  color: #d2d2d2;
}

.se-hint {
  position: absolute;
  left: 50%;
  bottom: clamp(16px, 4cqh, 44px);
  transform: translateX(-50%);
  z-index: 4;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  font: 500 clamp(0.72rem, 1.1cqw, 0.95rem) / 1 system-ui, -apple-system, "Segoe UI", sans-serif;
  color: #8b8b8b;
  white-space: nowrap;
  pointer-events: none;
}
.se-hint i { display: block; width: 1px; height: 28px; background: linear-gradient(#8b8b8b, transparent); }
`

/* ---------- helpers ---------- */

const FALLBACK_SRC = 'https://picsum.photos/seed/manifesto-hero/1920/1080'
const lerp = (a, b, t) => a + (b - a) * t
const clamp01 = (v) => Math.min(1, Math.max(0, v))
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const easeOut = (t) => 1 - Math.pow(1 - t, 3)
const isVideo = (src = '') => /\.(mp4|webm|mov|m4v|ogv)(\?.*)?$/i.test(src)

/* ---------- ScrollExpand ---------- */

function ScrollExpand({
  src,
  alt = '',
  title,
  scrollHint,
  children,
  useWindowScroll = false,
  startWidth = 38,      // % of the stage
  startHeight = 52,     // % of the stage
  startRadius = 24,     // px
  endRadius = 0,        // px
  mediaZoom = 1.25,     // media starts zoomed in and settles to 1
  scrollDistance = 1,   // expansion length, in stage-heights of scrolling
  holdDistance = 0.3,   // extra scrolling once open, while the content reveals
  smoothing = 0.1,      // 0–1, lower = floatier
  overlayScrim = 0.4,   // 0–1 darkness over the media at the start
  enabled = true,
}) {
  const stageRef = useRef(null)
  const frameRef = useRef(null)
  const mediaRef = useRef(null)
  const scrimRef = useRef(null)
  const titleRef = useRef(null)
  const contentRef = useRef(null)
  const hintRef = useRef(null)
  const targetRef = useRef(0)
  const currentRef = useRef(0)

  const hasContent = Children.count(children) > 0
  const total = Math.max(0.05, scrollDistance + holdDistance)
  const expandEnd = scrollDistance / total

  // latest props for the render loop (avoids stale closures, no re-renders per frame)
  const P = useRef({})
  P.current = { startWidth, startHeight, startRadius, endRadius, mediaZoom, overlayScrim, hasContent, expandEnd, holdDistance }

  /* Apply one frame of the animation. r = overall progress 0..1 */
  const render = useCallback((r) => {
    const p = P.current
    const e = easeInOut(clamp01(p.expandEnd > 0 ? r / p.expandEnd : 1))
    const hs = p.holdDistance > 0
      ? easeOut(clamp01((r - p.expandEnd) / (1 - p.expandEnd)))
      : clamp01((e - 0.7) / 0.3)

    const frame = frameRef.current
    if (frame) {
      frame.style.width = `${lerp(p.startWidth, 100, e)}%`
      frame.style.height = `${lerp(p.startHeight, 100, e)}%`
      frame.style.borderRadius = `${lerp(p.startRadius, p.endRadius, e)}px`
      frame.style.borderWidth = e > 0.98 ? '0px' : '1px'
    }
    if (mediaRef.current) mediaRef.current.style.transform = `scale(${lerp(p.mediaZoom, 1, e)})`
    if (scrimRef.current) {
      scrimRef.current.style.opacity = clamp01(p.overlayScrim * (1 - 0.55 * e) + (p.hasContent ? 0.28 * hs : 0))
    }
    if (titleRef.current) {
      titleRef.current.style.opacity = p.hasContent ? clamp01(1 - e * 1.8) : 1
      titleRef.current.style.transform = `translateY(${-e * 40}px) scale(${1 + e * 0.04})`
    }
    if (contentRef.current) {
      contentRef.current.style.opacity = hs
      contentRef.current.style.transform = `translateY(${(1 - hs) * 28}px)`
      contentRef.current.style.pointerEvents = hs > 0.9 ? 'auto' : 'none'
    }
    if (hintRef.current) hintRef.current.style.opacity = clamp01(1 - r * 12)
  }, [])

  useLayoutEffect(() => {
    const stage = stageRef.current
    if (!stage) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!enabled || reduced) {
      // no interaction: show the fully open state
      targetRef.current = currentRef.current = 1
      render(1)
      return
    }

    /* smoothed progress loop */
    let raf = 0
    let last = 0
    const tick = (t) => {
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 1 / 60
      last = t
      const k = 1 - Math.pow(1 - Math.min(1, Math.max(0.01, smoothing)), dt * 60)
      const cur = currentRef.current
      const tgt = targetRef.current
      const next = Math.abs(tgt - cur) < 0.0004 ? tgt : cur + (tgt - cur) * k
      currentRef.current = next
      render(next)
      if (next !== tgt) raf = requestAnimationFrame(tick)
      else { raf = 0; last = 0 }
    }
    const setTarget = (v) => {
      targetRef.current = clamp01(v)
      if (!raf) { last = 0; raf = requestAnimationFrame(tick) }
    }

    const cleanups = []

    if (useWindowScroll) {
      /* page scroll drives it: pin the stage while the progress runs */
      const st = ScrollTrigger.create({
        trigger: stage,
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
        start: 'top top',
        end: `+=${total * 100}%`,
        onUpdate: (self) => setTarget(self.progress),
      })
      targetRef.current = currentRef.current = st.progress
      render(st.progress)
      cleanups.push(() => st.kill())
    } else {
      /* wheel / touch / keys inside the frame drive it; release at either end */
      render(0)
      const move = (dy) => {
        const t = targetRef.current
        if ((dy > 0 && t < 1) || (dy < 0 && t > 0)) {
          setTarget(t + dy / (stage.clientHeight * total))
          return true
        }
        return false
      }
      const onWheel = (ev) => {
        const unit = ev.deltaMode === 1 ? 16 : ev.deltaMode === 2 ? stage.clientHeight : 1
        if (move(ev.deltaY * unit)) ev.preventDefault()
      }
      let touchY = 0
      const onTouchStart = (ev) => { touchY = ev.touches[0].clientY }
      const onTouchMove = (ev) => {
        const y = ev.touches[0].clientY
        const dy = touchY - y
        touchY = y
        if (move(dy)) ev.preventDefault()
      }
      const onKey = (ev) => {
        const step = stage.clientHeight * 0.25
        const dy = { ArrowDown: step, PageDown: step * 3, ' ': step * 3, ArrowUp: -step, PageUp: -step * 3 }[ev.key]
        if (dy && move(dy)) ev.preventDefault()
      }
      stage.addEventListener('wheel', onWheel, { passive: false })
      stage.addEventListener('touchstart', onTouchStart, { passive: true })
      stage.addEventListener('touchmove', onTouchMove, { passive: false })
      stage.addEventListener('keydown', onKey)
      cleanups.push(() => {
        stage.removeEventListener('wheel', onWheel)
        stage.removeEventListener('touchstart', onTouchStart)
        stage.removeEventListener('touchmove', onTouchMove)
        stage.removeEventListener('keydown', onKey)
      })
    }

    return () => {
      cancelAnimationFrame(raf)
      cleanups.forEach((fn) => fn())
    }
  }, [enabled, useWindowScroll, total, smoothing, render])

  const onMediaError = (ev) => {
    const el = ev.currentTarget
    if (!el.dataset.fallback) {
      el.dataset.fallback = '1'
      el.src = FALLBACK_SRC
    }
  }

  return (
    <div
      ref={stageRef}
      className={`se-stage ${useWindowScroll ? 'se-stage--window' : 'se-stage--inline'}`}
      role="region"
      aria-label={title || alt || 'Expanding media'}
      tabIndex={useWindowScroll ? undefined : 0}
    >
      <div
        ref={frameRef}
        className="se-frame"
        style={{ width: `${startWidth}%`, height: `${startHeight}%`, borderRadius: startRadius }}
      >
        <div ref={mediaRef} className="se-media" style={{ transform: `scale(${mediaZoom})` }}>
          {isVideo(src) ? (
            <video src={src} autoPlay muted loop playsInline aria-label={alt} onError={onMediaError} />
          ) : (
            <img src={src} alt={alt} draggable={false} onError={onMediaError} />
          )}
        </div>
        <div ref={scrimRef} className="se-scrim" style={{ opacity: overlayScrim }} />
        {title && (
          <div ref={titleRef} className="se-title" role="heading" aria-level={2}>
            {title}
          </div>
        )}
        {hasContent && (
          <div ref={contentRef} className="se-content">
            {children}
          </div>
        )}
      </div>
      {scrollHint && (
        <div ref={hintRef} className="se-hint">
          <span>{scrollHint}</span>
          <i />
        </div>
      )}
    </div>
  )
}

/* ---------- Section ---------- */

export default function Manifesto() {
  return (
    <section
      id="manifesto"
      className="section"
      style={{ display: 'block', position: 'relative', height: 'auto', minHeight: 0, padding: 0, overflow: 'visible' }}
    >
      <style>{CSS}</style>

      <ScrollExpand
        src="/hero.jpg"
        alt="Product hero"
        title="Built to scale"
        scrollHint="Scroll inside the frame"
        useWindowScroll
      >
        <h2>Every pixel, everywhere</h2>
        <p>The frame opens up as you scroll and hands the whole stage to your media.</p>
      </ScrollExpand>

    </section>
  )
}