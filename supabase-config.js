// =============================================
// SUPABASE CONFIGURATION
// =============================================
// Replace these with YOUR Supabase project details
// From: Supabase Dashboard > Settings > API
// =============================================

const SUPABASE_URL = 'https://lztqehygljqtkepghyak.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6dHFlaHlnbGpxdGtlcGdoeWFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTcwODEsImV4cCI6MjA4OTg3MzA4MX0.6XMVpnn6D5P1xX9oO3SXgBb72dOhkIipEWxtW3blj_0';

// Initialize Supabase client
let supabase;
let supabaseInitialized = false;

try {
    if (SUPABASE_URL.includes('YOUR-PROJECT') || SUPABASE_ANON_KEY.includes('YOUR-ANON-KEY')) {
        console.error('⚠️ Supabase not configured! Please update supabase-config.js with your project details.');
        supabaseInitialized = false;
    } else {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        supabaseInitialized = true;
        console.log('✅ Supabase initialized successfully');
    }
} catch (error) {
    console.error('❌ Failed to initialize Supabase:', error);
    supabaseInitialized = false;
}
