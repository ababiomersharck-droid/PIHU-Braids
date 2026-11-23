import type { Currency } from '@/lib/types';

interface CurrencyToggleProps {
  value: Currency;
  onChange: (currency: Currency) => void;
  tone?: 'light' | 'dark';
}

const OPTIONS: Array<{ value: Currency; label: string }> = [
  { value: 'USD', label: 'USD $' },
  { value: 'GHS', label: 'GH₵' },
];

export function CurrencyToggle({ value, onChange, tone = 'light' }: CurrencyToggleProps) {
  const surface = tone === 'dark' ? 'bg-white/15 ring-white/25' : 'bg-taupe-100 ring-taupe-200';
  const active = tone === 'dark' ? 'bg-white text-espresso-900' : 'bg-espresso-800 text-cream-50';
  const idle = tone === 'dark' ? 'text-white/85 hover:text-white' : 'text-taupe-600 hover:text-espresso-800';

  return (
    <div role="radiogroup" aria-label="Currency" className={`inline-flex items-center rounded-full p-1 ring-1 ${surface}`}>
      {OPTIONS.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={`rounded-full px-4 py-2.5 text-xs font-bold tracking-wide transition duration-300 ${selected ? active : idle}`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
