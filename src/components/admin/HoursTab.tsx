import { useState } from 'react';
import { BlackoutPanel } from '@/components/admin/BlackoutPanel';
import { Notice, PrimaryButton, SectionCard, Toggle, errorMessage } from '@/components/admin/AdminPrimitives';
import { saveHours } from '@/lib/api/admin';
import type { BlackoutDate, WorkingHour } from '@/lib/types';

interface HoursTabProps {
  hours: WorkingHour[];
  blackouts: BlackoutDate[];
  timezone: string;
  onChanged: () => void;
}

interface DayDraft {
  weekday: number;
  is_open: boolean;
  open_time: string;
  close_time: string;
}

const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function toDrafts(hours: WorkingHour[]): DayDraft[] {
  return WEEKDAY_NAMES.map((_, weekday) => {
    const row = hours.find((h) => h.weekday === weekday);
    return {
      weekday,
      is_open: row?.is_open ?? false,
      open_time: (row?.open_time ?? '09:00').slice(0, 5),
      close_time: (row?.close_time ?? '18:00').slice(0, 5),
    };
  });
}

function findInvalidDay(drafts: DayDraft[]): string | null {
  const bad = drafts.find((d) => d.is_open && d.close_time <= d.open_time);
  return bad ? `${WEEKDAY_NAMES[bad.weekday]} must close after it opens.` : null;
}

export function HoursTab({ hours, blackouts, timezone, onChanged }: HoursTabProps) {
  const [drafts, setDrafts] = useState<DayDraft[]>(() => toDrafts(hours));
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const updateDay = (weekday: number, patch: Partial<DayDraft>) => {
    setResult(null);
    setDrafts((prev) => prev.map((d) => (d.weekday === weekday ? { ...d, ...patch } : d)));
  };

  const save = async () => {
    const problem = findInvalidDay(drafts);
    if (problem) {
      setResult({ tone: 'error', text: problem });
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      await saveHours(drafts);
      setResult({ tone: 'success', text: 'Working hours saved. Clients see the new times right away.' });
      onChanged();
    } catch (err) {
      setResult({ tone: 'error', text: errorMessage(err, 'Working hours could not be saved. Please try again.') });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionCard title="Weekly working hours" description={`Times are in studio time (${timezone}).`}>
        <ul className="divide-y divide-taupe-100">
          {DISPLAY_ORDER.map((weekday) => {
            const day = drafts.find((d) => d.weekday === weekday);
            if (!day) return null;
            return (
              <li key={weekday} className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center justify-between gap-4 sm:w-56">
                  <span className="font-semibold text-espresso-900">{WEEKDAY_NAMES[weekday]}</span>
                  <Toggle
                    label={`Open on ${WEEKDAY_NAMES[weekday]}`}
                    checked={day.is_open}
                    onChange={(value) => updateDay(weekday, { is_open: value })}
                  />
                </div>
                {day.is_open ? (
                  <div className="flex flex-1 items-center gap-3 sm:max-w-md">
                    <input
                      type="time"
                      aria-label={`${WEEKDAY_NAMES[weekday]} opening time`}
                      className="field"
                      value={day.open_time}
                      onChange={(e) => updateDay(weekday, { open_time: e.target.value })}
                    />
                    <span className="text-sm text-taupe-500">to</span>
                    <input
                      type="time"
                      aria-label={`${WEEKDAY_NAMES[weekday]} closing time`}
                      className="field"
                      value={day.close_time}
                      onChange={(e) => updateDay(weekday, { close_time: e.target.value })}
                    />
                  </div>
                ) : (
                  <p className="text-sm text-taupe-500">Closed. No bookings on this day.</p>
                )}
              </li>
            );
          })}
        </ul>
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-h-5">{result && <Notice tone={result.tone}>{result.text}</Notice>}</div>
          <PrimaryButton type="button" busy={busy} onClick={() => void save()}>
            Save working hours
          </PrimaryButton>
        </div>
      </SectionCard>

      <BlackoutPanel blackouts={blackouts} timezone={timezone} onChanged={onChanged} />
    </div>
  );
}
