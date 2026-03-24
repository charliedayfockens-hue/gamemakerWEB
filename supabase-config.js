// PASTE YOUR URL HERE (between the quotes)
const SUPABASE_URL = 'https://lztqehygljqtkepghyak.supabase.co';

// PASTE YOUR ANON KEY HERE (between the quotes)  
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6dHFlaHlnbGpxdGtlcGdoeWFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTcwODEsImV4cCI6MjA4OTg3MzA4MX0.6XMVpnn6D5P1xX9oO3SXgBb72dOhkIipEWxtW3blj_0';

// Initialize
let supabase = null;
let supabaseConfigured = false;

if (SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL.includes('supabase.co')) {
    try {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        supabaseConfigured = true;
        console.log('✅ Supabase ready!');
    } catch (e) {
        console.error('❌ Supabase error:', e);
    }
} else {
    console.error('❌ Please add your Supabase URL and Key to supabase-config.js');
}
