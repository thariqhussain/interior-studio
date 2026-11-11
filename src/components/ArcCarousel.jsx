import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion'
import { ArrowUpRight, ChevronDown, ChevronUp, X } from 'lucide-react'
import { ACCENT, PROJECTS } from '@/lib/projects'
import { getScrollTarget, scrollToTarget, scrollToY } from '@/lib/useSmoothScroll'

/* =====================================================================
   Arc card carousel – pinned
   • landscape photo cards ride the rim of a big wheel whose hub is off the left edge of the screen
   • the card on the wheel's equator lies flat with its title beside it; the others fan out above and
     below it, all at full brightness, and melt away at the top / bottom of the pinned area
   • ENTRANCE: once pinned, the cards ease in from the left (a gentle slide + fade, one after another)
   • PIN: the carousel then stays pinned while page scroll turns the wheel one project at a time;
     after the last project the section releases and the page continues
   • mouse drag, the arrows or a click on a card also move through the projects
   • clicking a card opens the project viewer in the dead centre of the screen: the whole page except the navbar is dimmed,
     and the viewer is two separate tiles – the project image (the same size as the highlighted card) and a glass tile with
     its details. It follows the project on the wheel – scroll or use its Previous / Next buttons and it updates;
     Esc, ✕ or a click on the dimmed page closes it
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

/* Detail content shown when a card is expanded – PLACEHOLDERS, one entry per project in the order above. Replace with
   the real facts. */
