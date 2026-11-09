"use client";

import {
    motion,
    useTransform,
    useReducedMotion,
    useMotionValue,
    useSpring,
    useScroll,
    MotionValue,
} from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

export interface TunnelImage {
    src: string;
    title: string;
}

export interface TunnelStat {
    value: number;
    suffix?: string;
    label: string;
}

const DEFAULT_IMAGES: TunnelImage[] = [
    { src: "/assets/manifesto-background-images/bgimage1.jpg", title: "Living Room" },
    { src: "/assets/manifesto-background-images/bgimage2.jpg", title: "Kitchen" },
    { src: "/assets/manifesto-background-images/bgimage3.jpeg", title: "Bedroom" },
    { src: "/assets/manifesto-background-images/bgimage4.webp", title: "Dining" },
    { src: "/assets/manifesto-background-images/bgimage5.webp", title: "Lounge" },
    { src: "/assets/manifesto-background-images/bgimage6.jpg", title: "Study" },
    { src: "/assets/manifesto-background-images/bgimage7.jpg", title: "Bathroom" },
    { src: "/assets/manifesto-background-images/bgimage8.webp", title: "Office" },
    { src: "/assets/manifesto-background-images/bgimage9.jpg", title: "Entryway" },
];

const DEFAULT_STATS: TunnelStat[] = [
    { value: 12, suffix: "+", label: "Years of practice" },
    { value: 240, suffix: "+", label: "Projects delivered" },
    { value: 85, suffix: "k", label: "Sq. ft. designed" },
    { value: 98, suffix: "%", label: "Happy clients" },
];

interface TunnelCardData {
    item: TunnelImage;
    angleCos: number;
    angleSin: number;
    radiusFactorX: number;
    radiusFactorY: number;
    rotationZ: number;
    index: number;
}

function buildCards(images: TunnelImage[]): TunnelCardData[] {
    return images.map((item, i) => {
        const goldenAngle = i * 137.5 * (Math.PI / 180);
        return {
            item,
            angleCos: Math.cos(goldenAngle),
            angleSin: Math.sin(goldenAngle),
            radiusFactorX: 0.28 + (i % 3) * 0.08,
            radiusFactorY: 0.26 + (i % 2) * 0.09,
            rotationZ: (i % 2 === 0 ? 1 : -1) * (3 + (i % 5) * 2),
            index: i,
        };
    });
}

const SPRING_CONFIG = { stiffness: 60, damping: 25, mass: 0.5 };

interface StageDimensions {
    width: number;
    height: number;
    isMobile: boolean;
}

function useCameraParallax(enabled: boolean) {
    const rawX = useMotionValue(0);
    const rawY = useMotionValue(0);
    const x = useSpring(rawX, SPRING_CONFIG);
    const y = useSpring(rawY, SPRING_CONFIG);

    useEffect(() => {
        if (!enabled) return;
        const onMove = (e: PointerEvent) => {
            rawX.set((e.clientX / window.innerWidth - 0.5) * 2);
            rawY.set((e.clientY / window.innerHeight - 0.5) * 2);
        };
        window.addEventListener("pointermove", onMove, { passive: true });
        return () => window.removeEventListener("pointermove", onMove);
    }, [enabled, rawX, rawY]);

    return { x, y };
}

interface TunnelCardProps {
    card: TunnelCardData;
    progress: MotionValue<number>;
    pointer: { x: MotionValue<number>; y: MotionValue<number> };
    total: number;
    stage: StageDimensions;
}

