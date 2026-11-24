import { useCallback, useEffect, useState } from 'react';
import {
  CalendarDays,
  ClipboardList,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  MoreHorizontal,
  ScrollText,
  Share2,
  Sparkles,
  Store,
  type LucideIcon,
} from 'lucide-react';
import { AdminFeedbackProvider } from '@/components/admin/AdminFeedback';
import { BrandTab } from '@/components/admin/BrandTab';
import { HoursTab } from '@/components/admin/HoursTab';
import { BookingsTab } from '@/components/admin/BookingsTab';
import { ServicesTab } from '@/components/admin/ServicesTab';
import { PoliciesTab } from '@/components/admin/PoliciesTab';
import { SocialTab } from '@/components/admin/SocialTab';
import { TodayTab, TodaySkeleton } from '@/components/admin/TodayTab';
import { Notice, Skeleton, errorMessage } from '@/components/admin/AdminPrimitives';
import { Modal } from '@/components/ui/Modal';
import { fetchAdminData, fetchPendingCount, signOutOwner, type AdminData } from '@/lib/api/admin';

type TabId = 'today' | 'bookings' | 'hours' | 'services' | 'policies' | 'social' | 'brand';

interface NavItem {
  id: TabId;
  label: string;
  icon: LucideIcon;
  title: string;
  blurb: string;
}

const NAV: Record<TabId, NavItem> = {
  today: { id: 'today', label: 'Today', icon: LayoutDashboard, title: 'Today', blurb: '' },
  bookings: { id: 'bookings', label: 'Bookings', icon: ClipboardList, title: 'Bookings', blurb: 'Requests, confirmations and deposits in one place.' },
  hours: { id: 'hours', label: 'Hours & Calendar', icon: CalendarDays, title: 'Hours & calendar', blurb: 'When you work, and the days you are away.' },
  services: { id: 'services', label: 'Services', icon: Sparkles, title: 'Services', blurb: 'Your styles and add-ons, with prices, durations and photos.' },
  policies: { id: 'policies', label: 'Policies & FAQs', icon: ScrollText, title: 'Policies & FAQs', blurb: 'What clients should know before they book.' },
  social: { id: 'social', label: 'Social media', icon: Share2, title: 'Social media', blurb: 'The accounts shown in your website footer.' },
  brand: { id: 'brand', label: 'Brand & Business', icon: Store, title: 'Brand & business', blurb: 'Your name, wording, contact details, prices and booking rules.' },
};

const GROUPS: Array<{ label: string; ids: TabId[] }> = [
  { label: 'Studio', ids: ['today', 'bookings', 'hours'] },
  { label: 'Website', ids: ['services', 'policies', 'social', 'brand'] },
];

const BOTTOM_IDS: TabId[] = ['today', 'bookings', 'services'];
const MORE_IDS: TabId[] = ['hours', 'policies', 'social', 'brand'];

function PageHeader({ title, blurb }: { title: string; blurb: string }) {
  return (
    <header className="mb-8">
      <h1 className="text-display-lg">{title}</h1>
      <p className="mt-2 max-w-xl text-sm text-taupe-600">{blurb}</p>
    </header>
  );
}

function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="rounded-full bg-bronze-500 px-2 py-0.5 text-[11px] font-bold leading-none text-white" aria-label={`${count} waiting`}>
      {count > 9 ? '9+' : count}
    </span>
  );
}

export function AdminShell() {
  return (
    <AdminFeedbackProvider>
      <AdminLayout />
    </AdminFeedbackProvider>
  );
}

