import { Check } from 'lucide-react';
import { formatDuration, formatMoney, unitPrice } from '@/lib/format';
import { useSite } from '@/context/SiteContext';
import type { BookingDraft } from '@/components/booking/BookingWizard';
import type { SiteContent } from '@/lib/types';

interface ServiceStepProps {
  content: SiteContent;
  draft: BookingDraft;
  onChange: (patch: Partial<BookingDraft>) => void;
}

export function ServiceStep({ content, draft, onChange }: ServiceStepProps) {
  const { currency } = useSite();
  const rate = content.settings.ghs_per_usd;

  const toggleAddon = (id: string) => {
    const addonIds = draft.addonIds.includes(id)
      ? draft.addonIds.filter((a) => a !== id)
      : [...draft.addonIds, id];
    onChange({ addonIds, startAt: null });
  };

  return (
    <div className="space-y-10">
      <div>
        <h3 className="text-3xl">Choose your style</h3>
        <p className="mt-2 text-sm text-taupe-600">Select one hairstyle for this visit.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {content.services.map((service) => {
            const selected = draft.serviceId === service.id;
            return (
              <button
                key={service.id}
                type="button"
                aria-pressed={selected}
                onClick={() => onChange({ serviceId: service.id, startAt: null })}
                className={`group relative flex items-center gap-4 rounded-2xl border p-3 pr-5 text-left transition duration-300 ${
                  selected
                    ? 'border-bronze-500 bg-white shadow-lg ring-4 ring-bronze-300/30'
                    : 'border-taupe-200 bg-white hover:-translate-y-0.5 hover:border-bronze-400 hover:shadow-md'
                }`}
              >
                <div className="h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-taupe-200">
                  {service.image_url && <img src={service.image_url} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-xl text-espresso-900">{service.name}</p>
                  <p className="text-xs text-taupe-600">
                    {formatMoney(unitPrice(service, currency, rate), currency)} · {formatDuration(service.duration_minutes)}
                  </p>
                </div>
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition ${
                    selected ? 'border-bronze-500 bg-bronze-500 text-white' : 'border-taupe-300 text-transparent'
                  }`}
                >
                  <Check className="h-3.5 w-3.5" />
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {content.addons.length > 0 && (
        <div>
          <h3 className="text-2xl">Add-ons</h3>
          <p className="mt-2 text-sm text-taupe-600">Optional extras that make your look complete.</p>
          <div className="mt-5 grid gap-3">
            {content.addons.map((addon) => {
              const selected = draft.addonIds.includes(addon.id);
              return (
                <button
                  key={addon.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleAddon(addon.id)}
                  className={`flex items-center justify-between gap-4 rounded-2xl border px-5 py-4 text-left transition duration-300 ${
                    selected ? 'border-bronze-500 bg-cream-200' : 'border-taupe-200 bg-white hover:border-bronze-400'
                  }`}
                >
                  <span>
                    <span className="block font-semibold text-espresso-900">{addon.name}</span>
                    <span className="block text-xs text-taupe-600">
                      {addon.description} · +{formatDuration(addon.extra_minutes)}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-3">
                    <span className="font-bold text-espresso-900">
                      {formatMoney(unitPrice(addon, currency, rate), currency)}
                    </span>
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-md border transition ${
                        selected ? 'border-bronze-500 bg-bronze-500 text-white' : 'border-taupe-300 text-transparent'
                      }`}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
