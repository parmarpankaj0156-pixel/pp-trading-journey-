/**
 * PP Trading Journey configuration
 * To enable REAL cloud accounts, paste your Supabase Project URL and publishable (anon) key.
 * Do not paste a service_role or secret key here. See README.md.
 */
export const SUPABASE_URL = 'https://fkeakrefxvzcxqgwxtlg.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_EH6SriW7T-oLmHrVKnB0LQ_kIdOWh83';

export const AUTH_ENABLED = /^https:\/\//.test(SUPABASE_URL) && SUPABASE_ANON_KEY.length > 20;
