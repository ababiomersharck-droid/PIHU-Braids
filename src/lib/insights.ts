import { addDays, dateKeyInTimezone, weekdayOf } from '@/lib/format';
import type { Booking, Currency } from '@/lib/types';

export interface TodayView {
  today: string;
  todayList: Booking[];
  next: Booking | null;
  pending: Booking[];
  unpaid: Booking[];
  unpaidAmount: number;
  weekCount: number;
  weekIncome: number;
}

const byStart = (a: Booking, b: Booking) => a.start_at.localeCompare(b.start_at);
const money = (b: Booking, currency: Currency) => (currency === 'USD' ? b.total_usd : b.total_ghs);
const depositOf = (b: Booking, currency: Currency) => (currency === 'USD' ? b.deposit_usd : b.deposit_ghs);
const round2 = (n: number) => Math.round(n * 100) / 100;

/** Everything the Today screen shows, worked out from the full list of bookings. */
export function buildTodayView(bookings: Booking[], timezone: string, currency: Currency, nowMs: number): TodayView {
  // Today is worked out from the same clock as everything else on this screen.
  const today = dateKeyInTimezone(new Date(nowMs).toISOString(), timezone);
  const live = bookings.filter((b) => b.status !== 'canceled');

  const todayList = live.filter((b) => dateKeyInTimezone(b.start_at, timezone) === today).sort(byStart);

  // "Upcoming" means still to come and still on: waiting for confirmation or confirmed.
  const upcoming = bookings
    .filter((b) => (b.status === 'pending' || b.status === 'confirmed') && new Date(b.start_at).getTime() > nowMs)
    .sort(byStart);

  // Weeks run Monday to Sunday.
  const weekStart = addDays(today, -((weekdayOf(today) + 6) % 7));
  const weekEnd = addDays(weekStart, 6);
  const week = live.filter((b) => {
    const key = dateKeyInTimezone(b.start_at, timezone);
    return key >= weekStart && key <= weekEnd;
  });

  const unpaid = upcoming.filter((b) => !b.deposit_paid);

  return {
    today,
    todayList,
    next: upcoming[0] ?? null,
    pending: upcoming.filter((b) => b.status === 'pending'),
    unpaid,
    unpaidAmount: round2(unpaid.reduce((sum, b) => sum + depositOf(b, currency), 0)),
    weekCount: week.length,
    weekIncome: round2(week.reduce((sum, b) => sum + money(b, currency), 0)),
  };
}

/** "in 25 min", "in 3 hr", "tomorrow", "in 4 days" */
export function startsIn(iso: string, nowMs: number): string {
  const mins = Math.round((new Date(iso).getTime() - nowMs) / 60000);
  if (mins < 1) return 'starting now';
  if (mins < 60) return `in ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `in ${hours} hr`;
  const days = Math.round(hours / 24);
  return days === 1 ? 'tomorrow' : `in ${days} days`;
}

export function greetingFor(timezone: string, nowMs: number): string {
  const hour = Number(
    new Intl.DateTimeFormat('en-US', { timeZone: timezone, hour: 'numeric', hour12: false }).format(new Date(nowMs)),
  ) % 24;
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
