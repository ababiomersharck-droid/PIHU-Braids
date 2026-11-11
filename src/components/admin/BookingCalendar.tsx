import { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { dateKeyInTimezone, todayInTimezone, weekdayOf } from '@/lib/format';
import type { Booking } from '@/lib/types';

interface BookingCalendarProps {
  bookings: Booking[];
  timezone: string;
  month: string;
  onMonthChange: (month: string) => void;
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

const WEEK_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}`;
}

function monthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

function monthCells(month: string): Array<string | null> {
  const [y, m] = month.split('-').map(Number);
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells: Array<string | null> = Array.from({ length: weekdayOf(`${month}-01`) }, () => null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(`${month}-${pad(day)}`);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function BookingCalendar({ bookings, timezone, month, onMonthChange, selectedDate, onSelectDate }: BookingCalendarProps) {
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const booking of bookings) {
      const key = dateKeyInTimezone(booking.start_at, timezone);
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [bookings, timezone]);

  const today = todayInTimezone(timezone);
  const cells = monthCells(month);

  return (
    <div className="rounded-3xl border border-taupe-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => onMonthChange(shiftMonth(month, -1))}
          className="flex h-11 w-11 items-center justify-center rounded-full text-espresso-800 transition hover:bg-taupe-100"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <p className="font-display text-2xl text-espresso-900">{monthLabel(month)}</p>
        <button
          type="button"
          aria-label="Next month"
          onClick={() => onMonthChange(shiftMonth(month, 1))}
          className="flex h-11 w-11 items-center justify-center rounded-full text-espresso-800 transition hover:bg-taupe-100"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold uppercase tracking-wider text-taupe-500">
        {WEEK_HEADERS.map((day) => (
          <span key={day} className="py-2">
            {day}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, index) => {
          if (!date) return <span key={`blank-${index}`} aria-hidden="true" />;
          const count = counts.get(date) ?? 0;
          const selected = date === selectedDate;
          const dayNumber = Number(date.slice(8, 10));
          return (
            <button
              key={date}
              type="button"
              onClick={() => onSelectDate(date)}
              aria-pressed={selected}
              aria-label={`${date}, ${count} booking${count === 1 ? '' : 's'}`}
              className={`flex aspect-square flex-col items-center justify-center rounded-2xl text-sm transition duration-300 ${
                selected
                  ? 'bg-espresso-800 text-cream-50 shadow-md'
                  : 'text-espresso-900 hover:bg-bronze-50'
              } ${date === today && !selected ? 'ring-1 ring-bronze-500' : ''}`}
            >
              <span className="font-semibold">{dayNumber}</span>
              {count > 0 && (
                <span
                  className={`mt-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                    selected ? 'bg-bronze-300 text-espresso-900' : 'bg-bronze-500 text-white'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
