import { Component as ServiceStack } from '@/components/ui/connoisseur-stack-interactor'

const IMG = '/assets/manifesto-background-images/'

/* The services the studio offers. The stack interactor has three artwork masks (clipId); the services reuse
   them in turn, so the picture on the right changes shape as you move down the list.
   Photos are placeholders from the project's own image folder – swap `image` for real project shots. */
const CLIPS = ['clip-original', 'clip-hexagons', 'clip-pixels']
const SERVICES = [
  { name: 'Residential Design', image: 'bgimage7.jpg', desc: 'Complete design for homes, apartments and villas, from first layout to final finishes.' },
  { name: 'Commercial Design', image: 'bgimage8.webp', desc: 'Offices, retail and showrooms designed around your brand and how people use the space.' },
  { name: 'Space Planning', image: 'bgimage9.jpg', desc: 'Smarter floor plans for better flow, storage and light.' },
  { name: '3D Visualisation', image: 'bgimage10.jpg', desc: 'Realistic renders and walkthroughs, so you see the result before anything is built.' },
  { name: 'Custom Joinery', image: 'bgimage11.jpeg', desc: 'Wardrobes, kitchens and bespoke furniture made to fit your room exactly.' },
  { name: 'Turnkey Execution', image: 'bgimage12.jpeg', desc: 'We manage the contractors, schedule and budget, and hand you the finished space.' },
].map((s, i) => ({
  num: String(i + 1).padStart(2, '0'),
  name: s.name,
  clipId: CLIPS[i % CLIPS.length],
  image: IMG + s.image,
  desc: s.desc,
}))

export default function Services() {
  return (
    // the "dark" class switches the component to its dark look, whatever the visitor's system theme is
    <section id="services" className="dark relative bg-[#050505]">
      <div className="px-8 pt-20 md:px-24 md:pt-28">
        <p className="flex items-center gap-4 text-xs font-medium uppercase tracking-[0.25em] text-orange-500">
          <span className="h-px w-10 bg-orange-500" />
          What we do
        </p>
      </div>
      <ServiceStack items={SERVICES} className="min-h-0 py-16 md:py-20" />
    </section>
  )
}