function AdminLayout() {
  const [tab, setTab] = useState<TabId>('today');
  const [moreOpen, setMoreOpen] = useState(false);
  const [data, setData] = useState<AdminData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pending, setPending] = useState(0);

  const reload = useCallback(() => {
    fetchAdminData()
      .then((next) => {
        setData(next);
        setLoadError(null);
      })
      .catch((err: unknown) => setLoadError(errorMessage(err, 'Studio data could not be loaded.')));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  // the little number on Bookings: requests still waiting for the owner
  useEffect(() => {
    let active = true;
    const run = () => {
      fetchPendingCount()
        .then((count) => {
          if (active) setPending(count);
        })
        .catch(() => undefined);
    };
    run();
    const timer = window.setInterval(run, 60_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [tab]);

  const brand = data?.settings.brand_name ?? 'Studio';
  useEffect(() => {
    document.title = `${brand} \u00b7 Owner dashboard`;
  }, [brand]);

  const go = (id: TabId) => {
    setTab(id);
    setMoreOpen(false);
    window.scrollTo({ top: 0 });
  };
  const signOut = () => {
    void signOutOwner();
  };

  const badgeFor = (id: TabId) => (id === 'bookings' ? pending : 0);
  const page = NAV[tab];
  const moreActive = MORE_IDS.includes(tab);

  return (
    <div className="min-h-screen-dvh bg-cream-100 lg:pl-72">
      {/* Laptop and tablet: dark sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col bg-espresso-900 text-cream-200 lg:flex">
        <div className="flex items-center gap-3 px-6 pb-2 pt-6">
          <img src="/logo-mark.png" alt="" width={44} height={44} className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-bronze-300/50" />
          <div className="min-w-0">
            <p className="truncate font-display text-2xl leading-tight text-white">{brand}</p>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-bronze-300">Owner dashboard</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-3" aria-label="Admin sections">
          {GROUPS.map((group) => (
            <div key={group.label} className="mt-4">
              <p className="px-3 pb-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-taupe-400">{group.label}</p>
              <ul className="space-y-0.5">
                {group.ids.map((id) => {
                  const { label, icon: Icon } = NAV[id];
                  const active = tab === id;
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        onClick={() => go(id)}
                        aria-current={active ? 'page' : undefined}
                        className={`relative flex min-h-[2.5rem] w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold transition duration-200 ${
                          active ? 'bg-white/10 text-white' : 'text-cream-300/80 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        {active && <span className="absolute inset-y-2 left-0 w-1 rounded-full bg-bronze-400" aria-hidden="true" />}
                        <Icon className="h-[18px] w-[18px] shrink-0 text-bronze-300" aria-hidden="true" />
                        <span className="flex-1">{label}</span>
                        <Badge count={badgeFor(id)} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="space-y-0.5 border-t border-white/10 p-3">
          <a
            href="/"
            target="_blank"
            rel="noreferrer noopener"
            className="flex min-h-[2.5rem] items-center gap-3 rounded-xl px-3 text-sm font-semibold text-cream-300/80 transition hover:bg-white/5 hover:text-white"
          >
            <ExternalLink className="h-[18px] w-[18px] text-bronze-300" aria-hidden="true" />
            View your website
          </a>
          <button
            type="button"
            onClick={signOut}
            className="flex min-h-[2.5rem] w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold text-cream-300/80 transition hover:bg-white/5 hover:text-white"
          >
            <LogOut className="h-[18px] w-[18px] text-bronze-300" aria-hidden="true" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Phone: slim top bar */}
      <header className="pt-safe sticky top-0 z-30 border-b border-taupe-200 bg-cream-50/95 backdrop-blur lg:hidden">
        <div className="flex h-16 items-center justify-between gap-3 px-5">
          <div className="flex min-w-0 items-center gap-3">
            <img src="/logo-mark.png" alt="" width={40} height={40} className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-bronze-300/60" />
            <p className="truncate font-display text-xl text-espresso-900">{brand}</p>
          </div>
          <div className="flex items-center gap-1">
            <a
              href="/"
              target="_blank"
              rel="noreferrer noopener"
              aria-label="View your website"
              className="flex h-11 w-11 items-center justify-center rounded-full text-espresso-800 transition hover:bg-taupe-100"
            >
              <ExternalLink className="h-5 w-5" />
            </a>
            <button
              type="button"
              onClick={signOut}
              aria-label="Sign out"
              className="flex h-11 w-11 items-center justify-center rounded-full text-espresso-800 transition hover:bg-taupe-100"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="admin-main-pad mx-auto max-w-5xl px-5 pt-8 sm:px-8 lg:pt-12">
        {loadError && tab !== 'bookings' && <Notice tone="error">{loadError}</Notice>}

        {tab === 'today' && (data ? <TodayTab settings={data.settings} onOpenBookings={() => go('bookings')} /> : !loadError && <TodaySkeleton />)}

        {tab === 'bookings' && (
          <div className="animate-fade-up">
            <PageHeader title={page.title} blurb={page.blurb} />
            <BookingsTab timezone={data?.settings.timezone ?? 'Africa/Accra'} brandName={brand} />
          </div>
        )}

        {tab !== 'today' && tab !== 'bookings' && !data && !loadError && (
          <div className="space-y-4" aria-busy="true">
            <Skeleton className="h-16 max-w-sm" />
            <Skeleton className="h-64" />
          </div>
        )}

        {data && tab !== 'today' && tab !== 'bookings' && (
          <div key={tab} className="animate-fade-up">
            <PageHeader title={page.title} blurb={page.blurb} />
            {tab === 'brand' && <BrandTab settings={data.settings} onSaved={reload} />}
            {tab === 'hours' && <HoursTab hours={data.hours} blackouts={data.blackouts} timezone={data.settings.timezone} onChanged={reload} />}
            {tab === 'social' && <SocialTab socials={data.socials} ready={data.socialsReady} onChanged={reload} />}
            {tab === 'policies' && <PoliciesTab policies={data.policies} ready={data.policiesReady} onChanged={reload} />}
            {tab === 'services' && <ServicesTab services={data.services} addons={data.addons} onChanged={reload} />}
          </div>
        )}
      </main>

      {/* Phone: app-style bottom bar */}
      <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-espresso-900/95 backdrop-blur lg:hidden" aria-label="Main sections">
        <ul className="mx-auto grid max-w-md grid-cols-4">
          {BOTTOM_IDS.map((id) => {
            const { label, icon: Icon } = NAV[id];
            const active = tab === id;
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => go(id)}
                  aria-current={active ? 'page' : undefined}
                  className={`flex min-h-[4rem] w-full flex-col items-center justify-center gap-1 text-[11px] font-semibold transition ${
                    active ? 'text-bronze-300' : 'text-cream-300/70'
                  }`}
                >
                  <span className="relative">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                    {badgeFor(id) > 0 && (
                      <span className="absolute -right-3 -top-2">
                        <Badge count={badgeFor(id)} />
                      </span>
                    )}
                  </span>
                  {label}
                </button>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              aria-haspopup="dialog"
              className={`flex min-h-[4rem] w-full flex-col items-center justify-center gap-1 text-[11px] font-semibold transition ${
                moreActive ? 'text-bronze-300' : 'text-cream-300/70'
              }`}
            >
              <MoreHorizontal className="h-6 w-6" aria-hidden="true" />
              More
            </button>
          </li>
        </ul>
      </nav>

      <Modal open={moreOpen} onClose={() => setMoreOpen(false)} label="More sections">
        <div className="space-y-2 p-6 pb-8">
          <h2 className="mb-4 pr-10 text-3xl">More</h2>
          {MORE_IDS.map((id) => {
            const { label, icon: Icon, blurb } = NAV[id];
            return (
              <button
                key={id}
                type="button"
                onClick={() => go(id)}
                className="flex w-full items-center gap-4 rounded-2xl px-3 py-3 text-left transition hover:bg-taupe-100"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-espresso-800 text-bronze-300">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold text-espresso-900">{label}</span>
                  <span className="block truncate text-xs text-taupe-600">{blurb}</span>
                </span>
              </button>
            );
          })}
        </div>
      </Modal>
    </div>
  );
}
