/*
# Create core tables for the braiding booking site

1. New Tables
- `admins`: owner accounts allowed into the admin panel (one row per Supabase Auth user).
- `site_settings`: single-row table with brand name, tagline, logo, hero copy and images, contact details, timezone, currency default, USD-to-GHS rate and payment instructions.
- `services`: hairstyles shown in the catalog (name, category, description, prep instructions, USD and GHS prices, duration, deposit percent, image, active flag, display order).
- `addons`: optional extras a client can add to a booking (name, prices, extra minutes, active flag, order).
- `working_hours`: one row per weekday (0 = Sunday ... 6 = Saturday) with open/closed flag and opening and closing times.
- `blackout_dates`: days or time windows the owner blocks out (vacation, personal time).
- `bookings`: every appointment request with client details, time window, price snapshot, deposit and status.

2. Security
- Row level security enabled on every table.
- Public visitors can read site content (settings, active services, add-ons, hours, blackouts). Nothing public can read bookings or admin records.
- Only signed-in admins (checked with `is_admin()`) can change content or view bookings.
- Column-level update grant on bookings: admins may change only status and deposit_paid.

3. Important Notes
- 3.1 `is_admin()` is defined here so policies can reference it.
- 3.2 Bookings are never written directly from the browser; they go through the `create_booking` function in a later migration, which validates availability on the server.
- 3.3 Realtime publication is extended so the public site refreshes instantly after the owner edits content.
*/

CREATE TABLE IF NOT EXISTS admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS site_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  brand_name text NOT NULL DEFAULT 'Your Brand',
  tagline text NOT NULL DEFAULT '',
  logo_url text,
  hero_headline text NOT NULL DEFAULT '',
  hero_subheadline text NOT NULL DEFAULT '',
  hero_image_url text,
  phone text NOT NULL DEFAULT '',
  whatsapp_number text NOT NULL DEFAULT '',
  instagram_handle text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  footer_note text NOT NULL DEFAULT '',
  payment_instructions text NOT NULL DEFAULT '',
  timezone text NOT NULL DEFAULT 'Africa/Accra',
  default_currency text NOT NULL DEFAULT 'USD' CHECK (default_currency IN ('USD', 'GHS')),
  ghs_per_usd numeric(10,2) NOT NULL DEFAULT 14.50 CHECK (ghs_per_usd > 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'Braids',
  description text NOT NULL DEFAULT '',
  prep_instructions text NOT NULL DEFAULT '',
  price_usd numeric(10,2) NOT NULL CHECK (price_usd >= 0),
  price_ghs numeric(10,2) CHECK (price_ghs IS NULL OR price_ghs >= 0),
  duration_minutes integer NOT NULL CHECK (duration_minutes > 0),
  deposit_percent integer NOT NULL DEFAULT 50 CHECK (deposit_percent BETWEEN 0 AND 100),
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS services_position_idx ON services (position);

CREATE TABLE IF NOT EXISTS addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  price_usd numeric(10,2) NOT NULL CHECK (price_usd >= 0),
  price_ghs numeric(10,2) CHECK (price_ghs IS NULL OR price_ghs >= 0),
  extra_minutes integer NOT NULL DEFAULT 0 CHECK (extra_minutes >= 0),
  is_active boolean NOT NULL DEFAULT true,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS working_hours (
  weekday integer PRIMARY KEY CHECK (weekday BETWEEN 0 AND 6),
  is_open boolean NOT NULL DEFAULT false,
  open_time time NOT NULL DEFAULT '09:00',
  close_time time NOT NULL DEFAULT '18:00',
  CHECK (close_time > open_time)
);

CREATE TABLE IF NOT EXISTS blackout_dates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL DEFAULT '',
  start_date date NOT NULL,
  end_date date NOT NULL,
  start_time time,
  end_time time,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_date >= start_date),
  CHECK ((start_time IS NULL AND end_time IS NULL) OR (start_time IS NOT NULL AND end_time > start_time))
);
CREATE INDEX IF NOT EXISTS blackout_dates_range_idx ON blackout_dates (start_date, end_date);

CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  confirmation_code text NOT NULL UNIQUE,
  service_id uuid REFERENCES services(id) ON DELETE SET NULL,
  service_name text NOT NULL,
  addon_names text[] NOT NULL DEFAULT '{}',
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  duration_minutes integer NOT NULL,
  client_name text NOT NULL,
  client_email text NOT NULL,
  client_phone text NOT NULL,
  notes text NOT NULL DEFAULT '',
  reference_image_path text,
  display_currency text NOT NULL DEFAULT 'USD' CHECK (display_currency IN ('USD', 'GHS')),
  total_usd numeric(10,2) NOT NULL,
  total_ghs numeric(10,2) NOT NULL,
  deposit_usd numeric(10,2) NOT NULL,
  deposit_ghs numeric(10,2) NOT NULL,
  deposit_paid boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'canceled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_at > start_at)
);
CREATE INDEX IF NOT EXISTS bookings_start_idx ON bookings (start_at);
CREATE INDEX IF NOT EXISTS bookings_status_idx ON bookings (status);

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid());
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE working_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE blackout_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON admins TO authenticated;
GRANT SELECT, UPDATE ON site_settings TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON services TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON addons TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON working_hours TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON blackout_dates TO anon, authenticated;
GRANT SELECT, UPDATE (status, deposit_paid) ON bookings TO authenticated;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['site_settings', 'services', 'addons', 'working_hours', 'blackout_dates']
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;

