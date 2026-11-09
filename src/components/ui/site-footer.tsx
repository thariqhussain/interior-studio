"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { ArrowUpRight, Check, FileText, Heart, LifeBuoy, Mail, Send, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FooterLink {
    label: string;
    href: string;
}

export type FooterIcon = "mail" | "arrow" | "github" | "globe" | "shield" | "doc" | "support";

export interface FooterPill extends FooterLink {
    icon?: FooterIcon;
}

export interface FooterData {
    /** Small wordmark, top-left. */
    brand: string;
    /** Big question in the middle. */
    heading: string;
    /** "Open for ..." chip above the heading. Omit to hide. */
    status?: FooterLink;
    /** Top bar: horizontal category links. */
    nav: FooterLink[];
    /** Short tag + live clock, top-right. Omit `timeZone` to hide the clock. */
    mark?: string;
    timeZone?: string;
    timeLabel?: string;
    /** Two big glass pills. */
    primary: FooterPill[];
    /** Optional email sign-up under the primary pills. */
    newsletter?: { label: string; placeholder: string };
    onSubscribe?: (email: string) => void;
    /** Row of small pills. */
    secondary: FooterPill[];
    /** Bottom bar. */
    copyright: string;
    credit?: string;
    handle?: FooterLink;
}

const GlobeIcon = ({ className }: { className?: string }) => (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c2.6 2.6 4 5.7 4 9s-1.4 6.4-4 9c-2.6-2.6-4-5.7-4-9s1.4-6.4 4-9z" />
    </svg>
);

const GithubIcon = ({ className }: { className?: string }) => (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="currentColor">
        <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49v-1.7c-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.63.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.9 1.56 2.35 1.11 2.92.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.72 0 0 .84-.28 2.75 1.05A9.4 9.4 0 0 1 12 6.84c.85 0 1.7.12 2.5.35 1.9-1.33 2.74-1.05 2.74-1.05.55 1.42.2 2.46.1 2.72.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.8-4.57 5.05.36.32.68.94.68 1.9v2.82c0 .27.18.6.69.49A10.26 10.26 0 0 0 22 12.25C22 6.58 17.52 2 12 2z" />
    </svg>
);

function Icon({ name, className }: { name?: FooterIcon; className?: string }) {
    const c = cn("size-4 shrink-0", className);
    switch (name) {
        case "mail": return <Mail aria-hidden="true" className={c} />;
        case "arrow": return <ArrowUpRight aria-hidden="true" className={c} />;
        case "github": return <GithubIcon className={c} />;
        case "globe": return <GlobeIcon className={c} />;
        case "shield": return <Shield aria-hidden="true" className={c} />;
        case "doc": return <FileText aria-hidden="true" className={c} />;
        case "support": return <LifeBuoy aria-hidden="true" className={c} />;
        default: return null;
    }
}

const isExternal = (href: string) => /^https?:/.test(href);

/** Link that ignores placeholder "#" hrefs and opens external URLs in a new tab. */
function Anchor({ href, className, children, label }: { href: string; className?: string; children: ReactNode; label?: string }) {
    const placeholder = !href || href === "#";
    return (
        <a
            href={href || "#"}
            aria-label={label}
            onClick={placeholder ? (e) => e.preventDefault() : undefined}
            className={className}
            {...(isExternal(href) ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
            {children}
        </a>
    );
}

// glass pill: translucent + blurred + hairline border; inverts to solid white on hover with a soft glow
const GLASS =
    "group inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.06] text-white backdrop-blur-md " +
    "transition-[background-color,color,box-shadow,transform,border-color] duration-300 ease-out " +
    "hover:-translate-y-0.5 hover:border-white hover:bg-white hover:text-black hover:shadow-[0_0_36px_rgba(255,255,255,0.28)] " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0b0b] " +
    "motion-reduce:transition-none motion-reduce:hover:translate-y-0";

function useClock(timeZone?: string) {
    const [time, setTime] = useState("");
    useEffect(() => {
        if (!timeZone) return;
        const fmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone });
        const tick = () => setTime(fmt.format(new Date()));
        tick();
        const id = window.setInterval(tick, 15_000);
        return () => window.clearInterval(id);
    }, [timeZone]);
    return time;
}

function Newsletter({ label, placeholder, onSubscribe }: { label: string; placeholder: string; onSubscribe?: (email: string) => void }) {
    const [email, setEmail] = useState("");
    const [sent, setSent] = useState(false);
    const submit = (e: FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;
        onSubscribe?.(email.trim());
        setSent(true);
        setEmail("");
        window.setTimeout(() => setSent(false), 3500);
    };
    return (
        <form onSubmit={submit} className="flex w-full max-w-sm flex-col items-center gap-2">
            <label htmlFor="footer-email" className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/45">
                {label}
            </label>
            <div className="flex w-full items-center rounded-full border border-white/15 bg-white/[0.06] p-1 pl-5 backdrop-blur-md transition-colors focus-within:border-white/40">
                <input
                    id="footer-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={sent ? "Thanks, you're on the list" : placeholder}
                    className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/40"
                />
                <button
                    type="submit"
                    aria-label="Subscribe"
                    className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-black transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                >
                    {sent ? <Check className="size-4" /> : <Send className="size-4" />}
                </button>
            </div>
        </form>
    );
}

