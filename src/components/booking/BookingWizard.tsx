import { useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { ServiceStep } from '@/components/booking/ServiceStep';
import { ScheduleStep } from '@/components/booking/ScheduleStep';
import { DetailsStep } from '@/components/booking/DetailsStep';
import { ReviewStep } from '@/components/booking/ReviewStep';
import { ConfirmationStep } from '@/components/booking/ConfirmationStep';
import { createBooking, uploadReferenceImage } from '@/lib/api/site';
import { useSite } from '@/context/SiteContext';
import type { BookingReceipt, SiteContent } from '@/lib/types';

export interface BookingDraft {
  serviceId: string | null;
  addonIds: string[];
  date: string;
  startAt: string | null;
  name: string;
  email: string;
  phone: string;
  notes: string;
  referenceFile: File | null;
  termsAccepted: boolean;
}

const STEP_LABELS = ['Style', 'Date & time', 'Details', 'Review', 'Confirmed'];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[+0-9 ()-]{7,25}$/;
const MAX_REFERENCE_BYTES = 5 * 1024 * 1024;

function validateStep(step: number, draft: BookingDraft): string | null {
  if (step === 0 && !draft.serviceId) return 'Please choose a hairstyle to continue.';
  if (step === 1 && !draft.startAt) return 'Please pick an available time.';
  if (step === 2) {
    if (draft.name.trim().length < 2) return 'Please enter your full name.';
    if (!EMAIL_PATTERN.test(draft.email.trim())) return 'Please enter a valid email address.';
    if (!PHONE_PATTERN.test(draft.phone.trim())) return 'Please enter a valid phone number.';
    if (draft.notes.length > 1000) return 'Notes must be 1000 characters or fewer.';
    if (draft.referenceFile && draft.referenceFile.size > MAX_REFERENCE_BYTES) {
      return 'Reference photos must be 5 MB or smaller.';
    }
  }
  return null;
}

interface BookingWizardProps {
  content: SiteContent;
  initialServiceId: string | null;
  onClose: () => void;
}

export function BookingWizard({ content, initialServiceId, onClose }: BookingWizardProps) {
  const { currency } = useSite();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<BookingDraft>({
    serviceId: initialServiceId,
    addonIds: [],
    date: '',
    startAt: null,
    name: '',
    email: '',
    phone: '',
    notes: '',
    referenceFile: null,
    termsAccepted: false,
  });
  const [stepError, setStepError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<BookingReceipt | null>(null);

  const update = (patch: Partial<BookingDraft>) => {
    setStepError(null);
    setDraft((prev) => ({ ...prev, ...patch }));
  };

  const goNext = () => {
    const error = validateStep(step, draft);
    if (error) {
      setStepError(error);
      return;
    }
    setStepError(null);
    setStep((s) => s + 1);
  };

  const submit = async () => {
    if (!draft.serviceId || !draft.startAt || !draft.termsAccepted) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const referencePath = draft.referenceFile ? await uploadReferenceImage(draft.referenceFile) : null;
      const result = await createBooking({
        serviceId: draft.serviceId,
        addonIds: draft.addonIds,
        startAt: draft.startAt,
        clientName: draft.name.trim(),
        clientEmail: draft.email.trim(),
        clientPhone: draft.phone.trim(),
        notes: draft.notes.trim(),
        referencePath,
        currency,
      });
      setReceipt(result);
      setStep(4);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Your booking could not be completed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const showNav = step < 3;

  return (
    <Modal open onClose={onClose} label="Book an appointment" size="lg">
      <div className="flex min-h-wizard flex-col">
        <div className="border-b border-taupe-200 bg-cream-50/95 px-6 pb-5 pt-7 sm:px-10">
          <p className="eyebrow mb-4">Book an appointment</p>
          <ol className="flex items-center gap-2" aria-label="Booking progress">
            {STEP_LABELS.map((label, index) => {
              const done = index < step;
              const current = index === step;
              return (
                <li key={label} className="flex min-w-0 flex-1 flex-col gap-2">
                  <span
                    className={`h-1 w-full rounded-full transition-colors duration-500 ${
                      done || current ? 'bg-bronze-500' : 'bg-taupe-200'
                    }`}
                  />
                  <span
                    className={`hidden truncate text-[11px] font-semibold uppercase tracking-wider sm:block ${
                      current ? 'text-espresso-900' : 'text-taupe-500'
                    }`}
                  >
                    {label}
                  </span>
                </li>
              );
            })}
          </ol>
          <p className="mt-3 text-xs font-semibold text-taupe-600 sm:hidden">
            Step {step + 1} of {STEP_LABELS.length}: {STEP_LABELS[step]}
          </p>
        </div>

        <div key={step} className="flex-1 animate-fade-up px-6 py-8 sm:px-10">
          {step === 0 && (
            <ServiceStep content={content} draft={draft} onChange={update} />
          )}
          {step === 1 && (
            <ScheduleStep content={content} draft={draft} onChange={update} />
          )}
          {step === 2 && <DetailsStep draft={draft} onChange={update} />}
          {step === 3 && (
            <ReviewStep
              content={content}
              draft={draft}
              submitting={submitting}
              error={submitError}
              onSubmit={submit}
              onEdit={setStep}
              onChange={update}
            />
          )}
          {step === 4 && receipt && <ConfirmationStep content={content} receipt={receipt} onClose={onClose} />}
        </div>

        {showNav && (
          <div className="sticky bottom-0 flex flex-col gap-3 border-t border-taupe-200 bg-cream-50/95 px-6 py-5 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-10">
            <div className="min-h-5 text-sm font-medium text-red-700" role="alert">
              {stepError}
            </div>
            <div className="flex w-full items-center gap-3 sm:w-auto">
              {step > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setStepError(null);
                    setStep((s) => s - 1);
                  }}
                  className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-espresso-800 transition hover:bg-taupe-100"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
              )}
              <button
                type="button"
                onClick={goNext}
                className="group inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-espresso-800 px-7 py-3 text-sm font-bold sm:flex-none text-cream-50 transition duration-300 hover:-translate-y-0.5 hover:bg-espresso-900"
              >
                Continue
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
