import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const POLICIES = [
  {
    question: 'How do deposits work?',
    answer:
      'A non-refundable deposit reserves your appointment. Each style shows its own deposit amount, usually half of the service price. Pay by the method in your confirmation within 24 hours, and your slot is locked in once it arrives.',
  },
  {
    question: 'What is your cancellation policy?',
    answer:
      'Please give at least 48 hours notice to cancel or reschedule. Within 48 hours, the deposit is kept to cover the reserved time. Rescheduling once within 48 hours is welcome when a slot is available.',
  },
  {
    question: 'What happens if I arrive late?',
    answer:
      'A 15 minute grace period applies. Arrivals later than that may shorten your appointment to keep the schedule, and a late arrival fee of 10% of the service price applies. Arriving more than 30 minutes late may mean rebooking.',
  },
  {
    question: 'How should I prepare my hair?',
    answer:
      'Arrive with clean, dry, detangled hair unless your style page says otherwise. Avoid heavy oils or product build-up on the scalp for 48 hours. Trim split ends beforehand if you can, and let us know about any scalp sensitivities.',
  },
  {
    question: 'Can I bring my own hair or beads?',
    answer:
      'Yes, for extensions and beads you may bring your own, provided it is pre-washed and packaged. Please mention it in the notes at booking so we can plan the time needed.',
  },
];

export function PoliciesSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="policies" className="scroll-mt-24 bg-cream-200/50 py-16 sm:py-24">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 sm:px-8 lg:grid-cols-[1fr_1.4fr] lg:gap-14">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <p className="eyebrow mb-3">Good to know</p>
          <h2 className="text-display-lg">Policies and frequently asked questions</h2>
          <p className="mt-5 max-w-md text-sm leading-[1.5] text-taupe-700">
            Clear expectations keep every appointment calm and on time. Here is how we work together.
          </p>
        </div>

        <div className="divide-y divide-taupe-200 overflow-hidden rounded-3xl border border-taupe-200 bg-white">
          {POLICIES.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={item.question}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full items-center justify-between gap-6 px-6 py-5 text-left transition hover:bg-cream-100 sm:px-8"
                >
                  <span className="font-display text-xl text-espresso-900 sm:text-2xl">{item.question}</span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-bronze-600 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                <div
                  className={`grid transition-[grid-template-rows] duration-300 ease-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
                >
                  <div className="overflow-hidden">
                    <p className="px-6 pb-6 text-sm leading-[1.5] text-taupe-700 sm:px-8">{item.answer}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
