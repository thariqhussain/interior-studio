import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useAnimationFrame } from 'framer-motion'

/* =====================================================================
   Curved marquee (Apple-style)
   A row of large image cards drifts sideways across the screen. The row is bent like the inside of
   a curved panoramic screen:
   • every card is cut into thin vertical slices whose height is scaled from their distance to the
     centre of the viewport (shortest in the middle, taller toward the edges) – the picture itself bends
   • each card is then clipped by ONE smooth polygon that follows that curve and carries constant-radius
     rounded corners – so the top / bottom edges are smooth lines, never stair-steps
   • the row fades out horizontally with a mask; a soft coloured glow sits behind the outer cards
   Framer Motion supplies the frame loop and the entrance; transforms are written straight to the
   DOM (GPU-friendly), so nothing re-renders while it runs.
   ===================================================================== */

const SLICES = 72 // vertical slices per card (more = smoother image bend)
const BEND = 0.55 // extra height at the screen edge: height = 1 + BEND·u²  (u = 0 centre … 1 edge)
const GAP = 24
const COPIES = 3 // images are repeated so the loop always covers the screen
const RADIUS = 26 // card corner radius (px, constant along the bend)
const EDGE = 0.95 // |u| beyond which the bend stops growing (that part is already faded out)

const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
const EASE = [0.22, 1, 0.36, 1]
const MASK = 'linear-gradient(90deg, transparent 0%, #000 22%, #000 78%, transparent 100%)'

/* Details panel for the photo that is currently at the centre of the row. */
function Details({ item, index, total }) {
  return (
    <motion.div
      key={index}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="mx-auto max-w-2xl px-6 text-center"
    >
      <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-medium uppercase tracking-[0.25em] text-white/60">
        <span className="tabular-nums text-white">{String(index + 1).padStart(2, '0')}</span>
        <span className="text-white/30">/ {String(total).padStart(2, '0')}</span>
        <span className="h-3 w-px bg-white/20" />
        <span className="text-white">{item.title}</span>
        <span className="rounded-full border border-white/20 px-3 py-1 text-[10px] tracking-[0.2em] text-white/70">{item.time}</span>
      </div>

      <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">{item.text}</p>

      <ul className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-white/55">
        {item.points.map((p, k) => (
          <li key={p} className="flex items-center gap-2">
            <span className="text-[10px] tabular-nums text-blue-400">{String(k + 1).padStart(2, '0')}</span>
            {p}
          </li>
        ))}
      </ul>

      <div className="mx-auto mt-7 grid max-w-xl grid-cols-1 gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 text-left sm:grid-cols-2">
        <div className="bg-black p-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/45">Your part</p>
          <p className="mt-2 text-sm leading-snug text-white/80">{item.you}</p>
        </div>
        <div className="bg-black p-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-blue-400">You&apos;ll receive</p>
          <p className="mt-2 text-sm leading-snug text-white/80">{item.get}</p>
        </div>
      </div>
    </motion.div>
  )
}

