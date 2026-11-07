import { useRef } from 'react'
import { ParallaxComponent } from '@/components/ui/parallax-scrolling'

/* Preloader / opening section: a four-layer parallax scene.
   The section is 280svh tall; the scene is pinned (sticky) for the first 180svh of scroll while its
   layers drift at different speeds. Over the same stretch the Hero (z-index above, overlapping this
   section – see App.jsx) wipes in over it: it starts after IRIS_START (0.6 screens) and finishes at
   1.8 screens, which is exactly when this section's pin ends (keep in sync with Hero.jsx; travel = 0.6 × 1.5 keeps the layers' drift speed unchanged). */
export default function Preloader() {
  const ref = useRef(null)
  return (
    <section id="preloader" ref={ref} style={{ height: '280svh' }}>
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <ParallaxComponent triggerRef={ref} title="YEAH  IT'S  ME" travel={0.9} />
      </div>
    </section>
  )
}