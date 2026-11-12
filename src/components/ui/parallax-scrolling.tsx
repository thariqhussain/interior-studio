import { useEffect, useRef, type CSSProperties, type RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import ScriptWord from './script-word';

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
  /** optional handwritten word written out next to the bold title, e.g. "it's me" (a–z ! ? . , ' and spaces) */
  script?: string;
  /** ink colour of the handwritten word */
  scriptColor?: string;
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
  '1': '/assets/parallax-layers/layer-6.webp', // background sky layer
  '2': '/assets/parallax-layers/layer-5-building.webp', // the building, standing where the mountain used to be
  '4': '/assets/parallax-layers/layer-4.webp',
};

/** static vertical nudge (px, positive = down) per layer image; applied to the <img>, so it never fights GSAP's y on the layer wrapper */
const OFFSET_Y: Record<string, number> = {
  '2': 20, // building (layer-5) sits 20px lower
};

/** mouse response: how far (px) each layer drifts when the pointer is at the edge of the screen. Far layers move least, the
    foreground most, and they move AGAINST the pointer – as if looking through a window. Vertical drift is half of this. */
const MOUSE_DRIFT: Record<string, number> = { '1': 5, '2': 11, '3': 18, '4': 30 };
const MOUSE_EASE = 0.07; // 0–1 per frame: lower = softer, floatier follow

/* ---------- sky extras (twinkling stars, shooting stars, drifting mist, aurora) ----------
   Built to cost almost nothing: stars are drawn once, as box-shadows of THREE small elements (so three layers, not dozens), and only
   their opacity animates; the shooting stars and the mist animate transform/opacity only; no blur, filters or blend modes.
   They sit inside the sky layer, so they move with its parallax, and they pause when the scene is off screen. */
function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const STAR_TINTS = ['255,255,255', '214,228,255', '255,244,222'];
const STAR_GROUPS = [0, 1, 2].map((g) => {
  const r = seeded(101 + g * 37);
  return Array.from({ length: 15 }, () => {
    const x = (r() * 100).toFixed(1);
    const y = (r() * 50).toFixed(1); // upper sky only – the building covers the rest
    const a = (0.45 + r() * 0.55).toFixed(2);
    const spread = r() > 0.82 ? 0.7 : 0; // a few slightly bigger stars
    return `${x}vw ${y}svh 0 ${spread}px rgba(${STAR_TINTS[Math.floor(r() * 3)]},${a})`;
  }).join(',');
});

function SkyFx() {
  return (
    <div className="sky-fx" aria-hidden="true">
      <div className="sky-aurora" />
      <div className="sky-mist" />
      {STAR_GROUPS.map((shadow, i) => (
        <i key={i} className={`sky-stars sky-stars--${i}`} style={{ boxShadow: shadow }} />
      ))}
      <i className="sky-shoot sky-shoot--a" />
      <i className="sky-shoot sky-shoot--b" />
    </div>
  );
}

const style = (speed: number, travel: number) =>
  ({ '--k': speed, '--dist': `${travel * 100}svh` }) as CSSProperties;

export function ParallaxComponent({ triggerRef, title = 'ELENA VOSS', script, scriptColor, travel = 0.6 }: ParallaxProps) {
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

  // the sky's animations only run while the scene is on screen
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) root.removeAttribute('data-offscreen'); else root.setAttribute('data-offscreen', ''); }, { threshold: 0 });
    io.observe(root);
    return () => io.disconnect();
  }, []);

  // the layers answer the mouse: each layer's content (not the layer itself – GSAP owns that one) drifts a little against the pointer
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const layers = Object.keys(MOUSE_DRIFT).map((k) => ({
      el: root.querySelector<HTMLElement>(k === '3' ? '[data-parallax-layer="3"] .parallax__title' : `[data-parallax-layer="${k}"] .parallax__layer-img`),
      depth: MOUSE_DRIFT[k],
      base: OFFSET_Y[k] ?? 0,
    }));
    const rest = () => layers.forEach(({ el, base }) => { if (el) el.style.translate = base ? `0 ${base}px` : ''; });
    rest();
    // touch screens: the layers stay still (a finger on the screen is not a mouse pointer)
    if (reduced || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    let tx = 0, ty = 0, x = 0, y = 0, raf = 0, visible = true;
    const frame = () => {
      raf = 0;
      x += (tx - x) * MOUSE_EASE;
      y += (ty - y) * MOUSE_EASE;
      layers.forEach(({ el, depth, base }) => {
        if (el) el.style.translate = `${(-x * depth).toFixed(2)}px ${(-y * depth * 0.5 + base).toFixed(2)}px`;
      });
      if (Math.abs(tx - x) > 0.001 || Math.abs(ty - y) > 0.001) raf = requestAnimationFrame(frame);
    };
    const kick = () => { if (!raf && visible) raf = requestAnimationFrame(frame); };
    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
      kick();
    };
    const leave = () => { tx = 0; ty = 0; kick(); };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) kick(); }, { threshold: 0 });
    io.observe(root);
    window.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('mouseleave', leave);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener('pointermove', move);
      document.removeEventListener('mouseleave', leave);
      rest();
    };
  }, []);

  return (
    <div className="parallax" ref={rootRef}>
      <section className="parallax__header">
        <div className="parallax__visuals">
          <div data-parallax-layers className="parallax__layers">
            {['1', '2'].map((l) => (
              <div key={l} data-parallax-layer={l} className="parallax__layer" style={style(LAYERS[+l - 1].speed, travel)}>
                <img
                  src={IMAGES[l]}
                  loading="eager"
                  width={800}
                  alt=""
                  className="parallax__layer-img"
                  draggable={false}
                />
                {l === '1' && <SkyFx />}
              </div>
            ))}
            <div data-parallax-layer="3" className="parallax__layer-title">
              {script ? (
                <h2 className="parallax__title parallax__title--lockup">
                  <span className="sr-only">{`${title} ${script}`}</span>
                  <span aria-hidden="true">{title}</span>
                  <ScriptWord word={script} color={scriptColor} className="parallax__script" />
                </h2>
              ) : (
                <h2 className="parallax__title">{title}</h2>
              )}
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