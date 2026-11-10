import { useEffect, useState } from 'react'
import PillNav from '@/components/ui/pill-nav'
import { scrollToTarget } from '@/lib/useSmoothScroll'

/* Site-wide pill navigation, fixed to the top of the screen.
   • visible from the very first screen (the preloader) and stays on top of every section
   • the pill that matches the section you are in is highlighted as you scroll
   • links smooth-scroll through Lenis (see scrollToTarget)
   Edit ITEMS to change the links. `href` is a section id. */
const ITEMS = [
  { label: 'Work', href: '#projects' },
  { label: 'Process', href: '#process' },
  { label: 'Services', href: '#services' },
  { label: 'Team', href: '#team' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Contact', href: '#contact' },
]

const LOGO_HREF = '#preloader' // top of the page

const LOGO = <span className="text-[13px] font-extrabold tracking-[-0.05em]">EV</span>

// Every link in the nav (items and logo) goes through this, so "#section" links scroll smoothly instead of jumping
function NavLink({ href, onClick, ...rest }) {
  return (
    <a
      href={href}
      {...rest}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented || !href?.startsWith('#')) return
        event.preventDefault()
        scrollToTarget(href === LOGO_HREF ? 0 : href)
      }}
    />
  )
}

export default function SiteNav() {
  const [active, setActive] = useState('')

  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      // the section under the reading line (40% down the screen)
      const line = window.innerHeight * 0.4
      let current = ''
      for (const { href } of ITEMS) {
        const el = document.querySelector(href)
        if (!el) continue
        const rect = el.getBoundingClientRect()
        if (rect.top <= line && rect.bottom > line) current = href
      }
      setActive(current)
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-3 sm:pt-5">
      <PillNav
        className="pointer-events-auto"
        logo={LOGO}
        logoAlt="Elena Voss, back to top"
        logoHref={LOGO_HREF}
        items={ITEMS}
        activeHref={active}
        linkComponent={NavLink}
        itemStyle="pill"
        hoverEffect="fill"
        indicator="dot"
        layout="split"
        surface="glass"
        size="md"
        bounce={0.3}
        stretch={0.5}
        collapse="auto"
        intro
      />
    </div>
  )
}
