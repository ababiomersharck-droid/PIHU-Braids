import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** False when the .env file is missing or has the wrong names. App.tsx then shows a clear message. */
export const supabaseConfigured = Boolean(url && key);

// Placeholder values keep the app from crashing before it can show the message above.
export const supabase = createClient(url || 'https://placeholder.supabase.co', key || 'placeholder-key');
