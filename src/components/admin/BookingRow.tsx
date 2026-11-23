import { Camera, Check, CreditCard, MessageCircle } from 'lucide-react';
import { clientMessage, whatsappUrl } from '@/lib/whatsapp';
import { formatDateTime, formatMoney } from '@/lib/format';
import type { Booking, BookingStatus } from '@/lib/types';

export const STATUS_META: Record<BookingStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-amber-100 text-amber-800' },
  confirmed: { label: 'Confirmed', className: 'bg-emerald-100 text-emerald-800' },
  completed: { label: 'Completed', className: 'bg-taupe-200 text-taupe-800' },
  canceled: { label: 'Canceled', className: 'bg-red-100 text-red-700' },
};

const STATUS_ORDER: BookingStatus[] = ['pending', 'confirmed', 'completed', 'canceled'];

interface BookingRowProps {
  booking: Booking;
  timezone: string;
  brandName: string;
  busy: boolean;
  onStatus: (status: BookingStatus) => void;
  onDeposit: (paid: boolean) => void;
  onViewPhoto: () => void;
}

export function BookingRow({ booking, timezone, brandName, busy, onStatus, onDeposit, onViewPhoto }: BookingRowProps) {
  const whatsapp = whatsappUrl(booking.client_phone, clientMessage(booking, brandName, timezone));
  const meta = STATUS_META[booking.status];
  const currency = booking.display_currency;
  const total = currency === 'USD' ? booking.total_usd : booking.total_ghs;
  const deposit = currency === 'USD' ? booking.deposit_usd : booking.deposit_ghs;
  const addons = booking.addon_names.length > 0 ? ` + ${booking.addon_names.join(', ')}` : '';

  return (
    <article className="rounded-2xl border border-taupe-200 bg-white p-5 shadow-sm transition duration-300 hover:shadow-md">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${meta.className}`}>{meta.label}</span>
            <span className="text-xs font-semibold text-taupe-500">#{booking.confirmation_code}</span>
          </div>
          <p className="font-semibold text-espresso-900">{booking.client_name}</p>
          <p className="text-sm text-espresso-800">
            {booking.service_name}
            {addons}
          </p>
          <p className="text-sm text-taupe-600">{formatDateTime(booking.start_at, timezone)} · {booking.duration_minutes} min</p>
          <p className="text-sm text-taupe-600">
            <a href={`tel:${booking.client_phone}`} className="font-medium text-bronze-700 hover:underline">
              {booking.client_phone}
            </a>
            {booking.client_email && <span> · {booking.client_email}</span>}
          </p>
          {booking.notes && <p className="rounded-xl bg-cream-100 px-3 py-2 text-sm text-taupe-700">{booking.notes}</p>}
        </div>

        <div className="shrink-0 text-left sm:text-right">
          <p className="font-display text-2xl text-espresso-900">{formatMoney(total, currency)}</p>
          <p className="text-xs text-taupe-600">Deposit {formatMoney(deposit, currency)}</p>
          <button
            type="button"
            disabled={busy}
            onClick={() => onDeposit(!booking.deposit_paid)}
            className={`mt-2 inline-flex min-h-[2.5rem] items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold transition duration-300 disabled:opacity-50 ${
              booking.deposit_paid ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-taupe-100 text-taupe-700 hover:bg-taupe-200'
            }`}
          >
            {booking.deposit_paid ? <Check className="h-3.5 w-3.5" /> : <CreditCard className="h-3.5 w-3.5" />}
            {booking.deposit_paid ? 'Deposit received' : 'Mark deposit received'}
          </button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-taupe-100 pt-4">
        {whatsapp && (
          <a
            href={whatsapp}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex min-h-[2.5rem] items-center gap-1.5 rounded-full bg-[#25D366]/10 px-3.5 text-xs font-semibold text-[#128C7E] transition hover:bg-[#25D366]/20"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Message on WhatsApp
          </a>
        )}
        {STATUS_ORDER.filter((status) => status !== booking.status).map((status) => (
          <button
            key={status}
            type="button"
            disabled={busy}
            onClick={() => onStatus(status)}
            className="inline-flex min-h-[2.5rem] items-center rounded-full border border-taupe-300 px-3.5 text-xs font-semibold text-espresso-800 transition duration-300 hover:border-bronze-500 hover:text-bronze-700 disabled:opacity-50"
          >
            Mark {STATUS_META[status].label.toLowerCase()}
          </button>
        ))}
        {booking.reference_image_path && (
          <button
            type="button"
            disabled={busy}
            onClick={onViewPhoto}
            className="ml-auto inline-flex min-h-[2.5rem] items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold text-bronze-700 transition hover:bg-bronze-50 disabled:opacity-50"
          >
            <Camera className="h-3.5 w-3.5" />
            View reference photo
          </button>
        )}
      </div>
    </article>
  );
}
