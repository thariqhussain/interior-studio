import PerspectiveTunnelHero from '@/components/ui/perspective-tunnel-hero'

/* "Studio in numbers": a scroll-driven 3D tunnel of project photos with animated stats.
   The figures below are placeholders – replace them with the studio's real numbers.
   Photos come from the project's own image folder (see DEFAULT_IMAGES in the component). */
const STATS = [
  { value: 12, suffix: '+', label: 'Years of practice' },
  { value: 240, suffix: '+', label: 'Projects delivered' },
  { value: 85, suffix: 'k', label: 'Sq. ft. designed' },
  { value: 98, suffix: '%', label: 'Happy clients' },
]

export default function Numbers() {
  return <PerspectiveTunnelHero stats={STATS} />
}
