import { cn } from "@/lib/utils";
import { useRef, useState, useLayoutEffect } from "react";
import gsap from "gsap";

interface MenuItem {
  num: string;
  name: string;
  clipId: string;
  image: string;
  /** optional one-liner shown under the active item */
  desc?: string;
}

const defaultItems: MenuItem[] = [
  {
    num: "01",
    name: "Gourmet Burgers",
    clipId: "clip-original",
    image: "https://cdn.21st.dev/assets/mirror/53/534bb84332e13a8595670521bdcc71acd40fabbf589c1775f4028df1ca1ea96a.jpg"
  },
  {
    num: "02",
    name: "Fresh Desserts",
    clipId: "clip-hexagons",
    image: "https://cdn.21st.dev/assets/mirror/be/bec9c493cadbcd53fd0e00a0cf98f1dbb7813141c9c461b8c1b7920f6b7fa721.jpg"
  },
  {
    num: "03",
    name: "Artisan Waffles",
    clipId: "clip-pixels",
    image: "https://cdn.21st.dev/assets/mirror/b0/b05848f9ad0d993c69b9c21c3793b3b5507eff7064b01540d196cac068101729.jpg"
  }
];

export const Component = ({
  items = defaultItems,
  className
}: { items?: MenuItem[]; className?: string }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<SVGImageElement>(null);
  const mainGroupRef = useRef<SVGGElement>(null);
  const masterTl = useRef<gsap.core.Timeline | null>(null);

  const createLoop = (index: number) => {
    const item = items[index];
    const selector = `#${item.clipId} .path`;

    if (masterTl.current) masterTl.current.kill();

    if (imageRef.current) imageRef.current.setAttribute("href", item.image);
    if (mainGroupRef.current) mainGroupRef.current.setAttribute("clip-path", `url(#${item.clipId})`);

    gsap.set(selector, { scale: 0, transformOrigin: "50% 50%" });

    const tl = gsap.timeline({ repeat: -1, repeatDelay: 1 });

    // 1. IN (Expo Out)
    tl.to(selector, {
      scale: 1,
      duration: 0.8,
      stagger: { amount: 0.4, from: "random" },
      ease: "expo.out",
    })
    // 2. IDLE (Sine Breath)
    .to(selector, {
      scale: 1.05,
      duration: 1.5,
      yoyo: true,
      repeat: 1,
      ease: "sine.inOut",
      stagger: { amount: 0.2, from: "center" }
    })
    // 3. OUT (Expo In)
    .to(selector, {
      scale: 0,
      duration: 0.6,
      stagger: { amount: 0.3, from: "edges" },
      ease: "expo.in",
    });

    masterTl.current = tl;
  };

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      createLoop(0);
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const handleItemHover = (index: number) => {
    if (index === activeIndex) return;
    setActiveIndex(index);
    createLoop(index);
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex flex-col lg:flex-row items-center justify-between min-h-[100svh] w-full p-8 md:p-16 lg:p-24 overflow-hidden transition-colors duration-500",
        "bg-white dark:bg-[#050505]",
        className
      )}
    >

      {/* LEFT SIDE: HIGH CONTRAST MENU */}
      <div className="z-20 w-full lg:w-1/2">
        <nav>
          <ul className="flex flex-col gap-8 md:gap-9">
            {items.map((item, index) => {
              // first word on the first line, the rest on the second (works for 2-, 3- and 4-word names)
              const [first, ...rest] = item.name.split(' ');
              return (
              <li
                key={item.num}
                onMouseEnter={() => handleItemHover(index)}
                onFocus={() => handleItemHover(index)}
                onClick={() => handleItemHover(index)}
                tabIndex={0}
                className="group cursor-pointer outline-none"
              >
                <div className="flex items-start gap-6">
                  {/* Numbers: Increased visibility for non-hover state */}
                  <span className={cn(
                    "text-2xl md:text-3xl font-bold transition-all duration-500 mt-1.5",
                    activeIndex === index
                      ? "text-orange-500 scale-110"
                      : "text-zinc-400 dark:text-zinc-600"
                  )}>
                    {item.num}
                  </span>

                  <div>
                    {/* Main Text: Enhanced visibility logic */}
                    <h2 className={cn(
                      "text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter leading-[0.9] transition-all duration-700",
                      activeIndex === index
                        ? "text-zinc-950 dark:text-white opacity-100 translate-x-4"
                        // INACTIVE STATE: Increased from Zinc-200 to Zinc-400 for Light Mode
                        // Increased stroke visibility for Dark Mode (#52525b is Zinc-600)
                        : "opacity-40 translate-x-0 " +
                          "text-zinc-500 dark:text-transparent " +
                          "dark:[text-stroke:1.5px_#52525b] dark:[-webkit-text-stroke:1.5px_#52525b]"
                    )}>
                      {first}
                      {rest.length > 0 && (<><br />{rest.join(' ')}</>)}
                    </h2>
                    {item.desc && (
                      <p className={cn(
                        "max-w-sm overflow-hidden text-sm leading-relaxed text-zinc-500 dark:text-zinc-400 transition-all duration-700",
                        activeIndex === index ? "mt-3 max-h-24 translate-x-4 opacity-100" : "mt-0 max-h-0 translate-x-0 opacity-0"
                      )}>
                        {item.desc}
                      </p>
                    )}
                  </div>
                </div>
              </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* RIGHT SIDE: SQUARE GRID (Sharp Squares) */}
      <div className="relative w-full lg:w-1/2 flex justify-center items-center mt-16 lg:mt-0">
        <div className="absolute w-[120%] h-[120%] bg-orange-500/10 dark:bg-orange-600/5 blur-[120px] rounded-full transition-opacity duration-1000" />

        <svg viewBox="0 0 500 500" className="w-[100%] max-w-[500px] h-auto z-10 drop-shadow-xl dark:drop-shadow-[0_0_60px_rgba(0,0,0,0.8)]">
          <defs>
            {/* 2 × 2 grid of squares (replaces the original burger-shaped stack of bars) */}
            <clipPath id="clip-original">
              {[0, 1, 2, 3].map((i) => (
                <rect
                  key={i}
                  className="path"
                  x={(i % 2) * 240 + 20}
                  y={Math.floor(i / 2) * 240 + 20}
                  width="220"
                  height="220"
                  rx="4"
                />
              ))}
            </clipPath>

            <clipPath id="clip-hexagons">
              <rect className="path" x="20" y="20" width="200" height="280" rx="12" />
              <rect className="path" x="20" y="320" width="200" height="160" rx="12" />
              <rect className="path" x="240" y="20" width="240" height="140" rx="12" />
              <rect className="path" x="240" y="180" width="110" height="160" rx="12" />
              <rect className="path" x="370" y="180" width="110" height="160" rx="12" />
              <rect className="path" x="240" y="360" width="240" height="120" rx="12" />
            </clipPath>

            {/* Grid Squares with rx="4" as requested */}
            <clipPath id="clip-pixels">
              {Array.from({ length: 9 }).map((_, i) => (
                <rect
                  key={i}
                  className="path"
                  x={(i % 3) * 160 + 20}
                  y={Math.floor(i / 3) * 160 + 20}
                  width="140"
                  height="140"
                  rx="4"
                />
              ))}
            </clipPath>
          </defs>

          <g ref={mainGroupRef} clipPath={`url(#${items[0].clipId})`}>
            <image
              ref={imageRef}
              href={items[0].image}
              width="500"
              height="500"
              preserveAspectRatio="xMidYMid slice"
            />
          </g>
        </svg>
      </div>
    </div>
  );
};
