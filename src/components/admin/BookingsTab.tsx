import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, Loader2, Search } from 'lucide-react';
import { BookingCalendar } from '@/components/admin/BookingCalendar';
import { BookingRow, STATUS_META } from '@/components/admin/BookingRow';
import { Notice, SecondaryButton, errorMessage } from '@/components/admin/AdminPrimitives';
import { fetchBookings, referenceImageUrl, updateBooking } from '@/lib/api/admin';
import { buildBookingsCsv, downloadTextFile } from '@/lib/calendar';
import { dateKeyInTimezone, formatIsoDateLong, todayInTimezone } from '@/lib/format';
import type { Booking, BookingStatus } from '@/lib/types';

type StatusFilter = 'all' | BookingStatus;
type ViewMode = 'list' | 'calendar';

const STATUS_FILTERS: StatusFilter[] = ['all', 'pending', 'confirmed', 'completed', 'canceled'];

interface BookingsTabProps {
  timezone: string;
}

export function BookingsTab({ timezone }: BookingsTabProps) {
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [view, setView] = useState<ViewMode>('list');
  const [today] = useState(() => todayInTimezone(timezone));
  const [month, setMonth] = useState(() => today.slice(0, 7));
  const [selectedDate, setSelectedDate] = useState(today);

  const load = useCallback(async () => {
    try {
      setBookings(await fetchBookings());
      setLoadError(null);
    } catch (err) {
      setLoadError(errorMessage(err, 'Bookings could not be loaded. Please try again.'));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = useMemo(() => {
    const result: Record<StatusFilter, number> = { all: 0, pending: 0, confirmed: 0, completed: 0, canceled: 0 };
    for (const booking of bookings ?? []) {
      result.all += 1;
      result[booking.status] += 1;
    }
    return result;
  }, [bookings]);

  const byStatus = useMemo(
    () => (bookings ?? []).filter((b) => statusFilter === 'all' || b.status === statusFilter),
    [bookings, statusFilter],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return byStatus;
    const digits = q.replace(/\D/g, '');
    return byStatus.filter(
      (b) =>
        b.client_name.toLowerCase().includes(q) ||
        (digits.length > 0 && b.client_phone.replace(/\D/g, '').includes(digits)) ||
        dateKeyInTimezone(b.start_at, timezone).includes(q),
    );
  }, [byStatus, query, timezone]);

  const selectedDayBookings = useMemo(
    () =>
      visible
        .filter((b) => dateKeyInTimezone(b.start_at, timezone) === selectedDate)
        .sort((a, b) => a.start_at.localeCompare(b.start_at)),
    [visible, selectedDate, timezone],
  );

  const mutate = async (id: string, patch: Parameters<typeof updateBooking>[1]) => {
    setBusyId(id);
    setActionError(null);
    try {
      await updateBooking(id, patch);
      await load();
    } catch (err) {
      setActionError(errorMessage(err, 'This booking could not be updated. Please try again.'));
    } finally {
      setBusyId(null);
    }
  };

  const changeStatus = (booking: Booking, status: BookingStatus) => {
    if (status === 'canceled' && !window.confirm(`Cancel ${booking.client_name}'s appointment?`)) return;
    void mutate(booking.id, { status });
  };

  const openPhoto = async (booking: Booking) => {
    if (!booking.reference_image_path) return;
    setActionError(null);
    try {
      const url = await referenceImageUrl(booking.reference_image_path);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setActionError(errorMessage(err, 'The reference photo could not be opened.'));
    }
  };

  const exportCsv = () => {
    if (!bookings || bookings.length === 0) return;
    downloadTextFile(`bookings-${todayInTimezone(timezone)}.csv`, buildBookingsCsv(bookings, timezone), 'text/csv');
  };

  const renderRows = (rows: Booking[], emptyText: string) => {
    if (rows.length === 0) {
      return <EmptyState text={emptyText} />;
    }
    return (
      <div className="space-y-4">
        {rows.map((booking) => (
          <BookingRow
            key={booking.id}
            booking={booking}
            timezone={timezone}
            busy={busyId === booking.id}
            onStatus={(status) => changeStatus(booking, status)}
            onDeposit={(paid) => void mutate(booking.id, { deposit_paid: paid })}
            onViewPhoto={() => void openPhoto(booking)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="relative w-full xl:max-w-sm">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-taupe-400" />
          <input
            type="search"
            aria-label="Search bookings"
            className="field pl-11"
            placeholder="Search name, phone or date"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div role="tablist" aria-label="Filter by status" className="flex max-w-full gap-1 overflow-x-auto rounded-full bg-taupe-100 p-1">
            {STATUS_FILTERS.map((status) => {
              const active = statusFilter === status;
              const label = status === 'all' ? 'All' : STATUS_META[status].label;
              return (
                <button
                  key={status}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setStatusFilter(status)}
                  className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-2.5 text-xs font-semibold transition duration-300 ${
                    active ? 'bg-white text-espresso-900 shadow-sm' : 'text-taupe-700 hover:text-espresso-900'
                  }`}
                >
                  {label} <span className="text-taupe-500">{counts[status]}</span>
                </button>
              );
            })}
          </div>
          <div role="tablist" aria-label="View" className="flex gap-1 rounded-full bg-taupe-100 p-1">
            {(['list', 'calendar'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                role="tab"
                aria-selected={view === mode}
                onClick={() => setView(mode)}
                className={`rounded-full px-3.5 py-2.5 text-xs font-semibold capitalize transition duration-300 ${
                  view === mode ? 'bg-white text-espresso-900 shadow-sm' : 'text-taupe-700 hover:text-espresso-900'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
          <SecondaryButton onClick={exportCsv}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </SecondaryButton>
        </div>
      </div>

      {loadError && <Notice tone="error">{loadError}</Notice>}
      {actionError && <Notice tone="error">{actionError}</Notice>}

      {bookings === null && !loadError ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-bronze-600" />
        </div>
      ) : view === 'list' ? (
        renderRows(visible, 'No bookings match these filters yet.')
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_1fr]">
          <BookingCalendar
            bookings={byStatus}
            timezone={timezone}
            month={month}
            onMonthChange={setMonth}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
          <div className="space-y-4">
            <h3 className="text-2xl">{formatIsoDateLong(selectedDate)}</h3>
            {renderRows(selectedDayBookings, 'No bookings on this day.')}
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-taupe-300 px-6 py-12 text-center text-sm text-taupe-600">{text}</div>
  );
}
