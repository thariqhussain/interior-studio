import CurvedMarquee from '@/components/CurvedMarquee'

const IMG = '/assets/manifesto-background-images/'

// One entry per photo: the photo plus the details shown below the row while it is at the centre.
const STEPS = [
  {
    file: 'bgimage1.jpg',
    title: 'Discovery',
    time: 'Week 1–2',
    text: 'We walk through your space, listen to how you live, and shape a brief around your routines, taste and budget.',
    points: ['Site visit & measurements', 'Lifestyle and taste brief', 'Budget & scope agreement'],
    you: 'Share your inspiration and how you use each room.',
    get: 'A written design brief and project timeline.',
  },
  {
    file: 'bgimage2.jpg',
    title: 'Concept',
    time: 'Week 3–4',
    text: 'Mood boards, material palettes and first layouts turn the brief into a clear design direction.',
    points: ['Mood boards & palettes', 'Space planning options', 'Concept presentation'],
    you: 'Review the concept and approve the direction.',
    get: 'Mood board, colour & material palette, first layouts.',
  },
  {
    file: 'bgimage3.jpeg',
    title: 'Design Development',
    time: 'Week 5–8',
    text: 'Every detail is drawn and specified: joinery, lighting, finishes and furniture, with 3D renders to preview it.',
    points: ['Technical drawings', '3D visualisations', 'Material & furniture schedule'],
    you: 'Choose finishes and sign off the final design and budget.',
    get: 'Floor plans, 3D renders and a full specification pack.',
  },
  {
    file: 'bgimage4.webp',
    title: 'Execution',
    time: 'Week 9–20',
    text: 'We coordinate contractors and craftspeople on site, keeping quality, schedule and budget on track.',
    points: ['Contractor coordination', 'Weekly site reviews', 'Quality control'],
    you: 'Visit the site at key milestones and approve changes.',
    get: 'A weekly progress report with site photos.',
  },
  {
    file: 'bgimage5.webp',
    title: 'Handover',
    time: 'Final week',
    text: 'Final styling, a snagging walk-through and a care guide, so you move into a finished home.',
    points: ['Styling & installation', 'Snagging walk-through', 'Aftercare guide'],
    you: 'Walk through the finished space with us.',
    get: 'Your finished home, a care guide and 12 months of aftercare.',
  },
]

const GALLERY = STEPS.map((s) => ({ src: IMG + s.file, alt: `${s.title} – ${s.time}` }))

export default function Process() {
  return (
    <section id="process" className="relative overflow-hidden border-b border-white/10 bg-black py-24 sm:py-32">
      <CurvedMarquee
        images={GALLERY}
        details={STEPS}
        lines={['Every frame,', 'brought into focus.']}
        caption="Spaces we have designed, curved into view and brought into focus."
        glow="#1d4ed8"
      />
    </section>
  )
}
