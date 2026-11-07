import { useEffect } from 'react';
import { motion, MotionValue, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import { DisperseText } from '@/components/ui/disperse-text';
import { cn } from '@/lib/utils';

interface MinimalistHeroProps {
  imageSrc: string;
  imageAlt: string;
  overlayText: {
    part1: string;
    part2: string;
  };
  /** 0..1 value that drives the headline's dust dispersion (e.g. from scroll). */
  scrollProgress: MotionValue<number>;
  /** 0..1 value for the whole section's scroll, used for depth parallax. */
  parallaxProgress?: MotionValue<number>;
  className?: string;
}

export const MinimalistHero = ({
  imageSrc,
  imageAlt,
  overlayText,
  scrollProgress,
  parallaxProgress,
  className,
}: MinimalistHeroProps) => {
  const reduced = useReducedMotion();

  // Mouse position, normalised to -0.5..0.5, smoothed with a spring.
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 80, damping: 20 });
  const sy = useSpring(my, { stiffness: 80, damping: 20 });
  useEffect(() => {
    if (reduced) return;
    const move = (e: MouseEvent) => {
      mx.set(e.clientX / window.innerWidth - 0.5);
      my.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, [mx, my, reduced]);

  // Depth: far layers move little, near layers move more.
  const fallback = useMotionValue(0);
  const sp = parallaxProgress ?? fallback;
  const k = reduced ? 0 : 1;
  const circleX = useTransform(sx, (v) => v * -18 * k);
  const circleY = useTransform([sy, sp], ([v, p]: number[]) => (v * -18 + p * -40) * k);
  const textX = useTransform(sx, (v) => v * -40 * k);
  const textY = useTransform([sy, sp], ([v, p]: number[]) => (v * -40 + p * -90) * k);
  const imgX = useTransform(sx, (v) => v * 28 * k);
  const imgY = useTransform([sy, sp], ([v, p]: number[]) => (v * 28 + p * -170) * k);

  return (
    <div
      className={cn(
        'relative flex h-full min-h-[100svh] w-full items-center justify-center overflow-hidden bg-background p-5 font-sans sm:p-8 md:p-12',
        className
      )}
    >
      <div className="relative flex h-full w-full max-w-7xl items-center justify-center">
        {/* Layer 1 (far): yellow circle */}
        <motion.div style={{ x: circleX, y: circleY }} className="absolute z-0">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            className="h-[min(72vw,42svh)] w-[min(72vw,42svh)] rounded-full bg-yellow-400/90 md:h-[400px] md:w-[400px] lg:h-[500px] lg:w-[500px]"
          />
        </motion.div>

        {/* Layer 2 (mid): background headline */}
        <motion.div
          style={{ x: textX, y: textY }}
          className="pointer-events-none absolute left-1/2 top-1/2 z-[5] h-[70%] w-full -translate-x-1/2 -translate-y-1/2 md:w-[85%]"
        >
          <DisperseText lines={[overlayText.part1, overlayText.part2]} progress={scrollProgress} className="h-full w-full" />
        </motion.div>

        {/* Layer 3 (near): portrait */}
        <motion.div style={{ x: imgX, y: imgY }} className="relative z-10">
          <motion.img
            src={imageSrc}
            alt={imageAlt}
            className="h-auto w-44 object-cover sm:w-56 md:w-64 scale-150 lg:w-72"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = `https://cdn.21st.dev/assets/mirror/69/69f133c713200aa29789f9f07a83f105cc28793926179eb4a224b0454a743a00.svg`;
            }}
          />
        </motion.div>
      </div>
    </div>
  );
};