function TunnelCard({ card, progress, pointer, total, stage }: TunnelCardProps) {
    const staggerSpan = 0.55;
    const start = (card.index / total) * (1 - staggerSpan);
    const end = start + staggerSpan;

    const localProgress = useTransform(progress, [start, end], [0, 1]);

    const farZ = stage.isMobile ? -1200 : -1700;
    const nearZ = stage.isMobile ? 350 : 500;
    const z = useTransform(localProgress, [0, 1], [farZ, nearZ]);

    const opacity = useTransform(localProgress, [0, 0.18, 0.82, 0.98], [0, 1, 1, 0]);

    const cardWidth = stage.isMobile
        ? Math.max(130, Math.min(180, stage.width * 0.38))
        : Math.max(180, Math.min(270, stage.width * 0.18));

    const baseX = card.angleCos * (stage.width * card.radiusFactorX);
    const baseY = card.angleSin * (stage.height * card.radiusFactorY);
    const panStrength = stage.isMobile ? 20 : 45;

    const transform = useTransform(
        [z, pointer.x, pointer.y],
        ([currZ, px, py]: number[]) => {
            const offsetX = baseX - px * panStrength;
            const offsetY = baseY - py * panStrength;
            return `translate3d(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px), ${currZ}px) rotateZ(${card.rotationZ}deg)`;
        }
    );

    return (
        <motion.div
            style={{
                width: cardWidth,
                transform,
                opacity,
                zIndex: card.index + 1,
            }}
            className="pointer-events-auto absolute left-1/2 top-1/2 aspect-[4/5] will-change-transform select-none"
        >
            <div className="group relative h-full w-full overflow-hidden rounded-2xl bg-neutral-900 shadow-2xl shadow-black/90 ring-1 ring-white/15 transition-all duration-500 hover:ring-orange-400/70 hover:shadow-orange-500/25">
                <img
                    src={card.item.src}
                    alt={card.item.title}
                    draggable={false}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                />
                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/80 via-black/10 to-transparent p-4 sm:p-5">
                    <span className="font-mono text-xs uppercase tracking-widest text-white/95 drop-shadow-md sm:text-sm">
                        {card.item.title}
                    </span>
                </div>
            </div>
        </motion.div>
    );
}

function StatItem({ stat, progress }: { stat: TunnelStat; progress: MotionValue<number> }) {
    // numbers count up while the stats are on screen
    const count = useTransform(progress, [0.4, 0.7], [0, stat.value]);
    const text = useTransform(count, (v) => `${Math.round(v).toLocaleString()}${stat.suffix ?? ""}`);
    return (
        <div className="flex flex-col items-center text-center">
            <motion.span className="text-4xl font-bold tabular-nums tracking-tighter text-white sm:text-6xl md:text-7xl">
                {text}
            </motion.span>
            <span className="mt-2 font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-400 sm:text-xs">
                {stat.label}
            </span>
        </div>
    );
}

interface PerspectiveTunnelHeroProps {
    images?: TunnelImage[];
    stats?: TunnelStat[];
    eyebrow?: string;
    /** Total scroll length of the section, in svh (stage is pinned for this long). */
    scrollSvh?: number;
}

