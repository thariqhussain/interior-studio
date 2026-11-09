"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

interface ScrollRevealProps {
    /** The section that scrolls away (e.g. <Contact />). It stays in normal page flow. */
    children: ReactNode;
    /** The section revealed behind it (e.g. <Footer />). It is fixed to the viewport and sized to 100svh. */
    behind: ReactNode;
}

/**
 * "From behind" reveal. `behind` is pinned to the viewport underneath `children`. As `children` scrolls up it
 * uncovers the footer, which scales up, slides into place and brightens while a soft shadow along the
 * bottom edge of `children` fades out.
 *
 * How it works
 *  - the wrapper is clipped (clip-path: inset(0)), so the fixed `behind` panel only shows while this block is on screen
 *  - one ScrollTrigger covers a 100svh spacer after `children`; its progress (0 → 1) drives the footer's entrance
 *  - values are written straight to element styles inside onUpdate: no React state, no re-renders
 */
export default function ScrollReveal({ children, behind }: ScrollRevealProps) {
    const behindRef = useRef<HTMLDivElement>(null);
    const innerRef = useRef<HTMLDivElement>(null);
    const spacerRef = useRef<HTMLDivElement>(null);
    const shadowRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const back = behindRef.current;
        const inner = innerRef.current;
        const spacer = spacerRef.current;
        const shadow = shadowRef.current;
        if (!back || !inner || !spacer || !shadow) return;

        const apply = (p: number) => {
            const rise = easeOut(clamp01(p));
            // hidden until the contact section starts leaving (keeps it out of the tab order)
            back.style.visibility = p <= 0.001 ? "hidden" : "visible";
            inner.style.opacity = String(0.25 + 0.75 * rise);
            inner.style.transform = `translate3d(0, ${((1 - rise) * 8).toFixed(2)}svh, 0) scale(${(0.92 + 0.08 * rise).toFixed(4)})`;
            // shadow cast by the contact section's bottom edge onto the footer
            shadow.style.opacity = String(p <= 0.001 ? 0 : 1 - clamp01((p - 0.5) / 0.5));
        };

        const ctx = gsap.context(() => {
            ScrollTrigger.create({
                trigger: spacer,
                start: "top bottom", // contact's bottom edge reaches the bottom of the screen
                end: "bottom bottom", // ...until it has scrolled away and the footer fills the screen
                invalidateOnRefresh: true,
                onUpdate: (self) => apply(self.progress),
                onRefresh: (self) => apply(self.progress),
            });
        });
        apply(0);

        return () => ctx.revert();
    }, []);

    return (
        <div className="relative isolate" style={{ clipPath: "inset(0)" }}>
            {/* behind: pinned to the viewport; only visible below the contact section as it scrolls away */}
            <div
                ref={behindRef}
                className="fixed left-0 top-0 z-0 h-[100svh] w-full overflow-hidden bg-[#0b0b0b]"
                style={{ visibility: "hidden" }}
            >
                <div ref={innerRef} className="h-full w-full will-change-transform" style={{ transformOrigin: "50% 100%" }}>
                    {behind}
                </div>
            </div>

            {/* front: the section that scrolls away, with a soft shadow on its bottom edge */}
            <div className="relative z-10">
                {children}
                <div
                    ref={shadowRef}
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-full h-40 bg-gradient-to-b from-black/60 to-transparent"
                    style={{ opacity: 0 }}
                />
            </div>

            {/* scroll distance of the reveal: one screen after the contact section */}
            <div ref={spacerRef} aria-hidden="true" className="h-[100svh]" />
        </div>
    );
}
