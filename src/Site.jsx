import { useSmoothScroll } from './lib/useSmoothScroll.js'
import Preloader from './sections/Preloader.jsx'
import Hero from './sections/Hero.jsx'
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
import { Component as KineticNav } from './components/ui/sterling-gate-kinetic-navigation'

export default function Site() {
  useSmoothScroll()
  return (
    <main>
      <KineticNav />
      {/* Hero overlaps the preloader (negative margin = preloader height) so it can
          be revealed inside the expanding circular hole. */}
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