export default function PerspectiveTunnelHero({
    images = DEFAULT_IMAGES,
    stats = DEFAULT_STATS,
    eyebrow = "The studio in numbers",
    scrollSvh = 450,
}: PerspectiveTunnelHeroProps) {
    const sectionRef = useRef<HTMLDivElement>(null);
    const reduce = useReducedMotion();
    const cards = useMemo(() => buildCards(images), [images]);

    const [stage, setStage] = useState<StageDimensions>({
        width: 1440,
        height: 900,
        isMobile: false,
    });

    useEffect(() => {
        const updateDimensions = () => {
            setStage({
                width: window.innerWidth,
                height: window.innerHeight,
                isMobile: window.innerWidth < 768,
            });
        };

        updateDimensions();
        window.addEventListener("resize", updateDimensions);
        return () => window.removeEventListener("resize", updateDimensions);
    }, []);

    // Page scroll drives the tunnel (no wheel hijacking, so Lenis / native scroll keep working)
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start start", "end end"],
    });
    const smoothProgress = useSpring(scrollYProgress, {
        stiffness: 80,
        damping: 30,
        restDelta: 0.0001,
    });

    const pointer = useCameraParallax(!reduce);

    // the cards fly through the first 75% of the scroll; after that the stats get the stage to themselves
    const cardProgress = useTransform(smoothProgress, [0, 0.75], [0, 1]);

    const titleScale = useTransform(smoothProgress, [0, 0.2, 0.38], [0.7, 1, 1.2]);
    const titleOpacity = useTransform(smoothProgress, [0, 0.06, 0.22, 0.38], [0.25, 1, 1, 0]);
    const promptOpacity = useTransform(smoothProgress, [0, 0.06], [1, 0]);
    // stats: fade in at the bottom, then drift up to the vertical middle once the cards are gone
    const statsOpacity = useTransform(smoothProgress, [0.35, 0.5], [0, 1]);
    const statsY = useTransform(smoothProgress, [0.35, 0.5, 0.75, 0.93], ["40svh", "40svh", "40svh", "0svh"]);
    const shadeOpacity = useTransform(smoothProgress, [0.35, 0.5, 0.75, 0.93], [0, 1, 1, 0]);

    return (
        <div
            ref={sectionRef}
            id="numbers"
            className="dark relative w-full bg-neutral-950"
            style={{ height: `${scrollSvh}svh` }}
        >
            <div
                className="sticky top-0 flex h-[100svh] w-full select-none items-center justify-center overflow-hidden bg-neutral-950 text-white"
                style={{
                    perspective: stage.isMobile ? "900px" : "1200px",
                    transformStyle: "preserve-3d",
                }}
            >
                {/* Background grid & glow */}
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#3a2a1c_1px,transparent_1px)] [background-size:28px_28px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,#000_60%,transparent_100%)] opacity-65" />
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.18)_0%,transparent_75%)]" />

                {/* Depth ring guides */}
                <div className="pointer-events-none absolute h-[48vmin] w-[48vmin] rounded-full border border-orange-400/10" />
                <div className="pointer-events-none absolute h-[76vmin] w-[76vmin] rounded-full border border-dashed border-white/10" />

                {/* Central anchor typography */}
                <motion.div
                    style={{ scale: titleScale, opacity: titleOpacity }}
                    className="pointer-events-none z-0 flex max-w-xl flex-col items-center px-6 text-center"
                >
                    <p className="mb-4 font-mono text-xs uppercase tracking-[0.4em] text-orange-400">
                        {eyebrow}
                    </p>
                    <h2 className="bg-gradient-to-b from-white via-white to-white/40 bg-clip-text text-5xl font-bold leading-[0.9] tracking-tighter text-transparent sm:text-7xl md:text-8xl">
                        SPACES
                        <br />
                        WE'VE SHAPED.
                    </h2>
                </motion.div>

                {/* Scroll prompt */}
                <motion.div
                    style={{ opacity: promptOpacity }}
                    className="pointer-events-none absolute bottom-8 z-20 flex flex-col items-center gap-2 font-mono text-xs uppercase tracking-[0.3em] text-neutral-400"
                >
                    <span>Scroll to Explore</span>
                    <div className="h-6 w-px bg-gradient-to-b from-orange-500 to-transparent" />
                </motion.div>

                {/* 3D Z-space plane */}
                <div
                    className="pointer-events-none absolute inset-0"
                    style={{ transformStyle: "preserve-3d" }}
                >
                    {cards.map((card) => (
                        <TunnelCard
                            key={card.index}
                            card={card}
                            progress={cardProgress}
                            pointer={pointer}
                            total={cards.length}
                            stage={stage}
                        />
                    ))}
                </div>

                {/* Stats overlay: fades in low on the screen, then settles in the middle */}
                <motion.div
                    style={{ opacity: shadeOpacity }}
                    className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-1/2 bg-gradient-to-t from-black via-black/60 to-transparent"
                />
                <motion.div
                    style={{ opacity: statsOpacity, y: statsY }}
                    className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center px-6"
                >
                    <div className="grid w-full max-w-5xl grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4">
                        {stats.map((stat) => (
                            <StatItem key={stat.label} stat={stat} progress={smoothProgress} />
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
