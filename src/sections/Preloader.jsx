import { useRef } from 'react'
import { ParallaxComponent } from '@/components/ui/parallax-scrolling'

/* Preloader / opening section: a four-layer parallax scene.
   The section is 220svh tall; the scene is pinned (sticky) for the first 120svh of scroll while its
   layers drift at different speeds. Over the same stretch the Hero (z-index above, overlapping this
   section – see App.jsx) wipes in over it: it starts after IRIS_START (0.6 screens) and finishes at
   1.2 screens, which is exactly when this section's pin ends. */
export default function Preloader() {
  const ref = useRef(null)
  return (
    <section id="preloader" ref={ref} style={{ height: '220svh' }}>
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <ParallaxComponent triggerRef={ref} title="Elena Voss" travel={0.6} />
      </div>
    </section>
  )
}
