import type { Policy } from '@/lib/types';

// Fallback wording. The owner can change all of this in the admin panel.
export const DEFAULT_CATALOG_HEADING = 'Signature styles, made to order';
export const DEFAULT_POLICIES_HEADING = 'Policies and frequently asked questions';
export const DEFAULT_POLICIES_INTRO =
  'Clear expectations keep every appointment calm and on time. Here is how we work together.';
export const DEFAULT_BOOKING_TERMS =
  'I understand the deposit is non-refundable and that cancellations within 48 hours of the appointment forfeit it.';

export const DEFAULT_BOOK_BUTTON_LABEL = 'Book Appointment';
export const DEFAULT_EXPLORE_BUTTON_LABEL = 'Explore Styles';
export const DEFAULT_VISIT_HEADING = 'Visit the studio';
export const DEFAULT_HOURS_HEADING = 'Studio hours';

// Booking rules used when the database has not been updated yet (same as the original behaviour).
export const DEFAULT_BOOKING_WINDOW_DAYS = 21;

// Shown only if the policies table has not been created in the database yet.
export const DEFAULT_POLICIES: Policy[] = [
  {
    id: 'default-1',
    question: 'How do deposits work?',
    answer:
      'A non-refundable deposit reserves your appointment. Each style shows its own deposit amount, usually half of the service price. Pay by the method in your confirmation within 24 hours, and your slot is locked in once it arrives.',
    is_active: true,
    position: 1,
  },
  {
    id: 'default-2',
    question: 'What is your cancellation policy?',
    answer:
      'Please give at least 48 hours notice to cancel or reschedule. Within 48 hours, the deposit is kept to cover the reserved time.',
    is_active: true,
    position: 2,
  },
];
