import { Suspense, lazy, useEffect, useState } from 'react'
import ConstructionPage from './components/ConstructionPage.jsx'

/* The whole site lives in Site.jsx. It is loaded lazily, so phones and tablets that get the construction page below
   never download or start any of it (videos, smooth scroll, 3D, …). */
const Site = lazy(() => import('./Site.jsx'))

// Set to false to open the site on every device again.
const DESKTOP_ONLY = true
// "phone or tablet": a narrow window, or a touch screen up to a large tablet (iPad Pro landscape is 1366px wide)
const SMALL_SCREEN = '(max-width: 1099px), (pointer: coarse) and (max-width: 1399px)'

// start fetching the site's code immediately (in parallel with React starting up) when this is a desktop – lazy() then finds it already loaded
if (typeof window !== 'undefined' && DESKTOP_ONLY && !window.matchMedia(SMALL_SCREEN).matches) import('./Site.jsx')

function useSmallScreen() {
  const [small, setSmall] = useState(() => (typeof window !== 'undefined' ? window.matchMedia(SMALL_SCREEN).matches : false))
  useEffect(() => {
    const mq = window.matchMedia(SMALL_SCREEN)
    const update = () => setSmall(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return small
}

export default function App() {
  const small = useSmallScreen()
  if (DESKTOP_ONLY && small) return <ConstructionPage />
  return (
    <Suspense fallback={null}>
      <Site />
    </Suspense>
  )
}
