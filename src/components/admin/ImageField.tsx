import { useState, type ChangeEvent } from 'react';
import { ImagePlus, Loader2 } from 'lucide-react';
import { errorMessage, Notice } from '@/components/admin/AdminPrimitives';
import { uploadSiteImage } from '@/lib/api/admin';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024;

interface ImageFieldProps {
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
}

export function ImageField({ label, value, onChange }: ImageFieldProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Please choose a JPG, PNG or WEBP image.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError('Please choose an image under 5 MB.');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      onChange(await uploadSiteImage(file));
    } catch (err) {
      setError(errorMessage(err, 'The image could not be uploaded.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-taupe-700">{label}</span>
      <div className="flex items-center gap-4">
        <div className="flex h-24 w-32 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-cream-200 ring-1 ring-taupe-200">
          {value ? (
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : busy ? (
            <Loader2 className="h-6 w-6 animate-spin text-bronze-600" />
          ) : (
            <ImagePlus className="h-6 w-6 text-taupe-400" />
          )}
        </div>
        <div className="flex flex-col items-start gap-2">
          <label className="inline-flex min-h-[2.75rem] cursor-pointer items-center rounded-full border border-taupe-300 px-4 text-sm font-semibold text-espresso-800 transition duration-300 hover:border-bronze-500 hover:text-bronze-700 has-[:disabled]:opacity-60">
            {busy ? 'Uploading...' : value ? 'Replace photo' : 'Upload photo'}
            <input
              type="file"
              accept={ACCEPTED_TYPES.join(',')}
              className="sr-only"
              disabled={busy}
              onChange={handleFile}
            />
          </label>
          {value && !busy && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="text-xs font-semibold text-red-600 transition hover:text-red-700"
            >
              Remove photo
            </button>
          )}
        </div>
      </div>
      {error && <div className="mt-3"><Notice tone="error">{error}</Notice></div>}
    </div>
  );
}
