/*
# Social media accounts the owner can add, edit, reorder and delete

1. New table
- `social_links`: one row per account (platform, handle or full link, optional label, display order).
  Platforms: instagram, tiktok, facebook, youtube, x, snapchat, pinterest, other.

2. Data safety
- The value must be either a plain handle (letters, numbers, dot, dash, underscore, optional @)
  or a link starting with http:// or https://. Anything else, such as "javascript:...", is rejected by the database.

3. Security
- Row level security: everyone can read, only the owner can add, change or delete.
- Grants are narrow: visitors can only read.

4. Existing data
- If the old Instagram handle in `site_settings` looks valid, it is copied in as the first account.
  The old column is left in place and is no longer shown in the admin panel.

5. Safe to re-run
- Uses IF NOT EXISTS and only seeds while the table is empty.
*/

CREATE TABLE IF NOT EXISTS social_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL CHECK (platform IN ('instagram', 'tiktok', 'facebook', 'youtube', 'x', 'snapchat', 'pinterest', 'other')),
  value text NOT NULL CHECK (length(value) <= 300 AND value ~* '^(https?://[^[:space:]]+|@?[A-Za-z0-9._-]{1,60})$'),
  label text NOT NULL DEFAULT '' CHECK (length(label) <= 60),
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS social_links_position_idx ON social_links (position);

ALTER TABLE social_links ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON social_links TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON social_links TO authenticated;

DROP POLICY IF EXISTS "social_links_public_select" ON social_links;
CREATE POLICY "social_links_public_select" ON social_links FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "social_links_admin_insert" ON social_links;
CREATE POLICY "social_links_admin_insert" ON social_links FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "social_links_admin_update" ON social_links;
CREATE POLICY "social_links_admin_update" ON social_links FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "social_links_admin_delete" ON social_links;
CREATE POLICY "social_links_admin_delete" ON social_links FOR DELETE
  TO authenticated USING (public.is_admin());

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'social_links'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.social_links;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM social_links) THEN
    INSERT INTO social_links (platform, value, position)
    SELECT 'instagram', regexp_replace(btrim(instagram_handle), '^@', ''), 1
    FROM site_settings
    WHERE id = 1
      AND regexp_replace(btrim(instagram_handle), '^@', '') ~ '^[A-Za-z0-9._-]{1,60}$';
  END IF;
END $$;
