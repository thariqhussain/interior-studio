import { useEffect, useState } from 'react'
import LanyardBadge from '@/components/ui/lanyard-badge'

// swap in the studio's real details
const EMAIL = 'hello@example.com'
const BOOKING_URL = 'https://cal.com/your-studio' // Cal.com / Calendly link for "Book a call"

// hang the lanyard on the right half on desktop; on mobile it hangs from the top centre, behind the text
function useAnchorX() {
  const [x, setX] = useState(0.5)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const update = () => setX(mq.matches ? 0.75 : 0.5)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return x
}

export default function Contact() {
  const anchorX = useAnchorX()

  return (
    <section id="contact" className="relative overflow-hidden bg-white max-lg:min-h-[100svh]">
      {/* text, left-aligned */}
      <div className="relative z-10 mx-auto max-w-7xl max-lg:pointer-events-none lg:flex lg:min-h-[100svh] lg:items-center">
        <div className="px-6 pb-8 pt-24 text-left sm:px-10 lg:w-1/2 lg:py-24 lg:pl-12 lg:pr-8">
          <p className="mb-5 text-xs font-medium uppercase tracking-[0.25em] text-neutral-500">
            Contact
          </p>

          <h2 className="text-5xl font-semibold leading-[1.05] tracking-tight text-neutral-900 sm:text-6xl lg:text-7xl">
            Let&apos;s design
            <br />
            your space.
          </h2>

          <p className="mt-6 max-w-md text-base leading-relaxed text-neutral-600 sm:text-lg">
            Tell us about your home, office or project. We&apos;ll get back within one working day
            to talk through ideas, timelines and budget.
          </p>

          <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <a
              href={BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="pointer-events-auto inline-flex items-center justify-center rounded-full bg-neutral-900 px-7 py-3.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
            >
              Book a call
            </a>
            <a
              href={`mailto:${EMAIL}`}
              className="pointer-events-auto text-sm font-medium text-neutral-900 underline underline-offset-4 transition-colors hover:text-neutral-600"
            >
              {EMAIL}
            </a>
          </div>

          <p className="mt-12 text-xs uppercase tracking-[0.2em] text-neutral-400">
            Drag the badge · tap to flip
          </p>
        </div>

      </div>

      {/* lanyard layer: covers the whole section on desktop (the bottom screen on mobile),
          lets clicks through to the text, only the card itself is draggable */}
      <div className="pointer-events-none absolute inset-0 z-0 lg:z-20">
        <LanyardBadge
          height="100%"
          anchorX={anchorX}
          flipButton={false}
          title="Let's Build Together"
          subtitle="Interior Studio · Say hello"
          name="Say Hello"
          role="Book a call"
          strapText="let's build together"
          strapLabel="INTERIOR STUDIO"
          ribbonColor={anchorX === 0.75 ? undefined : '#e8dfcc'} // phones: a cream ribbon, the same stock as the card
        />
      </div>
    </section>
  )
}