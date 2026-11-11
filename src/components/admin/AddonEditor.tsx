import { useState, type FormEvent } from 'react';
import { Notice, PrimaryButton, SecondaryButton, TextField, Toggle, errorMessage, parseNumber } from '@/components/admin/AdminPrimitives';
import { saveAddon } from '@/lib/api/admin';
import type { Addon } from '@/lib/types';

interface AddonEditorProps {
  addon: Addon | null;
  nextPosition: number;
  onClose: () => void;
  onSaved: () => void;
}

interface AddonDraft {
  name: string;
  description: string;
  price_usd: string;
  price_ghs: string;
  extra_minutes: string;
  is_active: boolean;
}

function toDraft(addon: Addon | null): AddonDraft {
  return {
    name: addon?.name ?? '',
    description: addon?.description ?? '',
    price_usd: addon ? String(addon.price_usd) : '',
    price_ghs: addon?.price_ghs == null ? '' : String(addon.price_ghs),
    extra_minutes: addon ? String(addon.extra_minutes) : '0',
    is_active: addon?.is_active ?? true,
  };
}

function validate(draft: AddonDraft): Omit<Addon, 'id' | 'position'> | string {
  const priceUsd = parseNumber(draft.price_usd);
  const priceGhs = parseNumber(draft.price_ghs);
  const extra = parseNumber(draft.extra_minutes);
  if (!draft.name.trim()) return 'Give this add-on a name.';
  if (!Number.isFinite(priceUsd) || priceUsd < 0) return 'Enter a USD price of zero or more.';
  if (draft.price_ghs.trim() !== '' && (!Number.isFinite(priceGhs) || priceGhs < 0)) {
    return 'The cedi price must be zero or more, or left empty to convert automatically.';
  }
  if (!Number.isInteger(extra) || extra < 0) return 'Extra time must be a whole number of minutes, zero or more.';
  return {
    name: draft.name.trim(),
    description: draft.description.trim(),
    price_usd: priceUsd,
    price_ghs: draft.price_ghs.trim() === '' ? null : priceGhs,
    extra_minutes: extra,
    is_active: draft.is_active,
  };
}

export function AddonEditor({ addon, nextPosition, onClose, onSaved }: AddonEditorProps) {
  const [draft, setDraft] = useState<AddonDraft>(() => toDraft(addon));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof AddonDraft>(key: K, value: AddonDraft[K]) => {
    setError(null);
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const checked = validate(draft);
    if (typeof checked === 'string') {
      setError(checked);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await saveAddon({ ...checked, position: addon?.position ?? nextPosition }, addon?.id ?? null);
      onSaved();
    } catch (err) {
      setError(errorMessage(err, 'This add-on could not be saved. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6 p-6 sm:p-8">
      <div>
        <h3 className="text-3xl">{addon ? 'Edit add-on' : 'Add an add-on'}</h3>
        <p className="mt-2 text-sm text-taupe-600">Extras clients can add to any style, such as longer hair or a hair wash.</p>
      </div>

      <TextField label="Add-on name" value={draft.name} onChange={(v) => update('name', v)} placeholder="Hair wash and prep" />
      <TextField label="Description" multiline value={draft.description} onChange={(v) => update('description', v)} />

      <div className="grid gap-6 sm:grid-cols-3">
        <TextField label="Price (USD)" type="number" min="0" step="0.01" value={draft.price_usd} onChange={(v) => update('price_usd', v)} />
        <TextField
          label="Price (cedis)"
          type="number"
          min="0"
          step="0.01"
          value={draft.price_ghs}
          onChange={(v) => update('price_ghs', v)}
          hint="Empty converts from USD."
        />
        <TextField label="Extra minutes" type="number" min="0" step="5" value={draft.extra_minutes} onChange={(v) => update('extra_minutes', v)} />
      </div>

      <div className="flex items-center justify-between gap-4 rounded-2xl bg-cream-100 px-5 py-4">
        <div>
          <p className="text-sm font-semibold text-espresso-900">Offer to clients</p>
          <p className="text-xs text-taupe-600">Turn off to hide this add-on without deleting it.</p>
        </div>
        <Toggle label="Offer to clients" checked={draft.is_active} onChange={(v) => update('is_active', v)} />
      </div>

      {error && <Notice tone="error">{error}</Notice>}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
        <PrimaryButton busy={busy}>Save add-on</PrimaryButton>
      </div>
    </form>
  );
}
