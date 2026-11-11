"use client"

import type React from "react"
import { useState, useCallback, useRef, useEffect } from "react"
import { motion, useMotionValue, useSpring, useInView, AnimatePresence } from "framer-motion"

export interface TestimonialItem {
  quote: string
  author: string
  role: string
  company: string
  avatar: string
  /** 1–5 stars (default 5). */
  rating?: number
  /** What was designed, e.g. "3-bed apartment". */
  project?: string
}

/* Placeholder reviews and Unsplash stock portraits – replace with the studio's real clients (and real photos). */
const photo = (id: string) => `https://images.unsplash.com/photo-${id}?w=160&h=160&fit=crop&crop=faces&q=80`
const DEFAULT_ITEMS: TestimonialItem[] = [
  {
    quote: "They turned our flat into a home we never want to leave. Every detail felt considered.",
    author: "Maya Patel",
    role: "Homeowner",
    company: "Bengaluru",
    project: "3-bed apartment · Full interiors",
    avatar: photo("1494790108377-be9c29b29330"),
  },
  {
    quote: "On budget, on time, and better than the renders. The lighting alone is worth it.",
    author: "Daniel Brooks",
    role: "Villa client",
    company: "Kochi",
    project: "Sea-facing villa · Turnkey",
    avatar: photo("1507003211169-0a1dd7228f2d"),
  },
  {
    quote: "Our office finally feels like our brand, and they managed every contractor so we didn't have to.",
    author: "Elena Frost",
    role: "Founder",
    company: "Atelier Nord",
    project: "Studio office · Workspace design",
    avatar: photo("1438761681033-6461ffad8d80"),
  },
]

const Stars = ({ n = 5, className = "" }: { n?: number; className?: string }) => (
  <span className={`inline-flex gap-0.5 ${className}`} role="img" aria-label={`${n} out of 5 stars`}>
    {[0, 1, 2, 3, 4].map((i) => (
      <svg key={i} viewBox="0 0 20 20" className={`size-[1.05em] ${i < n ? "fill-[#f5b301]" : "fill-white/15"}`} aria-hidden="true">
        <path d="M10 1.6l2.5 5.5 6 .7-4.5 4.1 1.3 5.9L10 14.8l-5.3 3 1.3-5.9L1.5 7.8l6-.7L10 1.6z" />
      </svg>
    ))}
  </span>
)

function usePreloadImages(images: string[], enabled: boolean) {
  useEffect(() => {
    if (!enabled) return
    images.forEach((src) => {
      const img = new Image()
      img.src = src
    })
  }, [images, enabled])
}

function SplitText({ text }: { text: string }) {
  const words = text.split(" ")
  return (
    <span className="inline">
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.4, delay: i * 0.03, ease: [0.22, 1, 0.36, 1] }}
          className="mr-[0.25em] inline-block"
        >
          {word}
        </motion.span>
      ))}
    </span>
  )
}

