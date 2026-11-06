import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

/* =====================================================================
   Team section – ArchitecturalHero (single-file version)
   Needs: npm i gsap  (ScrollTrigger ships with it)
   Scroll-driven: ScrollTrigger pins the hero and scrubs the timeline while you scroll.
   Layout: CSS (below) → card components → GSAP timeline hook → Team
   ===================================================================== */

const CSS = `
/* ---------- Root = size container so everything scales with the section, not the viewport ---------- */
.ah-root {
  container-type: size;
  position: relative;
  width: 100%;
  height: 100svh;
  min-height: 560px;
  overflow: hidden;
  background: #0d0d0e;
}

.ah-stage {
  --cw: clamp(64px, min(9.6cqw, 13cqh), 210px); /* base card width */
  --col-x: 34cqw;                               /* column centre, distance from middle */
  --gap: calc(var(--cw) * 0.08);

  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: #f4f4f2;
  background-image: radial-gradient(rgba(255, 255, 255, 0.07) 1px, transparent 1.3px);
  background-size: 40px 40px;
}

/* ---------- Columns (no transform => no stacking context, so cards can interleave while merging) ---------- */
.ah-column {
  position: absolute;
  top: 0;
  height: 100%;
  width: calc(var(--cw) * 1.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--gap);
}
.ah-column--left  { left: calc(50% - var(--col-x) - var(--cw) * 0.65); }
.ah-column--right { left: calc(50% + var(--col-x) - var(--cw) * 0.65); }

/* ---------- Cards ---------- */
.ah-card {
  position: relative;
  flex: none;
  margin: 0;
  width: calc(var(--cw) * var(--sw));
  height: calc(var(--cw) * 1.4 * var(--sh));
  border-radius: clamp(10px, 1.7cqw, 22px);
  overflow: hidden;
  background: #1a1a1c;
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow: 0 28px 60px -18px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(0, 0, 0, 0.45);
  transform: perspective(1000px) translateZ(var(--z)) rotate(var(--rot)) rotateY(var(--ry));
  will-change: transform;
}
.ah-card::after { /* soft edge shading for depth */
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(160deg, rgba(255,255,255,.08), transparent 35%, rgba(0,0,0,.28));
  pointer-events: none;
}
.ah-card img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  user-select: none;
  -webkit-user-drag: none;
  pointer-events: none;
}

/* ---------- Typography ---------- */
.ah-copy {
  width: min(38cqw, 680px);
  text-align: center;
  z-index: 1;
}
.ah-eyebrow {
  margin: 0 0 clamp(14px, 2.4cqh, 28px);
  font: 500 clamp(0.6rem, 1.05cqw, 0.95rem) / 1 ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  letter-spacing: 0.38em;
  text-transform: uppercase;
  color: #8b8b8b;
}
.ah-title {
  margin: 0;
  font-family: "Instrument Serif", "Playfair Display", "Iowan Old Style", Georgia, serif;
  font-weight: 500;
  font-size: clamp(1.7rem, 5.6cqw, 5.4rem);
  line-height: 0.98;
  letter-spacing: -0.03em;
  color: #f7f7f5;
}
.ah-rule {
  display: block;
  width: clamp(60px, 9cqw, 180px);
  height: 1px;
  margin: clamp(16px, 3.4cqh, 38px) auto;
  background: rgba(255, 255, 255, 0.28);
}
.ah-text {
  margin: 0 auto;
  max-width: 32em;
  font: 400 clamp(0.72rem, 1.25cqw, 1.3rem) / 1.7 system-ui, -apple-system, "Segoe UI", sans-serif;
  color: #9a9a9a;
}

/* ---------- Status pill ---------- */
.ah-pill {
  position: absolute;
  left: 50%;
  bottom: clamp(18px, 5cqh, 56px);
  transform: translateX(-50%);
  z-index: 50;
  display: inline-flex;
  align-items: center;
  gap: 0.9em;
  padding: 0.85em 1.8em;
  border-radius: 999px;
  background: #1b1b1d;
  border: 1px solid #2c2c2f;
  color: #d9d9d9;
  font: 500 clamp(0.72rem, 1.15cqw, 1.05rem) / 1 system-ui, -apple-system, "Segoe UI", sans-serif;
  white-space: nowrap;
}
.ah-dot {
  width: 0.7em;
  height: 0.7em;
  border-radius: 50%;
  background: #3ccf7e;
  box-shadow: 0 0 0.9em rgba(60, 207, 126, 0.5);
  transition: background 0.4s, box-shadow 0.4s;
}
.ah-pill[data-state="closed"] .ah-dot {
  background: #ff9f1c;
  box-shadow: 0 0 0.9em rgba(255, 159, 28, 0.45);
}
.ah-label { display: grid; }
.ah-label > span { grid-area: 1 / 1; transition: opacity 0.4s; }
.ah-pill[data-state="open"]   .ah-label > [data-for="closed"],
.ah-pill[data-state="closed"] .ah-label > [data-for="open"] { opacity: 0; }

/* ---------- Narrow containers ---------- */
@container (max-width: 720px) {
  .ah-stage {
    --cw: clamp(52px, min(17cqw, 11cqh), 120px);
    --col-x: 37cqw;
  }
  .ah-copy { width: 50cqw; }
  .ah-eyebrow { letter-spacing: 0.24em; }
}

/* ---------- Interaction ---------- */
.ah-stage { cursor: pointer; }
.ah-pill { appearance: none; cursor: pointer; }
.ah-pill:focus-visible { outline: 2px solid #fff; outline-offset: 3px; }

@media (prefers-reduced-motion: reduce) {
  .ah-stage { cursor: default; }
  .ah-pill { display: none; }
}
`