export default function SiteFooter({ data }: { data: FooterData }) {
    const time = useClock(data.timeZone);

    return (
        <footer className="relative flex h-full w-full flex-col overflow-hidden bg-[#0b0b0b] text-white">
            {/* soft light from above (no grid) */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_45%_at_50%_0%,rgba(255,255,255,0.07),transparent)]" />

            {/* top bar: brand · category links · mark + clock */}
            <div className="relative z-10 flex items-center justify-between gap-6 border-b border-white/10 px-6 py-4 sm:px-10 sm:py-5">
                <span className="shrink-0 text-lg font-semibold tracking-tight" style={{ fontFamily: '"Bricolage Grotesque", system-ui, sans-serif' }}>
                    {data.brand}
                </span>
                <nav aria-label="Footer" className="hidden min-w-0 flex-1 items-center justify-center gap-x-6 gap-y-1 font-mono text-[11px] uppercase tracking-[0.22em] text-white/55 md:flex md:flex-wrap">
                    {data.nav.map((l) => (
                        <Anchor key={l.label} href={l.href} className="transition-colors hover:text-white">
                            {l.label}
                        </Anchor>
                    ))}
                </nav>
                <div className="flex shrink-0 items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-white/55">
                    {data.mark && <span>{data.mark}</span>}
                    {data.timeZone && time && (
                        <span className="tabular-nums">
                            {time} {data.timeLabel}
                        </span>
                    )}
                </div>
            </div>

            {/* the same links, for small screens (the top bar hides them) */}
            <nav aria-label="Footer (mobile)" className="relative z-10 flex flex-wrap justify-center gap-x-5 gap-y-1 px-6 pt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-white/55 md:hidden">
                {data.nav.map((l) => (
                    <Anchor key={l.label} href={l.href} className="transition-colors hover:text-white">
                        {l.label}
                    </Anchor>
                ))}
            </nav>

            {/* centre: status, heading, buttons, newsletter */}
            <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center sm:gap-8">
                {data.status && (
                    <Anchor href={data.status.href} className={cn(GLASS, "px-4 py-1.5 text-xs")}>
                        <span className="relative flex size-1.5">
                            <span className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-60 motion-reduce:animate-none" />
                            <span className="relative inline-flex size-1.5 rounded-full bg-current" />
                        </span>
                        {data.status.label}
                    </Anchor>
                )}

                <h2
                    className="bg-gradient-to-b from-white via-white to-white/35 bg-clip-text text-5xl font-bold leading-[0.95] tracking-tighter text-transparent drop-shadow-[0_10px_40px_rgba(255,255,255,0.12)] sm:text-7xl lg:text-8xl"
                    style={{ fontFamily: '"Bricolage Grotesque", system-ui, sans-serif' }}
                >
                    {data.heading}
                </h2>

                <div className="flex w-full max-w-md flex-col items-stretch gap-3 sm:max-w-none sm:flex-row sm:items-center sm:justify-center sm:gap-4">
                    {data.primary.map((b) => (
                        <Anchor key={b.label} href={b.href} className={cn(GLASS, "px-7 py-3.5 text-sm font-medium sm:px-9 sm:py-4 sm:text-base")}>
                            <Icon name={b.icon} className="size-5" />
                            {b.label}
                        </Anchor>
                    ))}
                </div>

                {data.newsletter && <Newsletter {...data.newsletter} onSubscribe={data.onSubscribe} />}

                <div className="flex flex-wrap items-center justify-center gap-2.5">
                    {data.secondary.map((l) => (
                        <Anchor key={l.label} href={l.href} label={l.label} className={cn(GLASS, "px-4 py-2 text-xs text-white/75")}>
                            <Icon name={l.icon} className="size-3.5" />
                            {l.label}
                        </Anchor>
                    ))}
                </div>
            </div>

            {/* bottom bar */}
            <div className="relative z-10 flex flex-col items-center justify-between gap-3 border-t border-white/10 px-6 py-4 font-mono text-[10px] uppercase tracking-[0.2em] text-white/50 sm:flex-row sm:px-10 sm:py-5">
                <span>{data.copyright}</span>
                {(data.credit || data.handle) && (
                    <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-white/10 bg-white/[0.05] px-3.5 py-1.5 text-[9px] tracking-[0.12em] backdrop-blur-md sm:px-4 sm:text-[10px] sm:tracking-[0.2em]">
                        {data.credit && <span>{data.credit}</span>}
                        <Heart aria-hidden="true" className="size-3 fill-white text-white" />
                        {data.handle && (
                            <Anchor href={data.handle.href} className="text-white/80 transition-colors hover:text-white">
                                {data.handle.label}
                            </Anchor>
                        )}
                    </span>
                )}
            </div>
        </footer>
    );
}
