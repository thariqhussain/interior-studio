import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

/* Frequently asked questions – edit the list below. The answers are drafted to match the rest of the
   site (the studio's services, timeline and 12-month aftercare); confirm them with the studio. */
const FAQS = [
  {
    q: 'How much does an interior design project cost?',
    a: 'Every project is quoted individually. After a first call and a site visit we give you a clear design fee and an estimated build budget, so there are no surprises later.',
  },
  {
    q: 'How long does a project take?',
    a: 'A typical home takes about 20 weeks from the first meeting to handover: discovery and concept in the first month, detailed design over the following four weeks, then execution on site. Smaller projects are quicker.',
  },
  {
    q: 'Can you work with my own contractors?',
    a: 'Yes. We can coordinate your contractors and craftspeople, or bring in our trusted team and manage the whole build for you, whichever you prefer.',
  },
  {
    q: 'Will I see the design before anything is built?',
    a: 'Always. You review the mood boards and first layouts, then realistic 3D renders and a full specification pack, and nothing goes to site until you have signed off the final design and budget.',
  },
  {
    q: 'What if I want to change something later?',
    a: 'Changes are easy before you sign off the final design. Once building has started we will tell you how a change affects the schedule and budget before we go ahead.',
  },
  {
    q: 'Do you offer support after handover?',
    a: 'Yes. You receive a care guide for your new space and 12 months of aftercare, so if something needs attention we are one message away.',
  },
]

const EASE = [0.22, 1, 0.36, 1]

function Item({ item, index, open, onToggle }) {
  const id = `faq-${index}`
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.7, ease: EASE, delay: index * 0.06 }}
      className="border-b border-white/10"
    >
      <h3>
        <button
          type="button"
          id={`${id}-button`}
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          onClick={onToggle}
          className="group flex w-full items-center justify-between gap-6 py-6 text-left outline-none focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-white/60 sm:py-7"
        >
          <span className="text-lg font-medium leading-snug text-white sm:text-xl">{item.q}</span>
          <ChevronDown
            aria-hidden="true"
            className={`size-5 shrink-0 text-white/60 transition-transform duration-300 group-hover:text-white motion-reduce:transition-none ${open ? 'rotate-180' : ''}`}
          />
        </button>
      </h3>
      {/* grid-rows 0fr → 1fr animates the height without measuring it */}
      <div
        id={`${id}-panel`}
        role="region"
        aria-labelledby={`${id}-button`}
        className={`grid motion-reduce:transition-none ${
          open
            ? 'visible grid-rows-[1fr] [transition:grid-template-rows_350ms_ease,visibility_0s]'
            : 'invisible grid-rows-[0fr] [transition:grid-template-rows_350ms_ease,visibility_0s_linear_350ms]'
        }`}
      >
        <div className="overflow-hidden">
          <p className="max-w-2xl pb-7 pr-10 text-base leading-relaxed text-white/60">{item.a}</p>
        </div>
      </div>
    </motion.div>
  )
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null) // one answer open at a time

  return (
    <section id="faq" className="relative bg-[#0a0a0a] text-white">
      <div className="mx-auto grid max-w-[1500px] gap-12 px-6 py-24 sm:px-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16 lg:px-16 lg:py-32 xl:gap-24">
        {/* left: heading, left-aligned */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.9, ease: EASE }}
          className="self-start text-left lg:sticky lg:top-32"
        >
          <p className="text-base font-medium text-white/55">FAQ</p>
          <h2 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-[-0.035em] sm:text-5xl xl:text-6xl">
            Frequently
            <br />
            asked questions
          </h2>
          <p className="mt-8 max-w-md text-xl leading-relaxed text-white/50">
            Answers to the questions we hear most. Cannot find what you are looking for? Reach out.
          </p>
          <p className="mt-10 text-base text-white/55">
            Still have questions?{' '}
            <a
              href="#contact"
              className="font-medium text-white underline decoration-white/60 underline-offset-[6px] transition-colors hover:decoration-white"
            >
              Contact us
            </a>
          </p>
        </motion.div>

        {/* right: accordion */}
        <div className="border-t border-white/10 lg:border-t-0 lg:pt-3">
          {FAQS.map((item, i) => (
            <Item
              key={item.q}
              item={item}
              index={i}
              open={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
