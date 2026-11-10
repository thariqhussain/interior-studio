"use client";

/**
 * Glyph Zoom – adapted from "Glyph Portal" © 2026 Christian Katzmann. MIT.
 * Origin: UsefulPortal.astro on https://ktzm.dk → UsefulPortal.tsx → ClarityPortal.tsx.
 * A scroll-driven camera through live type. Keep this notice with copies.
 *
 * Added: an optional intro (letters rise in one by one, then a light sweeps across the word), driven by its own 0 → 1 value.
 *
 * Changes from the original: it owns no scroll or pin. The parent drives it with a 0 → 1 `progress` motion value
 * (here: a slice of the Manifesto's pinned scroll), the letter picker is gone (the largest patch of ink is chosen),
 * and the "foreground", caption and content slots are gone. What stays is the engine: finding the largest safe patch of
 * ink in the word's letters, and the camera that flies into it until the letter fills the screen.
 */
import { useEffect, useId, useRef, type ReactNode } from "react";
import type { MotionValue } from "framer-motion";

const clamp = (n: number, a = 0, b = 1) => Math.min(b, Math.max(a, n));
const smooth = (a: number, b: number, n: number) => {
  const t = clamp((n - a) / (b - a));
  return t * t * (3 - 2 * t);
};

type Ink = { x: number; y: number; radius: number; index: number };

/** Largest opaque square, in linear time. Unlike a stem guess, it works in O, S and Ø. */
function interior(context: CanvasRenderingContext2D, char: string, font: string): Omit<Ink, "index"> | null {
  const canvas = context.canvas;
  context.font = font;
  const m = context.measureText(char);
  const pad = 8;
  const left = Math.ceil(m.actualBoundingBoxLeft);
  const ascent = Math.ceil(m.actualBoundingBoxAscent);
  canvas.width = Math.max(1, Math.ceil(m.actualBoundingBoxLeft + m.actualBoundingBoxRight) + pad * 2);
  canvas.height = Math.max(1, Math.ceil(m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) + pad * 2);
  context.font = font;
  context.fontKerning = "none";
  context.fillText(char, pad + left, pad + ascent);
  const { width, height } = canvas;
  const pixels = context.getImageData(0, 0, width, height).data;
  const rows = new Uint16Array(width + 1);
  let size = 0, bx = 0, by = 0;
  for (let y = 0; y < height; y++) {
    let diagonal = 0;
    for (let x = 0; x < width; x++) {
      const above = rows[x + 1];
      rows[x + 1] = pixels[(y * width + x) * 4 + 3] > 245 ? Math.min(above, rows[x], diagonal) + 1 : 0;
      diagonal = above;
      if (rows[x + 1] > size) { size = rows[x + 1]; bx = x; by = y; }
    }
  }
  if (size < 3) return null;
  // Scan at 3× SVG size. Inscribe a disk in the square, with room for raster disagreement.
  return { x: (bx + 1 - size / 2 - pad - left) / 3, y: (by + 1 - size / 2 - pad - ascent) / 3, radius: (size / 2 - 1) / 3 };
}

export interface GlyphZoomProps {
  /** 0 → 1: the camera flies from the whole word into the chosen letter. The parent supplies it (e.g. from page scroll). */
  progress: MotionValue<number>;
  /** 0 → 1: the word's entrance – the letters rise in one by one, then a light sweeps across them. Omit to show the word at once. */
  intro?: MotionValue<number>;
  word: string;
  /** Preloaded before measuring (CSS family name, no quotes). */
  fontName?: string;
  fontFamily?: string;
  fontWeight?: number;
  /** What the letters are filled with, and what the screen becomes after the zoom. Fills its parent (absolute inset-0). */
  children: ReactNode;
  className?: string;
}

const RISE = 60 // how far (in glyph units, 100 = one em) each letter starts below its place
const smoothOut = (n: number) => 1 - (1 - clamp(n)) ** 3

