export type Currency = 'USD' | 'GHS';

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'canceled';

export interface SiteSettings {
  id: number;
  brand_name: string;
  tagline: string;
  logo_url: string | null;
  hero_headline: string;
  hero_subheadline: string;
  hero_image_url: string | null;
  phone: string;
  whatsapp_number: string;
  instagram_handle: string;
  address: string;
  footer_note: string;
  payment_instructions: string;
  catalog_heading: string;
  policies_heading: string;
  policies_intro: string;
  booking_terms: string;
  book_button_label: string;
  explore_button_label: string;
  visit_heading: string;
  hours_heading: string;
  booking_window_days: number;
  min_notice_hours: number;
  buffer_minutes: number;
  slot_interval_minutes: number;
  timezone: string;
  default_currency: Currency;
  ghs_per_usd: number;
}

export interface Service {
  id: string;
  name: string;
  category: string;
  description: string;
  prep_instructions: string;
  price_usd: number;
  price_ghs: number | null;
  duration_minutes: number;
  deposit_percent: number;
  image_url: string | null;
  is_active: boolean;
  position: number;
}

export interface Addon {
  id: string;
  name: string;
  description: string;
  price_usd: number;
  price_ghs: number | null;
  extra_minutes: number;
  is_active: boolean;
  position: number;
}

export interface WorkingHour {
  weekday: number;
  is_open: boolean;
  open_time: string;
  close_time: string;
}

export interface BlackoutDate {
  id: string;
  label: string;
  start_date: string;
  end_date: string;
  start_time: string | null;
  end_time: string | null;
}

export interface Policy {
  id: string;
  question: string;
  answer: string;
  is_active: boolean;
  position: number;
}

export type SocialPlatform = 'instagram' | 'tiktok' | 'facebook' | 'youtube' | 'x' | 'snapchat' | 'pinterest' | 'other';

export interface SocialLink {
  id: string;
  platform: SocialPlatform;
  /** a handle such as "pihubraids" or a full link starting with https:// */
  value: string;
  /** display name, used when the platform is "other" */
  label: string;
  position: number;
}

export interface SiteContent {
  settings: SiteSettings;
  services: Service[];
  addons: Addon[];
  hours: WorkingHour[];
  blackouts: BlackoutDate[];
  policies: Policy[];
  socials: SocialLink[];
}

export interface Booking {
  id: string;
  confirmation_code: string;
  service_id: string | null;
  service_name: string;
  addon_names: string[];
  start_at: string;
  end_at: string;
  duration_minutes: number;
  client_name: string;
  client_email: string;
  client_phone: string;
  notes: string;
  reference_image_path: string | null;
  display_currency: Currency;
  total_usd: number;
  total_ghs: number;
  deposit_usd: number;
  deposit_ghs: number;
  deposit_paid: boolean;
  status: BookingStatus;
  created_at: string;
}

export interface BookingReceipt {
  confirmation_code: string;
  service_name: string;
  addon_names: string[];
  start_at: string;
  end_at: string;
  duration_minutes: number;
  display_currency: Currency;
  total_usd: number;
  total_ghs: number;
  deposit_usd: number;
  deposit_ghs: number;
  client_name: string;
}
