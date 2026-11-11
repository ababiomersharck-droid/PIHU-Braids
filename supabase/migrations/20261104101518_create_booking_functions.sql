/*
# Add booking, availability and owner-setup functions

1. New Functions
- `is_time_blocked(start, end)`: true when a time window falls inside a blackout date or blackout time window in the business timezone.
- `booking_duration_minutes(service, add-ons)`: total appointment length from the service plus any active add-ons.
- `get_available_slots(date, service, add-ons)`: returns the bookable start times for one day, based on working hours, blackouts and existing bookings. Times are 30 minutes apart and must be in the future. It exposes no client details.
- `create_booking(...)`: validates the client's details, the chosen service and add-ons, the working hours, blackouts and overlap with existing bookings, then stores the booking with a server-calculated price and deposit and returns a confirmation code.
- `admin_setup_open()`: true only while no owner account exists yet.
- `claim_admin()`: lets the first signed-in account become the owner. It refuses once an owner exists.

2. Security
- Bookings are only created through `create_booking`; the browser has no direct insert on bookings.
- Pricing, deposits and durations are calculated on the server, so the browser cannot change them.
- Helper functions are not callable by visitors.
- Visitors can call the availability and booking functions, which reveal no personal data.

3. Important Notes
- 3.1 Booking creation takes a short database lock so two clients cannot book the same slot at the same moment.
- 3.2 Deposits are calculated as the service's deposit percentage of the total price.
- 3.3 Cancelled bookings do not block slots.
*/

CREATE OR REPLACE FUNCTION public.is_time_blocked(p_start timestamptz, p_end timestamptz)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tz text;
  local_date date;
BEGIN
  SELECT timezone INTO tz FROM site_settings WHERE id = 1;
  local_date := (p_start AT TIME ZONE tz)::date;
  RETURN EXISTS (
    SELECT 1 FROM blackout_dates b
    WHERE local_date BETWEEN b.start_date AND b.end_date
      AND (
        b.start_time IS NULL
        OR tstzrange((local_date + b.start_time) AT TIME ZONE tz, (local_date + b.end_time) AT TIME ZONE tz)
           && tstzrange(p_start, p_end)
      )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.booking_duration_minutes(p_service_id uuid, p_addon_ids uuid[])
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    COALESCE((SELECT s.duration_minutes FROM services s WHERE s.id = p_service_id AND s.is_active), 0)
    + COALESCE((SELECT sum(a.extra_minutes) FROM addons a WHERE a.id = ANY(COALESCE(p_addon_ids, '{}')) AND a.is_active), 0)
  )::integer;
$$;

CREATE OR REPLACE FUNCTION public.get_available_slots(
  p_date date,
  p_service_id uuid,
  p_addon_ids uuid[] DEFAULT '{}'
)
RETURNS SETOF timestamptz
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tz text;
  wh working_hours%ROWTYPE;
  dur integer;
  cur timestamptz;
  close_ts timestamptz;
  slot_end timestamptz;
