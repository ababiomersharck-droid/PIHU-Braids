import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { fetchSiteContent } from '@/lib/api/site';
import { supabase } from '@/lib/supabase';
import type { Currency, SiteContent } from '@/lib/types';

const CURRENCY_KEY = 'aurum-currency';
const LIVE_TABLES = ['site_settings', 'services', 'addons', 'working_hours', 'blackout_dates'] as const;

interface SiteContextValue {
  content: SiteContent | null;
  loadError: string | null;
  isLoading: boolean;
  reload: () => void;
  currency: Currency;
  setCurrency: (currency: Currency) => void;
}

const SiteContext = createContext<SiteContextValue | null>(null);

function readStoredCurrency(): Currency | null {
  const stored = window.localStorage.getItem(CURRENCY_KEY);
  return stored === 'USD' || stored === 'GHS' ? stored : null;
}

export function SiteProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<SiteContent | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const [storedCurrency, setStoredCurrency] = useState<Currency | null>(() => readStoredCurrency());

  useEffect(() => {
    let active = true;
    fetchSiteContent()
      .then((data) => {
        if (!active) return;
        setContent(data);
        setLoadError(null);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setLoadError(err instanceof Error ? err.message : 'Something went wrong.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [version]);

  useEffect(() => {
    const bump = () => setVersion((v) => v + 1);
    let channel = supabase.channel('site-content');
    for (const table of LIVE_TABLES) {
      channel = channel.on('postgres_changes', { event: '*', schema: 'public', table }, bump);
    }
    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const reload = useCallback(() => {
    setIsLoading(true);
    setVersion((v) => v + 1);
  }, []);

  const setCurrency = useCallback((next: Currency) => {
    window.localStorage.setItem(CURRENCY_KEY, next);
    setStoredCurrency(next);
  }, []);

  const value = useMemo<SiteContextValue>(
    () => ({
      content,
      loadError,
      isLoading,
      reload,
      currency: storedCurrency ?? content?.settings.default_currency ?? 'USD',
      setCurrency,
    }),
    [content, loadError, isLoading, reload, storedCurrency, setCurrency],
  );

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export function useSite(): SiteContextValue {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error('useSite must be used inside SiteProvider');
  return ctx;
}
