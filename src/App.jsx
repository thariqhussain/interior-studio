import Preloader from './sections/Preloader.jsx'
import Hero from './sections/Hero.jsx'
import Manifesto from './sections/Manifesto.jsx'
import FeaturedProjects from './sections/FeaturedProjects.jsx'
import Process from './sections/Process.jsx'
import BeforeAfter from './sections/BeforeAfter.jsx'
import Services from './sections/Services.jsx'
import Numbers from './sections/Numbers.jsx'
import Testimonials from './sections/Testimonials.jsx'
import Team from './sections/Team.jsx'
import FAQ from './sections/FAQ.jsx'
import Contact from './sections/Contact.jsx'
import Footer from './sections/Footer.jsx'

export default function App() {
  return (
    <main>
      <Preloader />
      <Hero />
      <Manifesto />
      <FeaturedProjects />
      <Process />
      <BeforeAfter />
      <Services />
      <Numbers />
      <Testimonials />
      <Team />
      <FAQ />
      <Contact />
      <Footer />
    </main>
  )
}
