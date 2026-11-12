import Preloader from './sections/Preloader.jsx'
import Hero from './sections/Hero.jsx'
import { Component as KineticNav } from './components/ui/sterling-gate-kinetic-navigation'
import Manifesto from './sections/Manifesto.jsx'
import FeaturedProjects from './sections/FeaturedProjects.jsx'
import BeforeAfter from './sections/BeforeAfter.jsx'
import Services from './sections/Services.jsx'
import Testimonials from './sections/Testimonials.jsx'
import Team from './sections/Team.jsx'
import FAQ from './sections/FAQ.jsx'
import Contact from './sections/Contact.jsx'
import Footer from './sections/Footer.jsx'
import ScrollReveal from './components/ui/scroll-reveal'

/* Tablet version. Every section is open. Tablets scroll natively (no Lenis), like phones. */
const LINKS = [
  { label: 'About us', target: '#manifesto', shape: '1' },
  { label: 'Our work', target: '#projects', shape: '2' },
  { label: 'Services', target: '#services', shape: '3' },
  { label: 'Team', target: '#team', shape: '4' },
  { label: 'Contact us', target: '#contact', shape: '5' },
]

export default function TabletSite() {
  return (
    <main>
      <KineticNav links={LINKS} />
      <Preloader />
      <div style={{ marginTop: '-280svh' }}>
        <Hero />
      </div>
      <Manifesto />
      <FeaturedProjects />
      <BeforeAfter />
      <Services />
      <Testimonials />
      <Team />
      <FAQ />
      {/* Contact opens up like doors while the footer appears behind it */}
      <ScrollReveal behind={<Footer />}>
        <Contact />
      </ScrollReveal>
    </main>
  )
}
