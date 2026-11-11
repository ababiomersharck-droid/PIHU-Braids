import { useState, type FormEvent } from 'react';
import { ImageField } from '@/components/admin/ImageField';
import { Notice, PrimaryButton, SectionCard, TextField, errorMessage, parseNumber } from '@/components/admin/AdminPrimitives';
import { saveSettings } from '@/lib/api/admin';
import { formatMoney } from '@/lib/format';
import type { Currency, SiteSettings } from '@/lib/types';

type BrandDraft = Omit<SiteSettings, 'id' | 'timezone' | 'ghs_per_usd'> & { ghs_per_usd: string };

interface BrandTabProps {
  settings: SiteSettings;
  onSaved: () => void;
}

const CURRENCIES: Array<{ value: Currency; label: string }> = [
  { value: 'USD', label: 'US Dollars ($)' },
  { value: 'GHS', label: 'Ghana Cedis (GH₵)' },
];

function toDraft(settings: SiteSettings): BrandDraft {
  return {
    brand_name: settings.brand_name,
    tagline: settings.tagline,
    logo_url: settings.logo_url,
    hero_headline: settings.hero_headline,
    hero_subheadline: settings.hero_subheadline,
    hero_image_url: settings.hero_image_url,
    phone: settings.phone,
    whatsapp_number: settings.whatsapp_number,
    instagram_handle: settings.instagram_handle,
    address: settings.address,
    footer_note: settings.footer_note,
    payment_instructions: settings.payment_instructions,
    default_currency: settings.default_currency,
    ghs_per_usd: String(settings.ghs_per_usd),
  };
}

function validate(draft: BrandDraft): { patch: Omit<SiteSettings, 'id' | 'timezone'> } | { error: string } {
  const rate = parseNumber(draft.ghs_per_usd);
  if (!draft.brand_name.trim()) return { error: 'Your brand name cannot be empty.' };
  if (!draft.hero_headline.trim()) return { error: 'The homepage headline cannot be empty.' };
  if (!Number.isFinite(rate) || rate <= 0) return { error: 'Enter a cedi exchange rate greater than zero.' };
  return {
    patch: {
      brand_name: draft.brand_name.trim(),
      tagline: draft.tagline.trim(),
      logo_url: draft.logo_url,
      hero_headline: draft.hero_headline.trim(),
      hero_subheadline: draft.hero_subheadline.trim(),
      hero_image_url: draft.hero_image_url,
      phone: draft.phone.trim(),
      whatsapp_number: draft.whatsapp_number.trim(),
      instagram_handle: draft.instagram_handle.trim(),
      address: draft.address.trim(),
      footer_note: draft.footer_note.trim(),
      payment_instructions: draft.payment_instructions.trim(),
      default_currency: draft.default_currency,
      ghs_per_usd: rate,
    },
  };
}

export function BrandTab({ settings, onSaved }: BrandTabProps) {
  const [draft, setDraft] = useState<BrandDraft>(() => toDraft(settings));
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const update = <K extends keyof BrandDraft>(key: K, value: BrandDraft[K]) => {
    setResult(null);
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const rate = parseNumber(draft.ghs_per_usd);
  const examplePrice = Number.isFinite(rate) && rate > 0 ? formatMoney(Math.round(50 * rate * 100) / 100, 'GHS') : null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const checked = validate(draft);
    if ('error' in checked) {
      setResult({ tone: 'error', text: checked.error });
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      await saveSettings(checked.patch);
      setResult({ tone: 'success', text: 'Saved. Your public site already shows these changes.' });
      onSaved();
    } catch (err) {
      setResult({ tone: 'error', text: errorMessage(err, 'Your changes could not be saved. Please try again.') });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <SectionCard title="Brand identity" description="Shown in the header, footer and confirmation emails.">
        <div className="grid gap-6 md:grid-cols-2">
          <TextField label="Brand name" value={draft.brand_name} onChange={(v) => update('brand_name', v)} />
          <TextField label="Tagline" value={draft.tagline} onChange={(v) => update('tagline', v)} />
          <div className="md:col-span-2">
            <ImageField label="Logo" value={draft.logo_url} onChange={(url) => update('logo_url', url)} />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Homepage" description="The first thing clients read when they arrive.">
        <div className="grid gap-6">
          <TextField label="Headline" value={draft.hero_headline} onChange={(v) => update('hero_headline', v)} />
          <TextField
            label="Supporting text"
            multiline
            value={draft.hero_subheadline}
            onChange={(v) => update('hero_subheadline', v)}
          />
          <ImageField label="Hero background image" value={draft.hero_image_url} onChange={(url) => update('hero_image_url', url)} />
        </div>
      </SectionCard>

      <SectionCard title="Pricing and currency" description="Choose what clients see first. Prices appear in both currencies.">
        <div className="space-y-6">
          <div>
            <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-taupe-700">Default currency</span>
            <div role="radiogroup" aria-label="Default currency" className="grid gap-3 sm:grid-cols-2">
              {CURRENCIES.map((option) => {
                const active = draft.default_currency === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => update('default_currency', option.value)}
                    className={`rounded-2xl border px-5 py-4 text-left text-sm font-semibold transition duration-300 ${
                      active
                        ? 'border-bronze-500 bg-bronze-50 text-espresso-900 shadow-sm'
                        : 'border-taupe-200 text-taupe-700 hover:border-taupe-400'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <TextField
              label="Cedis per US dollar"
              type="number"
              min="0"
              step="0.01"
              value={draft.ghs_per_usd}
              onChange={(v) => update('ghs_per_usd', v)}
              hint={examplePrice ? `A $50 style shows as ${examplePrice}.` : 'Enter a rate above zero.'}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Business details" description="How clients reach you and where to find you.">
        <div className="grid gap-6 md:grid-cols-2">
          <TextField label="Phone" type="tel" value={draft.phone} onChange={(v) => update('phone', v)} />
          <TextField
            label="WhatsApp number"
            type="tel"
            value={draft.whatsapp_number}
            onChange={(v) => update('whatsapp_number', v)}
            hint="Include the country code, for example 233 24 000 0000."
          />
          <TextField label="Instagram handle" value={draft.instagram_handle} onChange={(v) => update('instagram_handle', v)} placeholder="@yourstudio" />
          <TextField label="Studio address" value={draft.address} onChange={(v) => update('address', v)} />
          <div className="md:col-span-2">
            <TextField label="Footer note" multiline value={draft.footer_note} onChange={(v) => update('footer_note', v)} />
          </div>
          <div className="md:col-span-2">
            <TextField
              label="Payment instructions"
              multiline
              value={draft.payment_instructions}
              onChange={(v) => update('payment_instructions', v)}
              hint="Shown to clients after they book, for the deposit."
            />
          </div>
        </div>
      </SectionCard>

      <div className="sticky sticky-bottom-safe z-20 flex flex-col gap-4 rounded-3xl bg-espresso-900/95 p-4 shadow-2xl backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="min-h-5 text-sm text-cream-100">
          {result && <Notice tone={result.tone}>{result.text}</Notice>}
        </div>
        <PrimaryButton busy={busy}>Save changes</PrimaryButton>
      </div>
    </form>
  );
}
