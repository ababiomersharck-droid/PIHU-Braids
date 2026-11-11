import { CalendarPlus, CheckCircle2, Download, MessageCircle } from 'lucide-react';
import { buildGoogleCalendarUrl, buildIcsFile, downloadTextFile } from '@/lib/calendar';
import { formatDateTime, formatDuration, formatMoney } from '@/lib/format';
import type { BookingReceipt, SiteContent } from '@/lib/types';

interface ConfirmationStepProps {
  content: SiteContent;
  receipt: BookingReceipt;
  onClose: () => void;
}

export function ConfirmationStep({ content, receipt, onClose }: ConfirmationStepProps) {
  const { settings } = content;
  const currency = receipt.display_currency;
  const deposit = currency === 'USD' ? receipt.deposit_usd : receipt.deposit_ghs;
  const googleUrl = buildGoogleCalendarUrl(receipt, settings.brand_name, settings.address);
  const whatsappDigits = settings.whatsapp_number.replace(/\D/g, '');
  const whatsappUrl = whatsappDigits
    ? `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(
        `Hi ${settings.brand_name}! I just booked ${receipt.service_name} for ${formatDateTime(receipt.start_at, settings.timezone)}. ` +
          `My name is ${receipt.client_name} and my confirmation code is ${receipt.confirmation_code}.`,
      )}`
    : null;

  const downloadIcs = () => {
    downloadTextFile(
      `${receipt.confirmation_code}.ics`,
      buildIcsFile(receipt, settings.brand_name, settings.address),
      'text/calendar',
    );
  };

  return (
    <div className="flex flex-col items-center gap-8 py-4 text-center">
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-bronze-100 text-bronze-600 animate-scale-in">
        <CheckCircle2 className="h-10 w-10" />
      </span>

      <div className="space-y-3">
        <p className="eyebrow">Booking received</p>
        <h3 className="text-4xl">Thank you, {receipt.client_name.split(' ')[0]}.</h3>
        <p className="mx-auto max-w-md text-sm leading-[1.5] text-taupe-700">
          Your appointment for {receipt.service_name} is saved. Send your deposit to confirm your slot.
        </p>
      </div>

      <div className="w-full max-w-md rounded-3xl border border-taupe-200 bg-white p-6 text-left shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wider text-taupe-500">Confirmation code</p>
        <p className="mt-1 font-mono text-3xl font-bold tracking-widest text-espresso-900">{receipt.confirmation_code}</p>
        <dl className="mt-6 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-taupe-600">When</dt>
            <dd className="text-right font-semibold">{formatDateTime(receipt.start_at, settings.timezone)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-taupe-600">Duration</dt>
            <dd className="font-semibold">{formatDuration(receipt.duration_minutes)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-taupe-600">Deposit due</dt>
            <dd className="font-semibold">{formatMoney(deposit, currency)}</dd>
          </div>
        </dl>
        <p className="mt-5 border-t border-taupe-200 pt-4 text-xs leading-[1.5] text-taupe-600">
          {settings.payment_instructions}
        </p>
      </div>

      <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
        <a
          href={googleUrl}
          target="_blank"
          rel="noreferrer"
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-espresso-800 px-5 py-3.5 text-sm font-bold text-cream-50 transition duration-300 hover:-translate-y-0.5 hover:bg-espresso-900"
        >
          <CalendarPlus className="h-4 w-4" />
          Google Calendar
        </a>
        <button
          type="button"
          onClick={downloadIcs}
          className="flex flex-1 items-center justify-center gap-2 rounded-full border border-espresso-800 px-5 py-3.5 text-sm font-bold text-espresso-900 transition duration-300 hover:-translate-y-0.5 hover:bg-taupe-100"
        >
          <Download className="h-4 w-4" />
          Apple / Outlook
        </button>
      </div>

      {whatsappUrl && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noreferrer"
          className="flex w-full max-w-md items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 py-3.5 text-sm font-bold text-white transition duration-300 hover:-translate-y-0.5 hover:brightness-95"
        >
          <MessageCircle className="h-4 w-4" />
          Send my booking details on WhatsApp
        </a>
      )}

      <button type="button" onClick={onClose} className="text-sm font-semibold text-taupe-600 transition hover:text-espresso-900">
        Back to the studio
      </button>
    </div>
  );
}
