import { Testimonial } from '@/components/ui/clean-testimonial'

/* Client reviews: one quote at a time – click anywhere to move to the next. The quotes and portraits are placeholders;
   edit DEFAULT_ITEMS in components/ui/clean-testimonial.tsx (or pass an `items` prop here). */
export default function Testimonials() {
  return (
    <section id="testimonials" className="testimonial-theme relative flex min-h-[100svh] items-center justify-center overflow-hidden border-b border-white/10 bg-black text-foreground">
      <Testimonial />
    </section>
  )
}
