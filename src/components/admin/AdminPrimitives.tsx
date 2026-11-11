import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

export function SectionCard({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-taupe-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-6">
        <h2 className="text-2xl">{title}</h2>
        {description && <p className="mt-1.5 text-sm text-taupe-600">{description}</p>}
      </div>
      {children}
    </section>
  );
}

const labelClass = 'mb-2 block text-xs font-bold uppercase tracking-wider text-taupe-700';

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  multiline?: boolean;
  placeholder?: string;
  hint?: string;
  min?: string;
  max?: string;
  step?: string;
}

export function TextField({ label, value, onChange, type = 'text', multiline = false, placeholder, hint, min, max, step }: TextFieldProps) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      {multiline ? (
        <textarea className="field min-h-24 resize-y" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input
          className="field"
          type={type}
          value={value}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {hint && <span className="mt-1.5 block text-xs text-taupe-500">{hint}</span>}
    </label>
  );
}

export function Notice({ tone, children }: { tone: 'success' | 'error'; children: ReactNode }) {
  const styles =
    tone === 'success' ? 'bg-emerald-50 text-emerald-800 ring-emerald-200' : 'bg-red-50 text-red-700 ring-red-200';
  return (
    <p role={tone === 'error' ? 'alert' : 'status'} className={`animate-fade-in rounded-2xl px-4 py-3 text-sm ring-1 ${styles}`}>
      {children}
    </p>
  );
}

interface PrimaryButtonProps {
  children: ReactNode;
  busy?: boolean;
  type?: 'button' | 'submit';
  onClick?: () => void;
}

export function PrimaryButton({ children, busy = false, type = 'submit', onClick }: PrimaryButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={busy}
      className="inline-flex items-center justify-center gap-2 rounded-full bg-espresso-800 px-6 py-3 text-sm font-bold text-cream-50 transition duration-300 hover:-translate-y-0.5 hover:bg-espresso-900 disabled:translate-y-0 disabled:opacity-60"
    >
      {busy && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

export function SecondaryButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center justify-center rounded-full border border-taupe-300 px-6 py-3 text-sm font-semibold text-espresso-800 transition duration-300 hover:border-bronze-500 hover:text-bronze-700"
    >
      {children}
    </button>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition duration-300 before:absolute before:-inset-2 ${
        checked ? 'bg-bronze-500' : 'bg-taupe-300'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-300 ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

export function parseNumber(value: string): number {
  return value.trim() === '' ? Number.NaN : Number(value);
}

export function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}
