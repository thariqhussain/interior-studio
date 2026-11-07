import { useEffect, useRef, type CSSProperties, type RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * ParallaxComponent (adapted from the Osmo parallax-scrolling component)
 *
 * Four layers – sky + mountain, mountain cut-out, title, foreground figure – drift at different
 * speeds while the page scrolls. In the original the header scrolls away with the page; here the
 * header is pinned (sticky) inside `triggerRef`'s section, so each layer is moved by the
 * speed it would have had on screen: upward travel = speed × `travel` (a fraction of the screen height,
 * reached at the end of the scroll). Layer 1 is the slowest, layer 4 the foreground.
 *
 * Lenis smooth scrolling is already set up once for the whole site (lib/useSmoothScroll), so the
 * component deliberately does not create a second Lenis instance.
 */

interface ParallaxProps {
  /** the tall section that contains this (sticky) header – its scroll drives the parallax */
  triggerRef: RefObject<HTMLElement | null>;
  title?: string;
  /** how far the fastest possible layer (speed 1) travels over the whole scroll, as a fraction of the header height */
  travel?: number;
}

/** share of the scroll distance a layer travels upward: 0.3 = far background (slow) … 0.9 = foreground (almost 1:1) */
const LAYERS = [
  { layer: '1', speed: 0.3 },
  { layer: '2', speed: 0.45 },
  { layer: '3', speed: 0.6 },
  { layer: '4', speed: 0.9 },
];

const IMAGES: Record<string, string> = {
  '1': '/assets/parallax-layers/layer-1.webp',
  '2': '/assets/parallax-layers/layer-2.webp',
  '4': '/assets/parallax-layers/layer-4.webp',
};

const style = (speed: number, travel: number) =>
  ({ '--k': speed, '--dist': `${travel * 100}svh` }) as CSSProperties;

export function ParallaxComponent({ triggerRef, title = 'ELENA VOSS', travel = 0.6 }: ParallaxProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  // useEffect (not layout effect): the parent's ref is only attached after children's layout effects
  useEffect(() => {
    const root = rootRef.current;
    const section = triggerRef.current;
    if (!root || !section) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      const travelPx = () => root.offsetHeight * travel;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0,
          invalidateOnRefresh: true,
        },
      });

      LAYERS.forEach(({ layer, speed }) => {
        tl.to(
          root.querySelectorAll(`[data-parallax-layer="${layer}"]`),
          { y: () => -speed * travelPx(), ease: 'none' },
          0
        );
      });

      // the scroll hint fades out almost immediately
      tl.to(root.querySelector('[data-parallax-hint]'), { opacity: 0, ease: 'none', duration: 0.12 }, 0);
    }, root);

    return () => ctx.revert();
  }, [triggerRef]);

  return (
    <div className="parallax" ref={rootRef}>
      <section className="parallax__header">
        <div className="parallax__visuals">
          <div data-parallax-layers className="parallax__layers">
            {['1', '2'].map((l) => (
              <div key={l} data-parallax-layer={l} className="parallax__layer" style={style(LAYERS[+l - 1].speed, travel)}>
                <img src={IMAGES[l]} loading="eager" width={800} alt="" className="parallax__layer-img" draggable={false} />
              </div>
            ))}
            <div data-parallax-layer="3" className="parallax__layer-title">
              <h2 className="parallax__title">{title}</h2>
            </div>
            <div data-parallax-layer="4" className="parallax__layer" style={style(LAYERS[3].speed, travel)}>
              <img src={IMAGES['4']} loading="eager" width={800} alt="" className="parallax__layer-img" draggable={false} />
            </div>
          </div>
          <div className="parallax__fade" />
        </div>
        <div className="parallax__hint" data-parallax-hint>
          <span>Scroll</span>
          <i />
        </div>
      </section>
    </div>
  );
}