const DETAILS = [
  { role: 'Residential / Interior Design', location: 'Bengaluru, India', area: '2,400 sq ft', year: '2025', duration: '16 weeks', services: ['Space planning', 'Joinery', 'Styling'], about: 'A family apartment reworked around light and flow: open social spaces, warm timber and joinery that hides the clutter.' },
  { role: 'Residential / Full Interiors', location: 'Kochi, India', area: '3,100 sq ft', year: '2025', duration: '20 weeks', services: ['Full interiors', '3D visuals', 'Turnkey'], about: 'A sea-facing home where every room borrows the horizon: pale stone, linen and low, quiet furniture.' },
  { role: 'Apartment / Interior Design', location: 'Chennai, India', area: '1,800 sq ft', year: '2024', duration: '12 weeks', services: ['Concept', 'Lighting', 'Furniture'], about: 'Compact living made generous: layered lighting, built-in storage and a palette that keeps the rooms calm.' },
  { role: 'Apartment / Custom Joinery', location: 'Mumbai, India', area: '2,750 sq ft', year: '2024', duration: '18 weeks', services: ['Space planning', 'Custom joinery'], about: 'A bold, art-led apartment: strong colour, sculptural pieces and a layout designed for hosting.' },
  { role: 'Villa / Architecture', location: 'Hyderabad, India', area: '4,200 sq ft', year: '2024', duration: '24 weeks', services: ['Architecture', 'Interiors', 'Landscape'], about: 'A courtyard villa that keeps the outside in: deep verandas, jali screens and natural materials throughout.' },
  { role: 'Workspace / Interior Design', location: 'Pune, India', area: '5,600 sq ft', year: '2023', duration: '14 weeks', services: ['Workspace design', 'Branding', 'Joinery'], about: 'A studio office built for collaboration: flexible zones, acoustic softness and a showroom-grade entrance.' },
  { role: 'Residential / Renovation', location: 'Goa, India', area: '2,300 sq ft', year: '2023', duration: '15 weeks', services: ['Renovation', 'Styling', 'Sourcing'], about: 'A heritage house renovated with restraint: original stone and timber restored, modern comfort added gently.' },
  { role: 'Boutique Hotel / Interiors', location: 'Jaipur, India', area: '9,800 sq ft', year: '2023', duration: '30 weeks', services: ['Hospitality', 'Lighting', 'Turnkey'], about: 'A boutique hotel with a residential feel: textured walls, soft lighting and rooms that each tell a small story.' },
  { role: 'Residential / Landscape', location: 'Coorg, India', area: '3,600 sq ft', year: '2022', duration: '22 weeks', services: ['Landscape', 'Interiors', 'Joinery'], about: 'A hillside retreat: rammed-earth walls, big glazing and interiors that blur into the garden.' },
  { role: 'Apartment / Interior Design', location: 'Delhi, India', area: '2,100 sq ft', year: '2022', duration: '13 weeks', services: ['Full interiors', 'Lighting'], about: 'A pared-back city home: a single material palette, hidden storage and light that changes through the day.' },
]
ITEMS.forEach((it, i) => {
  const d = DETAILS[i % DETAILS.length]
  it.role = d.role // roles follow the studio's own work (the names are still placeholders)
  it.details = d
})

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
  const ctlRef = useRef(null)
  const labelBox = useRef(null)
  const activeRef = useRef(0)
  const [active, setActive] = useState(0)
  const [open, setOpen] = useState(false) // front card expanded into its details
  const [geo, setGeo] = useState(null) // wheel geometry (px) – the expanded card grows out of the front card's exact rectangle
  const closeRef = useRef(null)
  const openRef = useRef(false) // read by the wheel's render loop
  // lift & tilt: once the image tile is in front it leans toward the cursor, with a soft sheen that follows it
  const reduceMotion = useReducedMotion()
  const tileRef = useRef(null)
  const aimX = useMotionValue(0) // -1 … 1: where the cursor is, horizontally, relative to the tile
  const aimY = useMotionValue(0)
  const tx = useSpring(aimX, { stiffness: 110, damping: 18, mass: 0.6 })
  const ty = useSpring(aimY, { stiffness: 110, damping: 18, mass: 0.6 })
  const leanY = useTransform(tx, [-1, 1], [-9, 9])
  const leanX = useTransform(ty, [-1, 1], [7, -7])
  const sheenX = useTransform(tx, [-1, 1], [85, 15])
  const sheenY = useTransform(ty, [-1, 1], [85, 15])
  const sheen = useMotionTemplate`radial-gradient(circle at ${sheenX}% ${sheenY}%, rgba(255,255,255,.3), transparent 55%)`
  const api = useRef({})

  useEffect(() => {
    const el = box.current
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const s = { cur: 0, target: 0, enter: 0, enterT: 0, dims: null, dragging: false, moved: 0, raf: 0, idle: 0 }

    const measure = () => {
      const W = el.clientWidth
      const H = el.clientHeight
      // phones: the highlighted card is centred, its label sits underneath it (there is no room beside it)
      const phone = W < 640
      const cardH = H * (phone ? 0.19 : 0.22)
      const cardW = cardH * 1.62 // landscape
      const R = H * 0.84
      const step = (cardH * 1.02) / R // radians between neighbouring cards
      const eqX = phone ? W / 2 : Math.max(cardW / 2 + 24, W * 0.27)
      const hubY = phone ? H * 0.5 : H / 2
      s.dims = { W, H, cardW, cardH, R, step, hubX: eqX - R, hubY, phone }
      if (labelBox.current) {
        const lb = labelBox.current.style
        if (phone) {
          lb.left = '24px'
          lb.width = W - 48 + 'px'
          lb.top = hubY + (cardH / 2) * (1 + POP) + 26 + 'px'
          lb.transform = 'none'
        } else {
          lb.left = eqX + (cardW / 2) * (1 + POP) + 32 + 'px'
          lb.width = Math.max(150, W - eqX - (cardW / 2) * (1 + POP) - 40) + 'px'
          lb.top = ''
          lb.transform = ''
        }
      }
      cards.current.forEach((c) => {
        if (!c) return
        c.style.width = cardW + 'px'
        c.style.height = cardH + 'px'
      })
      setGeo({ W, H, cardW, cardH, eqX })
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
        let vis = ad > 5 ? 0 : er // every card stays at full brightness; fades in as it slides
        if (d0.phone && d > 0) vis *= clamp(1 - d * 1.15, 0, 1) // phones: the label sits under the front card, so the cards below it fade out
        if (openRef.current && ad < 0.5) vis = 0 // the viewer shows this project's image itself, so the wheel's copy steps aside
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
    const scrollToSlot = (k) => {
      const y = posOf(clamp(k, 0, N - 1))
      if (reduced) window.scrollTo({ top: y, behavior: 'auto' })
      else scrollToY(y, { duration: 0.32, easing: (t) => 1 - Math.pow(1 - t, 4) }) // a quick, firm snap
    }

    // keep the buttons just under the stacked heading: measure the last word ("Work") and place them below it. The heading
    // settles with a slow animation, so after every scroll we re-measure for a few seconds, then stop (no idle cost).
    let ctlUntil = 0
    let ctlRaf = 0
    const placeControls = () => {
      ctlRaf = 0
      const c = ctlRef.current
      const word = document.querySelector('#projects h2 > span:last-child')
      if (c && word) {
        const top = word.getBoundingClientRect().bottom - el.getBoundingClientRect().top + 16
        c.style.top = `${clamp(top, 80, el.clientHeight - 140)}px`
      }
      if (performance.now() < ctlUntil) ctlRaf = requestAnimationFrame(placeControls)
    }
    const chaseControls = () => { ctlUntil = performance.now() + 3200; if (!ctlRaf) ctlRaf = requestAnimationFrame(placeControls) }

    // while the entrance is still under way the heading morphs with the scroll, so follow it; once the carousel is pinned the heading
    // only moves in its own timed animation (announced by the 'fp-settle' event), so scrolling no longer triggers any measuring
    // the carousel only reacts to scrolling while it is near the screen
    let near = true
    const nearObs = new IntersectionObserver(([e]) => { near = e.isIntersecting; if (near) { read(); kick() } }, { rootMargin: '100% 0px' })
    nearObs.observe(track.current)

    const onScroll = () => {
      if (!near) return
      if (s.enterT < 1) chaseControls()
      read()
      kick()
      // the expanded card belongs to the pinned wheel: close it once the carousel is no longer pinned on screen
      const tr = track.current.getBoundingClientRect()
      if (tr.top > 0 || tr.bottom < window.innerHeight) setOpen(false)
      clearTimeout(s.idle)
      // settle on a whole project while pinned: when scrolling stops, the project that has most of its tile on the highlight
      // line (the nearest one) is brought exactly onto it, so the wheel never rests between two projects
      s.idle = setTimeout(() => {
        if (s.dragging || s.enterT < 1 || reduced) return
        const frac = Math.abs(s.target - Math.round(s.target))
        if (s.target > 0.001 && s.target < N - 1 - 0.001 && frac > 0.01) scrollToSlot(Math.round(s.target))
      }, 70)
    }

    // Snap early: Lenis glides for most of a second after the last wheel notch, so waiting for the scroll to stop makes the snap feel
    // slow. Instead, a moment after the last wheel event, work out which project the glide is heading for and go straight there.
    const onWheel = () => {
      if (!near) return
      clearTimeout(s.wheelIdle)
      s.wheelIdle = setTimeout(() => {
        if (s.dragging || s.enterT < 1 || reduced) return
        const tr = track.current.getBoundingClientRect()
        if (tr.top > 0 || tr.bottom < window.innerHeight) return // only while the carousel is pinned
        const vh = window.innerHeight
        const topAtTarget = tr.top - (getScrollTarget() - window.scrollY) // where the track's top will be when the glide ends
        const t = clamp((-topAtTarget - START * vh) / (SLOT * vh), 0, N - 1)
        const k = Math.round(t)
        if (t > 0.001 && t < N - 1 - 0.001) scrollToSlot(k)
      }, 70)
    }
    window.addEventListener('wheel', onWheel, { passive: true })

    let startY = 0
    let downCard = -1 // the card the mouse went down on (the click itself is retargeted to this element by pointer capture)
    const onDown = (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return
      // presses on a button, link or the expanded card are theirs: capturing the pointer here would swallow their clicks
      if (e.target.closest?.('button, a, [role=dialog]')) return
      s.dragging = true
      s.moved = 0
      startY = e.clientY
      const hit = e.target.closest?.('[data-card]')
      downCard = hit ? Number(hit.dataset.card) : -1
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
    const onUp = (e) => {
      if (!s.dragging) return
      s.dragging = false
      el.style.cursor = ''
      // pressed and released on a card without dragging = a click: bring it to the front and open its details
      if (e.type === 'pointerup' && downCard >= 0 && s.moved <= 6) api.current.open(downCard)
      downCard = -1
      onScroll()
    }

    api.current = {
      redraw: () => { render() },
      go: (n) => scrollToSlot(Math.round(s.target) + n),
      // only the highlighted tile opens its details; clicking any other tile just brings it to the highlight line
      open: (k) => {
        if (k !== Math.round(s.target)) { scrollToSlot(k); return }
        setOpen(true)
      },
    }

    measure()
    s.cur = s.target
    s.enter = s.enterT
    render()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', measure)
    window.addEventListener('resize', chaseControls)
    window.addEventListener('fp-settle', chaseControls)
    chaseControls()
    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onUp)
    return () => {
      ro.disconnect()
      cancelAnimationFrame(s.raf)
      clearTimeout(s.idle)
      clearTimeout(s.wheelIdle)
      cancelAnimationFrame(ctlRaf)
      nearObs.disconnect()
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', measure)
      window.removeEventListener('resize', chaseControls)
      window.removeEventListener('fp-settle', chaseControls)
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onUp)
    }
  }, [])

  useEffect(() => {
    openRef.current = open
    api.current.redraw?.()
  }, [open])

  // aim the tile at the cursor while the viewer is open
  useEffect(() => {
    if (!open || reduceMotion) return
    const move = (e) => {
      const r = tileRef.current?.getBoundingClientRect()
      if (!r) return
      aimX.set(Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2))))
      aimY.set(Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (window.innerHeight / 2))))
    }
    window.addEventListener('pointermove', move)
    return () => { window.removeEventListener('pointermove', move); aimX.set(0); aimY.set(0) }
  }, [open, reduceMotion, aimX, aimY])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    closeRef.current?.focus({ preventScroll: true })
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const item = ITEMS[active]
  const d = item.details

  // the highlighted (front) card's size: the viewer's image tile has exactly this size
  const tile = geo ? { width: geo.cardW * (1 + POP), height: geo.cardH * (1 + POP) } : null

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
                data-card={k}
                // mouse clicks are handled on pointer-up (see onUp); this covers touch and keyboard
                onClick={(e) => { if (e.detail === 0 || window.matchMedia('(pointer: coarse)').matches) api.current.open(k) }}
                role="button"
                tabIndex={0}
                aria-label={`${p.name} – open project details`}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); api.current.open(k) } }}
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
            <div key={active} className={`transition-opacity duration-300 ${open ? 'opacity-0' : ''}`}>
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

          {/* progress: counter + bar, bottom right */}
          <div className="pointer-events-none absolute bottom-6 right-4 z-[200] flex items-center gap-4 text-white sm:right-6 lg:right-[3%]">
            <span ref={hint} className="text-[10px] uppercase tracking-[0.25em] text-white/50" style={{ opacity: 0 }}>
              Scroll to explore
            </span>
            <span className="text-sm font-semibold tabular-nums">
              <span ref={counter}>01</span>
              <span className="text-white/40"> / {pad(N)}</span>
            </span>
            <span className="relative block h-px w-28 bg-white/20">
              <span ref={bar} className="absolute inset-0 origin-left" style={{ background: ACCENT, transform: 'scaleX(0)' }} />
            </span>
          </div>


          {/* project viewer – rendered in <body> so it is centred on the screen and can dim the whole page. The navbar (z-50) stays
              above the dim layer. */}
          {typeof document !== 'undefined' &&
            createPortal(
              <AnimatePresence>
                {open && tile && (
                  <>
                    <motion.div
                      key="dim"
                      aria-hidden="true"
                      className="fixed inset-0 z-[45] bg-black/70"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.45 }}
                      onClick={() => setOpen(false)}
                    />
                    <motion.div
                      key="viewer"
                      role="dialog"
                      aria-label={`${item.name} – project details`}
                      className="pointer-events-none fixed inset-0 z-[46] grid place-items-center overflow-y-auto p-6"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      <div className="pointer-events-auto flex max-w-full flex-col items-center gap-6 md:flex-row" style={{ perspective: 1400 }}>
                        {/* tile 1: the project image, exactly as big as the highlighted card. It lifts toward you out of the page
                            with a 3D tilt and a small spring as it settles flat; afterwards it leans toward the cursor. */}
                        <motion.div
                          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 46, scale: 0.88, rotateX: 22, rotateY: -16, z: -160 }}
                          animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0, rotateY: 0, z: 0 }}
                          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.94, rotateX: 10, rotateY: 8, z: -80, transition: { duration: 0.35, ease: [0.4, 0, 0.6, 1] } }}
                          transition={reduceMotion ? { duration: 0.3 } : { type: 'spring', stiffness: 85, damping: 14, mass: 0.9, opacity: { duration: 0.45 } }}
                          className="shrink-0"
                          style={{ transformStyle: 'preserve-3d', maxWidth: '100%' }}
                        >
                          <motion.div
                            ref={tileRef}
                            className="relative overflow-hidden rounded-[1.4rem] bg-neutral-900 shadow-[0_50px_110px_-30px_rgba(0,0,0,.95)] ring-1 ring-white/15"
                            style={{ width: tile.width, height: tile.height, maxWidth: '100%', rotateX: reduceMotion ? 0 : leanX, rotateY: reduceMotion ? 0 : leanY }}
                          >
                            <motion.img
                              key={item.src}
                              src={item.src}
                              alt={item.name}
                              draggable={false}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.4 }}
                              className="absolute inset-0 h-full w-full select-none object-cover"
                            />
                            {!reduceMotion && <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: sheen }} />}
                          </motion.div>
                        </motion.div>

                        {/* tile 2: the details, in glass */}
                        <motion.div
                          initial={{ opacity: 0, x: 36 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 24 }}
                          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
                          className="relative w-[min(31rem,calc(100vw-3rem))] overflow-hidden rounded-[1.75rem] border border-white/25 bg-gradient-to-br from-white/[0.17] to-white/[0.05] text-left text-white shadow-[0_30px_90px_-24px_rgba(0,0,0,.75),inset_0_1px_0_rgba(255,255,255,.35)] backdrop-blur-2xl backdrop-saturate-150"
                        >
                          {/* soft light bleeding in from the corner – the "glass" sheen */}
                          <div
                            aria-hidden="true"
                            className="pointer-events-none absolute -left-16 -top-20 h-56 w-56 rounded-full"
                            style={{ background: 'radial-gradient(closest-side, rgba(255,255,255,.28), transparent)', filter: 'blur(6px)' }}
                          />
                          <div data-lenis-prevent className="relative max-h-[80svh] overflow-y-auto overscroll-contain p-6 sm:p-8">
                            <div className="flex items-start justify-between gap-4">
                              <p className="text-xs font-medium uppercase tracking-[0.22em] text-white/60">
                                {pad(active + 1)} / {pad(N)} · {item.role.split('/')[0].trim()}
                              </p>
                              <button
                                ref={closeRef}
                                type="button"
                                onClick={() => setOpen(false)}
                                aria-label="Close project details"
                                className="-mr-1 -mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/25 bg-white/10 text-white/85 transition hover:bg-white hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>

                            <div key={active} className="mt-3">
                              <h3
                                className="font-semibold"
                                style={{ fontSize: 'clamp(1.6rem, 2.6vw, 2.4rem)', lineHeight: 1.04, letterSpacing: '-0.03em', animation: 'labelIn .55s cubic-bezier(.22,1,.36,1) both' }}
                              >
                                {item.name}
                              </h3>
                              <p className="mt-1 text-sm text-white/65" style={{ animation: 'labelIn .55s cubic-bezier(.22,1,.36,1) .05s both' }}>{item.role}</p>
                              <p className="mt-4 text-[15px] leading-relaxed text-white/80" style={{ animation: 'labelIn .55s cubic-bezier(.22,1,.36,1) .1s both' }}>{d.about}</p>

                              <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 border-y border-white/15 py-4" style={{ animation: 'labelIn .55s cubic-bezier(.22,1,.36,1) .15s both' }}>
                                {[['Location', d.location], ['Area', d.area], ['Year', d.year], ['Duration', d.duration]].map(([k, v]) => (
                                  <div key={k}>
                                    <dt className="text-[10px] uppercase tracking-[0.2em] text-white/55">{k}</dt>
                                    <dd className="mt-1 text-sm font-medium">{v}</dd>
                                  </div>
                                ))}
                              </dl>

                              <div className="mt-4 flex flex-wrap gap-2" style={{ animation: 'labelIn .55s cubic-bezier(.22,1,.36,1) .2s both' }}>
                                {d.services.map((sv) => (
                                  <span key={sv} className="rounded-full border border-white/20 bg-white/[0.07] px-3 py-1 text-xs text-white/85">{sv}</span>
                                ))}
                              </div>
                            </div>

                            <div className="mt-7 flex items-center gap-3">
                              <a
                                href="#contact"
                                onClick={(e) => { e.preventDefault(); setOpen(false); scrollToTarget(document.querySelector('#contact') ? '#contact' : '#more') }} // phones have no contact section yet
                                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-white/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                              >
                                Start a similar project
                                <ArrowUpRight className="h-4 w-4" />
                              </a>
                              {[[-1, ChevronUp, 'Previous project'], [1, ChevronDown, 'Next project']].map(([n, Icon, label]) => (
                                <button
                                  key={label}
                                  type="button"
                                  aria-label={label}
                                  onClick={() => api.current.go(n)}
                                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/30 bg-white/10 text-white transition hover:bg-white hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                                >
                                  <Icon className="h-5 w-5" />
                                </button>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>,
              document.body,
            )}

          {/* controls: side by side, on the right, just below the "Award Winning Work" heading */}
          <div ref={ctlRef} className={`absolute right-5 top-[33svh] z-[200] flex flex-row gap-2 transition-opacity duration-300 sm:right-10 lg:right-[7%] ${open ? 'pointer-events-none opacity-0' : ''}`}>
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
