import { useState, type FormEvent } from 'react';
import { ImageField } from '@/components/admin/ImageField';
import { Notice, PrimaryButton, SectionCard, TextField, errorMessage, parseNumber } from '@/components/admin/AdminPrimitives';
import { saveSettings } from '@/lib/api/admin';
import { formatMoney } from '@/lib/format';
import type { Currency, SiteSettings } from '@/lib/types';

type NumericRule = 'booking_window_days' | 'min_notice_hours' | 'buffer_minutes' | 'slot_interval_minutes';
type BrandDraft = Omit<SiteSettings, 'id' | 'timezone' | 'ghs_per_usd' | NumericRule> & {
  ghs_per_usd: string;
  booking_window_days: string;
  min_notice_hours: string;
  buffer_minutes: string;
  slot_interval_minutes: string;
};

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
    catalog_heading: settings.catalog_heading ?? '',
    policies_heading: settings.policies_heading ?? '',
    policies_intro: settings.policies_intro ?? '',
    booking_terms: settings.booking_terms ?? '',
    book_button_label: settings.book_button_label ?? '',
    explore_button_label: settings.explore_button_label ?? '',
    visit_heading: settings.visit_heading ?? '',
    hours_heading: settings.hours_heading ?? '',
    booking_window_days: String(settings.booking_window_days ?? 21),
    min_notice_hours: String(settings.min_notice_hours ?? 0),
    buffer_minutes: String(settings.buffer_minutes ?? 0),
    slot_interval_minutes: String(settings.slot_interval_minutes ?? 30),
    default_currency: settings.default_currency,
    ghs_per_usd: String(settings.ghs_per_usd),
  };
}

function validate(draft: BrandDraft): { patch: Omit<SiteSettings, 'id' | 'timezone'> } | { error: string } {
  const rate = parseNumber(draft.ghs_per_usd);
  if (!draft.brand_name.trim()) return { error: 'Your brand name cannot be empty.' };
  if (!draft.hero_headline.trim()) return { error: 'The homepage headline cannot be empty.' };
  if (!Number.isFinite(rate) || rate <= 0) return { error: 'Enter a cedi exchange rate greater than zero.' };
  const windowDays = parseNumber(draft.booking_window_days);
  const notice = parseNumber(draft.min_notice_hours);
  const buffer = parseNumber(draft.buffer_minutes);
  const interval = parseNumber(draft.slot_interval_minutes);
  if (!Number.isInteger(windowDays) || windowDays < 1 || windowDays > 365) {
    return { error: 'Booking window must be a whole number of days from 1 to 365.' };
  }
  if (!Number.isInteger(notice) || notice < 0 || notice > 720) {
    return { error: 'Minimum notice must be a whole number of hours from 0 to 720.' };
  }
  if (!Number.isInteger(buffer) || buffer < 0 || buffer > 180) {
    return { error: 'Time between appointments must be a whole number of minutes from 0 to 180.' };
  }
  if (!Number.isInteger(interval) || interval < 15 || interval > 240 || interval % 5 !== 0) {
    return { error: 'Start times must be spaced 15 to 240 minutes apart, in steps of 5 (for example 30 or 60).' };
  }
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
      catalog_heading: draft.catalog_heading.trim(),
      policies_heading: draft.policies_heading.trim(),
      policies_intro: draft.policies_intro.trim(),
      booking_terms: draft.booking_terms.trim(),
      book_button_label: draft.book_button_label.trim(),
      explore_button_label: draft.explore_button_label.trim(),
      visit_heading: draft.visit_heading.trim(),
      hours_heading: draft.hours_heading.trim(),
      booking_window_days: windowDays,
      min_notice_hours: notice,
      buffer_minutes: buffer,
      slot_interval_minutes: interval,
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

      <SectionCard
        title="Booking rules"
        description="Control when clients can book. These rules apply to the calendar and are also checked again when a booking is saved."
      >
        <div className="grid gap-6 md:grid-cols-2">
          <TextField
            label="How far ahead can clients book (days)"
            type="number"
            min="1"
            max="365"
            step="1"
            value={draft.booking_window_days}
            onChange={(v) => update('booking_window_days', v)}
            hint="For example 30 shows the next 30 days."
          />
          <TextField
            label="Minimum notice (hours)"
            type="number"
            min="0"
            max="720"
            step="1"
            value={draft.min_notice_hours}
            onChange={(v) => update('min_notice_hours', v)}
            hint="0 allows booking right up to the start time. 24 means at least one day ahead."
          />
          <TextField
            label="Time kept free between appointments (minutes)"
            type="number"
            min="0"
            max="180"
            step="5"
            value={draft.buffer_minutes}
            onChange={(v) => update('buffer_minutes', v)}
            hint="A rest or clean-up gap after each appointment. 0 means none."
          />
          <TextField
            label="Start times offered every (minutes)"
            type="number"
            min="15"
            max="240"
            step="5"
            value={draft.slot_interval_minutes}
            onChange={(v) => update('slot_interval_minutes', v)}
            hint="30 offers 9:00, 9:30, 10:00. 60 offers 9:00, 10:00, 11:00."
          />
        </div>
      </SectionCard>

      <SectionCard title="Website wording" description="Text on the public site that you can change. Leave a box empty to use the standard wording.">
        <div className="grid gap-6">
          <div className="grid gap-6 md:grid-cols-2">
            <TextField label="Main booking button" value={draft.book_button_label} onChange={(v) => update('book_button_label', v)} />
            <TextField label="Second button on the first screen" value={draft.explore_button_label} onChange={(v) => update('explore_button_label', v)} />
            <TextField label="Footer heading for location and contact" value={draft.visit_heading} onChange={(v) => update('visit_heading', v)} />
            <TextField label="Footer heading for opening hours" value={draft.hours_heading} onChange={(v) => update('hours_heading', v)} />
          </div>
          <TextField label="Styles section heading" value={draft.catalog_heading} onChange={(v) => update('catalog_heading', v)} />
          <TextField label="Policies section heading" value={draft.policies_heading} onChange={(v) => update('policies_heading', v)} />
          <TextField
            label="Policies section introduction"
            multiline
            value={draft.policies_intro}
            onChange={(v) => update('policies_intro', v)}
          />
          <TextField
            label="Booking agreement (tick box)"
            multiline
            value={draft.booking_terms}
            onChange={(v) => update('booking_terms', v)}
            hint="Shown as a tick box on the last booking step. Clients must tick it to book. Keep it in line with your policies."
          />
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
