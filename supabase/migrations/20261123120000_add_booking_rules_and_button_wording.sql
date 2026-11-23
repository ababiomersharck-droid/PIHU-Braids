/*
# Editable booking rules and button wording

1. New settings (all editable by the owner in the admin panel)
- `booking_window_days`: how many days ahead clients can book (default 21, same as before).
- `min_notice_hours`: the least notice needed before an appointment (default 0, same as before).
- `buffer_minutes`: the gap kept free after every appointment (default 0, same as before).
- `slot_interval_minutes`: how often a start time is offered (default 30, same as before).
- `book_button_label`, `explore_button_label`, `visit_heading`, `hours_heading`: wording that used to be fixed in the code.

2. Changed functions
- `get_available_slots` and `create_booking` now read these rules, so the calendar and the server agree.
- The server still re-checks every rule when a booking is saved, so a client cannot bypass them.

3. Safe to re-run
- Columns use IF NOT EXISTS and the functions use CREATE OR REPLACE. Existing grants stay in place.
- With the default values, behaviour is exactly the same as before this update.
*/

ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS booking_window_days integer NOT NULL DEFAULT 21 CHECK (booking_window_days BETWEEN 1 AND 365),
  ADD COLUMN IF NOT EXISTS min_notice_hours integer NOT NULL DEFAULT 0 CHECK (min_notice_hours BETWEEN 0 AND 720),
  ADD COLUMN IF NOT EXISTS buffer_minutes integer NOT NULL DEFAULT 0 CHECK (buffer_minutes BETWEEN 0 AND 180),
  ADD COLUMN IF NOT EXISTS slot_interval_minutes integer NOT NULL DEFAULT 30 CHECK (slot_interval_minutes BETWEEN 15 AND 240),
  ADD COLUMN IF NOT EXISTS book_button_label text NOT NULL DEFAULT 'Book Appointment',
  ADD COLUMN IF NOT EXISTS explore_button_label text NOT NULL DEFAULT 'Explore Styles',
  ADD COLUMN IF NOT EXISTS visit_heading text NOT NULL DEFAULT 'Visit the studio',
  ADD COLUMN IF NOT EXISTS hours_heading text NOT NULL DEFAULT 'Studio hours';

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
  window_days integer;
  notice integer;
  buf integer;
  step integer;
  wh working_hours%ROWTYPE;
  dur integer;
  cur timestamptz;
  close_ts timestamptz;
  slot_end timestamptz;
  earliest timestamptz;
BEGIN
  IF p_date IS NULL THEN
    RETURN;
  END IF;

  dur := public.booking_duration_minutes(p_service_id, p_addon_ids);
  IF dur IS NULL OR dur <= 0 THEN
    RETURN;
  END IF;

  SELECT timezone, booking_window_days, min_notice_hours, buffer_minutes, slot_interval_minutes
    INTO tz, window_days, notice, buf, step
    FROM site_settings WHERE id = 1;

  IF p_date > (now() AT TIME ZONE tz)::date + (window_days - 1) THEN
    RETURN;
  END IF;

  SELECT * INTO wh FROM working_hours WHERE weekday = EXTRACT(DOW FROM p_date)::integer;
  IF NOT FOUND OR NOT wh.is_open THEN
    RETURN;
  END IF;

  earliest := now() + make_interval(hours => notice);
  cur := (p_date + wh.open_time) AT TIME ZONE tz;
  close_ts := (p_date + wh.close_time) AT TIME ZONE tz;

  LOOP
    slot_end := cur + make_interval(mins => dur);
    EXIT WHEN slot_end > close_ts;

    IF cur > earliest
       AND NOT public.is_time_blocked(cur, slot_end)
       AND NOT EXISTS (
         SELECT 1 FROM bookings b
         WHERE b.status <> 'canceled'
           AND tstzrange(b.start_at - make_interval(mins => buf), b.end_at + make_interval(mins => buf))
               && tstzrange(cur, slot_end)
       )
    THEN
      RETURN NEXT cur;
    END IF;

    cur := cur + make_interval(mins => step);
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
  window_days integer;
  notice integer;
  buf integer;
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

  SELECT timezone, ghs_per_usd, booking_window_days, min_notice_hours, buffer_minutes
    INTO tz, rate, window_days, notice, buf
    FROM site_settings WHERE id = 1;

  IF p_start_at <= now() + make_interval(hours => notice) THEN
    IF notice > 0 THEN
      RAISE EXCEPTION 'Please choose a time at least % hours from now.', notice;
    END IF;
    RAISE EXCEPTION 'Please choose a future appointment time.';
  END IF;
  IF (p_start_at AT TIME ZONE tz)::date > (now() AT TIME ZONE tz)::date + (window_days - 1) THEN
    RAISE EXCEPTION 'That date is too far ahead. Please choose an earlier date.';
  END IF;

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
      AND tstzrange(b.start_at - make_interval(mins => buf), b.end_at + make_interval(mins => buf))
          && tstzrange(p_start_at, end_ts)
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
