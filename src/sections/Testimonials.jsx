import { motion } from 'framer-motion'
import { TestimonialWall } from '@/components/ui/testimonial-wall'

/* Placeholder client reviews – replace with real ones (and add `avatar: '/path/to/photo.jpg'` for a photo avatar). */
const TESTIMONIALS = [
  { name: 'Maya Patel', handle: '@maya', flag: '🇮🇳', country: 'India', text: 'They turned our flat into a home we never want to leave.' },
  { name: 'Noah Smith', handle: '@noah', flag: '🇺🇸', country: 'USA', text: 'On budget, on time, and better than the renders.' },
  { name: 'Mateo Rossi', handle: '@mateo', flag: '🇮🇹', country: 'Italy', text: 'Every detail felt considered. The lighting alone is worth it.' },
  { name: 'Lucas Stone', handle: '@luc', flag: '🇫🇷', country: 'France', text: 'Very easy to work with, and a beautiful result.' },
  { name: 'Haruto Sato', handle: '@haru', flag: '🇯🇵', country: 'Japan', text: 'Impressive attention to materials and finishes.' },
  { name: 'Emma Müller', handle: '@emma', flag: '🇩🇪', country: 'Germany', text: 'Our office finally feels like our brand.' },
  { name: 'Sofia Alvarez', handle: '@sofia', flag: '🇪🇸', country: 'Spain', text: 'The 3D walkthrough made every decision effortless.' },
  { name: 'Ana Costa', handle: '@ana', flag: '🇧🇷', country: 'Brazil', text: 'Great communication from the first call to handover.' },
  { name: 'Omar Khalid', handle: '@omar', flag: '🇦🇪', country: 'UAE', text: 'Custom joinery that fits perfectly. Stunning.' },
  { name: 'Chloe Evans', handle: '@chloe', flag: '🇬🇧', country: 'UK', text: 'Calm, organised and genuinely creative.' },
  { name: "Liam O'Brien", handle: '@liam', flag: '🇮🇪', country: 'Ireland', text: "They managed every contractor, so we didn't have to." },
  { name: 'Priya Nair', handle: '@priya', flag: '🇨🇦', country: 'Canada', text: 'Our renovation went smoothly from start to finish.' },
]

export default function Testimonials() {
  return (
    <section id="testimonials" className="relative overflow-hidden border-b border-white/10 bg-black py-20 text-white sm:py-28">
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 mx-auto max-w-3xl px-6 text-center"
      >
        <p className="flex items-center justify-center gap-4 text-xs font-medium uppercase tracking-[0.25em] text-white/60">
          <span className="h-px w-10 bg-white/30" />
          Testimonials
          <span className="h-px w-10 bg-white/30" />
        </p>
        <h2 className="mt-6 text-4xl font-semibold leading-[1.05] tracking-[-0.04em] sm:text-6xl">
          Loved by the people
          <br />
          who live in our spaces.
        </h2>
      </motion.div>

      <TestimonialWall items={TESTIMONIALS} className="-mt-6 sm:-mt-10" />
    </section>
  )
}
