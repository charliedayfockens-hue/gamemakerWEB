// =============================================
// GITHUB OAUTH CONFIGURATION
// =============================================
// 
// HOW TO GET YOUR CLIENT ID:
// 1. Go to https://github.com/settings/developers
// 2. Click "OAuth Apps" → "New OAuth App"
// 3. Fill in:
//    - Application name: WebGL Game Editor
//    - Homepage URL: https://YOUR-USERNAME.github.io/game-editor
//    - Callback URL: https://YOUR-USERNAME.github.io/game-editor
// 4. Click "Register application"
// 5. Copy your Client ID below
//
// Note: We use client-side OAuth flow (no client secret needed)
// =============================================

const GITHUB_CONFIG = {
    // ⬇️ PASTE YOUR GITHUB OAUTH CLIENT ID HERE
    clientId: 'YOUR_GITHUB_CLIENT_ID_HERE',
    
    // ⬇️ UPDATE THIS TO YOUR GITHUB PAGES URL
    redirectUri: 'https://YOUR-USERNAME.github.io/game-editor',
    
    // OAuth scopes we need
    scopes: ['gist']
};

// API Configuration
const GITHUB_API = {
    baseUrl: 'https://api.github.com',
    gistUrl: 'https://api.github.com/gists'
};

// Check if configured
const isGitHubConfigured = 
    GITHUB_CONFIG.clientId && 
    !GITHUB_CONFIG.clientId.includes('YOUR_GITHUB') &&
    GITHUB_CONFIG.redirectUri && 
    !GITHUB_CONFIG.redirectUri.includes('YOUR-USERNAME');

if (!isGitHubConfigured) {
    console.warn('⚠️ GitHub OAuth not configured! Please update github-config.js');
}