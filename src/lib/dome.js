/* Shared geometry of the dome-shaped top edge of the Featured Projects section.
   The section's top corners have an elliptical radius of 50% (width) × DOME_DEPTH_SVH (height), so the whole top edge
   is one half-ellipse: highest in the middle, DOME_DEPTH_SVH lower at the left and right edges.
   The Manifesto's stats follow this same curve while the edge pushes them up. */
// phones: half the bend (the screen is narrow and tall, so the same depth looks far more curved)
export const DOME_DEPTH_SVH = typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches ? 8 : 16

/** u: -1 (left edge) … 0 (middle) … 1 (right edge). Returns how far the edge sits below its highest point, in svh. */
export const domeDrop = (u) => DOME_DEPTH_SVH * (1 - Math.sqrt(Math.max(0, 1 - u * u)))
