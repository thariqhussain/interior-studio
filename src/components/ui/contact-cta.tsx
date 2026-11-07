import { useEffect, useState } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { ArrowUpRight, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

/* =====================================================================
   Contact / call-to-action with a click transition
   State 1  "AVAILABLE FOR PROJECTS" · "Let's work together" · circular arrow button · blurb + email
   Click    the circle button swaps the view: everything lifts away, then the booking state grows in
   State 2  "PERFECT" · "Let's talk" · "Book a call" pill · "15 MIN INTRO CALL"
   Esc takes you back to state 1.
   ===================================================================== */

const EASE = [0.22, 1, 0.36, 1] as const;

// each state is a staggered group: items rise + sharpen in, and lift + blur out
const group: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.08 } },
  exit: { transition: { staggerChildren: 0.05, staggerDirection: -1 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 26, filter: "blur(6px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.8, ease: EASE } },
  exit: { opacity: 0, y: -22, filter: "blur(6px)", transition: { duration: 0.4, ease: EASE } },
};
// the "Book a call" pill grows in from a small circle – like the round button expanding
const pill: Variants = {
  hidden: { opacity: 0, scale: 0.5 },
  show: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 170, damping: 18 } },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.3, ease: EASE } },
};

interface ContactCtaProps {
  email?: string;
  /** where "Book a call" goes (a scheduling link). Falls back to an email with a subject line. */
  bookingUrl?: string;
  className?: string;
}

export function ContactCta({ email = "hello@example.com", bookingUrl, className }: ContactCtaProps) {
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setBooking(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const bookHref = bookingUrl ?? `mailto:${email}?subject=${encodeURIComponent("Intro call")}`;

  return (
    <div
      className={cn(
        "relative flex min-h-[100svh] w-full items-center justify-center overflow-hidden bg-white px-6 py-24 text-zinc-950",
        className
      )}
      style={{ fontFamily: 'Inter, "Helvetica Neue", system-ui, -apple-system, "Segoe UI", sans-serif' }}
    >
      <AnimatePresence mode="wait">
        {!booking ? (
          <motion.div
            key="cta"
            variants={group}
            initial="hidden"
            animate="show"
            exit="exit"
            className="flex flex-col items-center text-center"
          >
            {/* status pill */}
            <motion.p variants={item} className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.22em] text-zinc-500 sm:text-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
              Available for projects
            </motion.p>

            {/* headline */}
            <motion.h2
              variants={item}
              className="mt-12 font-normal leading-[0.95] tracking-[-0.05em]"
              style={{ fontSize: "clamp(3.4rem, 11.5vw, 10rem)" }}
            >
              <span className="block text-zinc-950">Let&apos;s work</span>
              <span className="flex items-center justify-center gap-[3vw] text-zinc-400">
                <i className="hidden h-px w-[6vw] bg-zinc-200 sm:block" aria-hidden="true" />
                together
                <i className="hidden h-px w-[6vw] bg-zinc-200 sm:block" aria-hidden="true" />
              </span>
            </motion.h2>

            {/* round button */}
            <motion.button
              variants={item}
              type="button"
              onClick={() => setBooking(true)}
              aria-label="Let's work together – book an intro call"
              whileTap={{ scale: 0.94 }}
              className="group mt-12 grid h-[112px] w-[112px] place-items-center rounded-full border border-zinc-300 bg-white transition-colors duration-500 hover:border-zinc-950 hover:bg-zinc-950 sm:h-[132px] sm:w-[132px]"
            >
              <ArrowUpRight className="h-7 w-7 text-zinc-950 transition-all duration-500 group-hover:rotate-45 group-hover:text-white" strokeWidth={2} />
            </motion.button>

            <motion.p variants={item} className="mt-20 max-w-md text-base leading-relaxed text-zinc-500 sm:text-lg">
              Have a project in mind? We&apos;d love to hear about it. Let&apos;s create something exceptional together.
            </motion.p>
            <motion.a
              variants={item}
              href={`mailto:${email}`}
              className="mt-5 text-xs uppercase tracking-[0.18em] text-zinc-400 transition-colors duration-300 hover:text-zinc-950 sm:text-sm"
            >
              {email}
            </motion.a>
          </motion.div>
        ) : (
          <motion.div
            key="book"
            variants={group}
            initial="hidden"
            animate="show"
            exit="exit"
            className="flex flex-col items-center text-center"
          >
            <motion.p variants={item} className="text-xs font-medium uppercase tracking-[0.35em] text-zinc-500 sm:text-sm">
              Perfect
            </motion.p>

            <motion.h2
              variants={item}
              className="mt-6 font-normal leading-none tracking-[-0.05em] text-zinc-950"
              style={{ fontSize: "clamp(3rem, 5.6vw, 5.2rem)" }}
            >
              Let&apos;s talk
            </motion.h2>

            <motion.a
              variants={pill}
              href={bookHref}
              target={bookingUrl ? "_blank" : undefined}
              rel={bookingUrl ? "noreferrer" : undefined}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="group mt-12 inline-flex items-center gap-4 rounded-full bg-zinc-950 px-9 py-6 text-lg font-medium text-white shadow-[0_24px_60px_-18px_rgba(0,0,0,0.45)] transition-shadow duration-500 hover:shadow-[0_30px_70px_-16px_rgba(0,0,0,0.55)] sm:text-xl"
            >
              <Calendar className="h-6 w-6" strokeWidth={1.6} />
              Book a call
              <ArrowUpRight className="h-5 w-5 text-white/80 transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </motion.a>

            <motion.p variants={item} className="mt-12 text-xs uppercase tracking-[0.18em] text-zinc-400 sm:text-sm">
              15 min intro call
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
