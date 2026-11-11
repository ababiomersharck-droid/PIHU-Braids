import { useEffect, useMemo } from 'react';
import type { BookingDraft } from '@/components/booking/BookingWizard';

interface DetailsStepProps {
  draft: BookingDraft;
  onChange: (patch: Partial<BookingDraft>) => void;
}

const fieldLabel = 'mb-2 block text-xs font-bold uppercase tracking-wider text-taupe-700';

export function DetailsStep({ draft, onChange }: DetailsStepProps) {
  const previewUrl = useMemo(
    () => (draft.referenceFile ? URL.createObjectURL(draft.referenceFile) : null),
    [draft.referenceFile],
  );

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-3xl">Your details</h3>
        <p className="mt-2 text-sm text-taupe-600">We will send your confirmation and reminders to these details.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <span className={fieldLabel}>Full name</span>
          <input
            className="field"
            autoComplete="name"
            value={draft.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="Ama Mensah"
          />
        </label>
        <label>
          <span className={fieldLabel}>Email</span>
          <input
            className="field"
            type="email"
            autoComplete="email"
            value={draft.email}
            onChange={(e) => onChange({ email: e.target.value })}
            placeholder="you@example.com"
          />
        </label>
        <label>
          <span className={fieldLabel}>Phone / WhatsApp</span>
          <input
            className="field"
            type="tel"
            autoComplete="tel"
            value={draft.phone}
            onChange={(e) => onChange({ phone: e.target.value })}
            placeholder="+233 24 000 0000"
          />
        </label>
        <label className="sm:col-span-2">
          <span className={fieldLabel}>Notes for your artist (optional)</span>
          <textarea
            className="field min-h-28 resize-y"
            maxLength={1000}
            value={draft.notes}
            onChange={(e) => onChange({ notes: e.target.value })}
            placeholder="Allergies, preferred length, or anything we should know"
          />
        </label>
      </div>

      <div>
        <span className={fieldLabel}>Reference photo (optional)</span>
        <label className="group flex cursor-pointer flex-col items-center gap-3 rounded-2xl border border-dashed border-taupe-300 bg-white px-6 py-8 text-center transition hover:border-bronze-500 hover:bg-cream-100">
          {previewUrl ? (
            <img src={previewUrl} alt="Reference preview" className="h-40 w-32 rounded-xl object-cover shadow-md" />
          ) : (
            <span className="font-display text-xl text-espresso-800">Upload a style you love</span>
          )}
          <span className="text-xs text-taupe-600">
            {draft.referenceFile ? draft.referenceFile.name : 'JPG, PNG or WEBP up to 5 MB'}
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(e) => onChange({ referenceFile: e.target.files?.[0] ?? null })}
          />
          <span className="rounded-full bg-taupe-100 px-4 py-2 text-xs font-bold text-espresso-800 transition group-hover:bg-bronze-500 group-hover:text-white">
            {draft.referenceFile ? 'Change photo' : 'Choose photo'}
          </span>
        </label>
      </div>
    </div>
  );
}
