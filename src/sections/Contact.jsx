import { ContactCta } from '@/components/ui/contact-cta'

export default function Contact() {
  return (
    <section id="contact" className="relative bg-white">
      {/* swap in the studio's real email, and a scheduling link (e.g. Cal.com / Calendly) for "Book a call" */}
      <ContactCta email="hello@example.com" />
    </section>
  )
}
