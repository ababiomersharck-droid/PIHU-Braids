import { useState } from 'react';
import { RotateCw, Scissors } from 'lucide-react';
import { SiteHeader } from '@/components/site/SiteHeader';
import { Hero } from '@/components/site/Hero';
import { CatalogSection } from '@/components/site/CatalogSection';
import { StyleModal } from '@/components/site/StyleModal';
import { PoliciesSection } from '@/components/site/PoliciesSection';
import { SiteFooter } from '@/components/site/SiteFooter';
import { FloatingActions } from '@/components/site/FloatingActions';
import { BookingWizard } from '@/components/booking/BookingWizard';
import { useSite } from '@/context/SiteContext';
import type { Service } from '@/lib/types';

export function SitePage() {
  const { content, loadError, isLoading, reload } = useSite();
  const [search, setSearch] = useState('');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [booking, setBooking] = useState<{ serviceId: string | null } | null>(null);

  if (!content) {
    return (
      <div className="flex min-h-screen-dvh flex-col items-center justify-center gap-6 bg-cream-100 px-6 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-espresso-800 text-bronze-300 animate-pulse">
          <Scissors className="h-7 w-7" />
        </span>
        {loadError ? (
          <>
            <p className="max-w-sm text-sm text-taupe-700">
              We could not load the studio right now. Please check your connection and try again.
            </p>
            <button
              type="button"
              onClick={reload}
              className="inline-flex items-center gap-2 rounded-full bg-espresso-800 px-6 py-3 text-sm font-bold text-cream-50 transition hover:bg-espresso-900"
            >
              <RotateCw className="h-4 w-4" />
              Try again
            </button>
          </>
        ) : (
          <p className="font-display text-2xl text-espresso-800 animate-fade-in">
            {isLoading ? 'Preparing the studio' : 'Loading'}
          </p>
        )}
      </div>
    );
  }

  const openBooking = (serviceId: string | null) => {
    setSelectedService(null);
    setBooking({ serviceId });
  };

  return (
    <div className="min-h-screen-dvh bg-cream-100 animate-fade-in">
      <SiteHeader settings={content.settings} onBook={() => openBooking(null)} />
      <main>
        <Hero
          settings={content.settings}
          search={search}
          onSearchChange={setSearch}
          onBook={() => openBooking(null)}
        />
        <CatalogSection services={content.services} search={search} onSelect={setSelectedService} />
        <PoliciesSection />
      </main>
      <SiteFooter
        settings={content.settings}
        hours={content.hours}
        onOwnerLogin={() => window.location.assign('/admin')}
      />

      <FloatingActions
        whatsappNumber={content.settings.whatsapp_number}
        brandName={content.settings.brand_name}
        onBook={() => openBooking(null)}
      />

      <StyleModal
        service={selectedService}
        onClose={() => setSelectedService(null)}
        onBook={(id) => openBooking(id)}
      />
      {booking && (
        <BookingWizard
          content={content}
          initialServiceId={booking.serviceId}
          onClose={() => setBooking(null)}
        />
      )}
    </div>
  );
}
