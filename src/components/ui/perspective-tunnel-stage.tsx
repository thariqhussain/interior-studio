"use client";

import {
    motion,
    useTransform,
    useReducedMotion,
    useMotionValue,
    useSpring,
    MotionValue,
} from "framer-motion";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { domeDrop, DOME_DEPTH_SVH } from "@/lib/dome";

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
                    decoding="async"
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
            <motion.span className="text-[1.7rem] font-bold tabular-nums tracking-tighter text-white sm:text-6xl md:text-7xl">
                {text}
            </motion.span>
            <span className="mt-1.5 font-mono text-[8px] uppercase leading-tight tracking-[0.12em] text-neutral-400 sm:mt-2 sm:text-xs sm:tracking-[0.25em]">
                {stat.label}
            </span>
        </div>
    );
}

interface PerspectiveTunnelStageProps {
    /** 0 → 1 over the whole fly-through. Pass a MotionValue (e.g. derived from the page scroll); this component has no scroll logic of its own. */
    progress: MotionValue<number>;
    /** false while the scene is hidden / off screen: stops the mouse tracking. */
    active?: boolean;
    images?: TunnelImage[];
    eyebrow?: string;
}

/**
 * The "studio in numbers" scene: photos fly past in a 3D tunnel. It fills its container (position: absolute; inset: 0),
 * so the parent decides when and how long it plays. The stats are a separate layer (<TunnelStats />) so they can be
 * placed in front of whatever comes next.
 */
export default function PerspectiveTunnelStage({
    progress,
    active = true,
    images = DEFAULT_IMAGES,
    eyebrow = "The studio in numbers",
}: PerspectiveTunnelStageProps) {
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

    const smoothProgress = useSpring(progress, {
        stiffness: 80,
        damping: 30,
        restDelta: 0.0001,
    });

    const pointer = useCameraParallax(!reduce && active);

    // the cards fly through the first 75% of the progress; after that the stats get the stage to themselves
    const cardProgress = useTransform(smoothProgress, [0, 0.75], [0, 1]);

    const titleScale = useTransform(smoothProgress, [0, 0.2, 0.38], [0.7, 1, 1.2]);
    const titleOpacity = useTransform(smoothProgress, [0, 0.06, 0.22, 0.38], [0.25, 1, 1, 0]);
    // a dark shade along the bottom while the stats come in, so they stay legible over the flying photos
    const shadeOpacity = useTransform(smoothProgress, [0.35, 0.5, 0.75, 0.93], [0, 1, 1, 0]);

    return (
        <div
            className="dark absolute inset-0 flex select-none items-center justify-center overflow-hidden bg-black text-white"
            style={{
                perspective: stage.isMobile ? "900px" : "1200px",
                transformStyle: "preserve-3d",
            }}
        >
            {/* Central anchor typography */}
            <motion.div
                style={{ scale: titleScale, opacity: titleOpacity }}
                className="pointer-events-none z-0 flex max-w-xl flex-col items-center px-6 text-center"
            >
                <p className="mb-4 font-mono text-xs uppercase tracking-[0.4em] text-orange-400">{eyebrow}</p>
                <h2 className="bg-gradient-to-b from-white via-white to-white/40 bg-clip-text text-5xl font-bold leading-[0.9] tracking-tighter text-transparent sm:text-7xl md:text-8xl">
                    SPACES
                    <br />
                    WE'VE SHAPED.
                </h2>
            </motion.div>

            {/* 3D Z-space plane */}
            <div className="pointer-events-none absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
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

            {/* shade behind the stats */}
            <motion.div
                style={{ opacity: shadeOpacity }}
                className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-1/2 bg-gradient-to-t from-black via-black/60 to-transparent"
            />
        </div>
    );
}

interface TunnelStatsProps {
    /** The same 0 → 1 progress that drives <PerspectiveTunnelStage />. */
    progress: MotionValue<number>;
    stats?: TunnelStat[];
    /** Height of the dome's highest point (svh from the top of the screen) while a section rises over the stats. */
    edge?: MotionValue<number>;
    /** Where the dome first touches the stats (svh from the top of the screen). */
    edgeStop?: number;
}

/** One stat. While the dome rises it is lifted by however far the dome reaches over it at its own horizontal position,
 *  and tilted to follow the curve – so the row bends with the edge. */
function CurvedStat({ stat, progress, edge, edgeStop }: { stat: TunnelStat; progress: MotionValue<number>; edge?: MotionValue<number>; edgeStop: number }) {
    const ref = useRef<HTMLDivElement>(null);
    const u = useRef(0); // -1 … 1: horizontal position of this stat across the screen
    const tick = useMotionValue(0);

    useLayoutEffect(() => {
        const measure = () => {
            const el = ref.current;
            if (!el) return;
            const r = el.getBoundingClientRect();
            u.current = Math.max(-0.98, Math.min(0.98, ((r.left + r.width / 2) / window.innerWidth) * 2 - 1));
            tick.set(tick.get() + 1);
        };
        measure();
        window.addEventListener("resize", measure);
        return () => window.removeEventListener("resize", measure);
    }, [tick]);

    const lift = useTransform([edge ?? tick, tick], ([e]: number[]) => {
        if (!edge) return 0;
        return Math.max(0, edgeStop - (e + domeDrop(u.current))); // svh the dome reaches over this stat
    });
    const y = useTransform(lift, (l) => `${-l}svh`);
    const rotate = useTransform(lift, (l) => {
        // tilt to the slope of the dome at this x, easing in as the dome takes hold
        const uu = u.current;
        const slope = ((DOME_DEPTH_SVH / 100) * window.innerHeight * (uu / Math.sqrt(1 - uu * uu))) / (window.innerWidth / 2);
        return (Math.atan(slope) * 180 / Math.PI) * Math.min(1, l / 6);
    });

    return (
        <motion.div ref={ref} style={{ y, rotate }}>
            <StatItem stat={stat} progress={progress} />
        </motion.div>
    );
}

/**
 * The stats row: fades in along the bottom of the screen and counts up. It stays there (it does not move to the
 * middle). A separate layer (fills its container) so the parent can keep it in front of the content that follows.
 * When `edge` is given, a dome-shaped edge rising from below pushes the row up and the row bends along its curve.
 */
export function TunnelStats({ progress, stats = DEFAULT_STATS, edge, edgeStop = 91 }: TunnelStatsProps) {
    const smoothProgress = useSpring(progress, {
        stiffness: 80,
        damping: 30,
        restDelta: 0.0001,
    });
    const opacity = useTransform(smoothProgress, [0.35, 0.5], [0, 1]);

    return (
        <motion.div style={{ opacity }} className="pointer-events-none absolute inset-0 flex items-end justify-center px-6 pb-[10svh]">
            <div className="grid w-full max-w-5xl grid-cols-4 gap-x-2 sm:gap-x-6">
                {stats.map((stat) => (
                    <CurvedStat key={stat.label} stat={stat} progress={smoothProgress} edge={edge} edgeStop={edgeStop} />
                ))}
            </div>
        </motion.div>
    );
}
