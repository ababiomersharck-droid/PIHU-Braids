/*
# Editable policies, FAQ and page text

1. New table
- `policies`: question and answer pairs shown in the "Policies and frequently asked questions" section.
  Owner can add, edit, hide, reorder and delete them from the admin panel.

2. Changed table
- `site_settings` gets four text columns so the owner can edit wording that used to be fixed in the code:
  catalog_heading, policies_heading, policies_intro, booking_terms (the tick-box text on the last booking step).

3. Security
- Row level security on `policies`: everyone can read active items, only the owner can change anything.
- Grants are explicit and narrow: visitors can only read.

4. Safe to re-run
- Uses IF NOT EXISTS and only seeds the starter policies while the table is empty.
*/

ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS catalog_heading text NOT NULL DEFAULT 'Signature styles, made to order',
  ADD COLUMN IF NOT EXISTS policies_heading text NOT NULL DEFAULT 'Policies and frequently asked questions',
  ADD COLUMN IF NOT EXISTS policies_intro text NOT NULL DEFAULT 'Clear expectations keep every appointment calm and on time. Here is how we work together.',
  ADD COLUMN IF NOT EXISTS booking_terms text NOT NULL DEFAULT 'I understand the deposit is non-refundable and that cancellations within 48 hours of the appointment forfeit it.';

CREATE TABLE IF NOT EXISTS policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL CHECK (length(btrim(question)) > 0),
  answer text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS policies_position_idx ON policies (position);

ALTER TABLE policies ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON policies TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON policies TO authenticated;

DROP POLICY IF EXISTS "policies_select" ON policies;
CREATE POLICY "policies_select" ON policies FOR SELECT
  TO anon, authenticated USING (is_active OR public.is_admin());

DROP POLICY IF EXISTS "policies_admin_insert" ON policies;
CREATE POLICY "policies_admin_insert" ON policies FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "policies_admin_update" ON policies;
CREATE POLICY "policies_admin_update" ON policies FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "policies_admin_delete" ON policies;
CREATE POLICY "policies_admin_delete" ON policies FOR DELETE
  TO authenticated USING (public.is_admin());

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'policies'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.policies;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM policies) THEN
    INSERT INTO policies (question, answer, position) VALUES
      ('How do deposits work?', 'A non-refundable deposit reserves your appointment. Each style shows its own deposit amount, usually half of the service price. Pay by the method in your confirmation within 24 hours, and your slot is locked in once it arrives.', 1),
      ('What is your cancellation policy?', 'Please give at least 48 hours notice to cancel or reschedule. Within 48 hours, the deposit is kept to cover the reserved time. Rescheduling once within 48 hours is welcome when a slot is available.', 2),
      ('What happens if I arrive late?', 'A 15 minute grace period applies. Arrivals later than that may shorten your appointment to keep the schedule, and a late arrival fee of 10% of the service price applies. Arriving more than 30 minutes late may mean rebooking.', 3),
      ('How should I prepare my hair?', 'Arrive with clean, dry, detangled hair unless your style page says otherwise. Avoid heavy oils or product build-up on the scalp for 48 hours. Trim split ends beforehand if you can, and let us know about any scalp sensitivities.', 4),
      ('Can I bring my own hair or beads?', 'Yes, for extensions and beads you may bring your own, provided it is pre-washed and packaged. Please mention it in the notes at booking so we can plan the time needed.', 5);
  END IF;
END $$;
