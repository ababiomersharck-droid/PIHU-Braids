import { useEffect, useMemo, useState } from 'react';
import { CalendarX, Loader2 } from 'lucide-react';
import type { BookingDraft } from '@/components/booking/BookingWizard';
import { fetchAvailableSlots } from '@/lib/api/site';
import { addDays, formatInTimezone, formatIsoDateLong, todayInTimezone, weekdayOf } from '@/lib/format';
import type { SiteContent } from '@/lib/types';

const DAYS_AHEAD = 21;
const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface ScheduleStepProps {
  content: SiteContent;
  draft: BookingDraft;
  onChange: (patch: Partial<BookingDraft>) => void;
}

export function ScheduleStep({ content, draft, onChange }: ScheduleStepProps) {
  const { settings, hours, blackouts } = content;
  const today = todayInTimezone(settings.timezone);

  const days = useMemo(
    () =>
      Array.from({ length: DAYS_AHEAD }, (_, i) => {
        const iso = addDays(today, i);
        const hour = hours.find((h) => h.weekday === weekdayOf(iso));
        const blockedAllDay = blackouts.some((b) => !b.start_time && iso >= b.start_date && iso <= b.end_date);
        return { iso, open: Boolean(hour?.is_open) && !blockedAllDay };
      }),
    [today, hours, blackouts],
  );

  const addonKey = draft.addonIds.join(',');
  const [slots, setSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!draft.date || !draft.serviceId) return;
    let active = true;
    const addonIds = addonKey ? addonKey.split(',') : [];
    setLoading(true);
    setLoadError(null);
    fetchAvailableSlots(draft.date, draft.serviceId, addonIds)
      .then((result) => {
        if (active) setSlots(result);
      })
      .catch((err: unknown) => {
        if (active) {
          setSlots([]);
          setLoadError(err instanceof Error ? err.message : 'Times could not be loaded.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [draft.date, draft.serviceId, addonKey]);

  const pickDate = (iso: string) => onChange({ date: iso, startAt: null });

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-3xl">Pick a date</h3>
        <p className="mt-2 text-sm text-taupe-600">Times shown are in studio time ({settings.timezone.replace('_', ' ')}).</p>
        <div className="-mx-6 mt-6 flex gap-2 overflow-x-auto px-6 pb-2 sm:-mx-10 sm:px-10">
          {days.map(({ iso, open }) => {
            const selected = draft.date === iso;
            const [, , dd] = iso.split('-');
            return (
              <button
                key={iso}
                type="button"
                disabled={!open}
                onClick={() => pickDate(iso)}
                aria-pressed={selected}
                className={`flex w-16 shrink-0 flex-col items-center rounded-2xl border py-3 transition duration-300 ${
                  selected
                    ? 'border-espresso-800 bg-espresso-800 text-cream-50 shadow-lg'
                    : open
                      ? 'border-taupe-200 bg-white text-espresso-900 hover:-translate-y-0.5 hover:border-bronze-500'
                      : 'cursor-not-allowed border-transparent bg-taupe-100 text-taupe-400 line-through'
                }`}
              >
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  {WEEKDAY_SHORT[weekdayOf(iso)]}
                </span>
                <span className="mt-1 font-display text-2xl">{Number(dd)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {draft.date && (
        <div className="animate-fade-up">
          <h3 className="text-2xl">{formatIsoDateLong(draft.date)}</h3>
          {loading && (
            <p className="mt-6 flex items-center gap-2 text-sm text-taupe-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking availability
            </p>
          )}
          {!loading && loadError && (
            <p className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{loadError}</p>
          )}
          {!loading && !loadError && slots.length === 0 && (
            <div className="mt-6 flex items-center gap-3 rounded-2xl bg-taupe-100 px-5 py-4 text-sm text-taupe-700">
              <CalendarX className="h-5 w-5 shrink-0" />
              No times are left on this day. Please choose another date.
            </div>
          )}
          {!loading && !loadError && slots.length > 0 && (
            <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4">
              {slots.map((iso) => {
                const selected = draft.startAt === iso;
                return (
                  <button
                    key={iso}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => onChange({ startAt: iso })}
                    className={`rounded-xl border py-3 text-sm font-semibold transition duration-200 ${
                      selected
                        ? 'border-bronze-500 bg-bronze-500 text-white shadow-md'
                        : 'border-taupe-200 bg-white text-espresso-800 hover:-translate-y-0.5 hover:border-bronze-500'
                    }`}
                  >
                    {formatInTimezone(iso, settings.timezone, { hour: 'numeric', minute: '2-digit' })}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
