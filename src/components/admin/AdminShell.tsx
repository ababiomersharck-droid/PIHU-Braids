import { useCallback, useEffect, useState } from 'react';
import { CalendarDays, Loader2, LogOut, Scissors, Settings2, Sparkles, Store } from 'lucide-react';
import { BrandTab } from '@/components/admin/BrandTab';
import { HoursTab } from '@/components/admin/HoursTab';
import { BookingsTab } from '@/components/admin/BookingsTab';
import { ServicesTab } from '@/components/admin/ServicesTab';
import { Notice, errorMessage } from '@/components/admin/AdminPrimitives';
import { fetchAdminData, signOutOwner, type AdminData } from '@/lib/api/admin';

type TabId = 'brand' | 'hours' | 'bookings' | 'services';

const TABS: Array<{ id: TabId; label: string; icon: typeof Store }> = [
  { id: 'brand', label: 'Brand & Business', icon: Store },
  { id: 'hours', label: 'Hours & Calendar', icon: CalendarDays },
  { id: 'bookings', label: 'Bookings', icon: Settings2 },
  { id: 'services', label: 'Services', icon: Sparkles },
];

export function AdminShell() {
  const [tab, setTab] = useState<TabId>('bookings');
  const [data, setData] = useState<AdminData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const reload = useCallback(() => {
    fetchAdminData()
      .then((next) => {
        setData(next);
        setLoadError(null);
      })
      .catch((err: unknown) => setLoadError(errorMessage(err, 'Studio data could not be loaded.')));
  }, []);

  useEffect(() => {
    (async () => {
      reload();
    })();
  }, [reload]);

  return (
    <div className="min-h-screen-dvh bg-cream-100">
      <header className="pt-safe sticky top-0 z-30 border-b border-taupe-200 bg-cream-50/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-espresso-800 text-bronze-300">
              <Scissors className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-xl leading-none text-espresso-900">{data?.settings.brand_name ?? 'Studio'}</p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-taupe-500">Owner dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href="/" className="inline-flex min-h-[2.75rem] items-center rounded-full px-4 text-sm font-semibold text-espresso-800 transition hover:bg-taupe-100">
              View site
            </a>
            <button
              type="button"
              onClick={() => {
                (async () => {
                  await signOutOwner();
                })();
              }}
              className="inline-flex min-h-[2.75rem] items-center gap-2 rounded-full bg-espresso-800 px-4 text-sm font-bold text-cream-50 transition hover:bg-espresso-900"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-5 pb-3 sm:px-8" aria-label="Admin sections">
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                aria-current={active ? 'page' : undefined}
                className={`inline-flex min-h-[2.75rem] shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold transition duration-300 ${
                  active ? 'bg-bronze-500 text-white shadow-md' : 'text-taupe-700 hover:bg-taupe-100 hover:text-espresso-900'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        {tab === 'bookings' && <BookingsTab timezone={data?.settings.timezone ?? 'Africa/Accra'} />}
        {tab !== 'bookings' && loadError && <Notice tone="error">{loadError}</Notice>}
        {tab !== 'bookings' && !data && !loadError && (
          <div className="flex justify-center py-24">
            <Loader2 className="h-6 w-6 animate-spin text-bronze-600" />
          </div>
        )}
        {data && tab !== 'bookings' && (
          <div key={tab} className="animate-fade-up">
            {tab === 'brand' && <BrandTab settings={data.settings} onSaved={reload} />}
            {tab === 'hours' && <HoursTab hours={data.hours} blackouts={data.blackouts} timezone={data.settings.timezone} onChanged={reload} />}
            {tab === 'services' && <ServicesTab services={data.services} addons={data.addons} onChanged={reload} />}
          </div>
        )}
      </main>
    </div>
  );
}
