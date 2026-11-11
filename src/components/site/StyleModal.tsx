import { CalendarClock, Clock, Droplets } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useSite } from '@/context/SiteContext';
import { formatDuration, formatMoney, unitPrice } from '@/lib/format';
import type { Service } from '@/lib/types';

interface StyleModalProps {
  service: Service | null;
  onClose: () => void;
  onBook: (serviceId: string) => void;
}

export function StyleModal({ service, onClose, onBook }: StyleModalProps) {
  const { currency, content } = useSite();
  const rate = content?.settings.ghs_per_usd ?? 1;
  const price = service ? unitPrice(service, currency, rate) : 0;
  const deposit = service ? Math.round(price * service.deposit_percent) / 100 : 0;

  return (
    <Modal open={service !== null} onClose={onClose} label={service?.name ?? 'Style details'} size="lg">
      {service && (
        <div className="grid md:grid-cols-2">
          <div className="relative aspect-[4/5] bg-taupe-200 md:aspect-auto">
            {service.image_url && <img src={service.image_url} alt={service.name} className="h-full w-full object-cover" />}
          </div>
          <div className="flex flex-col gap-6 p-7 sm:p-9">
            <div>
              <p className="eyebrow mb-2">{service.category}</p>
              <h2 className="text-4xl">{service.name}</h2>
              <p className="mt-4 text-sm leading-[1.5] text-taupe-700">{service.description}</p>
            </div>

            <dl className="grid grid-cols-2 gap-4 rounded-2xl bg-cream-200/70 p-5">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-taupe-500">Price</dt>
                <dd className="mt-1 text-xl font-bold text-espresso-900">{formatMoney(price, currency)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-taupe-500">Duration</dt>
                <dd className="mt-1 flex items-center gap-1.5 text-xl font-bold text-espresso-900">
                  <Clock className="h-4 w-4 text-bronze-600" />
                  {formatDuration(service.duration_minutes)}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs font-semibold uppercase tracking-wider text-taupe-500">Deposit to reserve</dt>
                <dd className="mt-1 text-sm text-espresso-800">
                  <span className="font-bold">{formatMoney(deposit, currency)}</span> ({service.deposit_percent}% of the
                  price), due to confirm your booking.
                </dd>
              </div>
            </dl>

            <div className="space-y-2">
              <h3 className="flex items-center gap-2 font-display text-2xl">
                <Droplets className="h-5 w-5 text-bronze-600" />
                Hair preparation
              </h3>
              <p className="text-sm leading-[1.5] text-taupe-700">{service.prep_instructions}</p>
            </div>

            <button
              type="button"
              onClick={() => onBook(service.id)}
              className="mt-auto inline-flex items-center justify-center gap-2 rounded-full bg-espresso-800 px-6 py-4 text-sm font-bold text-cream-50 transition duration-300 hover:-translate-y-0.5 hover:bg-espresso-900"
            >
              <CalendarClock className="h-4 w-4" />
              Book this style
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