DROP POLICY IF EXISTS "admins_select_self" ON admins;
CREATE POLICY "admins_select_self" ON admins FOR SELECT
  TO authenticated USING (user_id = auth.uid());

-- Public content is intentionally readable by everyone; only admins can change it.
DROP POLICY IF EXISTS "settings_public_select" ON site_settings;
CREATE POLICY "settings_public_select" ON site_settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "settings_admin_update" ON site_settings;
CREATE POLICY "settings_admin_update" ON site_settings FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "services_select" ON services;
CREATE POLICY "services_select" ON services FOR SELECT
  TO anon, authenticated USING (is_active OR public.is_admin());

DROP POLICY IF EXISTS "services_admin_insert" ON services;
CREATE POLICY "services_admin_insert" ON services FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "services_admin_update" ON services;
CREATE POLICY "services_admin_update" ON services FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "services_admin_delete" ON services;
CREATE POLICY "services_admin_delete" ON services FOR DELETE
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "addons_select" ON addons;
CREATE POLICY "addons_select" ON addons FOR SELECT
  TO anon, authenticated USING (is_active OR public.is_admin());

DROP POLICY IF EXISTS "addons_admin_insert" ON addons;
CREATE POLICY "addons_admin_insert" ON addons FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "addons_admin_update" ON addons;
CREATE POLICY "addons_admin_update" ON addons FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "addons_admin_delete" ON addons;
CREATE POLICY "addons_admin_delete" ON addons FOR DELETE
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "working_hours_public_select" ON working_hours;
CREATE POLICY "working_hours_public_select" ON working_hours FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "working_hours_admin_insert" ON working_hours;
CREATE POLICY "working_hours_admin_insert" ON working_hours FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "working_hours_admin_update" ON working_hours;
CREATE POLICY "working_hours_admin_update" ON working_hours FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "working_hours_admin_delete" ON working_hours;
CREATE POLICY "working_hours_admin_delete" ON working_hours FOR DELETE
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "blackouts_public_select" ON blackout_dates;
CREATE POLICY "blackouts_public_select" ON blackout_dates FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "blackouts_admin_insert" ON blackout_dates;
CREATE POLICY "blackouts_admin_insert" ON blackout_dates FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "blackouts_admin_update" ON blackout_dates;
CREATE POLICY "blackouts_admin_update" ON blackout_dates FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "blackouts_admin_delete" ON blackout_dates;
CREATE POLICY "blackouts_admin_delete" ON blackout_dates FOR DELETE
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "bookings_admin_select" ON bookings;
CREATE POLICY "bookings_admin_select" ON bookings FOR SELECT
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "bookings_admin_update" ON bookings;
CREATE POLICY "bookings_admin_update" ON bookings FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

INSERT INTO site_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

INSERT INTO working_hours (weekday, is_open, open_time, close_time) VALUES
  (0, false, '09:00', '18:00'),
  (1, true, '09:00', '18:00'),
  (2, true, '09:00', '18:00'),
  (3, true, '09:00', '18:00'),
  (4, true, '09:00', '18:00'),
  (5, true, '09:00', '18:00'),
  (6, true, '10:00', '16:00')
ON CONFLICT (weekday) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('site-media', 'site-media', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('booking-references', 'booking-references', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "site_media_public_read" ON storage.objects;
CREATE POLICY "site_media_public_read" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'site-media');

DROP POLICY IF EXISTS "site_media_admin_insert" ON storage.objects;
CREATE POLICY "site_media_admin_insert" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'site-media' AND public.is_admin());

DROP POLICY IF EXISTS "site_media_admin_update" ON storage.objects;
CREATE POLICY "site_media_admin_update" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'site-media' AND public.is_admin())
  WITH CHECK (bucket_id = 'site-media' AND public.is_admin());

DROP POLICY IF EXISTS "site_media_admin_delete" ON storage.objects;
CREATE POLICY "site_media_admin_delete" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'site-media' AND public.is_admin());

DROP POLICY IF EXISTS "booking_refs_client_upload" ON storage.objects;
CREATE POLICY "booking_refs_client_upload" ON storage.objects FOR INSERT
  TO anon, authenticated WITH CHECK (bucket_id = 'booking-references');

DROP POLICY IF EXISTS "booking_refs_admin_read" ON storage.objects;
CREATE POLICY "booking_refs_admin_read" ON storage.objects FOR SELECT
  TO authenticated USING (bucket_id = 'booking-references' AND public.is_admin());
