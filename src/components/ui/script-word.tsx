"use client";

import { useMemo, type CSSProperties } from "react";
import { SCRIPT_BOTTOM, SCRIPT_STROKE, SCRIPT_TOP, layoutWord, supports, timeWord } from "@/lib/script-lettering";

const UNIT = 0.0052; // em per glyph unit
const PAD_L = 70;
const PAD_R = 90;
const fmt = (n: number) => +n.toFixed(4) + "em";

interface ScriptWordProps {
    /** Letters a–z, ! ? . , ' and spaces. Anything else falls back to a space. */
    word: string;
    /** Ink colour. */
    color?: string;
    /** Seconds to wait before the pen touches down. */
    delay?: number;
    /** 1 = the pen speed of the original component; larger writes more slowly. */
    pace?: number;
    className?: string;
}

const CSS = `
.sw{position:relative;display:inline-block;height:1em;pointer-events:none;-webkit-user-select:none;user-select:none}
.sw svg{position:absolute;overflow:visible;max-width:none;transform-origin:20% 70%}
.sw-p{fill:none;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:1 2;stroke-dashoffset:0;animation:sw-draw var(--dur) cubic-bezier(.45,.05,.4,1) both;animation-delay:calc(var(--base) + var(--d))}
.sw-m .sw-p{stroke:var(--sw-ink)}
.sw-s .sw-p{stroke:var(--sw-shade)}
.sw-h .sw-p{stroke:#fff;stroke-opacity:.2}
.sw-dot{transform-box:fill-box;transform-origin:center;animation:sw-dot .45s cubic-bezier(.3,1.6,.5,1) both;animation-delay:calc(var(--base) + var(--d))}
.sw-m .sw-dot{fill:var(--sw-ink)}
.sw-s .sw-dot{fill:var(--sw-shade)}
.sw-h .sw-dot{fill:#fff;fill-opacity:.2}
.sw svg.sw-svg{animation:sw-pop .6s cubic-bezier(.3,1.6,.5,1) both;animation-delay:calc(var(--base) + var(--total))}
@keyframes sw-draw{from{stroke-dashoffset:1;opacity:0}1%{opacity:1}to{stroke-dashoffset:0;opacity:1}}
@keyframes sw-dot{from{transform:scale(0)}to{transform:none}}
@keyframes sw-pop{0%,100%{transform:none}35%{transform:scale(1.05,.93)}65%{transform:scale(.98,1.03)}}
@media (prefers-reduced-motion: reduce){.sw *,.sw svg{animation:none !important}}
`;

/**
 * A word written out in a fat monoline handwriting, stroke by stroke, as if with a marker.
 * The size comes from the surrounding font-size (the word is 1em tall); the entrance runs on mount.
 */
export default function ScriptWord({ word, color = "#ffb050", delay = 0.5, pace = 1.4, className = "" }: ScriptWordProps) {
    const script = useMemo(() => {
        const laid = layoutWord(word);
        const timed = timeWord(laid.glyphs);
        // slow the pen down: stretch every start time and duration
        const glyphs = timed.glyphs.map((g) => ({
            ...g,
            strokes: g.strokes.map((s) => ({ ...s, delay: s.delay * pace, dur: s.dur * pace })),
            dots: g.dots.map((d) => ({ ...d, delay: d.delay * pace })),
        }));
        return { glyphs, total: timed.total * pace, width: laid.width, ok: supports(word) };
    }, [word, pace]);

    const vbW = script.width + PAD_L + PAD_R;
    const vbH = SCRIPT_BOTTOM - SCRIPT_TOP;

    const layer = (kind: "s" | "m" | "h") => {
        const off = kind === "s" ? "translate(6,8)" : kind === "h" ? "translate(-5,-6)" : undefined;
        const w = kind === "h" ? 7 : SCRIPT_STROKE;
        const lag = kind === "s" ? 0.06 : kind === "h" ? 0.1 : 0;
        return (
            <g className={"sw-" + kind} transform={off}>
                {script.glyphs.map((g, gi) => (
                    <g key={gi} transform={"translate(" + g.x + ",0)"}>
                        {g.strokes.map((s, si) => (
                            <path
                                key={si}
                                className="sw-p"
                                d={s.d}
                                pathLength={1}
                                strokeWidth={w}
                                style={{ "--d": (s.delay + lag).toFixed(3) + "s", "--dur": s.dur.toFixed(3) + "s" } as CSSProperties}
                            />
                        ))}
                        {g.dots.map((p, di) => (
                            <circle
                                key={"d" + di}
                                className="sw-dot"
                                cx={p.x}
                                cy={p.y}
                                r={kind === "h" ? 4 : SCRIPT_STROKE / 2}
                                style={{ "--d": p.delay.toFixed(3) + "s" } as CSSProperties}
                            />
                        ))}
                    </g>
                ))}
            </g>
        );
    };

    return (
        <span
            className={("sw " + className).trim()}
            style={
                {
                    width: fmt(script.width * UNIT),
                    "--sw-ink": color,
                    "--sw-shade": "color-mix(in oklab, " + color + " 62%, #2a1002)",
                    "--base": delay + "s",
                } as CSSProperties
            }
            aria-hidden="true"
        >
            <style>{CSS}</style>
            <svg
                className="sw-svg"
                viewBox={-PAD_L + " " + SCRIPT_TOP + " " + vbW + " " + vbH}
                style={
                    {
                        left: fmt(-PAD_L * UNIT),
                        top: fmt(0.8 + SCRIPT_TOP * UNIT),
                        width: fmt(vbW * UNIT),
                        height: fmt(vbH * UNIT),
                        "--total": script.total.toFixed(3) + "s",
                    } as CSSProperties
                }
            >
                <g transform="rotate(-6 0 0) skewX(-10)">
                    {layer("s")}
                    {layer("m")}
                    {layer("h")}
                </g>
            </svg>
        </span>
    );
}
