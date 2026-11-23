import { supabase } from '@/lib/supabase';
import { DEFAULT_POLICIES } from '@/lib/defaults';
import type {
  Addon,
  BlackoutDate,
  BookingReceipt,
  Currency,
  Policy,
  Service,
  SocialLink,
  SiteContent,
  SiteSettings,
  WorkingHour,
} from '@/lib/types';

export interface QueryResult<T> {
  data: T | null;
  error: { message: string } | null;
}

export function unwrap<T>(result: QueryResult<T>): T {
  if (result.error) throw new Error(result.error.message);
  if (result.data === null) throw new Error('The studio content could not be loaded.');
  return result.data;
}

export async function fetchSiteContent(): Promise<SiteContent> {
  const [settings, services, addons, hours, blackouts, policies, socials] = await Promise.all([
    supabase.from('site_settings').select('*').eq('id', 1).maybeSingle(),
    supabase.from('services').select('*').order('position'),
    supabase.from('addons').select('*').order('position'),
    supabase.from('working_hours').select('*').order('weekday'),
    supabase.from('blackout_dates').select('*').order('start_date'),
    supabase.from('policies').select('*').order('position'),
    supabase.from('social_links').select('*').order('position'),
  ]);

  const settingsRow = unwrap(settings as QueryResult<SiteSettings>);
  // Before the social_links table exists, keep showing the old Instagram handle.
  const legacyHandle = (settingsRow.instagram_handle ?? '').trim().replace(/^@/, '');
  const legacySocials: SocialLink[] = /^[A-Za-z0-9._-]{1,60}$/.test(legacyHandle)
    ? [{ id: 'legacy-instagram', platform: 'instagram', value: legacyHandle, label: '', position: 1 }]
    : [];

  return {
    settings: settingsRow,
    services: (unwrap(services as QueryResult<Service[]>)).filter((s) => s.is_active),
    addons: (unwrap(addons as QueryResult<Addon[]>)).filter((a) => a.is_active),
    hours: unwrap(hours as QueryResult<WorkingHour[]>),
    blackouts: unwrap(blackouts as QueryResult<BlackoutDate[]>),
    // If the policies table does not exist yet, fall back to the built-in wording instead of failing.
    policies: policies.error ? DEFAULT_POLICIES : ((policies.data ?? []) as Policy[]).filter((p) => p.is_active),
    socials: socials.error ? legacySocials : ((socials.data ?? []) as SocialLink[]),
  };
}

export async function fetchAvailableSlots(
  date: string,
  serviceId: string,
  addonIds: string[],
): Promise<string[]> {
  const { data, error } = await supabase.rpc('get_available_slots', {
    p_date: date,
    p_service_id: serviceId,
    p_addon_ids: addonIds,
  });
  if (error) throw new Error(error.message);
  return Array.isArray(data) ? (data as string[]) : [];
}

export async function uploadReferenceImage(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const path = `refs/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from('booking-references')
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error('The reference image could not be uploaded. Please try a smaller image.');
  return path;
}

export interface BookingInput {
  serviceId: string;
  addonIds: string[];
  startAt: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  notes: string;
  referencePath: string | null;
  currency: Currency;
}

export async function createBooking(input: BookingInput): Promise<BookingReceipt> {
  const { data, error } = await supabase.rpc('create_booking', {
    p_service_id: input.serviceId,
    p_addon_ids: input.addonIds,
    p_start_at: input.startAt,
    p_client_name: input.clientName,
    p_client_email: input.clientEmail,
    p_client_phone: input.clientPhone,
    p_notes: input.notes,
    p_reference_image_path: input.referencePath,
    p_display_currency: input.currency,
  });
  if (error) throw new Error(error.message);
  if (!data || typeof data !== 'object' || !('confirmation_code' in data)) {
    throw new Error('Your booking could not be confirmed. Please try again.');
  }
  return data as BookingReceipt;
}