BEGIN
  IF p_date IS NULL THEN
    RETURN;
  END IF;

  dur := public.booking_duration_minutes(p_service_id, p_addon_ids);
  IF dur IS NULL OR dur <= 0 THEN
    RETURN;
  END IF;

  SELECT timezone INTO tz FROM site_settings WHERE id = 1;
  SELECT * INTO wh FROM working_hours WHERE weekday = EXTRACT(DOW FROM p_date)::integer;
  IF NOT FOUND OR NOT wh.is_open THEN
    RETURN;
  END IF;

  cur := (p_date + wh.open_time) AT TIME ZONE tz;
  close_ts := (p_date + wh.close_time) AT TIME ZONE tz;

  LOOP
    slot_end := cur + make_interval(mins => dur);
    EXIT WHEN slot_end > close_ts;

    IF cur > now()
       AND NOT public.is_time_blocked(cur, slot_end)
       AND NOT EXISTS (
         SELECT 1 FROM bookings b
         WHERE b.status <> 'canceled'
           AND tstzrange(b.start_at, b.end_at) && tstzrange(cur, slot_end)
       )
    THEN
      RETURN NEXT cur;
    END IF;

    cur := cur + interval '30 minutes';
  END LOOP;

  RETURN;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_booking(
  p_service_id uuid,
  p_addon_ids uuid[],
  p_start_at timestamptz,
  p_client_name text,
  p_client_email text,
  p_client_phone text,
  p_notes text,
  p_reference_image_path text,
  p_display_currency text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  s services%ROWTYPE;
  addon_rec RECORD;
  addon_count integer := 0;
  addon_names text[] := '{}';
  addon_extra integer := 0;
  rate numeric;
  tz text;
  dur integer;
  end_ts timestamptz;
  local_date date;
  wh working_hours%ROWTYPE;
  open_ts timestamptz;
  close_ts timestamptz;
  total_usd numeric := 0;
  total_ghs numeric := 0;
  code text;
  row_bk bookings%ROWTYPE;
BEGIN
  p_client_name := btrim(COALESCE(p_client_name, ''));
  p_client_email := btrim(COALESCE(p_client_email, ''));
  p_client_phone := btrim(COALESCE(p_client_phone, ''));
  p_notes := btrim(COALESCE(p_notes, ''));

  IF length(p_client_name) < 2 OR length(p_client_name) > 100 THEN
    RAISE EXCEPTION 'Please enter your full name.';
  END IF;
  IF p_client_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' OR length(p_client_email) > 200 THEN
    RAISE EXCEPTION 'Please enter a valid email address.';
  END IF;
  IF length(p_client_phone) < 7 OR length(p_client_phone) > 25 OR p_client_phone !~ '^[+0-9 ()-]+$' THEN
    RAISE EXCEPTION 'Please enter a valid phone number.';
  END IF;
  IF length(p_notes) > 1000 THEN
    RAISE EXCEPTION 'Notes must be 1000 characters or fewer.';
  END IF;
  IF p_display_currency NOT IN ('USD', 'GHS') THEN
    RAISE EXCEPTION 'Unsupported currency.';
  END IF;
  IF p_start_at IS NULL OR p_start_at <= now() THEN
    RAISE EXCEPTION 'Please choose a future appointment time.';
  END IF;
  IF p_reference_image_path IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM storage.objects o
    WHERE o.bucket_id = 'booking-references' AND o.name = p_reference_image_path
  ) THEN
    RAISE EXCEPTION 'The reference image could not be found. Please upload it again.';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('public.bookings'));

  SELECT * INTO s FROM services WHERE id = p_service_id AND is_active;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'This hairstyle is no longer available.';
  END IF;

  SELECT timezone, ghs_per_usd INTO tz, rate FROM site_settings WHERE id = 1;

  total_usd := s.price_usd;
  total_ghs := COALESCE(s.price_ghs, round(s.price_usd * rate, 2));
  dur := s.duration_minutes;

  IF p_addon_ids IS NOT NULL THEN
    addon_count := cardinality(p_addon_ids);
  END IF;

  FOR addon_rec IN
    SELECT a.* FROM addons a
    WHERE a.id = ANY(COALESCE(p_addon_ids, '{}')) AND a.is_active
    ORDER BY a.position
  LOOP
    total_usd := total_usd + addon_rec.price_usd;
    total_ghs := total_ghs + COALESCE(addon_rec.price_ghs, round(addon_rec.price_usd * rate, 2));
    dur := dur + addon_rec.extra_minutes;
    addon_names := array_append(addon_names, addon_rec.name);
  END LOOP;

  IF COALESCE(cardinality(addon_names), 0) <> addon_count THEN
    RAISE EXCEPTION 'One of the selected add-ons is no longer available.';
  END IF;

  end_ts := p_start_at + make_interval(mins => dur);
  local_date := (p_start_at AT TIME ZONE tz)::date;

  SELECT * INTO wh FROM working_hours WHERE weekday = EXTRACT(DOW FROM local_date)::integer;
  IF NOT FOUND OR NOT wh.is_open THEN
    RAISE EXCEPTION 'The studio is closed on that day.';
  END IF;

  open_ts := (local_date + wh.open_time) AT TIME ZONE tz;
  close_ts := (local_date + wh.close_time) AT TIME ZONE tz;
  IF p_start_at < open_ts OR end_ts > close_ts THEN
    RAISE EXCEPTION 'That appointment falls outside working hours.';
  END IF;

  IF public.is_time_blocked(p_start_at, end_ts) THEN
    RAISE EXCEPTION 'That time is no longer available. Please choose another slot.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.status <> 'canceled'
      AND tstzrange(b.start_at, b.end_at) && tstzrange(p_start_at, end_ts)
  ) THEN
    RAISE EXCEPTION 'That time was just booked. Please choose another slot.';
  END IF;

  code := 'BR-' || upper(substr(md5(gen_random_uuid()::text), 1, 6));

  INSERT INTO bookings (
    confirmation_code, service_id, service_name, addon_names, start_at, end_at, duration_minutes,
    client_name, client_email, client_phone, notes, reference_image_path, display_currency,
    total_usd, total_ghs, deposit_usd, deposit_ghs
  ) VALUES (
    code, s.id, s.name, addon_names, p_start_at, end_ts, dur,
    p_client_name, p_client_email, p_client_phone, p_notes, p_reference_image_path, p_display_currency,
    total_usd, total_ghs,
    round(total_usd * s.deposit_percent / 100, 2),
    round(total_ghs * s.deposit_percent / 100, 2)
  )
  RETURNING * INTO row_bk;

  RETURN jsonb_build_object(
    'confirmation_code', row_bk.confirmation_code,
    'service_name', row_bk.service_name,
    'addon_names', to_jsonb(row_bk.addon_names),
    'start_at', row_bk.start_at,
    'end_at', row_bk.end_at,
    'duration_minutes', row_bk.duration_minutes,
    'display_currency', row_bk.display_currency,
    'total_usd', row_bk.total_usd,
    'total_ghs', row_bk.total_ghs,
    'deposit_usd', row_bk.deposit_usd,
    'deposit_ghs', row_bk.deposit_ghs,
    'client_name', row_bk.client_name
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_setup_open()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (SELECT 1 FROM public.admins);
$$;

CREATE OR REPLACE FUNCTION public.claim_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Please sign in first.';
  END IF;
  IF EXISTS (SELECT 1 FROM admins) THEN
    RAISE EXCEPTION 'An owner account already exists.';
  END IF;
  INSERT INTO admins (user_id) VALUES (auth.uid());
  RETURN true;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.is_time_blocked(timestamptz, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.booking_duration_minutes(uuid, uuid[]) FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.get_available_slots(date, uuid, uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_available_slots(date, uuid, uuid[]) TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.create_booking(uuid, uuid[], timestamptz, text, text, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_booking(uuid, uuid[], timestamptz, text, text, text, text, text, text) TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.admin_setup_open() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_setup_open() TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.claim_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_admin() TO authenticated;
