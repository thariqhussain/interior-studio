import { useEffect, useRef } from 'react'
import { DISPLAY_FONT, SERIF_FONT } from '@/lib/projects'

/* =====================================================================
   Before / After – tilted, curved streaming grid
   • three rows of before/after tiles stream endlessly, each row in alternating directions
   • the whole grid is tilted; every row is curved – tiles bend toward the viewer at the left /
     right edges (translateZ + rotateY from their distance to the centre) and fade out there
   • inside each tile a divider keeps sweeping, revealing "before" ↔ "after"
   ===================================================================== */

const ACCENT = '#c9a77c'
const IMG = '/assets/manifesto-background-images/'

// placeholder photos – replace with real before / after pairs: { before, after } per tile
const ROWS = [
  { speed: 38, imgs: ['bgimage6.jpg', 'bgimage7.jpg', 'bgimage8.webp', 'bgimage9.jpg', 'bgimage10.jpg', 'bgimage11.jpeg'] },
  { speed: -52, imgs: ['bgimage12.jpeg', 'bgimage13.webp', 'bgimage14.jpeg', 'bgimage15.jpg', 'bgimage16.jpeg', 'bgimage17.webp'] },
  { speed: 32, imgs: ['bgimage18.webp', 'bgimage20.jpg', 'bgimage1.jpg', 'bgimage2.jpg', 'bgimage3.jpeg', 'bgimage4.webp'] },
]
const COPIES = 3 // each row renders its images this many times, so the loop always covers the screen
const GAP = 20
const BEFORE_FILTER = 'grayscale(1) contrast(.8) brightness(.62) blur(1px)'

const clamp = (v, a, b) => Math.min(b, Math.max(a, v))

export default function BeforeAfter() {
  const stage = useRef(null)
  const tiles = useRef([]) // tiles.current[row][i] = { el, before, line }

  useEffect(() => {
    const el = stage.current
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let W = el.clientWidth
    let tw = clamp(W * 0.24, 220, 360)
    const ro = new ResizeObserver(() => {
      W = el.clientWidth
      tw = clamp(W * 0.24, 220, 360)
      tiles.current.forEach((row) => row.forEach((t) => {
        t.el.style.width = tw + 'px'
        t.el.style.height = tw * 0.72 + 'px'
      }))
    })
    ro.observe(el)

    let raf = 0
    let visible = true
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting }, { rootMargin: '200px' })
    io.observe(el)

    const frame = (now) => {
      raf = requestAnimationFrame(frame)
      if (!visible) return
      const t = now / 1000
      const pw = tw + GAP
      ROWS.forEach((row, r) => {
        const L = row.imgs.length * pw
        const off = (((reduced ? 0 : t * row.speed) % L) + L) % L
        tiles.current[r].forEach((tile, i) => {
          const x = i * pw - off
          const cx = x + tw / 2
          if (cx < -tw * 1.5 || cx > W + tw * 1.5) {
            tile.el.style.visibility = 'hidden'
            return
          }
          tile.el.style.visibility = 'visible'
          const u = clamp((cx - W / 2) / (W / 2), -1.4, 1.4) // -1 … 1 across the screen
          const z = u * u * 320 // edges come toward the viewer
          const rot = -u * 30 // …and turn to face the centre
          tile.el.style.transform = `translate3d(${x}px, 0, ${z}px) rotateY(${rot}deg)`
          // divider sweeps back and forth, each tile out of phase
          const p = reduced ? 0.5 : 0.5 + 0.42 * Math.sin(t * 0.7 + i * 1.3 + r * 2.1)
          tile.before.style.clipPath = `inset(0 ${(1 - p) * 100}% 0 0)`
          tile.line.style.left = p * 100 + '%'
        })
      })
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
    }
  }, [])

  return (
    <section
      id="before-after"
      className="relative overflow-hidden border-b border-white/10 bg-[#070707] py-24 text-white sm:py-32"
      style={{ fontFamily: DISPLAY_FONT }}
    >
      {/* soft glow behind the heading */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[34rem] w-[60rem] -translate-x-1/2 rounded-full blur-[120px]"
        style={{ background: 'radial-gradient(closest-side, rgba(201,167,124,.16), transparent)' }}
      />

      <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
        <div className="flex items-center justify-center gap-4 text-xs font-medium uppercase tracking-[0.25em]" style={{ color: ACCENT }}>
          <span className="h-px w-10" style={{ background: ACCENT }} />
          Transformations
          <span className="h-px w-10" style={{ background: ACCENT }} />
        </div>
        <h2 className="mt-6 text-5xl font-extrabold leading-[0.95] tracking-[-0.04em] sm:text-7xl">
          Before{' '}
          <em className="font-normal italic" style={{ fontFamily: SERIF_FONT, color: ACCENT, letterSpacing: '-0.02em' }}>
            &amp;
          </em>{' '}
          After
        </h2>
        <p className="mx-auto mt-6 max-w-md text-base leading-relaxed text-white/55">
          The same rooms, reimagined. Watch each space move from what it was to what it became.
        </p>
      </div>

      {/* tilted grid */}
      <div className="relative mt-16 sm:mt-24" style={{ transform: 'rotate(-6deg) scale(1.12)' }}>
        <div
          ref={stage}
          className="flex flex-col"
          style={{
            gap: GAP,
            perspective: '1400px',
            WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, #000 16%, #000 84%, transparent 100%)',
            maskImage: 'linear-gradient(90deg, transparent 0%, #000 16%, #000 84%, transparent 100%)',
          }}
        >
          {ROWS.map((row, r) => {
            tiles.current[r] = []
            const list = Array.from({ length: row.imgs.length * COPIES }, (_, i) => row.imgs[i % row.imgs.length])
            return (
              <div key={r} className="relative" style={{ height: 'clamp(158px, 17.3vw, 259px)', transformStyle: 'preserve-3d' }}>
                {list.map((file, i) => (
                  <div
                    key={i}
                    ref={(n) => {
                      if (!n) return
                      tiles.current[r][i] = { el: n, before: n.children[1], line: n.children[2] }
                    }}
                    className="absolute left-0 top-0 overflow-hidden rounded-xl ring-1 ring-white/15 shadow-[0_24px_60px_-24px_rgba(0,0,0,.9)] will-change-transform"
                    style={{ width: 300, height: 216, visibility: 'hidden' }}
                  >
                    {/* after */}
                    <img src={IMG + file} alt="After" loading="lazy" draggable={false} className="absolute inset-0 h-full w-full object-cover" />
                    {/* before (clipped from the right by the sweeping divider) */}
                    <div className="absolute inset-0">
                      <img
                        src={IMG + file}
                        alt="Before"
                        loading="lazy"
                        draggable={false}
                        className="h-full w-full object-cover"
                        style={{ filter: BEFORE_FILTER }}
                      />
                    </div>
                    {/* divider */}
                    <div className="absolute inset-y-0 w-px bg-white/90" style={{ left: '50%' }}>
                      <span className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/90 bg-black/40 backdrop-blur" />
                    </div>
                    <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-white/90 backdrop-blur">
                      Before
                    </span>
                    <span
                      className="pointer-events-none absolute right-3 top-3 rounded-full px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-black"
                      style={{ background: ACCENT }}
                    >
                      After
                    </span>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
