import { useEffect, useMemo, useRef } from "react";
import { motion, useAnimationFrame, useMotionValue, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/* =====================================================================
   Testimonial wall – tilted, infinite vertical marquee
   • 2 / 3 / 4 columns (by screen width) of white review cards on a black wall
   • each column scrolls forever with a GPU translateY; neighbouring columns run in opposite directions
     and at different speeds, so the wall feels like a living masonry
   • the whole plane is tilted in 3D and its edges fade into the black background
   • hovering anywhere on the wall pauses every column
   ===================================================================== */

export interface Testimonial {
  name: string;
  handle: string;
  /** country flag emoji */
  flag: string;
  country: string;
  text: string;
  /** optional photo; falls back to a coloured initials avatar */
  avatar?: string;
}

const COPIES = 4; // each column renders its cards this many times, so the loop always covers the wall
const AVATAR_COLORS = ["#c9a77c", "#7c9ac9", "#c97c8a", "#8ac97c", "#b07cc9", "#c9b87c", "#7cc9c0", "#c98f7c"];

function Avatar({ t, i }: { t: Testimonial; i: number }) {
  if (t.avatar) return <img src={t.avatar} alt="" className="h-11 w-11 rounded-full object-cover" draggable={false} />;
  const initials = t.name.split(" ").map((p) => p[0]).slice(0, 2).join("");
  return (
    <span
      className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-semibold text-black"
      style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}

function Card({ t, i }: { t: Testimonial; i: number }) {
  return (
    // hovering a review lifts it very slightly: a gentle 3% scale-up that eases in and out (kept above its neighbours)
    <figure className="relative w-full shrink-0 rounded-2xl border border-zinc-200 bg-white p-5 shadow-md shadow-black/30 transition-[transform,box-shadow] duration-500 ease-in-out will-change-transform hover:z-10 hover:scale-[1.03] hover:shadow-lg hover:shadow-black/40">
      <figcaption className="flex items-center gap-3">
        <Avatar t={t} i={i} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-zinc-900">{t.name}</div>
          <div className="truncate text-xs text-zinc-500">{t.handle}</div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 text-xs text-zinc-500">
          <span className="text-base leading-none" role="img" aria-label={t.country}>{t.flag}</span>
          <span className="hidden sm:inline">{t.country}</span>
        </div>
      </figcaption>
      <blockquote className="mt-4 text-[15px] leading-snug text-zinc-800">{t.text}</blockquote>
    </figure>
  );
}

function Column({
  items,
  offset,
  speed,
  dir,
  paused,
  className,
}: {
  items: Testimonial[];
  offset: number; // index offset, only used to vary the avatar colours
  speed: number; // px per second
  dir: 1 | -1; // -1 = up, 1 = down
  paused: React.MutableRefObject<boolean>;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const inner = useRef<HTMLDivElement>(null);
  const y = useMotionValue(0);
  const setHeight = useRef(0);

  // height of ONE copy of the column's cards – the loop wraps by exactly this distance
  useEffect(() => {
    const el = inner.current;
    if (!el) return;
    const measure = () => { setHeight.current = el.scrollHeight / COPIES; };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useAnimationFrame((_, delta) => {
    const h = setHeight.current;
    if (!h || paused.current || reduced) return;
    let v = y.get() + (dir * speed * Math.min(delta, 50)) / 1000;
    if (v <= -h) v += h;
    if (v > 0) v -= h;
    y.set(v);
  });

  return (
    <div className={cn("flex-1", className)}>
      <motion.div ref={inner} style={{ y }} className="flex flex-col gap-5 will-change-transform">
        {Array.from({ length: COPIES }).flatMap((_, c) =>
          items.map((t, i) => <Card key={`${c}-${i}`} t={t} i={i + offset} />)
        )}
      </motion.div>
    </div>
  );
}

const COLUMNS = [
  { speed: 26, dir: -1 as const, cls: "" },
  { speed: 34, dir: 1 as const, cls: "" },
  { speed: 22, dir: -1 as const, cls: "hidden md:block" },
  { speed: 30, dir: 1 as const, cls: "hidden lg:block" },
];

export function TestimonialWall({ items, className }: { items: Testimonial[]; className?: string }) {
  const paused = useRef(false);
  // deal the testimonials out to the columns in turn
  const cols = useMemo(
    () => COLUMNS.map((_, c) => items.filter((_, i) => i % COLUMNS.length === c)),
    [items]
  );

  return (
    <div
      className={cn("relative w-full overflow-hidden bg-black", className)}
      style={{
        height: "clamp(520px, 82svh, 840px)",
        perspective: "1700px",
        // the wall melts into the black background at every edge
        WebkitMaskImage: "radial-gradient(ellipse 72% 70% at 50% 50%, #000 35%, transparent 100%)",
        maskImage: "radial-gradient(ellipse 72% 70% at 50% 50%, #000 35%, transparent 100%)",
      }}
      onMouseEnter={() => { paused.current = true; }}
      onMouseLeave={() => { paused.current = false; }}
    >
      {/* oversized, tilted plane */}
      <div
        className="absolute flex gap-5"
        style={{
          left: "-18%",
          right: "-18%",
          top: "-30%",
          bottom: "-30%",
          transform: "rotateX(30deg) rotateY(-12deg) rotateZ(12deg)",
          transformOrigin: "50% 50%",
        }}
      >
        {COLUMNS.map((c, i) => (
          <Column
            key={i}
            items={cols[i]}
            offset={i * 3}
            speed={c.speed}
            dir={c.dir}
            paused={paused}
            className={c.cls}
          />
        ))}
      </div>
    </div>
  );
}
