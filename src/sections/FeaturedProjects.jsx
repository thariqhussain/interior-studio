import { useRef, useState } from 'react'
import { AnimatePresence, motion, easeOut, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { ArrowUpRight, Star } from 'lucide-react'
import { ACCENT, DISPLAY_FONT, PROJECTS, ProjectArt, SERIF_FONT } from '@/lib/projects'

/* =====================================================================
   Featured Projects – "Award Winning Work"
   • vibrant accent banner
   • split screen: interactive project list (left) + live preview card (right)
   ===================================================================== */

const glass = {
  background: 'rgba(255,255,255,0.14)',
  border: '1px solid rgba(255,255,255,0.25)',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
}

const WORDS = ['Award', 'Winning', 'Work']

function Banner() {
  return (
    <div className="relative overflow-hidden px-5 py-14 sm:px-10 sm:py-20 lg:px-[7%] lg:py-24" style={{ background: ACCENT, color: '#0b0b0c', fontFamily: DISPLAY_FONT }}>
      <div className="flex items-start justify-between gap-6">
        <motion.h2
          className="font-extrabold"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          transition={{ staggerChildren: 0.1 }}
          style={{ fontSize: 'clamp(2.8rem, 10.5vw, 10rem)', lineHeight: 0.9, letterSpacing: '-0.045em' }}
        >
          {WORDS.map((w) => (
            <span key={w} className="block overflow-hidden pb-[0.06em]">
              <motion.span
                className="block"
                variants={{ hidden: { y: '110%' }, show: { y: 0 } }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                style={w === 'Work' ? { fontFamily: SERIF_FONT, fontStyle: 'italic', fontWeight: 400, letterSpacing: '-0.02em' } : undefined}
              >
                {w}
              </motion.span>
            </span>
          ))}
        </motion.h2>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
          className="hidden shrink-0 place-items-center rounded-full sm:grid"
          style={{ width: 'clamp(90px, 12vw, 170px)', height: 'clamp(90px, 12vw, 170px)', background: '#0b0b0c', color: ACCENT }}
        >
          <Star className="h-1/2 w-1/2" fill="currentColor" strokeWidth={0} />
        </motion.div>
      </div>
      <p className="mt-6 max-w-md text-sm font-medium sm:text-base" style={{ opacity: 0.8 }}>
        Selected collaborations with studios and brands that care how things look, move and feel.
      </p>
    </div>
  )
}

function Preview({ project }) {
  // the project's own artwork leads a small bento grid of related imagery
  const others = PROJECTS.filter((p) => p.id !== project.id)
  return (
    <motion.div
      key={project.id}
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.98 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-2.5 sm:gap-3"
    >
      <div className="relative col-span-2 row-span-2 overflow-hidden rounded-2xl">
        <ProjectArt variant={project.variant} />
        <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-3 rounded-2xl p-3 text-white sm:inset-x-4 sm:bottom-4 sm:p-4" style={glass}>
          <div>
            <div className="text-lg font-bold sm:text-2xl" style={{ letterSpacing: '-0.02em' }}>{project.name}</div>
            <div className="text-xs opacity-80 sm:text-sm">{project.role}</div>
          </div>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-black" style={{ background: ACCENT }}>
            <ArrowUpRight className="h-5 w-5" />
          </span>
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl"><ProjectArt variant={others[0].variant} hue={30} /></div>
      <div className="overflow-hidden rounded-2xl"><ProjectArt variant={others[1].variant} hue={-30} /></div>
      <div className="overflow-hidden rounded-2xl"><ProjectArt variant={others[2].variant} hue={90} /></div>
      <div className="flex flex-col justify-between rounded-2xl p-3 text-white sm:p-4" style={glass}>
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] opacity-70 sm:text-xs">{project.year}</span>
        <span className="text-xs leading-snug opacity-90 sm:text-sm">{project.blurb}</span>
      </div>
      <div className="grid place-items-center overflow-hidden rounded-2xl text-black" style={{ background: ACCENT }}>
        <span className="text-3xl font-extrabold sm:text-5xl" style={{ letterSpacing: '-0.05em' }}>
          0{PROJECTS.findIndex((p) => p.id === project.id) + 1}
        </span>
      </div>
    </motion.div>
  )
}

export default function FeaturedProjects() {
  const [active, setActive] = useState(0)
  const project = PROJECTS[active]

  // scroll-triggered card: starts as a rounded-3xl card and expands to full screen as it scrolls into view
  const ref = useRef(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'start start'] })
  const scale = useTransform(scrollYProgress, [0, 1], reduced ? [1, 1] : [0.86, 1], { ease: easeOut })
  const radius = useTransform(scrollYProgress, [0, 1], reduced ? [0, 0] : [24, 0], { ease: easeOut }) // 24px = rounded-3xl

  return (
    <section id="projects" ref={ref} style={{ background: '#0b0b0c', color: '#fff', fontFamily: DISPLAY_FONT }}>
      <motion.div
        style={{ scale, borderRadius: radius, transformOrigin: '50% 0%', background: '#0b0b0c' }}
        className="overflow-hidden will-change-transform"
      >
      <Banner />

      <div className="grid gap-10 px-5 py-14 sm:px-10 sm:py-20 lg:grid-cols-2 lg:gap-16 lg:px-[7%] lg:py-24">
        {/* project list */}
        <ul className="flex flex-col" onMouseLeave={() => undefined}>
          {PROJECTS.map((p, i) => {
            const on = i === active
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onClick={() => setActive(i)}
                  aria-pressed={on}
                  className="group relative flex w-full items-center gap-4 border-t py-6 text-left transition-colors sm:gap-6 sm:py-8"
                  style={{ borderColor: 'rgba(255,255,255,.14)' }}
                >
                  {/* highlight bar */}
                  <motion.span
                    aria-hidden="true"
                    className="absolute inset-0 -z-0 rounded-xl"
                    initial={false}
                    animate={{ opacity: on ? 1 : 0, x: on ? 0 : -12 }}
                    transition={{ duration: 0.3 }}
                    style={{ background: 'linear-gradient(90deg, rgba(198,255,61,.14), transparent 80%)' }}
                  />
                  <span className="relative text-sm font-semibold tabular-nums sm:text-base" style={{ color: on ? ACCENT : 'rgba(255,255,255,.4)' }}>
                    0{i + 1}
                  </span>
                  <span className="relative flex-1">
                    <span
                      className="block font-extrabold transition-all duration-300"
                      style={{
                        fontSize: 'clamp(1.8rem, 4.2vw, 3.4rem)',
                        lineHeight: 1,
                        letterSpacing: '-0.035em',
                        color: on ? '#fff' : 'rgba(255,255,255,.38)',
                        transform: on ? 'translateX(10px)' : 'none',
                      }}
                    >
                      {p.name}
                    </span>
                    <span className="mt-2 block text-xs sm:text-sm" style={{ color: on ? 'rgba(255,255,255,.75)' : 'rgba(255,255,255,.3)' }}>
                      {p.role}
                    </span>
                  </span>
                  <ArrowUpRight
                    className="relative h-6 w-6 shrink-0 transition-all duration-300 sm:h-7 sm:w-7"
                    style={{ color: ACCENT, opacity: on ? 1 : 0, transform: on ? 'none' : 'translate(-8px, 8px)' }}
                  />
                </button>
              </li>
            )
          })}
          <li className="border-t" style={{ borderColor: 'rgba(255,255,255,.14)' }} aria-hidden="true" />
        </ul>

        {/* preview */}
        <div className="lg:sticky lg:top-8 lg:self-start">
          <div className="relative w-full overflow-hidden rounded-3xl p-2.5 sm:p-3" style={{ aspectRatio: '1 / 1', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.12)' }}>
            <div className="relative h-full w-full">
              <AnimatePresence mode="wait">
                <Preview project={project} />
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
      </motion.div>
    </section>
  )
}
