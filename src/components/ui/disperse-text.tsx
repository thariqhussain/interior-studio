import { useEffect, useRef } from 'react';
import { MotionValue } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * DisperseText
 * ------------
 * Renders text on a <canvas> as thousands of tiny particles. A 0..1 MotionValue
 * (`progress`) drives a left-to-right "dust" dispersion: a soft wave front sweeps
 * across the text, and particles behind it drift away (right + up, with noise)
 * while fading out. Position is a pure function of progress, so scrolling back
 * up re-assembles the text.
 */
interface DisperseTextProps {
  lines: string[];
  progress: MotionValue<number>;
  className?: string;
}

interface Particle {
  x: number; // origin
  y: number;
  t: number; // 0..1 horizontal position (when the wave reaches it)
  dx: number; // drift direction * distance
  dy: number;
  size: number;
}

const STEP = 3; // sampling grid in CSS px: lower = denser (and heavier)
const BAND = 0.4; // width of the dispersion wave front (fraction of text width)

export function DisperseText({ lines, progress, className }: DisperseTextProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    let particles: Particle[] = [];
    let w = 0;
    let h = 0;
    let dpr = 1;
    let color = '#111';

    // Build particles by rasterising the text and sampling opaque pixels.
    const build = () => {
      const rect = wrap.getBoundingClientRect();
      // integer sizes: the pixel buffer is indexed with `w`, a fractional width (e.g. 870.4px at
      // 85% of a tablet viewport) skews the row lookup and collapses the text into thin streaks
      w = Math.round(rect.width);
      h = Math.round(rect.height);
      if (!w || !h) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      const cs = getComputedStyle(wrap);
      color = cs.color;
      const family = cs.fontFamily;

      const off = document.createElement('canvas');
      off.width = w;
      off.height = h;
      const o = off.getContext('2d', { willReadFrequently: true })!;

      // Fit the font size to the box.
      o.font = `800 100px ${family}`;
      const widest = Math.max(...lines.map((l) => o.measureText(l).width));
      const size = Math.min((w * 0.96 * 100) / widest, h / (lines.length * 1.05));
      o.font = `800 ${size}px ${family}`;
      o.fillStyle = '#000';
      o.textAlign = 'center';
      o.textBaseline = 'middle';
      const lh = size * 1.02;
      lines.forEach((l, i) => {
        o.fillText(l, w / 2, h / 2 + (i - (lines.length - 1) / 2) * lh);
      });

      const data = o.getImageData(0, 0, w, h).data;
      particles = [];
      for (let y = 0; y < h; y += STEP) {
        for (let x = 0; x < w; x += STEP) {
          if (data[((y | 0) * w + (x | 0)) * 4 + 3] > 128) {
            const a = Math.random() * Math.PI * 2;
            const dist = 60 + Math.random() * 220;
            particles.push({
              x,
              y,
              t: x / w,
              // bias to the right and slightly upward, plus random scatter
              dx: Math.abs(Math.cos(a)) * dist + 40,
              dy: Math.sin(a) * dist * 0.6 - 20,
              size: STEP * (0.5 + Math.random() * 0.6),
            });
          }
        }
      }
      draw(progress.get());
    };

    const draw = (p: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = color;
      for (const q of particles) {
        // local progress: 0 = untouched, 1 = fully dispersed
        const l = Math.min(1, Math.max(0, (p * (1 + BAND) - q.t) / BAND));
        if (l >= 1) continue;
        ctx.globalAlpha = 1 - l * l;
        const e = l * l; // ease-in so the break-up starts gently
        ctx.fillRect(q.x + q.dx * e, q.y + q.dy * e, q.size, q.size);
      }
      ctx.globalAlpha = 1;
    };

    build();
    const unsub = progress.on('change', draw);
    const ro = new ResizeObserver(build);
    ro.observe(wrap);
    document.fonts?.ready.then(build);
    return () => {
      unsub();
      ro.disconnect();
    };
  }, [lines, progress]);

  return (
    <div ref={wrapRef} className={cn('text-foreground', className)} aria-label={lines.join(' ')} role="img">
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}
