import { useEffect } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

let lenisInstance = null

/**
 * Smooth-scroll to a section (CSS selector such as '#faq'), an element, or the top of the page (0).
 * Uses Lenis when it is running, otherwise the browser's own smooth scroll.
 */
export function scrollToTarget(target, options = {}) {
  const el = typeof target === 'string' ? document.querySelector(target) : target
  if (el === null || el === undefined) return
  if (lenisInstance) {
    lenisInstance.scrollTo(el, { duration: 1.6, easing: (t) => 1 - Math.pow(1 - t, 4), ...options })
  } else if (el === 0) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } else {
    el.scrollIntoView({ behavior: 'smooth' })
  }
}

/**
 * Smooth-scroll to an absolute page position (px). Goes through Lenis when it is running – the browser's own smooth scroll
 * would fight it and stop short – otherwise uses the browser's.
 */
export function scrollToY(y, options = {}) {
  if (lenisInstance) lenisInstance.scrollTo(y, { duration: 0.9, easing: (t) => 1 - Math.pow(1 - t, 3), ...options })
  else window.scrollTo({ top: y, behavior: 'smooth' })
}

/** Where the page is heading: Lenis's scroll target (the glide's end point), or the current position when Lenis is not running. */
export function getScrollTarget() {
  return lenisInstance ? lenisInstance.targetScroll : window.scrollY
}

/**
 * Lenis smooth scrolling, wired into GSAP's ticker so ScrollTrigger (Manifesto,
 * Hero pin) and framer-motion's useScroll all follow the same smoothed position.
 * Skipped when the user prefers reduced motion.
 */
export function useSmoothScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true })
    lenisInstance = lenis
    lenis.on('scroll', ScrollTrigger.update)
    const tick = (t) => lenis.raf(t * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)
    return () => {
      gsap.ticker.remove(tick)
      lenis.destroy()
      if (lenisInstance === lenis) lenisInstance = null
    }
  }, [])
}