export default function CurvedMarquee({ images, speed = 46, lines, caption, details, glow = '#1d4ed8' }) {
  const [active, setActive] = useState(0)
  const activeRef = useRef(0)
  const paused = useRef(false)
  const wrap = useRef(null)
  const cards = useRef([]) // cards.current[i] = { el, slices: [] }
  const geo = useRef({ W: 1200, tw: 320, th: 200, rowH: 300, L: 1, xs: [0, 320] })
  const offset = useRef(0)
  const visible = useRef(true)
  const reduced = useRef(false)
  const [d, setD] = useState({ tw: 320, th: 200, rowH: 300 })
  const [ratios, setRatios] = useState(() => images.map(() => 1.5))

  // natural aspect ratio of each photo, so the slices can "cover" the card without stretching it
  useEffect(() => {
    let alive = true
    images.forEach((img, i) => {
      const im = new Image()
      im.onload = () => alive && setRatios((r) => { const n = r.slice(); n[i] = im.naturalWidth / im.naturalHeight; return n })
      im.src = img.src
    })
    return () => { alive = false }
  }, [images])

  useEffect(() => {
    reduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const el = wrap.current
    const measure = () => {
      const W = el.clientWidth
      const tw = clamp(W * 0.27, 220, 520)
      const th = tw * 0.62
      const rowH = th * (1 + BEND * EDGE * EDGE)
      // x positions (card-local) the clip polygon is sampled at: every slice + dense near both rounded corners
      const set = new Set()
      for (let k = 0; k <= SLICES; k++) set.add((k * tw) / SLICES)
      for (let k = 0; k <= 10; k++) {
        const o = RADIUS * (1 - Math.cos((Math.PI / 2) * (k / 10)))
        set.add(o)
        set.add(tw - o)
      }
      const xs = [...set].filter((x) => x >= 0 && x <= tw).sort((a, b) => a - b)
      geo.current = { W, tw, th, rowH, L: images.length * (tw + GAP), xs }
      setD({ tw, th, rowH })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    const io = new IntersectionObserver(([e]) => { visible.current = e.isIntersecting }, { rootMargin: '200px' })
    io.observe(el)
    return () => { ro.disconnect(); io.disconnect() }
  }, [images.length])

  useAnimationFrame((_, delta) => {
    if (!visible.current) return
    if (!reduced.current && !paused.current) offset.current += (speed * delta) / 1000
    const { W, tw, th, L, xs } = geo.current
    let best = Infinity
    let bestIdx = activeRef.current
    const sw = tw / SLICES
    const o = ((offset.current % L) + L) % L
    const bend = (screenX) => 1 + BEND * Math.pow(clamp((screenX - W / 2) / (W / 2), -EDGE, EDGE), 2)

    cards.current.forEach((c, i) => {
      if (!c || !c.el) return
      const x = i * (tw + GAP) - o
      if (x > W + tw * 0.3 || x < -tw * 1.3) {
        c.el.style.visibility = 'hidden'
        return
      }
      c.el.style.visibility = 'visible'
      c.el.style.transform = `translate3d(${x}px, 0, 0)`

      // the card nearest the centre is the "current" one: it is fully lit, its neighbours are dimmed a little
      const dist = Math.abs(x + tw / 2 - W / 2)
      if (dist < best) { best = dist; bestIdx = i % images.length }
      c.el.style.opacity = String(0.55 + 0.45 * (1 - Math.min(1, (dist / (W / 2)) * 1.3)))

      // the picture bends…
      for (let j = 0; j < SLICES; j++) {
        const s = c.slices[j]
        if (s) s.style.transform = `scaleY(${bend(x + j * sw + sw / 2)})`
      }

      // …and one smooth, rounded outline follows it
      const top = []
      const bot = []
      for (let k = 0; k < xs.length; k++) {
        const xl = xs[k]
        const h = th * bend(x + xl)
        let corner = 0
        if (xl < RADIUS) corner = RADIUS - Math.sqrt(RADIUS * RADIUS - (RADIUS - xl) * (RADIUS - xl))
        else if (xl > tw - RADIUS) corner = RADIUS - Math.sqrt(RADIUS * RADIUS - (xl - (tw - RADIUS)) * (xl - (tw - RADIUS)))
        top.push(`${xl.toFixed(1)}px ${(th / 2 - h / 2 + corner).toFixed(1)}px`)
        bot.push(`${xl.toFixed(1)}px ${(th / 2 + h / 2 - corner).toFixed(1)}px`)
      }
      c.el.style.clipPath = `polygon(${top.join(',')},${bot.reverse().join(',')})`
    })

    if (details && bestIdx !== activeRef.current) {
      activeRef.current = bestIdx
      setActive(bestIdx)
    }
  })

  const list = useMemo(() => Array.from({ length: images.length * COPIES }, (_, i) => i % images.length), [images.length])
  const sw = d.tw / SLICES

  return (
    <div className="text-center">
      <motion.h2
        initial={{ opacity: 0, y: 36 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 1, ease: EASE }}
        className="mx-auto max-w-4xl px-6 text-5xl font-semibold leading-[1.02] tracking-[-0.045em] text-white sm:text-7xl"
      >
        {lines.map((l) => (
          <span key={l} className="block">{l}</span>
        ))}
      </motion.h2>

      <div
        className="relative mt-6 sm:mt-10"
        onMouseEnter={() => { paused.current = true }}
        onMouseLeave={() => { paused.current = false }}
      >
        {/* soft coloured glow behind the outer cards – radial, so it has no hard edges */}
        {['left', 'right'].map((side) => (
          <div
            key={side}
            aria-hidden="true"
            className="pointer-events-none absolute"
            style={{
              [side]: '-18%',
              top: '-25%',
              width: '52%',
              height: '150%',
              background: `radial-gradient(closest-side, ${glow}8c, ${glow}2e 55%, transparent)`,
              filter: 'blur(28px)',
            }}
          />
        ))}

        <div
          ref={wrap}
          className="relative mx-auto w-full"
          style={{ height: d.rowH, WebkitMaskImage: MASK, maskImage: MASK }}
        >
          {list.map((imgIdx, i) => {
            const img = images[imgIdx]
            // "cover" sizing of the photo inside the card
            const r = ratios[imgIdx]
            const bw = r > d.tw / d.th ? d.th * r : d.tw
            const bh = r > d.tw / d.th ? d.th : d.tw / r
            const ox = (d.tw - bw) / 2
            const oy = (d.th - bh) / 2
            return (
              <div
                key={i}
                ref={(n) => { if (n) (cards.current[i] ||= { el: null, slices: [] }).el = n }}
                className="absolute left-0 will-change-transform"
                style={{ top: (d.rowH - d.th) / 2, width: d.tw, height: d.th, visibility: 'hidden' }}
                role="img"
                aria-label={img.alt}
              >
                {Array.from({ length: SLICES }, (_, j) => (
                  <div
                    key={j}
                    ref={(n) => { if (n) (cards.current[i] ||= { el: null, slices: [] }).slices[j] = n }}
                    className="absolute top-0 will-change-transform"
                    style={{
                      left: j * sw,
                      width: sw + 0.8, // tiny overlap hides hairline seams
                      height: d.th,
                      backgroundImage: `url(${img.src})`,
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: `${bw}px ${bh}px`,
                      backgroundPosition: `${-j * sw + ox}px ${oy}px`,
                    }}
                  />
                ))}
              </div>
            )
          })}
        </div>
      </div>

      {details ? (
        // details of the photo at the centre – the drift pauses while the pointer is over this panel
        <div
          className="mt-8 min-h-[22rem] sm:mt-12 sm:min-h-[19rem]"
          onMouseEnter={() => { paused.current = true }}
          onMouseLeave={() => { paused.current = false }}
        >
          <AnimatePresence mode="wait">
            <Details key={active} item={details[active]} index={active} total={details.length} />
          </AnimatePresence>
          <div className="mt-6 flex justify-center gap-2" aria-hidden="true">
            {details.map((_, k) => (
              <span
                key={k}
                className="h-1 rounded-full transition-all duration-500"
                style={{ width: k === active ? 32 : 12, background: k === active ? '#60a5fa' : 'rgba(255,255,255,.2)' }}
              />
            ))}
          </div>
        </div>
      ) : (
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: EASE, delay: 0.15 }}
          className="mx-auto mt-6 max-w-sm px-6 text-base leading-relaxed text-white/50 sm:mt-10"
        >
          {caption}
        </motion.p>
      )}
    </div>
  )
}
