import TeamLanyardRail from '@/components/ui/team-lanyard-rail'

/* The studio team as lanyard badges: brush along the rail to meet someone, pull a badge, click to flip it.
   Names, bios and contact links are PLACEHOLDERS – replace them with the real team.
   Portraits are Unsplash stock photos (cropped square to faces); swap `image` for real headshots. */
const photo = (id) => `https://images.unsplash.com/photo-${id}?w=400&h=400&fit=crop&crop=faces&q=80`

const TEAM = [
  {
    id: 'elena',
    name: 'Elena Voss',
    role: 'Founder & Principal Designer',
    team: 'Elena Voss · Studio',
    tone: 1,
    image: photo('1494790108377-be9c29b29330'),
    bio: 'Leads every project from first sketch to final styling. Believes a room should feel calm before it looks impressive.',
    tags: ['Residential', 'Since 2013'],
    links: [{ label: 'Email', href: 'mailto:hello@example.com' }, { label: 'Portfolio', href: '#' }],
  },
  {
    id: 'marcus',
    name: 'Marcus Hale',
    role: 'Lead Architect',
    team: 'Elena Voss · Architecture',
    tone: 4,
    image: photo('1507003211169-0a1dd7228f2d'),
    bio: 'Reworks floor plans so light, flow and storage finally agree. Happiest with a tracing-paper roll and a site visit.',
    tags: ['Space planning', 'Since 2015'],
    links: [{ label: 'Email', href: 'mailto:hello@example.com' }, { label: 'Calendar', href: '#' }],
  },
  {
    id: 'priya',
    name: 'Priya Nair',
    role: 'Senior Interior Designer',
    team: 'Elena Voss · Design',
    tone: 3,
    image: photo('1438761681033-6461ffad8d80'),
    bio: 'Builds the material palettes: stone, timber, linen, brass. Keeps a drawer of swatches for every client.',
    tags: ['Materials', 'Since 2017'],
    links: [{ label: 'Email', href: 'mailto:hello@example.com' }, { label: 'Portfolio', href: '#' }],
  },
  {
    id: 'daniel',
    name: 'Daniel Brooks',
    role: '3D Visualiser',
    team: 'Elena Voss · Visuals',
    tone: 5,
    image: photo('1500648767791-00dcc994a43e'),
    bio: 'Turns drawings into renders so real you will want to move in. Lights every scene like a photographer.',
    tags: ['Renders', 'Walkthroughs', 'Since 2019'],
    links: [{ label: 'Email', href: 'mailto:hello@example.com' }, { label: 'Showreel', href: '#' }],
  },
  {
    id: 'sofia',
    name: 'Sofia Alvarez',
    role: 'Project Manager',
    team: 'Elena Voss · Delivery',
    tone: 2,
    image: photo('1544005313-94ddf0286df2'),
    bio: 'Keeps contractors, deliveries and budgets moving in the same direction. Nothing slips past her schedule.',
    tags: ['Turnkey', 'Since 2018'],
    links: [{ label: 'Email', href: 'mailto:hello@example.com' }, { label: 'Calendar', href: '#' }],
  },
  {
    id: 'james',
    name: 'James Okoye',
    role: 'Joinery Specialist',
    team: 'Elena Voss · Workshop',
    tone: 1,
    image: photo('1506794778202-cad84cf45f1d'),
    bio: 'Designs the wardrobes, kitchens and one-off furniture that make a room fit its owner exactly.',
    tags: ['Custom joinery', 'Since 2016'],
    links: [{ label: 'Email', href: 'mailto:hello@example.com' }, { label: 'Workshop', href: '#' }],
  },
  {
    id: 'mei',
    name: 'Mei Tanaka',
    role: 'Lighting Designer',
    team: 'Elena Voss · Design',
    tone: 4,
    image: photo('1534528741775-53994a69daeb'),
    bio: 'Plans every lamp, dimmer and shadow. Says the best lighting is the kind you only notice when it is missing.',
    tags: ['Lighting', 'Since 2020'],
    links: [{ label: 'Email', href: 'mailto:hello@example.com' }, { label: 'Portfolio', href: '#' }],
  },
  {
    id: 'oliver',
    name: 'Oliver Grant',
    role: 'Client Relations',
    team: 'Elena Voss · Studio',
    tone: 3,
    image: photo('1519085360753-af0119f7cbe7'),
    bio: 'Your first call and your last. Makes sure every client knows what happens next, and when.',
    tags: ['Onboarding', 'Since 2021'],
    links: [{ label: 'Email', href: 'mailto:hello@example.com' }, { label: 'Calendar', href: '#' }],
  },
]

export default function Team() {
  return (
    // "dark" + "team-theme": dark stage with warm paper badges (tokens live in index.css)
    <section id="team" className="dark team-theme flex min-h-[90svh] items-center bg-[#0a0a09]">
      <TeamLanyardRail
        items={TEAM}
        autoplay
        className="py-8 md:py-10"
        eyebrow="Meet the team · Eight people"
        heading="The people behind every room."
        caption="Brush along the rail to meet someone, pull a badge down, click to flip it."
        action={
          <a
            href="#contact"
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background shadow-sm outline-none transition-[transform,box-shadow] hover:-translate-y-px hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none"
          >
            <span aria-hidden="true" className="size-1.5 rounded-full bg-orange-500" />
            Work with us
          </a>
        }
      />
    </section>
  )
}
