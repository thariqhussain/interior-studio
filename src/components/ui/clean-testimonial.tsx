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
}

/* Placeholder reviews and Unsplash stock portraits – replace with the studio's real clients (and real photos). */
const photo = (id: string) => `https://images.unsplash.com/photo-${id}?w=160&h=160&fit=crop&crop=faces&q=80`
const DEFAULT_ITEMS: TestimonialItem[] = [
  {
    quote: "They turned our flat into a home we never want to leave. Every detail felt considered.",
    author: "Maya Patel",
    role: "Homeowner",
    company: "Bengaluru",
    avatar: photo("1494790108377-be9c29b29330"),
  },
  {
    quote: "On budget, on time, and better than the renders. The lighting alone is worth it.",
    author: "Daniel Brooks",
    role: "Villa client",
    company: "Kochi",
    avatar: photo("1507003211169-0a1dd7228f2d"),
  },
  {
    quote: "Our office finally feels like our brand, and they managed every contractor so we didn't have to.",
    author: "Elena Frost",
    role: "Founder",
    company: "Atelier Nord",
    avatar: photo("1438761681033-6461ffad8d80"),
  },
]

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
    },
    [mouseX, mouseY],
  )

  const handleNext = () => setActiveIndex((prev) => (prev + 1) % items.length)
  const current = items[activeIndex]

  return (
    <div
      ref={containerRef}
      className={`relative mx-auto w-full max-w-3xl px-8 py-24 ${className}`}
      style={{ cursor: "none" }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleNext}
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
            Next
          </motion.span>
        </motion.div>
      </motion.div>

      {/* floating index indicator */}
      <motion.div className="absolute right-8 top-8 flex items-baseline gap-1 font-mono text-xs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
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

      {/* stacked avatar previews */}
      <motion.div className="absolute left-8 top-8 flex -space-x-2" initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} transition={{ delay: 0.6 }}>
        {items.map((t, i) => (
          <motion.div
            key={i}
            className={`h-6 w-6 overflow-hidden rounded-full border-2 border-background transition-all duration-300 ${
              i === activeIndex ? "ring-1 ring-accent ring-offset-1 ring-offset-background" : "opacity-50 grayscale"
            }`}
            whileHover={{ scale: 1.1, opacity: 1 }}
          >
            <img src={t.avatar} alt={t.author} loading="lazy" className="h-full w-full object-cover" />
          </motion.div>
        ))}
      </motion.div>

      {/* main content */}
      <div className="relative">
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
            <div className="relative h-12 w-12">
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
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Click anywhere</span>
      </motion.div>
    </div>
  )
}

export default Testimonial
