/*
# Seed starter brand, services and add-ons

1. Changes
- Fills the single settings row with a starter brand (Aurum Braids Studio), hero copy, hero photo, contact details and payment instructions.
- Adds six starter hairstyles across the four catalog categories, each with prices in USD and GHS, durations, deposit percentages and photos.
- Adds four starter add-ons (hair prep, length extensions, beads and cuffs, scalp treatment).

2. Security
- No security changes. Content stays editable only by the owner through the admin panel.

3. Important Notes
- 3.1 Seeding runs only when the matching table is still empty, so re-running this migration never duplicates services or add-ons.
- 3.2 The owner should replace the placeholder phone numbers, address and payment details in the admin panel.
*/

UPDATE site_settings
SET
  brand_name = 'Aurum Braids Studio',
  tagline = 'Editorial braiding, crafted with care',
  hero_headline = 'Braids that feel like you, finished to perfection.',
  hero_subheadline = 'Premium knotless, box, Fulani and loc styles by a dedicated artist. Browse, pick your time and book in minutes.',
  hero_image_url = 'https://images.pexels.com/photos/7750124/pexels-photo-7750124.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  phone = '+233 24 000 0000',
  whatsapp_number = '233240000000',
  instagram_handle = '@aurumbraids',
  address = 'East Legon, Accra, Ghana. Studio visits by appointment only.',
  footer_note = 'Every appointment is held just for you.',
  payment_instructions = 'Pay your deposit by Mobile Money or bank transfer within 24 hours. Your appointment is confirmed once the deposit is received.'
WHERE id = 1 AND brand_name = 'Your Brand';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM services) THEN
    INSERT INTO services (name, category, description, prep_instructions, price_usd, price_ghs, duration_minutes, deposit_percent, image_url, position) VALUES
      ('Knotless Braids, Medium', 'Knotless Braids', 'Feathered, lightweight knotless braids that sit softly at the scalp and move naturally. Ideal for everyday wear and long-lasting protective styling.', 'Arrive with clean, dry hair detangled as much as possible. Please avoid oil or product build-up on the scalp for 48 hours before your visit.', 180, NULL, 300, 50, 'https://images.pexels.com/photos/11466070/pexels-photo-11466070.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 1),
      ('Knotless Braids, Long Boho', 'Knotless Braids', 'Long, tapered knotless braids finished with curly boho ends for a relaxed, romantic look.', 'Wash and deep condition your natural hair 1-2 days before the appointment. Bring your preferred curly hair pack if you have one.', 240, 3300, 420, 50, 'https://images.pexels.com/photos/7190007/pexels-photo-7190007.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 2),
      ('Box Braids, Medium', 'Box Braids', 'Classic medium box braids with a clean parting and a polished, sculpted finish.', 'Arrive with hair clean and dry. A light moisturiser on the ends is fine, but avoid heavy oils.', 150, NULL, 300, 50, 'https://images.pexels.com/photos/13767165/pexels-photo-13767165.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 3),
      ('Fulani Braids with Beads', 'Fulani Braids', 'Traditional Fulani braids with a centre-part, side cornrows and handcrafted beads.', 'Hair should be washed and blow-dried straight before your visit. Let us know if you would like the beads in a specific colour palette.', 190, NULL, 360, 50, 'https://images.pexels.com/photos/37489452/pexels-photo-37489452.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 4),
      ('Straight-Back Cornrows', 'Locs & Cornrows', 'Sleek, neat straight-back cornrows for a clean, low-maintenance style.', 'Arrive with freshly washed, detangled hair. Hair should be dry before you come in.', 80, NULL, 120, 50, 'https://images.pexels.com/photos/33664383/pexels-photo-33664383.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 5),
      ('Starter Locs', 'Locs & Cornrows', 'Hand-coiled starter locs with a precise parting, tailored to your hair texture.', 'Please come with clean hair that has been washed and blow-dried. Locs take time to settle, so book a maintenance visit after 6-8 weeks.', 200, NULL, 360, 50, 'https://images.pexels.com/photos/17669816/pexels-photo-17669816.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 6);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM addons) THEN
    INSERT INTO addons (name, description, price_usd, price_ghs, extra_minutes, position) VALUES
      ('Hair Wash and Prep', 'Gentle wash, conditioning and blow-dry so your braids start on clean, prepped hair.', 25, NULL, 30, 1),
      ('Length Extensions', 'Premium synthetic extension hair added for extra length and volume.', 40, NULL, 60, 2),
      ('Beads and Cuffs', 'Hand-selected beads and cuffs for a finished, personal touch.', 15, NULL, 15, 3),
      ('Scalp Treatment', 'Soothing scalp massage with a nourishing treatment.', 20, NULL, 20, 4);
  END IF;
END $$;
