import { Suspense, lazy, useEffect, useState } from 'react'

/* Three layouts, each loaded lazily so a device never downloads the others:
   • desktop → Site.jsx (the whole site)
   • phone   → MobileSite.jsx (only the Preloader and the Hero; everything else is one "under construction" block)
   • tablet  → TabletSite.jsx (only the Preloader and the Hero so far; the rest is one "under construction" block) */
const Site = lazy(() => import('./Site.jsx'))
const MobileSite = lazy(() => import('./MobileSite.jsx'))
const TabletSite = lazy(() => import('./TabletSite.jsx'))

// Set to false to open the site on every device again.
const DESKTOP_ONLY = true
// "phone or tablet": a narrow window, or a touch screen up to a large tablet (iPad Pro landscape is 1366px wide)
const SMALL_SCREEN = '(max-width: 1099px), (pointer: coarse) and (max-width: 1399px)'
// "phone": narrower than a tablet
const PHONE = '(max-width: 767px)'

// start fetching the site's code immediately (in parallel with React starting up) when this is a desktop – lazy() then finds it already loaded
if (typeof window !== 'undefined' && DESKTOP_ONLY) {
  if (!window.matchMedia(SMALL_SCREEN).matches) import('./Site.jsx')
  else if (window.matchMedia(PHONE).matches) import('./MobileSite.jsx')
  else import('./TabletSite.jsx')
}

function useMedia(query) {
  const [matches, setMatches] = useState(() => (typeof window !== 'undefined' ? window.matchMedia(query).matches : false))
  useEffect(() => {
    const mq = window.matchMedia(query)
    const update = () => setMatches(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [query])
  return matches
}

export default function App() {
  const small = useMedia(SMALL_SCREEN)
  const phone = useMedia(PHONE)
  return (
    <Suspense fallback={null}>
      {DESKTOP_ONLY && small ? (phone ? <MobileSite /> : <TabletSite />) : <Site />}
    </Suspense>
  )
}
