import { Monitor } from 'lucide-react'
import { DISPLAY_FONT } from '@/lib/projects'

/* Shown instead of the site on phones and tablets while the mobile / tablet layouts are not ready.
   (See DESKTOP_ONLY in App.jsx to switch the block off.) */
export default function ConstructionPage() {
  return (
    <main
      className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden bg-[#0b0b0c] px-8 py-12 text-center text-white"
      style={{ fontFamily: DISPLAY_FONT }}
    >
      {/* soft warm glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(60% 45% at 50% 38%, rgba(200,67,31,.28), transparent 70%)' }}
      />

      <p className="relative text-sm font-semibold tracking-[-0.01em]">
        ELENA<span className="opacity-60">VOSS</span>
      </p>

      <div className="relative mt-14 grid size-20 place-items-center rounded-full border border-white/15 bg-white/[0.05] backdrop-blur-md">
        <Monitor aria-hidden="true" className="size-9 text-white" strokeWidth={1.5} />
      </div>

      <p className="relative mt-10 text-xs font-medium uppercase tracking-[0.28em] text-orange-400">Under construction</p>
      <h1 className="relative mt-4 max-w-md text-4xl font-semibold leading-[1.05] tracking-[-0.035em]">
        Our mobile site is on its way.
      </h1>
      <p className="relative mt-5 max-w-sm text-base leading-relaxed text-white/60">
        For the best experience, please open this website on a desktop or laptop computer.
      </p>

      <p className="relative mt-12 text-[11px] uppercase tracking-[0.25em] text-white/35">Thank you for your patience</p>
    </main>
  )
}
