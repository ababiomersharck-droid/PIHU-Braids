import { useMemo, useState } from 'react';
import { Clock, ArrowUpRight } from 'lucide-react';
import { useSite } from '@/context/SiteContext';
import { formatDuration, formatMoney, unitPrice } from '@/lib/format';
import type { Service } from '@/lib/types';

interface CatalogSectionProps {
  services: Service[];
  search: string;
  onSelect: (service: Service) => void;
}

export function CatalogSection({ services, search, onSelect }: CatalogSectionProps) {
  const [category, setCategory] = useState<string>('All');
  const { currency, content } = useSite();
  const rate = content?.settings.ghs_per_usd ?? 1;

  const categories = useMemo(() => {
    const seen: string[] = [];
    for (const s of services) if (!seen.includes(s.category)) seen.push(s.category);
    return ['All', ...seen];
  }, [services]);

  const query = search.trim().toLowerCase();
  const visible = services.filter((s) => {
    const matchesCategory = category === 'All' || s.category === category;
    const matchesQuery =
      !query || s.name.toLowerCase().includes(query) || s.description.toLowerCase().includes(query);
    return matchesCategory && matchesQuery;
  });

  return (
    <section id="catalog" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-16 sm:px-8 sm:py-24">
      <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div className="max-w-xl">
          <p className="eyebrow mb-3">The Collection</p>
          <h2 className="text-display-lg">Signature styles, made to order</h2>
        </div>
        <div role="tablist" aria-label="Filter by category" className="flex flex-wrap gap-2">
          {categories.map((c) => {
            const selected = c === category;
            return (
              <button
                key={c}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setCategory(c)}
                className={`inline-flex min-h-[2.75rem] items-center rounded-full px-4 text-sm font-semibold transition duration-300 ${
                  selected
                    ? 'bg-espresso-800 text-cream-50 shadow-md'
                    : 'bg-white text-taupe-600 ring-1 ring-taupe-200 hover:text-espresso-800 hover:ring-bronze-400'
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="mt-16 rounded-3xl border border-dashed border-taupe-300 bg-white/60 px-6 py-16 text-center">
          <p className="font-display text-2xl text-espresso-800">No styles match your search yet.</p>
          <p className="mt-2 text-sm text-taupe-600">Try a different keyword or view all categories.</p>
        </div>
      ) : (
        <div className="mt-10 grid gap-6 sm:mt-14 sm:grid-cols-2 sm:gap-7 lg:grid-cols-3">
          {visible.map((service, index) => (
            <button
              key={service.id}
              type="button"
              onClick={() => onSelect(service)}
              style={{ animationDelay: `${index * 60}ms` }}
              className="group card-lift animate-fade-up flex flex-col overflow-hidden rounded-3xl bg-white text-left ring-1 ring-taupe-200/70"
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-taupe-200">
                {service.image_url && (
                  <img
                    src={service.image_url}
                    alt={service.name}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                )}
                <span className="absolute left-4 top-4 rounded-full bg-cream-50/95 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-espresso-800">
                  {service.category}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-3 p-6">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-2xl leading-tight">{service.name}</h3>
                  <ArrowUpRight className="mt-1 h-5 w-5 shrink-0 text-bronze-500 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
                <p className="line-clamp-2 text-sm leading-[1.5] text-taupe-600">{service.description}</p>
                <div className="mt-auto flex items-center justify-between border-t border-taupe-200 pt-4">
                  <span className="text-lg font-bold text-espresso-900">
                    <span className="mr-1 text-xs font-medium text-taupe-500">from</span>
                    {formatMoney(unitPrice(service, currency, rate), currency)}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-taupe-600">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDuration(service.duration_minutes)}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
