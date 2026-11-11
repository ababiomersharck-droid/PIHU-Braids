/*
# Restrict public-role write grants on studio tables

1. Summary
- The public (anon) role previously held INSERT, UPDATE and DELETE on every studio table. Row rules already blocked those writes, but the grants were broader than the app needs.
- The owner dashboard is the only writer, and it signs in as an authenticated user.

2. Changes
- anon: write grants removed from all tables; read grants removed from bookings and admins.
- authenticated: write grants removed from admins (owner list is managed only by the claim routine).

3. Unchanged
- Public read access to services, add-ons, site settings, working hours and blackout dates.
- Owner write access on studio tables, still gated by the owner check in row rules.
- Booking creation and availability lookups, which run through privileged functions.

4. Notes
- REVOKE is idempotent, so this migration is safe to re-run.
*/

REVOKE INSERT, UPDATE, DELETE ON public.services, public.addons, public.site_settings, public.working_hours, public.blackout_dates, public.bookings, public.admins FROM anon;
REVOKE SELECT ON public.bookings, public.admins FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.admins FROM authenticated;
