import { ArrowRight, Search, Sparkles } from 'lucide-react';
import { CurrencyToggle } from '@/components/site/CurrencyToggle';
import { useSite } from '@/context/SiteContext';
import type { SiteSettings } from '@/lib/types';

interface HeroProps {
  settings: SiteSettings;
  search: string;
  onSearchChange: (value: string) => void;
  onBook: () => void;
}

export function Hero({ settings, search, onSearchChange, onBook }: HeroProps) {
  const { currency, setCurrency } = useSite();

  return (
    <section id="top" className="relative isolate flex min-h-hero items-center overflow-hidden bg-espresso-900">
      {settings.hero_image_url && (
        <img
          src={settings.hero_image_url}
          alt=""
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 -z-10 h-full w-full object-cover opacity-70 animate-fade-in"
        />
      )}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-espresso-900/95 via-espresso-900/70 to-espresso-900/30" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-cream-100 to-transparent" />

      <div className="hero-pad mx-auto w-full max-w-6xl px-5 pb-20 sm:px-8 sm:pb-24">
        <div className="max-w-2xl">
          <p className="eyebrow mb-6 inline-flex items-center gap-2 text-bronze-300 animate-fade-up">
            <Sparkles className="h-3.5 w-3.5" />
            {settings.tagline}
          </p>
          <h1 className="text-display-xl text-white animate-fade-up [animation-delay:120ms]">
            {settings.hero_headline}
          </h1>
          <p className="mt-6 max-w-xl text-base leading-[1.5] text-white/80 sm:text-lg animate-fade-up [animation-delay:240ms]">
            {settings.hero_subheadline}
          </p>

          <div className="mt-10 flex flex-col gap-4 animate-fade-up [animation-delay:360ms]">
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onBook}
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-bronze-500 px-7 py-4 text-sm font-bold text-white shadow-xl shadow-black/30 transition duration-300 hover:-translate-y-0.5 hover:bg-bronze-400"
              >
                Book Appointment
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </button>
              <a
                href="#catalog"
                className="inline-flex items-center justify-center rounded-full border border-white/40 px-7 py-4 text-sm font-bold text-white transition hover:border-white hover:bg-white/10"
              >
                Explore Styles
              </a>
            </div>

            <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center">
              <label className="relative flex w-full max-w-md items-center">
                <Search className="pointer-events-none absolute left-4 h-4 w-4 text-taupe-500" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search a style, e.g. knotless"
                  className="w-full rounded-full border border-white/20 bg-white/95 py-3.5 pl-11 pr-5 text-base text-espresso-900 placeholder:text-taupe-500 shadow-lg transition focus:outline-none focus:ring-4 focus:ring-bronze-300/40"
                />
              </label>
              <CurrencyToggle value={currency} onChange={setCurrency} tone="dark" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
