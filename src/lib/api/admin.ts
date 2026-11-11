import { supabase } from '@/lib/supabase';
import { unwrap, type QueryResult } from '@/lib/api/site';
import type {
  Addon,
  BlackoutDate,
  Booking,
  BookingStatus,
  Service,
  SiteSettings,
  WorkingHour,
} from '@/lib/types';

export interface AdminData {
  settings: SiteSettings;
  services: Service[];
  addons: Addon[];
  hours: WorkingHour[];
  blackouts: BlackoutDate[];
}

function check(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
}

export async function signInOwner(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  check(error);
}

export async function createOwnerAccount(email: string, password: string): Promise<void> {
  const { data, error } = await supabase.auth.signUp({ email, password });
  check(error);
  if (!data.session) throw new Error('Your account was created. Please sign in to finish setup.');
  const claim = await supabase.rpc('claim_admin');
  check(claim.error);
}

export async function signOutOwner(): Promise<void> {
  await supabase.auth.signOut();
}

export async function fetchOwnerStatus(): Promise<{ signedIn: boolean; isOwner: boolean; setupOpen: boolean }> {
  const { data: sessionData } = await supabase.auth.getSession();
  const setup = await supabase.rpc('admin_setup_open');
  check(setup.error);
  const setupOpen = setup.data === true;
  if (!sessionData.session) return { signedIn: false, isOwner: false, setupOpen };
  const owner = await supabase.rpc('is_admin');
  check(owner.error);
  return { signedIn: true, isOwner: owner.data === true, setupOpen };
}

export async function fetchAdminData(): Promise<AdminData> {
  const [settings, services, addons, hours, blackouts] = await Promise.all([
    supabase.from('site_settings').select('*').eq('id', 1).maybeSingle(),
    supabase.from('services').select('*').order('position'),
    supabase.from('addons').select('*').order('position'),
    supabase.from('working_hours').select('*').order('weekday'),
    supabase.from('blackout_dates').select('*').order('start_date'),
  ]);
  return {
    settings: unwrap(settings as QueryResult<SiteSettings>),
    services: unwrap(services as QueryResult<Service[]>),
    addons: unwrap(addons as QueryResult<Addon[]>),
    hours: unwrap(hours as QueryResult<WorkingHour[]>),
    blackouts: unwrap(blackouts as QueryResult<BlackoutDate[]>),
  };
}

export async function saveSettings(patch: Partial<Omit<SiteSettings, 'id'>>): Promise<void> {
  check((await supabase.from('site_settings').update(patch).eq('id', 1)).error);
}

export async function uploadSiteImage(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const path = `uploads/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from('site-media')
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error('The image could not be uploaded. Please use a JPG, PNG or WEBP under 5 MB.');
  return supabase.storage.from('site-media').getPublicUrl(path).data.publicUrl;
}

export async function saveService(input: Omit<Service, 'id'>, id: string | null): Promise<void> {
  const request = id
    ? supabase.from('services').update(input).eq('id', id)
    : supabase.from('services').insert(input);
  check((await request).error);
}

export async function saveAddon(input: Omit<Addon, 'id'>, id: string | null): Promise<void> {
  const request = id ? supabase.from('addons').update(input).eq('id', id) : supabase.from('addons').insert(input);
  check((await request).error);
}

export async function deleteService(id: string): Promise<void> {
  check((await supabase.from('services').delete().eq('id', id)).error);
}

export async function deleteAddon(id: string): Promise<void> {
  check((await supabase.from('addons').delete().eq('id', id)).error);
}

export async function saveHours(rows: WorkingHour[]): Promise<void> {
  check((await supabase.from('working_hours').upsert(rows, { onConflict: 'weekday' })).error);
}

export async function addBlackout(input: Omit<BlackoutDate, 'id'>): Promise<void> {
  check((await supabase.from('blackout_dates').insert(input)).error);
}

export async function deleteBlackout(id: string): Promise<void> {
  check((await supabase.from('blackout_dates').delete().eq('id', id)).error);
}

export async function fetchBookings(): Promise<Booking[]> {
  const result = await supabase.from('bookings').select('*').order('start_at', { ascending: false });
  return unwrap(result as QueryResult<Booking[]>);
}

export async function updateBooking(
  id: string,
  patch: { status: BookingStatus } | { deposit_paid: boolean },
): Promise<void> {
  check((await supabase.from('bookings').update(patch).eq('id', id)).error);
}

export async function referenceImageUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from('booking-references').createSignedUrl(path, 600);
  check(error);
  if (!data) throw new Error('The reference image is unavailable.');
  return data.signedUrl;
}
