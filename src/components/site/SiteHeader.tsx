import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { CurrencyToggle } from '@/components/site/CurrencyToggle';
import { useSite } from '@/context/SiteContext';
import { DEFAULT_BOOK_BUTTON_LABEL } from '@/lib/defaults';
import type { SiteSettings } from '@/lib/types';

interface SiteHeaderProps {
  settings: SiteSettings;
  onBook: () => void;
  /** hide the Policies link when the owner has removed every policy */
  showPolicies?: boolean;
}

const NAV_LINKS = [
  { href: '#catalog', label: 'Styles' },
  { href: '#policies', label: 'Policies' },
  { href: '#visit', label: 'Visit' },
];

export function SiteHeader({ settings, onBook, showPolicies = true }: SiteHeaderProps) {
  const links = NAV_LINKS.filter((link) => showPolicies || link.href !== '#policies');
  const { currency, setCurrency } = useSite();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const solid = scrolled || menuOpen;

  return (
    <header
      className={`pt-safe fixed inset-x-0 top-0 z-40 transition-all duration-500 ${
        solid ? 'bg-cream-50/95 shadow-sm backdrop-blur-md' : 'bg-transparent'
      }`}
    >
      <div className="gutter mx-auto flex h-20 max-w-6xl items-center justify-between">
        <a href="#top" className="group flex min-w-0 items-center gap-3">
          {settings.logo_url ? (
            <img src={settings.logo_url} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
          ) : (
            <img
              src="/logo-mark.png"
              alt=""
              width={40}
              height={40}
              className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-bronze-300/60"
            />
          )}
          <span className={`truncate font-display text-xl font-semibold tracking-tight transition-colors sm:text-2xl ${solid ? 'text-espresso-900' : 'text-white'}`}>
            {settings.brand_name}
          </span>
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`text-sm font-semibold transition hover:text-bronze-500 ${solid ? 'text-espresso-700' : 'text-white/90'}`}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden sm:block">
            <CurrencyToggle value={currency} onChange={setCurrency} tone={solid ? 'light' : 'dark'} />
          </div>
          <button
            type="button"
            onClick={onBook}
            className="hidden rounded-full bg-bronze-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-bronze-900/20 transition duration-300 hover:-translate-y-0.5 hover:bg-bronze-600 sm:inline-flex"
          >
            {settings.book_button_label || DEFAULT_BOOK_BUTTON_LABEL}
          </button>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            className={`flex h-11 w-11 items-center justify-center rounded-full md:hidden ${solid ? 'text-espresso-900' : 'text-white'}`}
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="menu-panel animate-fade-in overflow-y-auto border-t border-taupe-200 bg-cream-50 px-5 pt-4 md:hidden">
          <nav className="flex flex-col gap-1">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-xl px-3 py-3 font-display text-2xl text-espresso-900 transition hover:bg-taupe-100"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="mt-5 flex flex-col gap-4">
            <CurrencyToggle value={currency} onChange={setCurrency} />
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onBook();
              }}
              className="rounded-full bg-espresso-800 px-6 py-3.5 text-sm font-bold text-cream-50 transition hover:bg-espresso-900"
            >
              {settings.book_button_label || DEFAULT_BOOK_BUTTON_LABEL}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
