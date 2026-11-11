import { Monitor } from 'lucide-react'
import { DISPLAY_FONT } from '@/lib/projects'

/* "The rest of the site" on phones: one construction block that stands in for every section after the Hero. */
export default function ConstructionSection() {
  return (
    <section
      id="more"
      className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden bg-[#0b0b0c] px-7 py-16 text-center text-white"
      style={{ fontFamily: DISPLAY_FONT }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(70% 40% at 50% 40%, rgba(200,67,31,.26), transparent 70%)' }}
      />
      <div className="relative grid size-16 place-items-center rounded-full border border-white/15 bg-white/[0.05]">
        <Monitor aria-hidden="true" className="size-7" strokeWidth={1.5} />
      </div>
      <p className="relative mt-8 text-[11px] font-medium uppercase tracking-[0.28em] text-orange-400">Under construction</p>
      <h2 className="relative mt-4 max-w-xs text-3xl font-semibold leading-[1.08] tracking-[-0.035em]">The rest of the site is on its way.</h2>
      <p className="relative mt-4 max-w-xs text-sm leading-relaxed text-white/60">
        For the full experience, please open this website on a desktop or laptop computer.
      </p>
    </section>
  )
}
