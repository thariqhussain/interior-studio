import BeforeAfterGallery from '@/components/ui/before-after-gallery'

/* Before / After
   One entry per room. `after` is the finished room; `before` is the room before the work.
   PLACEHOLDERS: the photos are stock images, and no real "before" photos exist yet, so without a `before` the
   slider shows a dulled, desaturated copy of the `after` photo. Add `before: '/assets/…'` per room to use real ones. */
const photo = (id) => `https://images.unsplash.com/photo-${id}?w=1600&q=80&auto=format&fit=crop`

const ROOMS = [
  {
    id: 'entrance',
    name: 'Entrance',
    description: 'A welcoming first impression: console, mirror, lighting and storage that make coming home easy.',
    after: photo('1618219908412-a29a1bb7b86e'),
  },
  {
    id: 'living',
    name: 'Living Room',
    description: 'Layered seating, natural materials and light, planned around how you relax and host.',
    after: photo('1600210491892-03d54c0aaf87'),
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    description: 'Joinery, surfaces and layout designed for cooking, storage and everyday flow.',
    after: photo('1556912172-45b7abe8b7e1'),
  },
  {
    id: 'dining',
    name: 'Dining Area',
    description: 'A dining space with the right table, lighting and proportions for family meals and guests.',
    after: photo('1560185007-cde436f6a4d0'),
  },
  {
    id: 'master-bedroom',
    name: 'Master Bedroom',
    description: 'A calm retreat: bed wall, soft lighting, wardrobes and textures made for rest.',
    after: photo('1616594039964-ae9021a400a0'),
  },
  {
    id: 'guest-bedroom',
    name: 'Guest Bedroom',
    description: 'Light, simple and comfortable, with smart storage so guests feel at home.',
    after: photo('1595526114035-0d45ed16cfbf'),
  },
  {
    id: 'bathroom',
    name: 'Bathroom',
    description: 'Tiles, fittings and vanity detailed for a spa feel that is easy to keep clean.',
    after: photo('1600566752355-35792bedcfea'),
  },
  {
    id: 'staircase',
    name: 'Staircase',
    description: 'The staircase as a feature: balustrade, lighting and finishes that connect every floor.',
    after: '/assets/manifesto-background-images/bgimage10.jpg',
  },
]

export default function BeforeAfter() {
  return (
    <section
      id="before-after"
      className="relative overflow-hidden border-b border-white/10 bg-[#070707] text-white"
    >
      {/* soft neutral light behind the card */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 55% 50% at 72% 50%, rgba(255,255,255,0.06), transparent 70%)' }}
      />
      <div className="relative">
        <BeforeAfterGallery
          rooms={ROOMS}
          intro="Pick a room, then drag the handle to see it before and after. Every space in the house, designed end to end."
        />
      </div>
    </section>
  )
}