export default function GlyphZoom({
  progress,
  intro,
  word,
  fontName = "Bricolage Grotesque",
  fontFamily = '"Bricolage Grotesque", "Arial Black", Arial, sans-serif',
  fontWeight = 800,
  children,
  className,
}: GlyphZoomProps) {
  const uid = `gz-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const clipId = `${uid}-clip`;
  const boxRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const clipRef = useRef<SVGClipPathElement>(null);
  const glyphRef = useRef<SVGTextElement>(null);
  const sweepRef = useRef<HTMLDivElement>(null);
  const text = word.trim().normalize("NFC");

  useEffect(() => {
    const box = boxRef.current!;
    const field = fieldRef.current!;
    const svg = svgRef.current!;
    const clip = clipRef.current!;
    const glyph = glyphRef.current!;
    const sweep = sweepRef.current!;
    const spans: SVGTSpanElement[] = [];
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { willReadFrequently: true });
    let disposed = false;
    let ready = false;
    let W = 1, H = 1, startScale = 1, endScale = 1;
    let center = { x: 0, y: 0 };
    let target: Ink | null = null;
    let bounds = { x: 0, y: 0, width: 1, height: 1 };

    const font = (size: number) => `${fontWeight} ${size}px ${fontFamily}`;

    /** measure the word and find the letter (and the spot in it) to fly into */
    const readInk = () => {
      if (!context) return false;
      context.font = font(100);
      context.fontKerning = "none";
      const metrics = context.measureText(text);
      bounds = {
        x: -metrics.actualBoundingBoxLeft,
        y: -metrics.actualBoundingBoxAscent,
        width: metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight,
        height: metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent,
      };
      if (!bounds.width || !bounds.height) return false;
      center = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
      const candidates: Ink[] = [];
      let offset = 0;
      glyph.textContent = "";
      spans.length = 0;
      for (const char of Array.from(text)) {
        context.font = font(100);
        context.fontKerning = "none";
        const advance = context.measureText(text.slice(0, offset)).width;
        if (char.trim()) {
          // every letter is its own absolutely placed piece of the clip, so it can rise on its own
          const span = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
          span.setAttribute("x", String(advance));
          span.setAttribute("y", "0");
          span.textContent = char;
          glyph.appendChild(span);
          spans.push(span);
        }
        const found = interior(context, char, font(300));
        if (found) candidates.push({ ...found, x: found.x + advance, index: offset });
        offset += char.length;
      }
      // the largest patch of ink wins; ties go to the letter nearest the middle of the word
      target = [...candidates].sort((a, b) => b.radius - a.radius || Math.abs(a.x - center.x) - Math.abs(b.x - center.x))[0] ?? null;
      return !!target;
    };

    const layout = () => {
      W = box.clientWidth;
      H = box.clientHeight;
      if (!W || !H || !ready) return;
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      startScale = Math.min((W * 0.84) / bounds.width, (H * 0.38) / bounds.height);
      // the whole viewport fits inside the measured ink
      endScale = target ? Math.max(startScale, Math.hypot(W, H) / (target.radius * 1.35)) : startScale;
    };

    const paint = (p: number) => {
      if (!ready || !target) return;
      const t = clamp(p / 0.78);
      // a gentle ease: mostly even speed (the zoom is exponential, so a straight line already feels like constant zooming), with only a soft start and finish
      const cubic = t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
      const eased = t * 0.65 + cubic * 0.35;
      const scale = Math.exp(Math.log(startScale) + Math.log(endScale / startScale) * eased);
      const blend = endScale === startScale ? 0 : (1 / scale - 1 / startScale) / (1 / endScale - 1 / startScale);
      const cx = center.x + (target.x - center.x) * blend;
      const cy = center.y + (target.y - center.y) * blend;
      const roll = -4 * smooth(0.06, 0.5, t) * (1 - smooth(0.62, 0.92, t));
      // Keep scale on the clip to avoid text paint limits; the text is only translated.
      const radians = (roll * Math.PI) / 180;
      const dx = W / 2 / scale;
      const dy = (H * 0.46 + H * 0.04 * eased) / scale;
      clip.setAttribute("transform", `scale(${scale}) rotate(${roll})`);
      glyph.setAttribute(
        "transform",
        `translate(${Math.cos(radians) * dx + Math.sin(radians) * dy - cx} ${-Math.sin(radians) * dx + Math.cos(radians) * dy - cy})`,
      );
      // drop the clip only after the camera has already filled the viewport with ink
      field.style.clipPath = t >= 1 ? "none" : `url(#${clipId})`;
      (field as HTMLElement & { inert: boolean }).inert = t < 1; // the screen is only clickable once it has opened
    };

    /** the entrance: letters rise one by one (first 65%), then a light sweeps across the word (last 45%) */
    const paintIntro = (v: number) => {
      if (!ready) return;
      const n = spans.length;
      for (let i = 0; i < n; i++) {
        const start = (i / n) * 0.35;
        const e = smoothOut((v - start) / 0.3);
        spans[i].setAttribute("y", ((1 - e) * RISE).toFixed(2));
      }
      const s = clamp((v - 0.55) / 0.45);
      sweep.style.opacity = s <= 0 || s >= 1 ? "0" : String(Math.sin(Math.PI * s) * 0.9);
      sweep.style.transform = `translateX(${((-0.45 + 1.55 * s) * W).toFixed(1)}px)`;
    };

    const relayout = () => { layout(); paint(progress.get()); paintIntro(intro ? intro.get() : 1); };

    (async () => {
      try { await document.fonts.load(`${fontWeight} 100px "${fontName}"`, text); } catch { /* fall back to the stack */ }
      if (disposed) return;
      ready = readInk();
      if (!ready) return;
      layout();
      paint(progress.get());
      paintIntro(intro ? intro.get() : 1);
      box.style.visibility = "visible";
    })();

    const ro = new ResizeObserver(relayout);
    ro.observe(box);
    const off = progress.on("change", paint);
    const offIntro = intro ? intro.on("change", paintIntro) : () => {};
    return () => {
      disposed = true;
      ro.disconnect();
      off();
      offIntro();
    };
  }, [progress, intro, text, fontName, fontFamily, fontWeight, clipId]);

  return (
    <div ref={boxRef} className={["absolute inset-0", className].filter(Boolean).join(" ")} style={{ visibility: "hidden" }}>
      <span className="sr-only">{text}</span>
      <div ref={fieldRef} className="absolute inset-0">
        {children}
        {/* the light sweep: a soft warm band that crosses the word once during the intro (hidden otherwise) */}
        <div
          ref={sweepRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-[45%]"
          style={{
            opacity: 0,
            background: "linear-gradient(100deg, transparent 0%, rgba(255,214,170,.35) 38%, rgba(255,244,226,.95) 50%, rgba(255,214,170,.35) 62%, transparent 100%)",
          }}
        />
      </div>
      <svg ref={svgRef} aria-hidden="true" focusable="false" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
        <defs>
          <clipPath ref={clipRef} id={clipId} clipPathUnits="userSpaceOnUse">
            <text
              ref={glyphRef}
              x="0"
              y="0"
              style={{ fontFamily, fontWeight, fontSize: 100, fontKerning: "none", fontVariantLigatures: "none", letterSpacing: 0 }}
            >
            </text>
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}
