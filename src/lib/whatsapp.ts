import { formatDateTime, formatMoney } from '@/lib/format';
import type { Booking } from '@/lib/types';

/**
 * Turns a phone number a client typed into the digits WhatsApp links need.
 * Numbers starting with + or 00 are taken as international. Local numbers starting with 0 get the
 * default country code (Ghana, 233).
 */
export function whatsappDigits(phone: string, defaultCountryCode = '233'): string {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return '';
  if (trimmed.startsWith('+')) return digits;
  if (digits.startsWith('00')) return digits.slice(2);
  if (digits.startsWith('0')) return defaultCountryCode + digits.slice(1);
  return digits;
}

export function whatsappUrl(phone: string, message: string): string | null {
  const digits = whatsappDigits(phone);
  if (digits.length < 8) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

/** A ready-written message that fits where the booking is in its life. */
export function clientMessage(booking: Booking, brandName: string, timezone: string): string {
  const first = booking.client_name.trim().split(/\s+/)[0] || 'there';
  const when = formatDateTime(booking.start_at, timezone);
  const currency = booking.display_currency;
  const deposit = formatMoney(currency === 'USD' ? booking.deposit_usd : booking.deposit_ghs, currency);

  if (booking.status === 'pending') {
    return booking.deposit_paid
      ? `Hi ${first}, thank you for booking ${booking.service_name} with ${brandName} on ${when}. We have your deposit and your appointment is confirmed. Booking code: ${booking.confirmation_code}.`
      : `Hi ${first}, thank you for booking ${booking.service_name} with ${brandName} on ${when}. To confirm your slot, please send your deposit of ${deposit}. Booking code: ${booking.confirmation_code}.`;
  }
  if (booking.status === 'confirmed') {
    return `Hi ${first}, this is a reminder of your ${booking.service_name} appointment with ${brandName} on ${when}. We look forward to seeing you! Booking code: ${booking.confirmation_code}.`;
  }
  if (booking.status === 'completed') {
    return `Hi ${first}, thank you for visiting ${brandName}! We hope you love your style. We would be delighted to see you again.`;
  }
  return `Hi ${first}, this is ${brandName} about your booking ${booking.confirmation_code}.`;
}
