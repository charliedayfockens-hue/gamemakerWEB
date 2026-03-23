// =============================================
// SUPABASE CONFIGURATION
// =============================================
// Replace these with YOUR Supabase project details
// From: Supabase Dashboard > Settings > API
// =============================================

const SUPABASE_URL = 'https://YOUR-PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR-ANON-KEY-HERE';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);