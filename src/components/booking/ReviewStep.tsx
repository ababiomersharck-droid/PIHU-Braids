import { CalendarCheck2, Clock, Wallet } from 'lucide-react';
import type { BookingDraft } from '@/components/booking/BookingWizard';
import { CurrencyToggle } from '@/components/site/CurrencyToggle';
import { useSite } from '@/context/SiteContext';
import { formatDateTime, formatDuration, formatMoney, unitPrice } from '@/lib/format';
import type { SiteContent } from '@/lib/types';

interface ReviewStepProps {
  content: SiteContent;
  draft: BookingDraft;
  submitting: boolean;
  error: string | null;
  onSubmit: () => void;
  onEdit: (step: number) => void;
  onChange: (patch: Partial<BookingDraft>) => void;
}

export function ReviewStep({ content, draft, submitting, error, onSubmit, onEdit, onChange }: ReviewStepProps) {
  const { currency, setCurrency } = useSite();
  const { settings } = content;
  const service = content.services.find((s) => s.id === draft.serviceId);
  const addons = content.addons.filter((a) => draft.addonIds.includes(a.id));

  if (!service || !draft.startAt) {
    return <p className="text-sm text-taupe-600">Please go back and complete your selections.</p>;
  }

  const rate = settings.ghs_per_usd;
  const addonTotal = addons.reduce((sum, a) => sum + unitPrice(a, currency, rate), 0);
  const total = unitPrice(service, currency, rate) + addonTotal;
  const deposit = Math.round(total * service.deposit_percent) / 100;
  const duration = service.duration_minutes + addons.reduce((sum, a) => sum + a.extra_minutes, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-3xl">Review and deposit</h3>
          <p className="mt-2 text-sm text-taupe-600">Check your appointment, then confirm to reserve your slot.</p>
        </div>
        <CurrencyToggle value={currency} onChange={setCurrency} />
      </div>

      <div className="overflow-hidden rounded-3xl border border-taupe-200 bg-white shadow-sm">
        <div className="flex gap-5 border-b border-taupe-200 p-5">
          <div className="h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-taupe-200">
            {service.image_url && <img src={service.image_url} alt="" className="h-full w-full object-cover" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-2xl text-espresso-900">{service.name}</p>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-taupe-600">
              <CalendarCheck2 className="h-4 w-4" />
              {formatDateTime(draft.startAt, settings.timezone)}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-taupe-600">
              <Clock className="h-4 w-4" />
              About {formatDuration(duration)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onEdit(0)}
            className="-m-2 self-start p-2 text-xs font-bold uppercase tracking-wider text-bronze-600 transition hover:text-bronze-700"
          >
            Edit
          </button>
        </div>

        <ul className="divide-y divide-taupe-100 px-5 text-sm">
          <li className="flex justify-between py-3">
            <span className="text-taupe-700">{service.name}</span>
            <span className="font-semibold">{formatMoney(unitPrice(service, currency, rate), currency)}</span>
          </li>
          {addons.map((addon) => (
            <li key={addon.id} className="flex justify-between py-3">
              <span className="text-taupe-700">{addon.name}</span>
              <span className="font-semibold">{formatMoney(unitPrice(addon, currency, rate), currency)}</span>
            </li>
          ))}
          <li className="flex justify-between py-3 text-base">
            <span className="font-bold text-espresso-900">Total</span>
            <span className="font-bold text-espresso-900">{formatMoney(total, currency)}</span>
          </li>
        </ul>
      </div>

      <div className="rounded-3xl bg-espresso-800 p-6 text-cream-50 shadow-xl">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-bronze-300">
          <Wallet className="h-4 w-4" />
          Deposit due now ({service.deposit_percent}%)
        </p>
        <p className="mt-3 font-display text-5xl">{formatMoney(deposit, currency)}</p>
        <p className="mt-4 text-sm leading-[1.5] text-cream-200/90">{settings.payment_instructions}</p>
      </div>

      <div className="text-sm text-taupe-700">
        <p>
          <span className="font-semibold text-espresso-900">{draft.name}</span> · {draft.email} · {draft.phone}
        </p>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-taupe-200 bg-white p-5 text-sm leading-[1.5] text-taupe-700 transition hover:border-bronze-500">
        <input
          type="checkbox"
          checked={draft.termsAccepted}
          onChange={(e) => onChange({ termsAccepted: e.target.checked })}
          className="mt-0.5 h-4 w-4 shrink-0 accent-bronze-500"
        />
        <span>
          I understand the deposit is non-refundable and that cancellations within 48 hours of the appointment forfeit it.
        </span>
      </label>

      {error && (
        <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={onSubmit}
        disabled={submitting || !draft.termsAccepted}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-bronze-500 px-6 py-4 text-sm font-bold text-white shadow-lg transition duration-300 hover:-translate-y-0.5 hover:bg-bronze-600 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {submitting ? 'Confirming your booking' : 'Confirm booking'}
      </button>
    </div>
  );
}
