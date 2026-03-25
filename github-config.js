// =============================================
// GITHUB OAUTH CONFIGURATION
// =============================================

const GITHUB_CONFIG = {
    // ⬇️ PASTE YOUR CLIENT ID HERE (from GitHub OAuth app)
    clientId: '6945536682bf825ff95bc6c7a5c9ab3da9a9049e',
    
    // ⬇️ Your GitHub Pages URL
    redirectUri: 'https://charliedayfockens-hue.github.io/gamemakerWEB/',
    
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
    !GITHUB_CONFIG.clientId.includes('YOUR_CLIENT_ID') &&
    GITHUB_CONFIG.redirectUri && 
    !GITHUB_CONFIG.redirectUri.includes('YOUR-USERNAME');

if (!isGitHubConfigured) {
    console.warn('⚠️ GitHub OAuth not configured! Please update github-config.js');
}
