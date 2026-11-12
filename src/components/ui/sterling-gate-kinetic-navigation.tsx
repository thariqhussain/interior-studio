"use client"

import type React from "react"
import { useEffect, useRef } from "react"
import gsap from "gsap"
import { CustomEase } from "gsap/CustomEase"
import { scrollToTarget, setScrollLocked } from "@/lib/useSmoothScroll"

gsap.registerPlugin(CustomEase)
CustomEase.create("sg-main", "0.65, 0.01, 0.05, 0.99")

/* Menu entries – `target` is the section each link scrolls to. */
export type NavLink = { label: string; target: string; shape: string }
const LINKS: NavLink[] = [
  { label: "About us", target: "#manifesto", shape: "1" },
  { label: "Our work", target: "#projects", shape: "2" },
  { label: "Services", target: "#services", shape: "3" },
  { label: "Team", target: "#team", shape: "4" },
  { label: "Contact us", target: "#contact", shape: "5" },
]

const SHAPES: Record<string, React.ReactNode> = {
  "1": (
    <svg viewBox="0 0 400 400" fill="none">
      <circle className="shape-element" cx="80" cy="120" r="40" fill="currentColor" />
      <circle className="shape-element" cx="300" cy="80" r="60" stroke="currentColor" strokeWidth="2" />
      <circle className="shape-element" cx="200" cy="300" r="80" fill="currentColor" opacity=".5" />
      <circle className="shape-element" cx="350" cy="280" r="30" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  "2": (
    <svg viewBox="0 0 400 400" fill="none">
      <rect className="shape-element" x="60" y="60" width="120" height="120" stroke="currentColor" strokeWidth="2" />
      <rect className="shape-element" x="220" y="180" width="100" height="100" fill="currentColor" opacity=".5" />
      <rect className="shape-element" x="120" y="260" width="60" height="60" stroke="currentColor" strokeWidth="2" />
      <rect className="shape-element" x="290" y="50" width="50" height="50" fill="currentColor" />
    </svg>
  ),
  "3": (
    <svg viewBox="0 0 400 400" fill="none">
      <path className="shape-element" d="M0 300 Q100 200 200 300 T400 300" stroke="currentColor" strokeWidth="2" />
      <path className="shape-element" d="M0 240 Q100 140 200 240 T400 240" stroke="currentColor" strokeWidth="2" opacity=".6" />
      <path className="shape-element" d="M0 180 Q100 80 200 180 T400 180" stroke="currentColor" strokeWidth="2" opacity=".35" />
      <circle className="shape-element" cx="330" cy="90" r="36" fill="currentColor" opacity=".5" />
    </svg>
  ),
  "4": (
    <svg viewBox="0 0 400 400" fill="none">
      <polygon className="shape-element" points="200,40 340,280 60,280" stroke="currentColor" strokeWidth="2" />
      <polygon className="shape-element" points="300,200 380,340 220,340" fill="currentColor" opacity=".5" />
      <polygon className="shape-element" points="70,120 120,210 20,210" fill="currentColor" />
    </svg>
  ),
  "5": (
    <svg viewBox="0 0 400 400" fill="none">
      <line className="shape-element" x1="40" y1="60" x2="360" y2="60" stroke="currentColor" strokeWidth="2" />
      <line className="shape-element" x1="40" y1="140" x2="300" y2="140" stroke="currentColor" strokeWidth="2" opacity=".6" />
      <line className="shape-element" x1="40" y1="220" x2="360" y2="220" stroke="currentColor" strokeWidth="2" opacity=".4" />
      <circle className="shape-element" cx="320" cy="300" r="50" fill="currentColor" opacity=".5" />
    </svg>
  ),
}

export function Component({ links = LINKS }: { links?: NavLink[] }) {
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el) return
    const q = (s: string) => el.querySelectorAll<HTMLElement>(s)
    const one = (s: string) => el.querySelector<HTMLElement>(s)!

    const menu = one("[data-nav]")
    const overlay = one(".overlay")
    const bgPanels = q(".backdrop-layer")
    const linkItems = q(".nav-link")
    const toggle = one(".nav-close-btn")
    const label = one(".nav-toggle-label")
    const hb1 = one(".hb-1")
    const hb2 = one(".hb-2")
    const items = q(".menu-list-item")
    const shapes = q(".ambient-background-shapes > div")
    let open = false
    let activeShape: Element | null = null

    gsap.set(menu, { display: "none" })
    const hideShapes = () => {
      gsap.set(shapes, { autoAlpha: 0 })
      activeShape = null
    }
    hideShapes()

    const openTl = gsap.timeline({ paused: true, defaults: { ease: "sg-main" } })
    openTl
      .set(menu, { display: "block" })
      .set(bgPanels, { xPercent: 101 })
      .set(linkItems, { yPercent: 140, rotate: 8 })
      .to(hb1, { y: 4, rotate: 45, duration: 0.6 }, 0)
      .to(hb2, { y: -4, rotate: -45, duration: 0.6 }, 0)
      .to(label, { autoAlpha: 0, duration: 0.3 }, 0)
      .fromTo(overlay, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6 }, 0)
      .to(bgPanels, { xPercent: 0, duration: 0.8, stagger: 0.1 }, 0)
      .to(linkItems, { yPercent: 0, rotate: 0, duration: 0.9, stagger: 0.07 }, 0.35)

    const closeTl = gsap.timeline({ paused: true, defaults: { ease: "sg-main" } })
    closeTl
      .to(hb1, { y: 0, rotate: 0, duration: 0.5 }, 0)
      .to(hb2, { y: 0, rotate: 0, duration: 0.5 }, 0)
      .to(label, { autoAlpha: 1, duration: 0.4 }, 0.3)
      .to(linkItems, { yPercent: -120, duration: 0.5, stagger: 0.03 }, 0)
      .to(bgPanels, { xPercent: 101, duration: 0.6, stagger: { each: 0.08, from: "end" } }, 0.1)
      .to(overlay, { autoAlpha: 0, duration: 0.5 }, 0.2)
      .set(menu, { display: "none" })
      .add(hideShapes)

    const setOpen = (next: boolean) => {
      if (next === open) return
      open = next
      toggle.setAttribute("aria-expanded", String(open))
      el.classList.toggle("menu-open", open)
      setScrollLocked(open)
      if (open) { closeTl.pause(0); openTl.invalidate().restart() }
      else { openTl.pause(); closeTl.invalidate().restart() }
    }

    const showShape = (key: string | null) => {
      const next = key ? el.querySelector<HTMLElement>(`.bg-shape-${key}`) : null
      if (next === activeShape) return
      if (activeShape) gsap.to(activeShape, { autoAlpha: 0, duration: 0.3, overwrite: true })
      activeShape = next
      if (!next) return
      gsap.to(next, { autoAlpha: 1, duration: 0.4, overwrite: true })
      gsap.fromTo(next.querySelectorAll(".shape-element"),
        { scale: 0.6, rotate: -20, transformOrigin: "50% 50%" },
        { scale: 1, rotate: 0, duration: 0.9, ease: "sg-main", stagger: 0.05, overwrite: true })
    }

    const onToggle = () => setOpen(!open)
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
    toggle.addEventListener("click", onToggle)
    overlay.addEventListener("click", onToggle)
    window.addEventListener("keydown", onKey)

    const cleanups: Array<() => void> = []
    items.forEach((li) => {
      const a = li.querySelector<HTMLAnchorElement>("a")!
      const canHover = window.matchMedia("(hover: hover)").matches
      const enter = () => { if (canHover) showShape(li.dataset.shape || null) }
      const click = (e: Event) => {
        e.preventDefault()
        const target = a.getAttribute("href")!
        setOpen(false)
        // let the menu start closing, then glide to the section
        window.setTimeout(() => scrollToTarget(target), 350)
      }
      li.addEventListener("mouseenter", enter)
      a.addEventListener("focus", enter)
      a.addEventListener("click", click)
      cleanups.push(() => { li.removeEventListener("mouseenter", enter); a.removeEventListener("focus", enter); a.removeEventListener("click", click) })
    })
    const leave = () => showShape(null)
    one(".menu-list").addEventListener("mouseleave", leave)

    return () => {
      toggle.removeEventListener("click", onToggle)
      overlay.removeEventListener("click", onToggle)
      window.removeEventListener("keydown", onKey)
      one(".menu-list").removeEventListener("mouseleave", leave)
      cleanups.forEach((f) => f())
      openTl.kill(); closeTl.kill()
      if (open) setScrollLocked(false)
    }
  }, [])

  return (
    <div ref={root} className="sg-nav">
      <div className="site-header-wrapper">
        <header className="header">
          <div className="sg-container is--full">
            <nav className="nav-row">
              {/* logo, top left: back to the top of the page */}
              <a
                href="#"
                className="nav-logo"
                aria-label="Interior Design – back to the top"
                onClick={(e) => { e.preventDefault(); scrollToTarget(document.querySelector("#preloader") ?? 0) }}
              >
                <img src="/assets/logo/interior_logo_nav.webp" alt="" width={640} height={541} decoding="async" />
              </a>
              <p className="nav-toggle-label">click me</p>
              <button type="button" className="nav-close-btn" aria-expanded="false" aria-label="Open or close the menu">
                <span className="hb" aria-hidden="true">
                  <i className="hb-line hb-1" />
                  <i className="hb-line hb-2" />
                </span>
              </button>
            </nav>
          </div>
        </header>
      </div>

      <section className="fullscreen-menu-container">
        <div className="nav-overlay-wrapper" data-nav="closed">
          <div className="overlay" />
          <nav className="menu-content" aria-label="Main menu">
            <div className="menu-bg" aria-hidden="true">
              <div className="backdrop-layer first" />
              <div className="backdrop-layer second" />
              <div className="backdrop-layer third" />
              <div className="ambient-background-shapes">
                {Object.entries(SHAPES).map(([k, svg]) => (
                  <div key={k} className={`bg-shape-${k}`}>{svg}</div>
                ))}
              </div>
            </div>
            <div className="menu-content-wrapper">
              <ul className="menu-list">
                {links.map((l) => (
                  <li key={l.label} className="menu-list-item" data-shape={l.shape}>
                    <a href={l.target} className="nav-link">
                      <span className="nav-link-text">{l.label}</span>
                      <span className="nav-link-hover-bg" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        </div>
      </section>
    </div>
  )
}

export default Component
