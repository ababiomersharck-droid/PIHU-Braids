import { useState } from 'react';
import { useConfirm, useToast } from '@/components/admin/AdminFeedback';
import { CalendarOff, Plus, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Notice, PrimaryButton, SectionCard, SecondaryButton, TextField, errorMessage } from '@/components/admin/AdminPrimitives';
import { addBlackout, deleteBlackout } from '@/lib/api/admin';
import { formatIsoDateLong, formatTimeOfDay, todayInTimezone } from '@/lib/format';
import type { BlackoutDate } from '@/lib/types';

interface BlackoutPanelProps {
  blackouts: BlackoutDate[];
  timezone: string;
  onChanged: () => void;
}

interface BlackoutDraft {
  label: string;
  start_date: string;
  end_date: string;
  all_day: boolean;
  start_time: string;
  end_time: string;
}

function newDraft(timezone: string): BlackoutDraft {
  const today = todayInTimezone(timezone);
  return { label: '', start_date: today, end_date: today, all_day: true, start_time: '12:00', end_time: '14:00' };
}

function validateDraft(draft: BlackoutDraft): Omit<BlackoutDate, 'id'> | string {
  if (!draft.label.trim()) return 'Give this block a short name, for example "Family trip".';
  if (!draft.start_date || !draft.end_date) return 'Choose both a start and an end date.';
  if (draft.end_date < draft.start_date) return 'The end date cannot be before the start date.';
  if (draft.all_day) {
    return { label: draft.label.trim(), start_date: draft.start_date, end_date: draft.end_date, start_time: null, end_time: null };
  }
  if (!draft.start_time || !draft.end_time) return 'Choose the start and end times for this block.';
  if (draft.start_date === draft.end_date && draft.end_time <= draft.start_time) {
    return 'The end time must be after the start time.';
  }
  return {
    label: draft.label.trim(),
    start_date: draft.start_date,
    end_date: draft.end_date,
    start_time: draft.start_time,
    end_time: draft.end_time,
  };
}

function describeBlock(block: BlackoutDate): string {
  const dates =
    block.start_date === block.end_date
      ? formatIsoDateLong(block.start_date)
      : `${formatIsoDateLong(block.start_date)} to ${formatIsoDateLong(block.end_date)}`;
  if (!block.start_time || !block.end_time) return `${dates}, all day`;
  return `${dates}, ${formatTimeOfDay(block.start_time)} to ${formatTimeOfDay(block.end_time)}`;
}

export function BlackoutPanel({ blackouts, timezone, onChanged }: BlackoutPanelProps) {
  const confirm = useConfirm();
  const notify = useToast();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<BlackoutDraft>(() => newDraft(timezone));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  const close = () => {
    setOpen(false);
    setError(null);
  };

  const submit = async () => {
    const checked = validateDraft(draft);
    if (typeof checked === 'string') {
      setError(checked);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await addBlackout(checked);
      setDraft(newDraft(timezone));
      setOpen(false);
      onChanged();
    } catch (err) {
      setError(errorMessage(err, 'This block could not be saved. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (block: BlackoutDate) => {
    const ok = await confirm({
      title: 'Remove this time off?',
      message: `"${block.label}" will be removed and clients will be able to book these times again.`,
      confirmLabel: 'Remove',
      danger: true,
    });
    if (!ok) return;
    setRemovingId(block.id);
    setListError(null);
    try {
      await deleteBlackout(block.id);
      notify('Time off removed');
      onChanged();
    } catch (err) {
      setListError(errorMessage(err, 'This block could not be removed.'));
    } finally {
      setRemovingId(null);
    }
  };

  const update = <K extends keyof BlackoutDraft>(key: K, value: BlackoutDraft[K]) => {
    setError(null);
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <SectionCard
      title="Time off and blackout dates"
      description="Block days or time windows when you cannot take clients. Blocked times disappear from the booking calendar."
    >
      <div className="mb-6 flex justify-end">
        <SecondaryButton onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add blackout
        </SecondaryButton>
      </div>

      {listError && <div className="mb-4"><Notice tone="error">{listError}</Notice></div>}

      {blackouts.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-taupe-300 px-6 py-10 text-center">
          <CalendarOff className="h-6 w-6 text-taupe-400" />
          <p className="text-sm text-taupe-600">No blackout dates yet. Your calendar is fully open.</p>
        </div>
      ) : (
        <ul className="divide-y divide-taupe-100">
          {blackouts.map((block) => (
            <li key={block.id} className="flex items-center justify-between gap-4 py-4">
              <div className="min-w-0">
                <p className="font-semibold text-espresso-900">{block.label}</p>
                <p className="mt-1 text-sm text-taupe-600">{describeBlock(block)}</p>
              </div>
              <button
                type="button"
                onClick={() => remove(block)}
                disabled={removingId === block.id}
                aria-label={`Remove ${block.label}`}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-taupe-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Modal open={open} onClose={close} label="Add blackout date">
        <form
          className="space-y-6 p-6 sm:p-8"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <div>
            <h3 className="text-3xl">Add a blackout</h3>
            <p className="mt-2 text-sm text-taupe-600">Choose the dates you want to block. Times are in studio time.</p>
          </div>
          <TextField label="Name" value={draft.label} onChange={(v) => update('label', v)} placeholder="Family wedding" />
          <div className="grid gap-6 sm:grid-cols-2">
            <TextField label="Start date" type="date" value={draft.start_date} onChange={(v) => update('start_date', v)} />
            <TextField label="End date" type="date" value={draft.end_date} onChange={(v) => update('end_date', v)} />
          </div>
          <label className="flex items-center gap-3 text-sm font-semibold text-espresso-800">
            <input
              type="checkbox"
              checked={draft.all_day}
              onChange={(e) => update('all_day', e.target.checked)}
              className="h-5 w-5 rounded border-taupe-300 accent-bronze-600"
            />
            Block the whole day
          </label>
          {!draft.all_day && (
            <div className="grid gap-6 sm:grid-cols-2">
              <TextField label="From" type="time" value={draft.start_time} onChange={(v) => update('start_time', v)} />
              <TextField label="Until" type="time" value={draft.end_time} onChange={(v) => update('end_time', v)} />
            </div>
          )}
          {error && <Notice tone="error">{error}</Notice>}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <SecondaryButton onClick={close}>Cancel</SecondaryButton>
            <PrimaryButton busy={busy}>Save blackout</PrimaryButton>
          </div>
        </form>
      </Modal>
    </SectionCard>
  );
}
