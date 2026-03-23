// =============================================
// SUPABASE CONFIGURATION
// =============================================
// Replace these with YOUR Supabase project details
// From: Supabase Dashboard > Settings > API
// =============================================

const SUPABASE_URL = 'https://lztqehygljqtkepghyak.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6dHFlaHlnbGpxdGtlcGdoeWFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTcwODEsImV4cCI6MjA4OTg3MzA4MX0.6XMVpnn6D5P1xX9oO3SXgBb72dOhkIipEWxtW3blj_0';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