/* ---------- Data ---------- */

/* Placeholder photos – replace with 8 real URLs (4 left column, 4 right). */
const IMAGES = Array.from(
  { length: 8 },
  (_, i) => `https://picsum.photos/seed/architecture-${i + 1}/600/840`
)

/* Per-card look: rotation (deg), rotateY (deg), size multipliers, depth (px). Right column mirrors left. */
const CARD_LOOKS = [
  { rot: 6,    ry: 12, sw: 1.05, sh: 1.0,  z: 30 },
  { rot: -1.5, ry: 9,  sw: 0.96, sh: 0.98, z: -10 },
  { rot: 3,    ry: 11, sw: 0.99, sh: 1.02, z: 10 },
  { rot: 8,    ry: 14, sw: 1.1,  sh: 1.0,  z: 40 },
]

const COPY = {
  eyebrow: 'Monograph No. 04',
  title: ['Architectural', 'Symmetry.'],
  description:
    'Unfolding spatial narratives through raw concrete, natural light, and balanced bilateral geometry.',
  openLabel: 'Scroll up or click to close curtain',
  closedLabel: 'Scroll down or click to unveil',
}

/* ---------- Components ---------- */

function Card({ src, side, row, look }) {
  const dir = side === 'left' ? 1 : -1
  const rot = look.rot * dir
  const ry = look.ry * dir
  return (
    <figure
      className="ah-card"
      data-card
      data-side={-dir} /* left = -1, right = 1 */
      data-row={row}
      data-rot={rot}
      data-ry={ry}
      data-z={look.z}
      style={{
        '--sw': look.sw,
        '--sh': look.sh,
        '--rot': `${rot}deg`,
        '--ry': `${ry}deg`,
        '--z': `${look.z}px`,
        zIndex: side === 'left' ? 10 + row : 10 + (3 - row),
      }}
    >
      <img src={src} alt="" loading="lazy" draggable={false} />
    </figure>
  )
}

function Column({ side, images }) {
  return (
    <div className={`ah-column ah-column--${side}`} aria-hidden="true">
      {images.map((src, row) => (
        <Card key={src} src={src} side={side} row={row} look={CARD_LOOKS[row]} />
      ))}
    </div>
  )
}

function Copy() {
  return (
    <div className="ah-copy" data-copy>
      <p className="ah-eyebrow">{COPY.eyebrow}</p>
      <h2 className="ah-title">
        {COPY.title.map((line, i) => (
          <span key={line}>{line}{i < COPY.title.length - 1 && <br />}</span>
        ))}
      </h2>
      <span className="ah-rule" />
      <p className="ah-text">{COPY.description}</p>
    </div>
  )
}

function StatusPill({ pillRef }) {
  return (
    <button type="button" className="ah-pill" ref={pillRef} data-state="closed">
      <span className="ah-dot" />
      <span className="ah-label">
        <span data-for="open">{COPY.openLabel}</span>
        <span data-for="closed">{COPY.closedLabel}</span>
      </span>
    </button>
  )
}

/* ---------- Animation (GSAP + ScrollTrigger) ----------
   One timeline: progress 0 = columns open, 1 = single collapsed stack.
   Scroll position drives it (top of section = collapsed, bottom = open). */

gsap.registerPlugin(ScrollTrigger)

const STEPS = [
  { yk: 0.34, xf: 0.35, scale: 0.94, rm: 0.25, peek: 0,    stack: 0, dur: 1.1, ease: 'power2.in' },
  { yk: 0.77, xf: 0.74, scale: 0.84, rm: 0.6,  peek: 0,    stack: 0, dur: 0.9, ease: 'none' },
  { yk: 1,    xf: 1,    scale: 0.72, rm: 1,    peek: 0.18, stack: 7, dur: 0.9, ease: 'power3.out' },
]
const SMOOTH = 0.6 // seconds of easing between scroll position and animation

