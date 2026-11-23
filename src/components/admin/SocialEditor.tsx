import { useState, type FormEvent } from 'react';
import { Notice, PrimaryButton, SecondaryButton, TextField, errorMessage } from '@/components/admin/AdminPrimitives';
import { saveSocial } from '@/lib/api/admin';
import { SOCIAL_PLATFORMS, normalizeSocialValue, socialUrl, validateSocialValue } from '@/lib/social';
import type { SocialLink, SocialPlatform } from '@/lib/types';

interface SocialEditorProps {
  link: SocialLink | null;
  nextPosition: number;
  onClose: () => void;
  onSaved: () => void;
}

export function SocialEditor({ link, nextPosition, onClose, onSaved }: SocialEditorProps) {
  const [platform, setPlatform] = useState<SocialPlatform>(link?.platform ?? 'instagram');
  const [value, setValue] = useState(link?.value ?? '');
  const [label, setLabel] = useState(link?.label ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const example = SOCIAL_PLATFORMS.find((p) => p.id === platform)?.example ?? '';
  const preview = value.trim() && !validateSocialValue(platform, value, label || 'x') ? socialUrl({ platform, value: normalizeSocialValue(value) }) : null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const problem = validateSocialValue(platform, value, label);
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await saveSocial(
        {
          platform,
          value: normalizeSocialValue(value),
          label: platform === 'other' ? label.trim() : '',
          position: link?.position ?? nextPosition,
        },
        link?.id ?? null,
      );
      onSaved();
    } catch (err) {
      setError(errorMessage(err, 'This could not be saved. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6 p-6 sm:p-8">
      <div>
        <h3 className="pr-12 text-3xl">{link ? 'Edit account' : 'Add a social media account'}</h3>
        <p className="mt-2 text-sm text-taupe-600">It appears in the footer of your website as soon as you save.</p>
      </div>

      <label className="block">
        <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-taupe-700">Platform</span>
        <select
          className="field"
          value={platform}
          onChange={(e) => {
            setError(null);
            setPlatform(e.target.value as SocialPlatform);
          }}
        >
          {SOCIAL_PLATFORMS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </label>

      {platform === 'other' && (
        <TextField
          label="Name shown on your website"
          value={label}
          onChange={(v) => {
            setError(null);
            setLabel(v);
          }}
          placeholder="Blog, Shop, Reviews"
        />
      )}

      <TextField
        label={platform === 'other' ? 'Full link' : 'Account name or full link'}
        value={value}
        onChange={(v) => {
          setError(null);
          setValue(v);
        }}
        placeholder={example}
        hint={platform === 'other' ? 'Paste the whole address, starting with https://' : 'Type just the account name, or paste the whole link from your browser.'}
      />

      {preview && (
        <p className="break-all rounded-2xl bg-cream-100 px-4 py-3 text-sm text-taupe-700">
          Visitors will be sent to: <span className="font-semibold text-espresso-900">{preview}</span>
        </p>
      )}

      {error && <Notice tone="error">{error}</Notice>}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
        <PrimaryButton busy={busy}>Save account</PrimaryButton>
      </div>
    </form>
  );
}
