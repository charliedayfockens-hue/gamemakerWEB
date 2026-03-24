// =============================================
// SUPABASE CONFIGURATION
// =============================================
// 
// HOW TO GET YOUR KEYS:
// 1. Go to https://supabase.com and sign in
// 2. Select your project (or create one)
// 3. Click "Settings" (gear icon) in the left sidebar
// 4. Click "API" 
// 5. Copy "Project URL" and "anon public" key
//
// =============================================

// ⬇️ PASTE YOUR PROJECT URL HERE (replace the placeholder)
const SUPABASE_URL = 'https://lztqehygljqtkepghyak.supabase.co';

// ⬇️ PASTE YOUR ANON KEY HERE (replace the placeholder)
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6dHFlaHlnbGpxdGtlcGdoeWFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTcwODEsImV4cCI6MjA4OTg3MzA4MX0.6XMVpnn6D5P1xX9oO3SXgBb72dOhkIipEWxtW3blj_0';

// =============================================
// DO NOT EDIT BELOW THIS LINE
// =============================================

let supabase = null;
let supabaseConfigured = false;

try {
    // Check if configuration is valid
    if (SUPABASE_URL.includes('https://lztqehygljqtkepghyak.supabase.co') || SUPABASE_ANON_KEY.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6dHFlaHlnbGpxdGtlcGdoeWFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTcwODEsImV4cCI6MjA4OTg3MzA4MX0.6XMVpnn6D5P1xX9oO3SXgBb72dOhkIipEWxtW3blj_0')) {
        console.warn('⚠️ Supabase not configured! Please edit supabase-config.js');
        supabaseConfigured = false;
    } else if (!SUPABASE_URL.startsWith('https://') || !SUPABASE_URL.includes('.supabase.co')) {
        console.error('❌ Invalid Supabase URL format');
        supabaseConfigured = false;
    } else {
        // Initialize Supabase
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        supabaseConfigured = true;
        console.log('✅ Supabase configured successfully');
    }
} catch (error) {
    console.error('❌ Supabase initialization failed:', error);
    supabaseConfigured = false;
}
