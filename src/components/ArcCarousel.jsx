import { useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { ACCENT, PROJECTS } from '@/lib/projects'

/* =====================================================================
   Arc card carousel – pinned
   • landscape photo cards ride the rim of a big wheel whose hub is off the left edge of the screen
   • the card on the wheel's equator lies flat with its title beside it; the others fan out above and
     below it, all at full brightness, and melt away at the top / bottom of the pinned area
   • ENTRANCE: once pinned, the cards ease in from the left (a gentle slide + fade, one after another)
   • PIN: the carousel then stays pinned while page scroll turns the wheel one project at a time;
     after the last project the section releases and the page continues
   • mouse drag, the arrows or a click on a card also move through the projects
   ===================================================================== */

const IMG = '/assets/manifesto-background-images/'

// the four portfolio projects + placeholders, so the arc is full. Swap `src` for real project photos.
const EXTRA = [
  ['Casa Verde', 'Residential / Interior Design'],
  ['Maison Lumière', 'Villa / Architecture'],
  ['Atelier Nord', 'Workspace / Interior Design'],
  ['Hearth & Stone', 'Residential / Renovation'],
  ['Solène', 'Boutique Hotel / Interiors'],
  ['Terra House', 'Residential / Landscape'],
]
const PHOTOS = ['bgimage7.jpg', 'bgimage8.webp', 'bgimage9.jpg', 'bgimage10.jpg', 'bgimage11.jpeg', 'bgimage12.jpeg', 'bgimage13.webp', 'bgimage14.jpeg', 'bgimage15.jpg', 'bgimage16.jpeg']
const ITEMS = [
  ...PROJECTS.map((p) => ({ name: p.name, role: p.role })),
  ...EXTRA.map(([name, role]) => ({ name, role })),
].map((p, i) => ({ ...p, src: IMG + PHOTOS[i % PHOTOS.length] }))

const N = ITEMS.length
const ENTER = 0.55 // viewport heights of (pinned) scrolling the entrance takes – it starts only once the section is pinned and the colour change is over
const START = ENTER + 0.1 // viewport heights before the wheel starts turning (entrance + a short hold on the first project)
const SLOT = 0.6 // viewport heights of scrolling per project
const END = 0.3 // viewport heights held on the last project before the pin releases
const ENTER_SHIFT = 1.6 // entrance: cards start this far (in card widths) to the left of their place and ease in sideways
const POP = 0.38 // the card on the equator is this much bigger (38%) than the rest
const STAGGER = 0 // no delay between cards: a stagger runs top → bottom and made the reveal look like it was dropping down
const VERT_MASK = 'linear-gradient(180deg, transparent 0%, #000 16%, #000 84%, transparent 100%)'

const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
const easeOut = (t) => 1 - Math.pow(1 - t, 3)
const pad = (n) => String(n).padStart(2, '0')

export default function ArcCarousel() {
  const track = useRef(null)
  const box = useRef(null)
  const cards = useRef([])
  const counter = useRef(null)
  const bar = useRef(null)
  const hint = useRef(null)
  const labelBox = useRef(null)
  const activeRef = useRef(0)
  const [active, setActive] = useState(0)
  const api = useRef({})

  useEffect(() => {
    const el = box.current
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const s = { cur: 0, target: 0, enter: 0, enterT: 0, dims: null, dragging: false, moved: 0, raf: 0, idle: 0 }

    const measure = () => {
      const W = el.clientWidth
      const H = el.clientHeight
      const cardH = H * 0.22
      const cardW = cardH * 1.62 // landscape
      const R = H * 0.84
      const step = (cardH * 1.02) / R // radians between neighbouring cards
      const eqX = Math.max(cardW / 2 + 24, W * 0.27)
      s.dims = { W, H, cardW, cardH, R, step, hubX: eqX - R, hubY: H / 2 }
      if (labelBox.current) {
        labelBox.current.style.left = eqX + (cardW / 2) * (1 + POP) + 32 + 'px'
        labelBox.current.style.width = Math.max(150, W - eqX - (cardW / 2) * (1 + POP) - 40) + 'px'
      }
      cards.current.forEach((c) => {
        if (!c) return
        c.style.width = cardW + 'px'
        c.style.height = cardH + 'px'
      })
      read()
      render()
    }

    // page scroll → entrance progress + which project the wheel is on
    const read = () => {
      const vh = window.innerHeight
      const top = track.current.getBoundingClientRect().top
      s.enterT = reduced ? 1 : clamp(-top / (ENTER * vh), 0, 1)
      s.target = reduced ? 0 : clamp((-top - START * vh) / (SLOT * vh), 0, N - 1)
    }

    const render = () => {
      const d0 = s.dims
      if (!d0) return
      cards.current.forEach((c, k) => {
        if (!c) return
        // each card sweeps in a little after the previous one
        const er = easeOut(clamp((s.enter - k * STAGGER) / (1 - (N - 1) * STAGGER), 0, 1))
        const d = k - s.cur
        const a = d * d0.step
        const x = d0.hubX + d0.R * Math.cos(a) - d0.cardW / 2 - (1 - er) * d0.cardW * ENTER_SHIFT // slides in from the left
        const y = d0.hubY + d0.R * Math.sin(a) - d0.cardH / 2
        const ad = Math.abs(d)
        // the card nearest the equator pops up a little: eased, so it grows smoothly as it arrives and shrinks as it leaves
        const f = clamp(1 - ad * 1.2, 0, 1)
        const pop = 1 + POP * f * f * (3 - 2 * f)
        const vis = ad > 5 ? 0 : er // every card stays at full brightness; fades in as it slides
        c.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${a}rad) scale(${pop})`
        c.style.opacity = String(vis)
        c.style.zIndex = String(100 - Math.round(ad * 10) + (f > 0.5 ? 20 : 0))
        c.style.pointerEvents = vis < 0.2 ? 'none' : 'auto'
      })
      const idx = clamp(Math.round(s.cur), 0, N - 1)
      // one label, never rotated – it simply swaps (a short fade + rise) when another project reaches the equator
      if (idx !== activeRef.current) { activeRef.current = idx; setActive(idx) }
      if (labelBox.current) labelBox.current.style.opacity = String(clamp((s.enter - 0.8) * 5, 0, 1))
      if (counter.current) counter.current.textContent = pad(idx + 1)
      if (bar.current) bar.current.style.transform = `scaleX(${N > 1 ? clamp(s.cur / (N - 1), 0, 1) : 1})`
      if (hint.current) hint.current.style.opacity = String(clamp((s.enter - 0.7) * 3.3, 0, 1) * clamp(1 - s.cur * 2, 0, 1))
    }

    const tick = () => {
      const k = reduced ? 1 : 0.12
      const dc = s.target - s.cur
      const de = s.enterT - s.enter
      if (Math.abs(dc) > 0.0005 || Math.abs(de) > 0.0005) {
        s.cur += dc * k
        s.enter += de * k
        render()
        s.raf = requestAnimationFrame(tick)
      } else {
        s.cur = s.target
        s.enter = s.enterT
        render()
        s.raf = 0
      }
    }
    const kick = () => { if (!s.raf) s.raf = requestAnimationFrame(tick) }

    // absolute page position at which project k sits on the equator
    const posOf = (k) => window.scrollY + track.current.getBoundingClientRect().top + (START + k * SLOT) * window.innerHeight
    const scrollToSlot = (k) => window.scrollTo({ top: posOf(clamp(k, 0, N - 1)), behavior: reduced ? 'auto' : 'smooth' })

    const onScroll = () => {
      read()
      kick()
      clearTimeout(s.idle)
      // settle on a whole project while pinned, so a card always rests flat on the equator
      s.idle = setTimeout(() => {
        if (s.dragging || s.enterT < 1 || reduced) return
        const frac = Math.abs(s.target - Math.round(s.target))
        if (s.target > 0.001 && s.target < N - 1 - 0.001 && frac > 0.02) scrollToSlot(Math.round(s.target))
      }, 220)
    }

    let startY = 0
    const onDown = (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return
      s.dragging = true
      s.moved = 0
      startY = e.clientY
      el.setPointerCapture?.(e.pointerId)
      el.style.cursor = 'grabbing'
    }
    const onMove = (e) => {
      if (!s.dragging) return
      const dy = e.clientY - startY
      startY = e.clientY
      s.moved += Math.abs(dy)
      // dragging the cards up advances: translate the drag into page scroll
      window.scrollBy(0, (-dy / (s.dims.R * s.dims.step)) * SLOT * window.innerHeight)
    }
    const onUp = () => {
      if (!s.dragging) return
      s.dragging = false
      el.style.cursor = ''
      onScroll()
    }

    api.current = {
      go: (n) => scrollToSlot(Math.round(s.target) + n),
      focus: (k) => { if (s.moved <= 6) scrollToSlot(k) },
    }

    measure()
    s.cur = s.target
    s.enter = s.enterT
    render()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', measure)
    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onUp)
    return () => {
      ro.disconnect()
      cancelAnimationFrame(s.raf)
      clearTimeout(s.idle)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', measure)
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onUp)
    }
  }, [])

  return (
    // tall track: its extra height is the scroll "budget" spent while the carousel stays pinned
    <div ref={track} style={{ height: `calc(${(1 + (N - 1) * SLOT + START + END) * 100}svh)` }}>
      {/* pt keeps the pinned wheel clear of the "Award Winning Work" heading, which stays at the top of the screen */}
      <div className="sticky top-0 flex h-svh items-end pt-[15svh]">
        <div
          ref={box}
          className="relative w-full select-none"
          style={{ height: 'calc(100svh - 15svh)', touchAction: 'pan-y', cursor: 'grab' }}
          role="region"
          aria-roledescription="carousel"
          aria-label="Featured projects"
        >
          {/* cards – the top and bottom of the wheel melt away instead of being cut off */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ WebkitMaskImage: VERT_MASK, maskImage: VERT_MASK }}
          >
            {ITEMS.map((p, k) => (
              <div
                key={p.name}
                ref={(n) => { cards.current[k] = n }}
                className="absolute left-0 top-0 will-change-transform"
                style={{ opacity: 0 }}
                onClick={() => api.current.focus(k)}
              >
                <div className="h-full w-full overflow-hidden rounded-[1.4rem] shadow-[0_24px_60px_-20px_rgba(0,0,0,.9)] ring-1 ring-white/10">
                  <img src={p.src} alt={p.name} draggable={false} decoding="async" className="h-full w-full object-cover" />
                </div>
              </div>
            ))}
          </div>

          {/* project label beside the flat (equator) card */}
          <div
            ref={labelBox}
            className="pointer-events-none absolute top-1/2 z-[150] -translate-y-1/2 text-left text-white"
            style={{ opacity: 0 }}
          >
            <div key={active}>
              <div
                className="text-sm font-medium tabular-nums tracking-widest text-white/50"
                style={{ animation: 'labelIn .6s cubic-bezier(.22,1,.36,1) both' }}
              >
                {pad(active + 1)} / {pad(N)}
              </div>
              <div
                className="mt-3 font-semibold"
                style={{
                  fontSize: 'clamp(1.8rem, 4vw, 3.8rem)',
                  lineHeight: 1.02,
                  letterSpacing: '-0.03em',
                  animation: 'labelIn .6s cubic-bezier(.22,1,.36,1) .08s both',
                }}
              >
                {ITEMS[active].name}
              </div>
              <div
                className="mt-3 text-sm text-white/55 sm:text-base"
                style={{ animation: 'labelIn .6s cubic-bezier(.22,1,.36,1) .16s both' }}
              >
                {ITEMS[active].role}
              </div>
            </div>
          </div>

          {/* progress: counter + bar */}
          <div className="pointer-events-none absolute bottom-6 left-5 z-[200] flex items-center gap-4 text-white sm:left-[7%]">
            <span className="text-sm font-semibold tabular-nums">
              <span ref={counter}>01</span>
              <span className="text-white/40"> / {pad(N)}</span>
            </span>
            <span className="relative block h-px w-28 bg-white/20">
              <span ref={bar} className="absolute inset-0 origin-left" style={{ background: ACCENT, transform: 'scaleX(0)' }} />
            </span>
            <span ref={hint} className="text-[10px] uppercase tracking-[0.25em] text-white/50" style={{ opacity: 0 }}>
              Scroll to explore
            </span>
          </div>

          {/* controls */}
          <div className="absolute bottom-5 right-5 z-[200] flex flex-col gap-2 sm:right-8">
            {[[-1, ChevronUp, 'Previous project'], [1, ChevronDown, 'Next project']].map(([n, Icon, label]) => (
              <button
                key={label}
                type="button"
                aria-label={label}
                onClick={() => api.current.go(n)}
                onPointerDown={(e) => e.stopPropagation()}
                className="grid h-11 w-11 place-items-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
              >
                <Icon className="h-5 w-5" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
