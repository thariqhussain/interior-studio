/* A viewport height that does NOT change when a phone's address bar slides in and out.
   window.innerHeight changes during scrolling on phones, which made the scroll maths (carousel snap points, heading hand-off,
   dome tilt) shift under the visitor's finger. This reads the height of a hidden 100svh element (the "small" viewport, always
   the same) and only re-reads it when the screen's WIDTH changes (rotation / window resize). */
let probe = null
let cached = 0
let cachedW = 0

export function stableVH() {
  if (typeof document === 'undefined') return 800
  const w = window.innerWidth
  if (cached && w === cachedW) return cached
  if (!probe) {
    probe = document.createElement('div')
    probe.setAttribute('aria-hidden', 'true')
    probe.style.cssText = 'position:fixed;left:0;top:0;width:0;height:100svh;visibility:hidden;pointer-events:none'
    document.body.appendChild(probe)
  }
  cached = probe.offsetHeight || window.innerHeight
  cachedW = w
  return cached
}
