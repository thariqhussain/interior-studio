import SiteFooter from '@/components/ui/site-footer'

/* =====================================================================
   FOOTER DATA – everything the footer shows lives here.
   PLACEHOLDERS: the email, phone number, address link, Instagram handle and booking link below are examples –
   replace them with the studio's real details, and delete any line you do not want (the footer hides what is missing).
   Links that start with "#" glide to that section of the page.
   ===================================================================== */
const EMAIL = 'hello@example.com'
const PHONE = '+910000000000'
const INSTAGRAM = 'https://instagram.com/your-studio'
const MAP = 'https://maps.google.com/?q=your+studio+address'
const BOOKING_URL = 'https://cal.com/your-studio' // same link as the Contact section's "Book a call"

const FOOTER = {
  brand: 'Elena Voss.', // small wordmark, top-left
  heading: 'Let’s make it home.',

  // chip above the heading
  status: { label: 'now booking projects for 2026', href: `mailto:${EMAIL}` },

  // top bar links (scroll to the sections of this page)
  nav: [
    { label: 'Work', href: '#projects' },
    { label: 'Services', href: '#services' },
    { label: 'Before & After', href: '#before-after' },
    { label: 'Team', href: '#team' },
    { label: 'FAQ', href: '#faq' },
    { label: 'Contact', href: '#contact' },
  ],

  // top-right: tag + live clock (the studio's local time)
  mark: 'Interior Studio',
  timeZone: 'Asia/Kolkata',
  timeLabel: 'IST',

  // the two big pills
  primary: [
    { label: 'Book a consultation', href: BOOKING_URL, icon: 'mail' },
    { label: 'View our work', href: '#projects', icon: 'arrow' },
  ],

  // email sign-up. Connect `onSubscribe` to your email service.
  newsletter: { label: 'design notes & new projects, once a month', placeholder: 'your@email' },

  // small pills
  secondary: [
    { label: 'Instagram', href: INSTAGRAM, icon: 'instagram' },
    { label: 'Call us', href: `tel:${PHONE}`, icon: 'phone' },
    { label: 'Visit the studio', href: MAP, icon: 'pin' },
    { label: 'Privacy Policy', href: '#', icon: 'shield' },
    { label: 'Terms of Service', href: '#', icon: 'doc' },
  ],

  // bottom bar
  copyright: '© 2026 Elena Voss Interior Studio',
  credit: 'designed to be lived in',
}

export default function Footer() {
  return (
    <div id="footer" className="h-full w-full">
      <SiteFooter data={FOOTER} />
    </div>
  )
}
