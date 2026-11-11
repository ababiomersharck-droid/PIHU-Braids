import { useState, type FormEvent } from 'react';
import { ImageField } from '@/components/admin/ImageField';
import { Notice, PrimaryButton, SecondaryButton, TextField, Toggle, errorMessage, parseNumber } from '@/components/admin/AdminPrimitives';
import { saveService } from '@/lib/api/admin';
import type { Service } from '@/lib/types';

interface ServiceEditorProps {
  service: Service | null;
  nextPosition: number;
  onClose: () => void;
  onSaved: () => void;
}

interface ServiceDraft {
  name: string;
  category: string;
  description: string;
  prep_instructions: string;
  price_usd: string;
  price_ghs: string;
  duration_minutes: string;
  deposit_percent: string;
  image_url: string | null;
  is_active: boolean;
}

function toDraft(service: Service | null): ServiceDraft {
  return {
    name: service?.name ?? '',
    category: service?.category ?? '',
    description: service?.description ?? '',
    prep_instructions: service?.prep_instructions ?? '',
    price_usd: service ? String(service.price_usd) : '',
    price_ghs: service?.price_ghs == null ? '' : String(service.price_ghs),
    duration_minutes: service ? String(service.duration_minutes) : '180',
    deposit_percent: service ? String(service.deposit_percent) : '50',
    image_url: service?.image_url ?? null,
    is_active: service?.is_active ?? true,
  };
}

function validate(draft: ServiceDraft): Omit<Service, 'id' | 'position'> | string {
  const priceUsd = parseNumber(draft.price_usd);
  const priceGhs = parseNumber(draft.price_ghs);
  const duration = parseNumber(draft.duration_minutes);
  const deposit = parseNumber(draft.deposit_percent);
  if (!draft.name.trim()) return 'Give this style a name.';
  if (!draft.category.trim()) return 'Add a category, for example Knotless Braids.';
  if (!Number.isFinite(priceUsd) || priceUsd <= 0) return 'Enter a USD price greater than zero.';
  if (draft.price_ghs.trim() !== '' && (!Number.isFinite(priceGhs) || priceGhs <= 0)) {
    return 'The cedi price must be greater than zero, or left empty to convert automatically.';
  }
  if (!Number.isInteger(duration) || duration < 15) return 'Duration must be a whole number of minutes, at least 15.';
  if (!Number.isInteger(deposit) || deposit < 0 || deposit > 100) return 'Deposit must be a whole percentage from 0 to 100.';
  return {
    name: draft.name.trim(),
    category: draft.category.trim(),
    description: draft.description.trim(),
    prep_instructions: draft.prep_instructions.trim(),
    price_usd: priceUsd,
    price_ghs: draft.price_ghs.trim() === '' ? null : priceGhs,
    duration_minutes: duration,
    deposit_percent: deposit,
    image_url: draft.image_url,
    is_active: draft.is_active,
  };
}

export function ServiceEditor({ service, nextPosition, onClose, onSaved }: ServiceEditorProps) {
  const [draft, setDraft] = useState<ServiceDraft>(() => toDraft(service));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof ServiceDraft>(key: K, value: ServiceDraft[K]) => {
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
      await saveService({ ...checked, position: service?.position ?? nextPosition }, service?.id ?? null);
      onSaved();
    } catch (err) {
      setError(errorMessage(err, 'This style could not be saved. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6 p-6 sm:p-8">
      <div>
        <h3 className="text-3xl">{service ? 'Edit style' : 'Add a style'}</h3>
        <p className="mt-2 text-sm text-taupe-600">Changes appear on the public site as soon as you save.</p>
      </div>

      <ImageField label="Photo" value={draft.image_url} onChange={(url) => update('image_url', url)} />

      <div className="grid gap-6 sm:grid-cols-2">
        <TextField label="Style name" value={draft.name} onChange={(v) => update('name', v)} />
        <TextField label="Category" value={draft.category} onChange={(v) => update('category', v)} placeholder="Knotless Braids" />
      </div>
      <TextField label="Description" multiline value={draft.description} onChange={(v) => update('description', v)} />
      <TextField
        label="Preparation instructions"
        multiline
        value={draft.prep_instructions}
        onChange={(v) => update('prep_instructions', v)}
        hint="What the client should do before the appointment."
      />

      <div className="grid gap-6 sm:grid-cols-2">
        <TextField label="Price (USD)" type="number" min="0" step="0.01" value={draft.price_usd} onChange={(v) => update('price_usd', v)} />
        <TextField
          label="Price (cedis)"
          type="number"
          min="0"
          step="0.01"
          value={draft.price_ghs}
          onChange={(v) => update('price_ghs', v)}
          hint="Leave empty to convert from the USD price."
        />
        <TextField label="Duration (minutes)" type="number" min="15" step="5" value={draft.duration_minutes} onChange={(v) => update('duration_minutes', v)} />
        <TextField label="Deposit (%)" type="number" min="0" max="100" step="1" value={draft.deposit_percent} onChange={(v) => update('deposit_percent', v)} />
      </div>

      <div className="flex items-center justify-between gap-4 rounded-2xl bg-cream-100 px-5 py-4">
        <div>
          <p className="text-sm font-semibold text-espresso-900">Show on the website</p>
          <p className="text-xs text-taupe-600">Hidden styles stay saved but are not bookable.</p>
        </div>
        <Toggle label="Show on the website" checked={draft.is_active} onChange={(v) => update('is_active', v)} />
      </div>

      {error && <Notice tone="error">{error}</Notice>}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
        <PrimaryButton busy={busy}>Save style</PrimaryButton>
      </div>
    </form>
  );
}
