import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, CalendarCheck2, CalendarX, Check, Clock, Copy, MessageCircle, Phone, Share2, TrendingUp, Wallet } from 'lucide-react';
import { useToast } from '@/components/admin/AdminFeedback';
import { Notice, Skeleton, errorMessage } from '@/components/admin/AdminPrimitives';
import { STATUS_META } from '@/components/admin/BookingRow';
import { fetchBookings, updateBooking } from '@/lib/api/admin';
import { formatDateTime, formatDuration, formatInTimezone, formatIsoDateLong, formatMoney } from '@/lib/format';
import { buildTodayView, greetingFor, startsIn } from '@/lib/insights';
import { clientMessage, whatsappUrl } from '@/lib/whatsapp';
import type { Booking, SiteSettings } from '@/lib/types';

interface TodayTabProps {
  settings: SiteSettings;
  onOpenBookings: () => void;
}

const MAX_ATTENTION = 5;

export function TodaySkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading your day">
      <Skeleton className="h-24 max-w-sm" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
    </div>
  );
}

export function TodayTab({ settings, onOpenBookings }: TodayTabProps) {
  const notify = useToast();
  const tz = settings.timezone;
  const currency = settings.default_currency;
  const brand = settings.brand_name;

  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    try {
      setBookings(await fetchBookings());
      setError(null);
    } catch (err) {
      setError(errorMessage(err, 'Your bookings could not be loaded. Please try again.'));
    }
  }, []);

  useEffect(() => {
    void load();
    // keep "in 25 min" and the lists fresh without the owner touching anything
    const timer = window.setInterval(() => {
      setNow(Date.now());
      void load();
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [load]);

  const view = useMemo(() => buildTodayView(bookings ?? [], tz, currency, now), [bookings, tz, currency, now]);

  const act = async (booking: Booking, patch: Parameters<typeof updateBooking>[1], done: string) => {
    setBusyId(booking.id);
    try {
      await updateBooking(booking.id, patch);
      notify(done);
      await load();
    } catch (err) {
      notify(errorMessage(err, 'That could not be saved. Please try again.'), 'error');
    } finally {
      setBusyId(null);
    }
  };

  const bookingLink = window.location.origin;
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(bookingLink);
      notify('Booking link copied');
    } catch {
      notify('Could not copy automatically. Select the link and copy it by hand.', 'error');
    }
  };
  const shareUrl = `https://wa.me/?text=${encodeURIComponent(`Book your appointment with ${brand}: ${bookingLink}`)}`;

  if (bookings === null && !error) return <TodaySkeleton />;

  const { next, todayList, pending, unpaid } = view;
  const waFor = (b: Booking) => whatsappUrl(b.client_phone, clientMessage(b, brand, tz));
  const nextWhatsapp = next ? waFor(next) : null;

  const stats = [
    {
      label: 'Today',
      value: String(todayList.length),
      note: todayList.length === 1 ? 'appointment' : 'appointments',
      icon: CalendarCheck2,
      highlight: false,
    },
    {
      label: 'Needs attention',
      value: String(pending.length),
      note: pending.length === 1 ? 'waiting to be confirmed' : 'waiting to be confirmed',
      icon: Clock,
      highlight: pending.length > 0,
    },
    {
      label: 'Deposits to chase',
      value: String(unpaid.length),
      note: unpaid.length > 0 ? `${formatMoney(view.unpaidAmount, currency)} outstanding` : 'all received',
      icon: Wallet,
      highlight: false,
    },
    {
      label: 'This week',
      value: formatMoney(view.weekIncome, currency),
      note: `${view.weekCount} ${view.weekCount === 1 ? 'booking' : 'bookings'}`,
      icon: TrendingUp,
      highlight: false,
    },
  ];

  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow">{formatIsoDateLong(view.today)}</p>
        <h1 className="mt-2 text-display-lg">{greetingFor(tz, now)}.</h1>
        <p className="mt-2 text-sm text-taupe-600">
          {todayList.length === 0
            ? 'No appointments today. A quiet day, or a good moment to share your booking link.'
            : `You have ${todayList.length} ${todayList.length === 1 ? 'appointment' : 'appointments'} today.`}
        </p>
      </header>

      {error && <Notice tone="error">{error}</Notice>}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, note, icon: Icon, highlight }) => (
          <div
            key={label}
            className={`rounded-3xl border bg-white p-5 shadow-sm ${highlight ? 'border-bronze-400 ring-4 ring-bronze-300/20' : 'border-taupe-200'}`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-bold uppercase tracking-wider text-taupe-600">{label}</p>
              <Icon className="h-4 w-4 shrink-0 text-bronze-600" aria-hidden="true" />
            </div>
            <p className="mt-3 font-display text-4xl leading-none text-espresso-900">{value}</p>
            <p className="mt-2 text-xs text-taupe-600">{note}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="min-w-0 space-y-6">
          <section className="relative overflow-hidden rounded-3xl bg-espresso-900 p-6 text-cream-100 shadow-xl sm:p-8">
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-bronze-500/25 blur-3xl" aria-hidden="true" />
            <p className="relative text-xs font-bold uppercase tracking-[0.2em] text-bronze-300">Up next</p>
            {next ? (
              <div className="relative">
                <p className="mt-3 font-display text-4xl text-white sm:text-5xl">{next.client_name}</p>
                <p className="mt-1 text-sm text-cream-200/90">
                  {next.service_name}
                  {next.addon_names.length > 0 && ` + ${next.addon_names.join(', ')}`}
                </p>
                <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-cream-100">
                  <span className="inline-flex items-center gap-2">
                    <CalendarCheck2 className="h-4 w-4 text-bronze-300" aria-hidden="true" />
                    {formatDateTime(next.start_at, tz)}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Clock className="h-4 w-4 text-bronze-300" aria-hidden="true" />
                    {formatDuration(next.duration_minutes)}
                  </span>
                  <span className="font-semibold text-bronze-300">{startsIn(next.start_at, now)}</span>
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href={`tel:${next.client_phone}`}
                    className="inline-flex min-h-[2.75rem] items-center gap-2 rounded-full bg-white/10 px-5 text-sm font-semibold text-white transition hover:bg-white/20"
                  >
                    <Phone className="h-4 w-4" />
                    Call
                  </a>
                  {nextWhatsapp && (
                    <a
                      href={nextWhatsapp}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex min-h-[2.75rem] items-center gap-2 rounded-full bg-[#25D366] px-5 text-sm font-bold text-white transition hover:brightness-95"
                    >
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={onOpenBookings}
                    className="inline-flex min-h-[2.75rem] items-center gap-2 rounded-full px-4 text-sm font-semibold text-cream-200 transition hover:text-white"
                  >
                    All bookings
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative mt-3">
                <p className="font-display text-3xl text-white">Nothing coming up yet</p>
                <p className="mt-2 max-w-md text-sm text-cream-200/90">
                  New requests appear here the moment a client books. Share your booking link to fill the calendar.
                </p>
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-taupe-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-2xl">Today&rsquo;s schedule</h2>
            {todayList.length === 0 ? (
              <div className="mt-5 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-taupe-300 px-6 py-10 text-center">
                <CalendarX className="h-6 w-6 text-taupe-400" aria-hidden="true" />
                <p className="text-sm text-taupe-600">No appointments today.</p>
              </div>
            ) : (
              <ul className="mt-4 divide-y divide-taupe-100">
                {todayList.map((b) => {
                  const done = new Date(b.end_at).getTime() < now;
                  const meta = STATUS_META[b.status];
                  return (
                    <li key={b.id} className={`flex items-center gap-4 py-4 ${done ? 'opacity-55' : ''}`}>
                      <div className="w-20 shrink-0">
                        <p className="font-display text-2xl leading-none text-espresso-900">
                          {formatInTimezone(b.start_at, tz, { hour: 'numeric', minute: '2-digit' })}
                        </p>
                        <p className="mt-1 text-xs text-taupe-500">{formatDuration(b.duration_minutes)}</p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-espresso-900">{b.client_name}</p>
                        <p className="truncate text-sm text-taupe-600">{b.service_name}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${meta.className}`}>
                        {meta.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        <div className="min-w-0 space-y-6">
          <section className="rounded-3xl border border-taupe-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl">Needs your attention</h2>
            {pending.length === 0 ? (
              <div className="mt-5 flex flex-col items-center gap-3 rounded-2xl bg-cream-100 px-6 py-8 text-center">
                <Check className="h-6 w-6 text-bronze-600" aria-hidden="true" />
                <p className="text-sm text-taupe-700">All caught up. Nothing is waiting for you.</p>
              </div>
            ) : (
              <>
                <ul className="mt-4 space-y-3">
                  {pending.slice(0, MAX_ATTENTION).map((b) => {
                    const wa = waFor(b);
                    const busy = busyId === b.id;
                    return (
                      <li key={b.id} className="rounded-2xl bg-cream-50 p-4 ring-1 ring-taupe-200">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-espresso-900">{b.client_name}</p>
                            <p className="truncate text-sm text-taupe-600">{b.service_name}</p>
                          </div>
                          <span className="shrink-0 text-xs font-semibold text-bronze-700">{startsIn(b.start_at, now)}</span>
                        </div>
                        <p className="mt-1 text-xs text-taupe-500">
                          {formatDateTime(b.start_at, tz)} &middot; {b.deposit_paid ? 'Deposit received' : 'Deposit not received'}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void act(b, { status: 'confirmed' }, `${b.client_name} confirmed`)}
                            className="inline-flex min-h-[2.5rem] items-center gap-1.5 rounded-full bg-espresso-800 px-4 text-xs font-bold text-cream-50 transition hover:bg-espresso-900 disabled:opacity-50"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Confirm
                          </button>
                          {!b.deposit_paid && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void act(b, { deposit_paid: true }, 'Deposit marked as received')}
                              className="inline-flex min-h-[2.5rem] items-center gap-1.5 rounded-full border border-taupe-300 px-4 text-xs font-semibold text-espresso-800 transition hover:border-bronze-500 hover:text-bronze-700 disabled:opacity-50"
                            >
                              <Wallet className="h-3.5 w-3.5" />
                              Deposit received
                            </button>
                          )}
                          {wa && (
                            <a
                              href={wa}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="inline-flex min-h-[2.5rem] items-center gap-1.5 rounded-full bg-[#25D366]/10 px-4 text-xs font-semibold text-[#128C7E] transition hover:bg-[#25D366]/20"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                              WhatsApp
                            </a>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
                {pending.length > MAX_ATTENTION && (
                  <button
                    type="button"
                    onClick={onOpenBookings}
                    className="mt-4 inline-flex min-h-[2.75rem] items-center gap-2 text-sm font-semibold text-bronze-700 transition hover:text-bronze-600"
                  >
                    See all {pending.length} in Bookings
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </>
            )}
          </section>

          <section className="rounded-3xl border border-taupe-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl">Your booking link</h2>
            <p className="mt-2 text-sm text-taupe-600">Send this to clients, or put it in your Instagram bio.</p>
            <p className="mt-4 break-all rounded-2xl bg-cream-100 px-4 py-3 text-sm font-semibold text-espresso-900">{bookingLink}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void copyLink()}
                className="inline-flex min-h-[2.75rem] items-center gap-2 rounded-full bg-espresso-800 px-5 text-sm font-bold text-cream-50 transition hover:bg-espresso-900"
              >
                <Copy className="h-4 w-4" />
                Copy link
              </button>
              <a
                href={shareUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex min-h-[2.75rem] items-center gap-2 rounded-full border border-taupe-300 px-5 text-sm font-semibold text-espresso-800 transition hover:border-bronze-500 hover:text-bronze-700"
              >
                <Share2 className="h-4 w-4" />
                Share on WhatsApp
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