function useHeroTimeline(stageRef, pillRef) {
  useLayoutEffect(() => {
    const stage = stageRef.current
    const root = stage?.parentElement
    if (!stage || !root) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return // keep static open layout

    let ctx
    let timer
    let toggle = () => {}

    const build = () => {
      ctx?.revert()
      try {
        buildTimeline()
      } catch (err) {
        console.error('[Team] animation setup failed, showing static layout', err)
        ctx?.revert()
      }
    }

    const buildTimeline = () => {
      ctx = gsap.context(() => {
        const cards = gsap.utils.toArray('[data-card]', stage)
        const copy = stage.querySelector('[data-copy]')
        const labels = pillRef.current.querySelectorAll('[data-for]')
        const sr = stage.getBoundingClientRect()
        const cx = sr.width / 2
        const cy = sr.height / 2

        // Measure each card's un-transformed centre in stage coordinates
        const info = cards.map((el) => {
          const col = el.parentElement.getBoundingClientRect()
          const ccx = col.left - sr.left + el.offsetLeft + el.offsetWidth / 2
          const ccy = col.top - sr.top + el.offsetTop + el.offsetHeight / 2
          const row = +el.dataset.row
          const side = +el.dataset.side
          return {
            row, side,
            w: el.offsetWidth,
            dx: cx - ccx,
            d: ccy - cy,
            rot: +el.dataset.rot,
            ry: +el.dataset.ry,
            z: +el.dataset.z,
            finalRot: (row - 1.5) * -2.5 * side,
          }
        })

        gsap.set(cards, {
          x: 0, y: 0, scale: 1,
          rotation: (i) => info[i].rot,
          rotationY: (i) => info[i].ry,
          z: (i) => info[i].z,
          transformPerspective: 1000,
        })

        let open = null
        const syncPill = () => {
          const nowOpen = tl.progress() < 0.35
          if (nowOpen === open) return
          open = nowOpen
          pillRef.current.setAttribute('data-state', open ? 'open' : 'closed')
          labels.forEach((l) => l.setAttribute('aria-hidden', String((l.dataset.for === 'open') !== open)))
        }

        const tl = gsap.timeline({ paused: true })
        tl.to(copy, { autoAlpha: 0, y: -18, filter: 'blur(6px)', duration: 0.8, ease: 'power2.out' }, 0)

        STEPS.forEach((s) => {
          tl.to(cards, {
            x: (i) => info[i].dx * s.xf + info[i].side * info[i].w * s.peek,
            y: (i) => -info[i].d * s.yk + (info[i].row - 1.5) * s.stack,
            scale: s.scale,
            rotation: (i) => info[i].rot * (1 - s.rm) + info[i].finalRot * s.rm,
            rotationY: (i) => info[i].ry * (1 - s.rm),
            z: (i) => info[i].z * (1 - s.rm),
            delay: (i) => Math.abs(info[i].row - 1.5) * 0.05, // outer cards lag slightly
            duration: s.dur,
            ease: s.ease,
          }, '>')
        })

        const st = ScrollTrigger.create({
          trigger: root,
          pin: true,            // ScrollTrigger pins the hero (works even if a parent has overflow set)
          pinSpacing: true,
          anticipatePin: 1,
          start: 'top top',
          end: '+=200%',        // scroll distance for the whole animation
          onUpdate: (self) =>
            gsap.to(tl, {
              progress: 1 - self.progress, // scroll down = open
              duration: SMOOTH,
              ease: 'power2.out',
              overwrite: true,
              onUpdate: syncPill,
            }),
        })

        tl.progress(1 - st.progress) // jump to the right frame (also after a resize rebuild)
        syncPill()

        // Click / Enter on the stage: glide to the opposite end of the scroll range
        toggle = () =>
          window.scrollTo({ top: tl.progress() < 0.5 ? st.start : st.end, behavior: 'smooth' })
      }, stage)
    }

    const onClick = () => toggle()
    stage.addEventListener('click', onClick)

    let lastW = stage.clientWidth
    let lastH = stage.clientHeight
    build()

    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      if (Math.abs(width - lastW) < 1 && Math.abs(height - lastH) < 1) return
      lastW = width
      lastH = height
      clearTimeout(timer)
      timer = setTimeout(build, 180) // rebuild once resize settles
    })
    ro.observe(stage)

    return () => {
      stage.removeEventListener('click', onClick)
      ro.disconnect()
      clearTimeout(timer)
      ctx?.revert()
    }
  }, [stageRef, pillRef])
}

/* ---------- Section ---------- */

export default function Team() {
  const stageRef = useRef(null)
  const pillRef = useRef(null)

  useHeroTimeline(stageRef, pillRef) // remove this line for the static (open) layout only

  return (
    <section
      id="team"
      className="section"
      style={{ display: 'block', position: 'relative', height: 'auto', minHeight: 0, padding: 0, overflow: 'visible' }}
    >
      <style>{CSS}</style>
      <div className="ah-root">
        <div className="ah-stage" ref={stageRef}>
          <Column side="left" images={IMAGES.slice(0, 4)} />
          <Copy />
          <Column side="right" images={IMAGES.slice(4, 8)} />
          <StatusPill pillRef={pillRef} />
        </div>
      </div>
    </section>
  )
}