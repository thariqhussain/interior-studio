"use client";

import {
    AnimatePresence,
    animate,
    motion,
    useInView,
    useMotionTemplate,
    useMotionValue,
    useMotionValueEvent,
    useReducedMotion,
    useTransform,
    type AnimationPlaybackControls,
} from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

export interface BeforeAfterRoom {
    id: string;
    name: string;
    /** One line shown under the picture. */
    description: string;
    /** The finished room. */
    after: string;
    /** The room before the work. When omitted, a dulled, desaturated copy of `after` stands in for it. */
    before?: string;
    alt?: string;
}

interface BeforeAfterGalleryProps {
    rooms: BeforeAfterRoom[];
    eyebrow?: string;
    heading?: string[];
    intro?: string;
}

const EASE = [0.22, 1, 0.36, 1] as const;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Before / after gallery.
 *  - left: heading + a vertical list of rooms (a tab list: arrow keys move through it)
 *  - right: a rounded comparison card. Drag anywhere on it (or use the handle with the arrow keys) to wipe between
 *    "before" and "after"; switching room slides the next pair in like a carousel.
 * The wipe position is a motion value, so dragging never re-renders React.
 */
export default function BeforeAfterGallery({
    rooms,
    eyebrow = "Before & After",
    heading = ["Every room,", "reimagined."],
    intro,
}: BeforeAfterGalleryProps) {
    const reduce = useReducedMotion();
    const [{ index, dir }, setView] = useState({ index: 0, dir: 1 });
    const room = rooms[index]!;

    const cardRef = useRef<HTMLDivElement>(null);
    const handleRef = useRef<HTMLDivElement>(null);
    const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const dragging = useRef(false);
    const hint = useRef<AnimationPlaybackControls | null>(null);

    // wipe position, 0–100 (% of the card width where the divider sits)
    const pos = useMotionValue(50);
    const clip = useMotionTemplate`inset(0 ${useTransform(pos, (p) => 100 - p)}% 0 0)`;
    const left = useMotionTemplate`${pos}%`;
    const beforeLabel = useTransform(pos, [6, 18], [0, 1]);
    const afterLabel = useTransform(pos, [82, 94], [1, 0]);
    useMotionValueEvent(pos, "change", (v) => handleRef.current?.setAttribute("aria-valuenow", String(Math.round(v))));

    // a small sweep the first time the card is seen, so people know it can be dragged
    const seen = useInView(cardRef, { once: true, amount: 0.5 });
    useEffect(() => {
        if (!seen || reduce) return;
        hint.current = animate(pos, [50, 30, 68, 50], { duration: 2.6, ease: "easeInOut", delay: 0.5 });
        return () => hint.current?.stop();
    }, [seen, reduce, pos]);

    // warm the cache for the neighbouring rooms
    useEffect(() => {
        [index - 1, index + 1].forEach((i) => {
            const r = rooms[(i + rooms.length) % rooms.length];
            if (!r) return;
            [r.after, r.before].forEach((src) => {
                if (src) new Image().src = src;
            });
        });
    }, [index, rooms]);

    const go = (to: number) => {
        const next = (to + rooms.length) % rooms.length;
        if (next === index) return;
        hint.current?.stop();
        pos.set(50);
        setView({ index: next, dir: to > index || (index === rooms.length - 1 && next === 0) ? 1 : -1 });
    };

    const fromPointer = (clientX: number) => {
        const r = cardRef.current?.getBoundingClientRect();
        if (r) pos.set(clamp(((clientX - r.left) / r.width) * 100, 4, 96));
    };
    const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
        if (e.button !== 0) return;
        hint.current?.stop();
        dragging.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        fromPointer(e.clientX);
    };
    const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
        if (dragging.current) fromPointer(e.clientX);
    };
    const endDrag = () => {
        dragging.current = false;
    };
    const onHandleKey = (e: KeyboardEvent<HTMLDivElement>) => {
        const step = e.shiftKey ? 15 : 5;
        const target =
            e.key === "ArrowLeft" ? pos.get() - step : e.key === "ArrowRight" ? pos.get() + step : e.key === "Home" ? 4 : e.key === "End" ? 96 : null;
        if (target === null) return;
        e.preventDefault();
        hint.current?.stop();
        pos.set(clamp(target, 4, 96));
    };
    const onTabKey = (e: KeyboardEvent<HTMLButtonElement>) => {
        const to =
            e.key === "ArrowDown" || e.key === "ArrowRight" ? index + 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? index - 1 : e.key === "Home" ? 0 : e.key === "End" ? rooms.length - 1 : null;
        if (to === null) return;
        e.preventDefault();
        const next = clamp(to, 0, rooms.length - 1);
        go(next);
        tabRefs.current[next]?.focus();
    };

    const slide = {
        enter: (d: number) => ({ x: reduce ? 0 : d * 70, opacity: 0, filter: reduce ? "none" : "blur(10px)" }),
        center: { x: 0, opacity: 1, filter: "blur(0px)" },
        exit: (d: number) => ({ x: reduce ? 0 : d * -70, opacity: 0, filter: reduce ? "none" : "blur(10px)" }),
    };

    return (
        <div className="mx-auto grid max-w-[1500px] grid-cols-[minmax(0,1fr)] gap-12 px-6 py-24 sm:px-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center lg:gap-16 lg:px-16 lg:py-32 xl:gap-24">
            {/* left: heading + room list */}
            <div className="min-w-0 text-left">
                <motion.div
                    initial={{ opacity: 0, y: 28 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ duration: 0.9, ease: EASE }}
                >
                    <p className="flex items-center gap-4 text-xs font-medium uppercase tracking-[0.25em] text-white/55">
                        <span className="h-px w-10 bg-white/40" />
                        {eyebrow}
                    </p>
                    <h2 className="mt-5 text-4xl font-semibold leading-[1.04] tracking-[-0.04em] text-white sm:text-5xl xl:text-6xl">
                        {heading.map((l) => (
                            <span key={l} className="block">
                                {l}
                            </span>
                        ))}
                    </h2>
                    {intro && <p className="mt-6 max-w-md text-base leading-relaxed text-white/50 sm:text-lg">{intro}</p>}
                </motion.div>

                <div
                    role="tablist"
                    aria-label="Rooms"
                    aria-orientation="vertical"
                    className="-mx-6 mt-10 flex snap-x scroll-px-6 gap-2 overflow-x-auto px-6 pb-2 [scrollbar-width:none] sm:-mx-10 sm:scroll-px-10 sm:px-10 lg:mx-0 lg:mt-12 lg:flex-col lg:gap-0 lg:overflow-visible lg:px-0 lg:pb-0 [&::-webkit-scrollbar]:hidden"
                >
                    {rooms.map((r, i) => {
                        const active = i === index;
                        return (
                            <button
                                key={r.id}
                                ref={(n) => {
                                    tabRefs.current[i] = n;
                                }}
                                type="button"
                                role="tab"
                                id={`ba-tab-${r.id}`}
                                aria-selected={active}
                                aria-controls="ba-panel"
                                tabIndex={active ? 0 : -1}
                                onClick={() => go(i)}
                                onKeyDown={onTabKey}
                                className={`group relative flex shrink-0 snap-start items-baseline gap-3 whitespace-nowrap rounded-full border px-4 py-2 text-left outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-white/60 lg:w-full lg:gap-5 lg:rounded-none lg:border-0 lg:border-b lg:px-0 lg:py-4 lg:focus-visible:ring-offset-0 ${
                                    active ? "border-white bg-white text-black lg:bg-transparent lg:text-white" : "border-white/15 text-white/55 hover:text-white lg:border-white/10 lg:text-white/35"
                                }`}
                            >
                                <span className={`text-xs tabular-nums transition-colors lg:text-sm ${active ? "text-black/50 lg:text-white/60" : "text-white/30"}`}>{pad(i + 1)}</span>
                                <span className="text-sm font-medium tracking-tight sm:text-base lg:text-2xl xl:text-3xl">{r.name}</span>
                                <ArrowRight
                                    aria-hidden="true"
                                    className={`ml-auto hidden size-5 shrink-0 self-center transition-all duration-300 lg:block ${active ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-50"}`}
                                />
                                {/* the bright rule that glides to the selected room */}
                                {active && (
                                    <motion.span
                                        layoutId="ba-rule"
                                        aria-hidden="true"
                                        className="absolute inset-x-0 -bottom-px hidden h-px bg-white lg:block"
                                        transition={{ duration: reduce ? 0 : 0.5, ease: EASE }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* right: comparison card + caption/controls */}
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 1, ease: EASE, delay: 0.1 }}
                className="min-w-0"
            >
                <div
                    ref={cardRef}
                    id="ba-panel"
                    role="tabpanel"
                    aria-labelledby={`ba-tab-${room.id}`}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={endDrag}
                    onPointerCancel={endDrag}
                    className="relative aspect-[4/3] w-full cursor-ew-resize select-none overflow-hidden rounded-[1.75rem] bg-neutral-900 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)] ring-1 ring-white/10 [touch-action:pan-y] sm:rounded-[2.25rem]"
                >
                    <AnimatePresence initial={false} custom={dir}>
                        <motion.div
                            key={room.id}
                            custom={dir}
                            variants={slide}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: reduce ? 0 : 0.7, ease: EASE }}
                            className="absolute inset-0"
                        >
                            <img src={room.after} alt={room.alt ?? `${room.name}, after`} draggable={false} className="absolute inset-0 size-full object-cover" />
                            <motion.div className="absolute inset-0" style={{ clipPath: clip }}>
                                <img
                                    src={room.before ?? room.after}
                                    alt={room.alt ? `${room.alt} (before)` : `${room.name}, before`}
                                    draggable={false}
                                    className={`absolute inset-0 size-full object-cover ${room.before ? "" : "brightness-[0.82] contrast-[0.82] grayscale sepia-[0.15]"}`}
                                />
                            </motion.div>
                        </motion.div>
                    </AnimatePresence>

                    {/* labels */}
                    <motion.span
                        style={{ opacity: beforeLabel }}
                        className="pointer-events-none absolute left-4 top-4 rounded-full bg-white/80 px-4 py-1.5 text-sm font-medium text-black backdrop-blur-md sm:left-6 sm:top-6 sm:px-5 sm:py-2 sm:text-base"
                    >
                        Before
                    </motion.span>
                    <motion.span
                        style={{ opacity: afterLabel }}
                        className="pointer-events-none absolute right-4 top-4 rounded-full bg-white/80 px-4 py-1.5 text-sm font-medium text-black backdrop-blur-md sm:right-6 sm:top-6 sm:px-5 sm:py-2 sm:text-base"
                    >
                        After
                    </motion.span>

                    {/* divider + handle */}
                    <motion.div style={{ left }} className="pointer-events-none absolute inset-y-0 -translate-x-1/2">
                        <div className="absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 bg-white shadow-[0_0_18px_rgba(0,0,0,0.45)]" />
                        <div
                            ref={handleRef}
                            role="slider"
                            tabIndex={0}
                            aria-label="Drag to compare before and after"
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={50}
                            onKeyDown={onHandleKey}
                            className="pointer-events-auto absolute left-1/2 top-1/2 flex size-12 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-full border-[3px] border-black bg-white text-black shadow-[0_8px_30px_rgba(0,0,0,0.45)] outline-none transition-transform duration-200 hover:scale-105 focus-visible:ring-4 focus-visible:ring-white/60 sm:size-14"
                        >
                            <ChevronLeft aria-hidden="true" className="-mr-0.5 size-4 sm:size-[18px]" strokeWidth={2.5} />
                            <ChevronRight aria-hidden="true" className="-ml-0.5 size-4 sm:size-[18px]" strokeWidth={2.5} />
                        </div>
                    </motion.div>
                </div>

                {/* caption + carousel controls */}
                <div className="mt-6 flex items-start justify-between gap-6">
                    <div className="min-h-[4.25rem] min-w-0" aria-live="polite">
                        <AnimatePresence mode="wait" initial={false}>
                            <motion.div
                                key={room.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.35, ease: EASE }}
                            >
                                <p className="text-lg font-medium tracking-tight text-white sm:text-xl">{room.name}</p>
                                <p className="mt-1 max-w-md text-sm leading-relaxed text-white/50 sm:text-base">{room.description}</p>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                        <span className="mr-1 hidden text-sm tabular-nums text-white/45 sm:block">
                            <span className="text-white">{pad(index + 1)}</span> / {pad(rooms.length)}
                        </span>
                        <button
                            type="button"
                            aria-label="Previous room"
                            onClick={() => go(index - 1)}
                            className="grid size-11 place-items-center rounded-full border border-white/15 text-white transition-colors hover:bg-white hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                        >
                            <ChevronLeft className="size-5" />
                        </button>
                        <button
                            type="button"
                            aria-label="Next room"
                            onClick={() => go(index + 1)}
                            className="grid size-11 place-items-center rounded-full border border-white/15 text-white transition-colors hover:bg-white hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                        >
                            <ChevronRight className="size-5" />
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
