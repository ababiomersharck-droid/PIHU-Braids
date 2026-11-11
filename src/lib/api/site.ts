import { supabase } from '@/lib/supabase';
import type {
  Addon,
  BlackoutDate,
  BookingReceipt,
  Currency,
  Service,
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
  const [settings, services, addons, hours, blackouts] = await Promise.all([
    supabase.from('site_settings').select('*').eq('id', 1).maybeSingle(),
    supabase.from('services').select('*').order('position'),
    supabase.from('addons').select('*').order('position'),
    supabase.from('working_hours').select('*').order('weekday'),
    supabase.from('blackout_dates').select('*').order('start_date'),
  ]);

  return {
    settings: unwrap(settings as QueryResult<SiteSettings>),
    services: (unwrap(services as QueryResult<Service[]>)).filter((s) => s.is_active),
    addons: (unwrap(addons as QueryResult<Addon[]>)).filter((a) => a.is_active),
    hours: unwrap(hours as QueryResult<WorkingHour[]>),
    blackouts: unwrap(blackouts as QueryResult<BlackoutDate[]>),
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