export function Testimonial({ items = DEFAULT_ITEMS, className = "" }: { items?: TestimonialItem[]; className?: string }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [side, setSide] = useState<"prev" | "next">("next") // left half of the section = Previous, right half = Next
  const containerRef = useRef<HTMLDivElement>(null)

  const near = useInView(containerRef, { once: true, margin: "400px 0px" })
  usePreloadImages(items.map((t) => t.avatar), near)

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const springConfig = { damping: 25, stiffness: 150 }
  const cursorX = useSpring(mouseX, springConfig)
  const cursorY = useSpring(mouseY, springConfig)

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      mouseX.set(e.clientX - rect.left)
      mouseY.set(e.clientY - rect.top)
      setSide(e.clientX < rect.left + rect.width / 2 ? "prev" : "next")
    },
    [mouseX, mouseY],
  )

  const handleNext = () => setActiveIndex((prev) => (prev + 1) % items.length)
  const handlePrev = () => setActiveIndex((prev) => (prev - 1 + items.length) % items.length)
  const handleClick = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (rect && e.clientX < rect.left + rect.width / 2) handlePrev()
    else handleNext()
  }
  const current = items[activeIndex]
  const average = (items.reduce((a, t) => a + (t.rating ?? 5), 0) / items.length).toFixed(1)

  return (
    <div
      ref={containerRef}
      className={`relative mx-auto w-full max-w-3xl select-none px-8 py-24 ${className}`}
      style={{ cursor: "none" }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* custom magnetic cursor */}
      <motion.div
        className="pointer-events-none absolute z-50 mix-blend-difference"
        style={{ x: cursorX, y: cursorY, translateX: "-50%", translateY: "-50%" }}
      >
        <motion.div
          className="flex items-center justify-center rounded-full bg-foreground"
          animate={{ width: isHovered ? 80 : 0, height: isHovered ? 80 : 0, opacity: isHovered ? 1 : 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 200 }}
        >
          <motion.span
            className="text-xs font-medium uppercase tracking-wider text-background"
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ delay: 0.1 }}
          >
            {side === "prev" ? "Prev" : "Next"}
          </motion.span>
        </motion.div>
      </motion.div>

      {/* review header */}
      <div className="relative mb-10 mt-6 text-left">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-[#d1182b]">Client reviews</p>
        <h2 className="mt-3 text-3xl font-semibold leading-[1.08] tracking-[-0.03em] text-foreground md:text-5xl">What our clients say</h2>
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <Stars n={5} className="text-lg" />
          <span><span className="font-semibold text-foreground">{average}</span> average · {items.length} reviews shown</span>
        </div>
      </div>

      {/* main content */}
      <div className="relative rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.015] p-6 md:p-10">
        <svg aria-hidden="true" viewBox="0 0 48 36" className="absolute -top-5 left-6 h-10 w-12 fill-[#d1182b] md:left-10"><path d="M0 36V19.6C0 8.4 6.3 1.6 18 0v6.6C11.7 8 9 11.6 8.6 16H18v20H0zm27 0V19.6C27 8.4 33.3 1.6 45 0v6.6C38.7 8 36 11.6 35.6 16H45v20H27z" /></svg>
        <motion.div className="absolute right-6 top-6 md:right-10 md:top-8 flex items-baseline gap-1 font-mono text-xs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
        <motion.span
          className="text-2xl font-light text-foreground"
          key={activeIndex}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {String(activeIndex + 1).padStart(2, "0")}
        </motion.span>
        <span className="text-muted-foreground">/</span>
        <span className="text-muted-foreground">{String(items.length).padStart(2, "0")}</span>
      </motion.div>
        <Stars n={current.rating ?? 5} className="mb-5 mt-2 text-xl" />
        <AnimatePresence mode="wait">
          <motion.blockquote
            key={activeIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            className="text-2xl font-light leading-relaxed tracking-tight text-foreground md:text-4xl"
          >
            <SplitText text={current.quote} />
          </motion.blockquote>
        </AnimatePresence>

        {/* author */}
        <motion.div className="relative mt-12" layout>
          <div className="flex items-center gap-4">
            <div className="relative h-12 w-12 shrink-0">
              <motion.div className="absolute -inset-1.5 rounded-full border border-accent/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} />
              {items.map((t, i) => (
                <motion.img
                  loading="lazy"
                  key={t.avatar}
                  src={t.avatar}
                  alt={t.author}
                  className="absolute inset-0 h-12 w-12 rounded-full object-cover grayscale transition-[filter] duration-500 hover:grayscale-0"
                  animate={{ opacity: i === activeIndex ? 1 : 0, zIndex: i === activeIndex ? 1 : 0 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                />
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                className="relative pl-4"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  className="absolute bottom-0 left-0 top-0 w-px bg-accent"
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                  style={{ originY: 0 }}
                />
                <span className="block text-sm font-medium tracking-wide text-foreground">{current.author}</span>
                <span className="mt-0.5 block font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  {current.role} — {current.company}
                </span>
                <span className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400">
                    <svg viewBox="0 0 16 16" className="size-3" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 8.5l3.2 3L13 4.5" /></svg>
                    Verified client
                  </span>
                  {current.project && <span className="text-xs text-muted-foreground">{current.project}</span>}
                </span>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

        {/* progress bar */}
        <div className="relative mt-16 h-px overflow-hidden bg-border">
          <motion.div
            className="absolute inset-y-0 left-0 bg-accent"
            initial={{ width: "0%" }}
            animate={{ width: `${((activeIndex + 1) / items.length) * 100}%` }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>

      <motion.div className="absolute bottom-8 left-8 flex items-center gap-2" initial={{ opacity: 0 }} animate={{ opacity: isHovered ? 0.4 : 0.2 }} transition={{ duration: 0.3 }}>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground"><span className="max-sm:hidden">Click</span><span className="sm:hidden">Tap</span> left for previous · right for next</span>
      </motion.div>
    </div>
  )
}

export default Testimonial
