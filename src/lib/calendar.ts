import type { Booking, BookingReceipt, Currency } from '@/lib/types';

const CSV_COLUMNS: Array<[string, (b: Booking, tz: string) => string | number | boolean]> = [
  ['Confirmation Code', (b) => b.confirmation_code],
  ['Status', (b) => b.status],
  ['Client Name', (b) => b.client_name],
  ['Email', (b) => b.client_email],
  ['Phone', (b) => b.client_phone],
  ['Service', (b) => b.service_name],
  ['Add-ons', (b) => b.addon_names.join('; ')],
  ['Date', (b, tz) => new Intl.DateTimeFormat('en-CA', { timeZone: tz, dateStyle: 'short' }).format(new Date(b.start_at))],
  ['Start Time', (b, tz) => new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit' }).format(new Date(b.start_at))],
  ['Duration (min)', (b) => b.duration_minutes],
  ['Currency Shown', (b) => b.display_currency],
  ['Total USD', (b) => b.total_usd],
  ['Total GHS', (b) => b.total_ghs],
  ['Deposit USD', (b) => b.deposit_usd],
  ['Deposit GHS', (b) => b.deposit_ghs],
  ['Deposit Paid', (b) => (b.deposit_paid ? 'Yes' : 'No')],
  ['Notes', (b) => b.notes],
  ['Booked On', (b) => b.created_at],
];

function escapeCell(value: string | number | boolean): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function buildBookingsCsv(bookings: Booking[], timezone: string): string {
  const header = CSV_COLUMNS.map(([label]) => escapeCell(label)).join(',');
  const rows = bookings.map((b) => CSV_COLUMNS.map(([, read]) => escapeCell(read(b, timezone))).join(','));
  return [header, ...rows].join('\r\n');
}

export function downloadTextFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function toCalendarStamp(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

export function buildGoogleCalendarUrl(receipt: BookingReceipt, brandName: string, address: string): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${receipt.service_name} at ${brandName}`,
    dates: `${toCalendarStamp(receipt.start_at)}/${toCalendarStamp(receipt.end_at)}`,
    details: `Confirmation code: ${receipt.confirmation_code}`,
    location: address,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function buildIcsFile(receipt: BookingReceipt, brandName: string, address: string): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Booking//EN',
    'BEGIN:VEVENT',
    `UID:${receipt.confirmation_code}@booking`,
    `DTSTAMP:${toCalendarStamp(new Date().toISOString())}`,
    `DTSTART:${toCalendarStamp(receipt.start_at)}`,
    `DTEND:${toCalendarStamp(receipt.end_at)}`,
    `SUMMARY:${receipt.service_name} at ${brandName}`,
    `DESCRIPTION:Confirmation code ${receipt.confirmation_code}`,
    `LOCATION:${address}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.join('\r\n');
}
