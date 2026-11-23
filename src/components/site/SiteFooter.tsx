import { Lock, MapPin, MessageCircle, Phone } from 'lucide-react';
import { SocialIcon } from '@/components/ui/SocialIcon';
import { socialHandleText, socialName, socialUrl } from '@/lib/social';
import { formatTimeOfDay } from '@/lib/format';
import { DEFAULT_HOURS_HEADING, DEFAULT_VISIT_HEADING } from '@/lib/defaults';
import type { SiteSettings, SocialLink, WorkingHour } from '@/lib/types';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface SiteFooterProps {
  settings: SiteSettings;
  hours: WorkingHour[];
  socials?: SocialLink[];
  onOwnerLogin: () => void;
}

export function SiteFooter({ settings, hours, socials = [], onOwnerLogin }: SiteFooterProps) {
  const orderedHours = [1, 2, 3, 4, 5, 6, 0]
    .map((day) => hours.find((h) => h.weekday === day))
    .filter((h): h is WorkingHour => Boolean(h));
  const whatsappDigits = settings.whatsapp_number.replace(/\D/g, '');

  return (
    <footer id="visit" className="footer-pad scroll-mt-24 bg-espresso-900 text-cream-200">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-14 sm:px-8 sm:py-20 md:grid-cols-3">
        <div className="space-y-5">
          <img
            src="/logo-badge.webp"
            alt={settings.brand_name}
            width={900}
            height={709}
            loading="lazy"
            decoding="async"
            className="-ml-3 h-auto w-full max-w-[16rem]"
          />
          <p className="max-w-xs text-sm leading-[1.5] text-cream-300/90">{settings.footer_note}</p>
        </div>

        <div className="space-y-5">
          <h3 className="font-display text-2xl text-white">{settings.visit_heading || DEFAULT_VISIT_HEADING}</h3>
          <ul className="space-y-4 text-sm">
            {settings.address && (
              <li className="flex gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-bronze-300" />
                <span>{settings.address}</span>
              </li>
            )}
            {settings.phone && (
              <li className="flex gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-bronze-300" />
                <a href={`tel:${settings.phone.replace(/\s/g, '')}`} className="transition hover:text-white">
                  {settings.phone}
                </a>
              </li>
            )}
            {whatsappDigits && (
              <li className="flex gap-3">
                <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-bronze-300" />
                <a
                  href={`https://wa.me/${whatsappDigits}`}
                  target="_blank"
                  rel="noreferrer"
                  className="transition hover:text-white"
                >
                  Message us on WhatsApp
                </a>
              </li>
            )}
            {socials.map((link) => {
              const href = socialUrl(link);
              if (!href) return null;
              const handleText = socialHandleText(link);
              return (
                <li key={link.id} className="flex gap-3">
                  <SocialIcon platform={link.platform} className="mt-0.5 h-4 w-4 shrink-0 text-bronze-300" />
                  <a href={href} target="_blank" rel="noreferrer noopener" className="min-w-0 break-words transition hover:text-white">
                    {socialName(link)}
                    {handleText && <span className="text-cream-300/70"> {handleText}</span>}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="space-y-5">
          <h3 className="font-display text-2xl text-white">{settings.hours_heading || DEFAULT_HOURS_HEADING}</h3>
          <ul className="space-y-2.5 text-sm">
            {orderedHours.map((h) => (
              <li key={h.weekday} className="flex justify-between gap-4 border-b border-white/10 pb-2.5">
                <span>{DAY_NAMES[h.weekday]}</span>
                <span className="text-cream-300/80">
                  {h.is_open ? `${formatTimeOfDay(h.open_time)} - ${formatTimeOfDay(h.close_time)}` : 'Closed'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-6 text-xs text-cream-300/70 sm:flex-row sm:px-8">
          <p>© {new Date().getFullYear()} {settings.brand_name}. All rights reserved.</p>
          <button
            type="button"
            onClick={onOwnerLogin}
            className="-m-2 inline-flex items-center gap-1.5 p-2 transition hover:text-white"
          >
            <Lock className="h-3 w-3" />
            Owner login
          </button>
        </div>
      </div>
    </footer>
  );
}
