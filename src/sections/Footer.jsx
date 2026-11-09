import SiteFooter from '@/components/ui/site-footer'

/* =====================================================================
   FOOTER DATA – everything the footer shows lives here.
   These are the values carried over from the previous footer (a template with the author's
   placeholder details: "kedhareswer", 21st.dev links, hello@example.com…). Replace them with the
   studio's real details, and delete any line you do not want – the footer hides what is missing.
   ===================================================================== */
const ME = 'kedhareswer'
const HOME = `https://21st.dev/@${ME}`
const GITHUB = `https://github.com/${ME}`
const EMAIL = 'hello@example.com'

const FOOTER = {
  brand: 'kedhar.', // small wordmark, top-left
  heading: 'Ready to begin?',

  // chip above the heading (was "status")
  status: { label: 'open for collaborations', href: `mailto:${EMAIL}` },

  // top bar category links (were the "index" and "elsewhere" columns)
  nav: [
    // index
    { label: 'Components', href: HOME },
    { label: 'Templates', href: HOME },
    { label: 'Preloaders', href: HOME },
    // elsewhere
    { label: 'GitHub', href: GITHUB },
    { label: '21st.dev', href: HOME },
    { label: 'Source', href: `${GITHUB}/21stdev-my-components` },
  ],

  // top-right: tag + live clock
  mark: 'KS / 2026',
  timeZone: 'Asia/Kolkata',
  timeLabel: 'IST',

  // the two big pills (were the "say hi" bubble and the "work." link)
  primary: [
    { label: 'Say hi', href: `mailto:${EMAIL}`, icon: 'mail' },
    { label: 'Work', href: HOME, icon: 'arrow' },
  ],

  // email sign-up (was the newsletter pill). Connect `onSubscribe` to your email service.
  newsletter: { label: 'new components, once a month', placeholder: 'your@email' },

  // small pills (were "privacy", "terms" and the GitHub / 21st.dev social icons)
  secondary: [
    { label: 'Privacy Policy', href: '#', icon: 'shield' },
    { label: 'Terms of Service', href: '#', icon: 'doc' },
    { label: 'Support', href: `mailto:${EMAIL}`, icon: 'support' },
    { label: 'GitHub', href: GITHUB, icon: 'github' },
    { label: '21st.dev', href: HOME, icon: 'globe' },
  ],

  // bottom bar
  copyright: '© 2026 Kedhareswer',
  credit: 'designed & built by hand',
  handle: { label: `@${ME}`, href: HOME },
}

export default function Footer() {
  return (
    <div id="footer" className="h-full w-full">
      <SiteFooter data={FOOTER} />
    </div>
  )
}
