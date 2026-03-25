// =============================================
// WebGL Game Editor - GitHub Personal Access Token Version
// With Account Switching & Token Expiry Handling
// =============================================

const gameChannel = new BroadcastChannel('webgl_game_editor_channel');
let runningGameWindow = null;
let currentUser = null;
let currentProject = null;
let currentFile = null;
let projects = {};
let saveTimeout = null;
let accessToken = null;
let tokenValid = true;

// =============================================
// DOM ELEMENTS
// =============================================

const loadingScreen = document.getElementById('loadingScreen');
const loginScreen = document.getElementById('loginScreen');
const mainApp = document.getElementById('mainApp');
const connectBtn = document.getElementById('connectBtn');
const tokenInput = document.getElementById('tokenInput');
const toggleTokenVisibility = document.getElementById('toggleTokenVisibility');
const loginError = document.getElementById('loginError');
const showSetupGuideBtn = document.getElementById('showSetupGuideBtn');
const setupGuideModal = document.getElementById('setupGuideModal');
const signOutBtn = document.getElementById('signOutBtn');
const syncBtn = document.getElementById('syncBtn');
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const userAvatar = document.getElementById('userAvatar');
const userName = document.getElementById('userName');
const projectList = document.getElementById('projectList');
const archivedList = document.getElementById('archivedList');
const projectEditor = document.getElementById('projectEditor');
const noProjectSelected = document.getElementById('noProjectSelected');
const projectName = document.getElementById('projectName');
const fileTabs = document.getElementById('fileTabs');
const codeEditor = document.getElementById('codeEditor');
const editorStatus = document.getElementById('editorStatus');
const viewOnGitHub = document.getElementById('viewOnGitHub');

const newProjectBtn = document.getElementById('newProjectBtn');
const addFileBtn = document.getElementById('addFileBtn');
const shareProjectBtn = document.getElementById('shareProjectBtn');
const downloadProjectBtn = document.getElementById('downloadProjectBtn');
const archiveProjectBtn = document.getElementById('archiveProjectBtn');
const deleteProjectBtn = document.getElementById('deleteProjectBtn');
const runProjectBtn = document.getElementById('runProjectBtn');
const editProjectNameBtn = document.getElementById('editProjectNameBtn');

const newProjectModal = document.getElementById('newProjectModal');
const shareModal = document.getElementById('shareModal');
const newFileModal = document.getElementById('newFileModal');
const renameFileModal = document.getElementById('renameFileModal');
const changeTokenModal = document.getElementById('changeTokenModal');
const fileContextMenu = document.getElementById('fileContextMenu');

// =============================================
// TEMPLATES
// =============================================

const templates = {
    blank: {
        files: {
            'index.html': '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>My Game</title>\n    <link rel="stylesheet" href="style.css">\n</head>\n<body>\n    <h1>Hello World!</h1>\n    <script src="script.js"><\/script>\n</body>\n</html>',
            'style.css': '/* Your styles here */\nbody {\n    margin: 0;\n    padding: 20px;\n    font-family: Arial, sans-serif;\n    background: #1a1a2e;\n    color: white;\n}',
            'script.js': '// Your JavaScript code here\nconsole.log("Hello from JavaScript!");'
        }
    },
    webgl: {
        files: {
            'index.html': '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>WebGL Game</title>\n    <link rel="stylesheet" href="style.css">\n</head>\n<body>\n    <canvas id="glCanvas"></canvas>\n    <script src="main.js"><\/script>\n</body>\n</html>',
            'style.css': '* {\n    margin: 0;\n    padding: 0;\n    box-sizing: border-box;\n}\n\nbody {\n    overflow: hidden;\n    background: #000;\n}\n\n#glCanvas {\n    display: block;\n    width: 100vw;\n    height: 100vh;\n}',
            'main.js': '// WebGL Setup\nconst canvas = document.getElementById("glCanvas");\nconst gl = canvas.getContext("webgl");\n\nif (!gl) {\n    alert("WebGL not supported!");\n}\n\ncanvas.width = window.innerWidth;\ncanvas.height = window.innerHeight;\ngl.viewport(0, 0, canvas.width, canvas.height);\n\ngl.clearColor(0.1, 0.2, 0.3, 1.0);\ngl.clear(gl.COLOR_BUFFER_BIT);\n\nconsole.log("WebGL ready!");'
        }
    },
    canvas: {
        files: {
            'index.html': '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Canvas Game</title>\n    <link rel="stylesheet" href="style.css">\n</head>\n<body>\n    <canvas id="gameCanvas"></canvas>\n    <script src="game.js"><\/script>\n</body>\n</html>',
            'style.css': '* {\n    margin: 0;\n    padding: 0;\n}\n\nbody {\n    overflow: hidden;\n    background: #1a1a2e;\n}\n\n#gameCanvas {\n    display: block;\n}',
            'game.js': 'const canvas = document.getElementById("gameCanvas");\nconst ctx = canvas.getContext("2d");\n\ncanvas.width = window.innerWidth;\ncanvas.height = window.innerHeight;\n\nconst player = {\n    x: canvas.width / 2,\n    y: canvas.height / 2,\n    size: 30,\n    speed: 5,\n    color: "#00ff88"\n};\n\nconst keys = {};\ndocument.addEventListener("keydown", e => keys[e.key] = true);\ndocument.addEventListener("keyup", e => keys[e.key] = false);\n\nfunction update() {\n    if (keys["ArrowUp"] || keys["w"]) player.y -= player.speed;\n    if (keys["ArrowDown"] || keys["s"]) player.y += player.speed;\n    if (keys["ArrowLeft"] || keys["a"]) player.x -= player.speed;\n    if (keys["ArrowRight"] || keys["d"]) player.x += player.speed;\n}\n\nfunction draw() {\n    ctx.fillStyle = "#1a1a2e";\n    ctx.fillRect(0, 0, canvas.width, canvas.height);\n    \n    ctx.beginPath();\n    ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);\n    ctx.fillStyle = player.color;\n    ctx.fill();\n    \n    ctx.fillStyle = "#fff";\n    ctx.font = "18px Arial";\n    ctx.fillText("Use WASD or Arrow Keys", 20, 30);\n}\n\nfunction gameLoop() {\n    update();\n    draw();\n    requestAnimationFrame(gameLoop);\n}\n\ngameLoop();'
        }
    }
};

// =============================================
// SAVED ACCOUNTS MANAGEMENT
// =============================================

function getSavedAccounts() {
    try {
        return JSON.parse(localStorage.getItem('github_accounts') || '[]');
    } catch {
        return [];
    }
}

function saveAccount(user, token) {
    const accounts = getSavedAccounts();
    
    // Check if account already exists
    const existingIndex = accounts.findIndex(a => a.login === user.login);
    
    const accountData = {
        login: user.login,
        avatar_url: user.avatar_url,
        token: token,
        lastUsed: new Date().toISOString()
    };
    
    if (existingIndex >= 0) {
        accounts[existingIndex] = accountData;
    } else {
        accounts.push(accountData);
    }
    
    localStorage.setItem('github_accounts', JSON.stringify(accounts));
}

function removeAccount(login) {
    const accounts = getSavedAccounts().filter(a => a.login !== login);
    localStorage.setItem('github_accounts', JSON.stringify(accounts));
}

function renderSavedAccounts() {
    const accounts = getSavedAccounts();
    const container = document.getElementById('savedAccountsList');
    
    if (!container) return;
    
    if (accounts.length === 0) {
        container.innerHTML = '';
        container.style.display = 'none';
        return;
    }
    
    container.style.display = 'block';
    container.innerHTML = `
        <div class="saved-accounts-header">
            <h3><i class="fas fa-users"></i> Saved Accounts</h3>
        </div>
        <div class="saved-accounts-list">
            ${accounts.map(account => `
                <div class="saved-account-item" data-login="${escapeHtml(account.login)}">
                    <div class="saved-account-info" onclick="loginWithSavedAccount('${escapeHtml(account.login)}')">
                        <img src="${escapeHtml(account.avatar_url)}" alt="${escapeHtml(account.login)}">
                        <span>${escapeHtml(account.login)}</span>
                    </div>
                    <button class="saved-account-remove" onclick="event.stopPropagation(); removeSavedAccount('${escapeHtml(account.login)}')" title="Remove account">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `).join('')}
        </div>
    `;
}

window.loginWithSavedAccount = async function(login) {
    const accounts = getSavedAccounts();
    const account = accounts.find(a => a.login === login);
    
    if (!account) {
        showToast('Account not found', 'error');
        return;
    }
    
    // Show loading state
    const items = document.querySelectorAll('.saved-account-item');
    items.forEach(item => {
        if (item.dataset.login === login) {
            item.classList.add('loading');
            const info = item.querySelector('.saved-account-info span');
            if (info) info.textContent = 'Connecting...';
        }
    });
    
    try {
        accessToken = account.token;
        
        // Validate token
        const response = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `token ${accessToken}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Token expired');
        }
        
        const userData = await response.json();
        currentUser = userData;
        
        // Update saved account data
        saveAccount(currentUser, accessToken);
        localStorage.setItem('github_token', accessToken);
        
        userAvatar.src = currentUser.avatar_url;
        userName.textContent = currentUser.login;
        
        tokenValid = true;
        showMainApp();
        await loadProjects();
        
        showToast(`Welcome back, ${currentUser.login}!`, 'success');
        
    } catch (error) {
        console.error('Saved account login error:', error);
        
        // Token expired for this saved account
        renderSavedAccounts();
        
        showToast(`Token expired for ${login}. Please enter a new token.`, 'error');
        
        // Pre-fill the account name
        loginError.textContent = `Token for "${login}" has expired. Enter a new token above.`;
        accessToken = null;
    }
};

window.removeSavedAccount = function(login) {
    if (confirm(`Remove saved account "${login}"?`)) {
        removeAccount(login);
        renderSavedAccounts();
        showToast('Account removed', 'info');
    }
};

// =============================================
// TOKEN EXPIRY HANDLING
// =============================================

function setTokenInvalid() {
    tokenValid = false;
    document.body.classList.add('token-expired');
    
    // Show token expired banner
    let banner = document.getElementById('tokenExpiredBanner');
    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'tokenExpiredBanner';
        banner.className = 'token-expired-banner';
        banner.innerHTML = `
            <div class="banner-content">
                <i class="fas fa-exclamation-triangle"></i>
                <span>Your GitHub token has expired or is invalid. Go to Settings to update it.</span>
                <button onclick="document.getElementById('settingsBtn').click();" class="banner-btn">
                    <i class="fas fa-cog"></i> Open Settings
                </button>
            </div>
        `;
        
        // Insert after header
        const header = document.querySelector('.app-header');
        header.parentNode.insertBefore(banner, header.nextSibling);
    }
    
    banner.style.display = 'flex';
    setEditorStatus('error', 'Token Invalid');
}

function setTokenValid() {
    tokenValid = true;
    document.body.classList.remove('token-expired');
    
    const banner = document.getElementById('tokenExpiredBanner');
    if (banner) {
        banner.style.display = 'none';
    }
    
    setEditorStatus('saved', 'Synced');
}

function checkTokenBeforeAction(action) {
    if (!tokenValid) {
        showToast('Token invalid! Go to Settings to update it.', 'error');
        settingsModal.classList.add('active');
        updateSettingsContent();
        return false;
    }
    return true;
}

// =============================================
// THEME MANAGEMENT
// =============================================

function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === theme);
    });
}

document.getElementById('themeLightBtn')?.addEventListener('click', () => setTheme('light'));
document.getElementById('themeDarkBtn')?.addEventListener('click', () => setTheme('dark'));

// =============================================
// INITIALIZATION
// =============================================

async function init() {
    console.log('🚀 Initializing Game Editor...');
    
    initTheme();
    
    accessToken = localStorage.getItem('github_token');
    
    if (accessToken) {
        console.log('🔑 Found stored token, validating...');
        try {
            await loadUserData();
        } catch (error) {
            console.error('Token invalid:', error);
            
            // Don't remove token - show expired state instead
            // Check if we have user data cached
            const accounts = getSavedAccounts();
            const cachedAccount = accounts.find(a => a.token === accessToken);
            
            if (cachedAccount) {
                // Show main app with expired state
                currentUser = {
                    login: cachedAccount.login,
                    avatar_url: cachedAccount.avatar_url
                };
                
                userAvatar.src = currentUser.avatar_url;
                userName.textContent = currentUser.login;
                
                showMainApp();
                setTokenInvalid();
                
                showToast('Token expired! Update it in Settings.', 'error');
            } else {
                localStorage.removeItem('github_token');
                accessToken = null;
                showLoginScreen();
            }
        }
    } else {
        console.log('ℹ️ No token found, showing login');
        showLoginScreen();
    }
}

function showLoginScreen() {
    loadingScreen.classList.add('hidden');
    loginScreen.classList.remove('hidden');
    mainApp.classList.add('hidden');
    loginError.textContent = '';
    
    renderSavedAccounts();
}

function showMainApp() {
    loadingScreen.classList.add('hidden');
    loginScreen.classList.add('hidden');
    mainApp.classList.remove('hidden');
}

setTimeout(() => {
    if (loadingScreen && !loadingScreen.classList.contains('hidden')) {
        showLoginScreen();
    }
}, 5000);

// =============================================
// SETUP GUIDE
// =============================================

showSetupGuideBtn?.addEventListener('click', () => {
    setupGuideModal.classList.add('active');
});

// =============================================
// TOKEN VISIBILITY TOGGLE
// =============================================

toggleTokenVisibility?.addEventListener('click', () => {
    const isPassword = tokenInput.type === 'password';
    tokenInput.type = isPassword ? 'text' : 'password';
    toggleTokenVisibility.innerHTML = `<i class="fas fa-eye${isPassword ? '-slash' : ''}"></i>`;
});

// =============================================
// AUTHENTICATION
// =============================================

connectBtn?.addEventListener('click', async () => {
    const token = tokenInput.value.trim();
    
    if (!token) {
        loginError.textContent = 'Please enter your GitHub token';
        return;
    }
    
    if (!token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
        loginError.textContent = 'Invalid token. Should start with ghp_ or github_pat_';
        return;
    }
    
    connectBtn.disabled = true;
    connectBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting...';
    loginError.textContent = '';
    
    try {
        accessToken = token;
        await loadUserData();
        
        // Save token and account
        localStorage.setItem('github_token', token);
        saveAccount(currentUser, token);
        tokenInput.value = '';
        
    } catch (error) {
        console.error('Login error:', error);
        loginError.textContent = 'Invalid token. Please check and try again.';
        accessToken = null;
        
        connectBtn.disabled = false;
        connectBtn.innerHTML = '<i class="fab fa-github"></i> Connect to GitHub';
    }
});

tokenInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') connectBtn.click();
});

async function loadUserData() {
    const response = await githubRequest('/user');
    currentUser = response;
    
    userAvatar.src = currentUser.avatar_url;
    userName.textContent = currentUser.login;
    
    tokenValid = true;
    setTokenValid();
    showMainApp();
    await loadProjects();
    
    console.log('✅ Logged in as:', currentUser.login);
}

signOutBtn?.addEventListener('click', () => {
    if (confirm('Sign out? Your account will be saved for quick login later.')) {
        // Keep account saved but remove active token
        localStorage.removeItem('github_token');
        accessToken = null;
        currentUser = null;
        projects = {};
        currentProject = null;
        currentFile = null;
        tokenValid = true;
        
        // Remove expired banner if exists
        const banner = document.getElementById('tokenExpiredBanner');
        if (banner) banner.style.display = 'none';
        document.body.classList.remove('token-expired');
        
        showLoginScreen();
        showToast('Signed out. Your account is saved for quick login.', 'info');
    }
});

// =============================================
// SETTINGS MODAL
// =============================================

function updateSettingsContent() {
    document.getElementById('settingsUserName').textContent = currentUser?.login || 'Unknown';
    document.getElementById('settingsProfileLink').href = `https://github.com/${currentUser?.login}`;
    document.getElementById('settingsTokenDisplay').value = accessToken || '';
    
    const currentTheme = localStorage.getItem('theme') || 'dark';
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === currentTheme);
    });
    
    // Update token status display
    const tokenStatusEl = document.getElementById('tokenStatusDisplay');
    if (tokenStatusEl) {
        if (tokenValid) {
            tokenStatusEl.innerHTML = '<i class="fas fa-check-circle"></i> Token is valid';
            tokenStatusEl.className = 'token-status token-status-valid';
        } else {
            tokenStatusEl.innerHTML = '<i class="fas fa-exclamation-circle"></i> Token is expired or invalid';
            tokenStatusEl.className = 'token-status token-status-invalid';
        }
    }
}

settingsBtn?.addEventListener('click', () => {
    updateSettingsContent();
    settingsModal.classList.add('active');
});

document.getElementById('toggleSettingsTokenBtn')?.addEventListener('click', () => {
    const input = document.getElementById('settingsTokenDisplay');
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    document.getElementById('toggleSettingsTokenBtn').innerHTML = 
        `<i class="fas fa-eye${isPassword ? '-slash' : ''}"></i>`;
});

document.getElementById('copyTokenBtn')?.addEventListener('click', () => {
    const input = document.getElementById('settingsTokenDisplay');
    input.type = 'text';
    input.select();
    document.execCommand('copy');
    input.type = 'password';
    showToast('Token copied!', 'success');
});

document.getElementById('changeTokenBtn')?.addEventListener('click', () => {
    document.getElementById('newTokenInput').value = '';
    document.getElementById('changeTokenError').textContent = '';
    changeTokenModal.classList.add('active');
});

document.getElementById('saveNewTokenBtn')?.addEventListener('click', async () => {
    const newToken = document.getElementById('newTokenInput').value.trim();
    const errorEl = document.getElementById('changeTokenError');
    
    if (!newToken) {
        errorEl.textContent = 'Please enter a token';
        return;
    }
    
    if (!newToken.startsWith('ghp_') && !newToken.startsWith('github_pat_')) {
        errorEl.textContent = 'Invalid format. Should start with ghp_ or github_pat_';
        return;
    }
    
    const btn = document.getElementById('saveNewTokenBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Validating...';
    
    try {
        const response = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `token ${newToken}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (!response.ok) throw new Error('Invalid token');
        
        const userData = await response.json();
        
        // Token is valid - update everything
        accessToken = newToken;
        currentUser = userData;
        localStorage.setItem('github_token', newToken);
        saveAccount(currentUser, newToken);
        
        userAvatar.src = currentUser.avatar_url;
        userName.textContent = currentUser.login;
        
        // Restore valid state
        setTokenValid();
        
        closeAllModals();
        
        // Reload projects
        await loadProjects();
        
        showToast('Token updated! Everything is working again.', 'success');
        
    } catch (error) {
        errorEl.textContent = 'Invalid token. Please check and try again.';
    }
    
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-save"></i> Save New Token';
});

// =============================================
// GITHUB API (with token expiry detection)
// =============================================

async function githubRequest(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `https://api.github.com${endpoint}`;
    
    const response = await fetch(url, {
        ...options,
        headers: {
            'Authorization': `token ${accessToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
            ...options.headers
        }
    });
    
    if (response.status === 401 || response.status === 403) {
        // Token expired or invalid
        setTokenInvalid();
        throw new Error('Token expired or invalid');
    }
    
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `GitHub API error: ${response.status}`);
    }
    
    const text = await response.text();
    return text ? JSON.parse(text) : null;
}

// =============================================
// PROJECT MANAGEMENT
// =============================================

async function loadProjects() {
    if (!checkTokenBeforeAction()) return;
    
    try {
        setEditorStatus('syncing', 'Syncing...');
        
        const gists = await githubRequest('/gists');
        projects = {};
        
        for (const gist of gists) {
            if (gist.description && gist.description.startsWith('[GameEditor]')) {
                projects[gist.id] = parseGistToProject(gist);
            }
        }
        
        renderProjectList();
        renderArchivedList();
        setEditorStatus('saved', 'Synced');
        
        console.log(`✅ Loaded ${Object.keys(projects).length} projects`);
    } catch (error) {
        console.error('Load projects error:', error);
        
        if (error.message.includes('Token expired')) {
            return;
        }
        
        setEditorStatus('error', 'Sync failed');
        showToast('Failed to load projects', 'error');
    }
}

function parseGistToProject(gist) {
    const files = {};
    
    for (const [filename, fileData] of Object.entries(gist.files)) {
        if (filename !== 'project-meta.json') {
            files[filename] = fileData.content || '';
        }
    }
    
    let meta = { archived: false };
    if (gist.files['project-meta.json']) {
        try {
            meta = JSON.parse(gist.files['project-meta.json'].content);
        } catch (e) {}
    }
    
    return {
        id: gist.id,
        name: gist.description.replace('[GameEditor] ', ''),
        description: meta.description || '',
        files: files,
        archived: meta.archived || false,
        gistUrl: gist.html_url,
        isPublic: gist.public,
        updatedAt: gist.updated_at
    };
}

async function saveProjectToGithub(project, isNew = false) {
    if (!checkTokenBeforeAction()) return;
    
    try {
        setEditorStatus('saving', 'Saving...');
        
        const gistFiles = {};
        
        for (const [filename, content] of Object.entries(project.files)) {
            gistFiles[filename] = { content: content || ' ' };
        }
        
        gistFiles['project-meta.json'] = {
            content: JSON.stringify({
                description: project.description || '',
                archived: project.archived || false,
                version: '1.0'
            }, null, 2)
        };
        
        if (isNew) {
            const response = await githubRequest('/gists', {
                method: 'POST',
                body: JSON.stringify({
                    description: `[GameEditor] ${project.name}`,
                    public: project.isPublic || false,
                    files: gistFiles
                })
            });
            
            project.id = response.id;
            project.gistUrl = response.html_url;
            projects[project.id] = project;
        } else {
            await githubRequest(`/gists/${project.id}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    description: `[GameEditor] ${project.name}`,
                    files: gistFiles
                })
            });
        }
        
        setEditorStatus('saved', 'Saved');
        return project;
    } catch (error) {
        console.error('Save error:', error);
        
        if (!error.message.includes('Token expired')) {
            setEditorStatus('error', 'Save failed');
            showToast('Failed to save', 'error');
        }
        
        throw error;
    }
}

async function deleteProjectFromGithub(projectId) {
    if (!checkTokenBeforeAction()) return;
    
    try {
        await githubRequest(`/gists/${projectId}`, { method: 'DELETE' });
        delete projects[projectId];
        showToast('Project deleted', 'success');
    } catch (error) {
        console.error('Delete error:', error);
        if (!error.message.includes('Token expired')) {
            showToast('Failed to delete', 'error');
        }
    }
}

syncBtn?.addEventListener('click', async () => {
    if (!checkTokenBeforeAction()) return;
    syncBtn.classList.add('syncing');
    await loadProjects();
    syncBtn.classList.remove('syncing');
});

// =============================================
// UI RENDERING
// =============================================

function renderProjectList() {
    const active = Object.values(projects).filter(p => !p.archived);
    projectList.innerHTML = active.length === 0 ? '<p class="no-items">No projects yet</p>' : '';
    
    active.forEach(project => {
        const item = document.createElement('div');
        item.className = `project-item ${currentProject?.id === project.id ? 'active' : ''}`;
        item.innerHTML = `
            <i class="fas fa-folder"></i>
            <span class="project-item-name">${escapeHtml(project.name)}</span>
        `;
        item.addEventListener('click', () => selectProject(project.id));
        projectList.appendChild(item);
    });
}

function renderArchivedList() {
    const archived = Object.values(projects).filter(p => p.archived);
    archivedList.innerHTML = archived.length === 0 ? '<p class="no-items">No archived projects</p>' : '';
    
    archived.forEach(project => {
        const item = document.createElement('div');
        item.className = `project-item ${currentProject?.id === project.id ? 'active' : ''}`;
        item.innerHTML = `
            <i class="fas fa-archive"></i>
            <span class="project-item-name">${escapeHtml(project.name)}</span>
            <div class="project-item-actions">
                <button title="Restore" onclick="event.stopPropagation(); restoreProject('${project.id}')">
                    <i class="fas fa-undo"></i>
                </button>
            </div>
        `;
        item.addEventListener('click', () => selectProject(project.id));
        archivedList.appendChild(item);
    });
}

function selectProject(projectId) {
    saveCurrentFile();
    
    currentProject = projects[projectId];
    currentFile = null;
    
    if (currentProject) {
        noProjectSelected.classList.add('hidden');
        projectEditor.classList.remove('hidden');
        projectName.textContent = currentProject.name;
        
        if (viewOnGitHub) {
            viewOnGitHub.href = currentProject.gistUrl;
            viewOnGitHub.style.display = 'flex';
        }
        
        renderFileTabs();
        
        const fileNames = Object.keys(currentProject.files);
        if (fileNames.length > 0) {
            selectFile(fileNames[0]);
        } else {
            codeEditor.value = '';
            codeEditor.disabled = true;
        }
    }
    
    renderProjectList();
    renderArchivedList();
}

function showNoProjectSelected() {
    noProjectSelected.classList.remove('hidden');
    projectEditor.classList.add('hidden');
    if (viewOnGitHub) viewOnGitHub.style.display = 'none';
}

window.restoreProject = async function(projectId) {
    if (!checkTokenBeforeAction()) return;
    
    const project = projects[projectId];
    if (!project) return;
    
    project.archived = false;
    await saveProjectToGithub(project);
    renderProjectList();
    renderArchivedList();
    showToast('Project restored', 'success');
};

// =============================================
// FILE TABS
// =============================================

function renderFileTabs() {
    fileTabs.innerHTML = '';
    if (!currentProject?.files) return;
    
    Object.keys(currentProject.files).forEach(filename => {
        const tab = document.createElement('div');
        const ext = filename.split('.').pop();
        tab.className = `file-tab ${currentFile === filename ? 'active' : ''}`;
        tab.innerHTML = `
            <i class="file-tab-icon ${ext} ${getFileIcon(ext)}"></i>
            <span>${escapeHtml(filename)}</span>
        `;
        tab.addEventListener('click', () => selectFile(filename));
        tab.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            showFileContextMenu(e, filename);
        });
        fileTabs.appendChild(tab);
    });
}

function getFileIcon(ext) {
    const icons = { html: 'fab fa-html5', css: 'fab fa-css3-alt', js: 'fab fa-js-square' };
    return icons[ext] || 'fas fa-file';
}

function selectFile(filename) {
    if (currentProject?.files?.[filename] === undefined) return;
    
    saveCurrentFile();
    currentFile = filename;
    codeEditor.value = currentProject.files[filename] || '';
    codeEditor.disabled = false;
    renderFileTabs();
}

function saveCurrentFile() {
    if (currentProject && currentFile && currentProject.files.hasOwnProperty(currentFile)) {
        currentProject.files[currentFile] = codeEditor.value;
    }
}

// =============================================
// CODE EDITOR
// =============================================

codeEditor?.addEventListener('input', () => {
    if (currentProject && currentFile) {
        currentProject.files[currentFile] = codeEditor.value;
        
        clearTimeout(saveTimeout);
        setEditorStatus('saving', 'Saving...');
        saveTimeout = setTimeout(async () => {
            if (!tokenValid) {
                setEditorStatus('error', 'Token Invalid');
                return;
            }
            try {
                await saveProjectToGithub(currentProject);
            } catch (error) {
                console.error('Auto-save failed:', error);
            }
        }, 2000);
    }
});

codeEditor?.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
        e.preventDefault();
        const start = codeEditor.selectionStart;
        const end = codeEditor.selectionEnd;
        codeEditor.value = codeEditor.value.substring(0, start) + '    ' + codeEditor.value.substring(end);
        codeEditor.selectionStart = codeEditor.selectionEnd = start + 4;
    }
});

function setEditorStatus(type, message) {
    if (!editorStatus) return;
    
    editorStatus.className = `status-${type}`;
    const icons = {
        saved: 'fas fa-check-circle',
        saving: 'fas fa-spinner fa-pulse',
        syncing: 'fas fa-sync-alt fa-spin',
        error: 'fas fa-exclamation-circle'
    };
    editorStatus.innerHTML = `<i class="${icons[type] || 'fas fa-circle'}"></i> ${message}`;
}

// =============================================
// RUN PROJECT (works even with expired token - runs locally)
// =============================================

runProjectBtn?.addEventListener('click', () => {
    if (!currentProject?.files) return;
    
    saveCurrentFile();
    
    gameChannel.postMessage({ type: 'close_game' });
    if (runningGameWindow && !runningGameWindow.closed) {
        runningGameWindow.close();
    }
    
    let html = currentProject.files['index.html'] || '<!DOCTYPE html><html><head></head><body></body></html>';
    let css = '';
    let js = '';
    
    Object.entries(currentProject.files).forEach(([filename, content]) => {
        if (filename.endsWith('.css')) {
            css += `/* ${filename} */\n${content}\n\n`;
        } else if (filename.endsWith('.js')) {
            js += `// ${filename}\n${content}\n\n`;
        }
    });
    
    html = html.replace(/<link[^>]*href=["'][^"']*\.css["'][^>]*>/gi, '');
    html = html.replace(/<script[^>]*src=["'][^"']*\.js["'][^>]*><\/script>/gi, '');
    
    const finalHtml = html
        .replace('</head>', `<style>${css}</style></head>`)
        .replace('</body>', `<script>${js}<\/script></body>`);
    
    runningGameWindow = window.open('', '_blank', 'width=1024,height=768');
    
    if (runningGameWindow) {
        runningGameWindow.document.open();
        runningGameWindow.document.write(finalHtml);
        runningGameWindow.document.close();
        showToast('Game running!', 'success');
    } else {
        showToast('Allow popups to run games', 'error');
    }
});

gameChannel.addEventListener('message', (e) => {
    if (e.data.type === 'close_game' && runningGameWindow && !runningGameWindow.closed) {
        runningGameWindow.close();
        runningGameWindow = null;
    }
});

// =============================================
// SHARE PROJECT
// =============================================

shareProjectBtn?.addEventListener('click', () => {
    if (!currentProject) return;
    
    document.getElementById('shareUrl').value = currentProject.gistUrl;
    document.getElementById('openGistBtn').href = currentProject.gistUrl;
    shareModal.classList.add('active');
});

document.getElementById('copyUrlBtn')?.addEventListener('click', () => {
    const input = document.getElementById('shareUrl');
    input.select();
    document.execCommand('copy');
    showToast('URL copied!', 'success');
});

// =============================================
// DOWNLOAD PROJECT (works even with expired token)
// =============================================

downloadProjectBtn?.addEventListener('click', async () => {
    if (!currentProject?.files) return;
    
    saveCurrentFile();
    
    const zip = new JSZip();
    Object.entries(currentProject.files).forEach(([filename, content]) => {
        zip.file(filename, content);
    });
    
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentProject.name}.zip`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('Downloaded!', 'success');
});

// =============================================
// ARCHIVE & DELETE
// =============================================

archiveProjectBtn?.addEventListener('click', async () => {
    if (!currentProject) return;
    if (!checkTokenBeforeAction()) return;
    
    currentProject.archived = true;
    await saveProjectToGithub(currentProject);
    showNoProjectSelected();
    currentProject = null;
    currentFile = null;
    renderProjectList();
    renderArchivedList();
    showToast('Project archived', 'success');
});

deleteProjectBtn?.addEventListener('click', async () => {
    if (!currentProject) return;
    if (!checkTokenBeforeAction()) return;
    
    if (confirm(`Delete "${currentProject.name}" from GitHub? This cannot be undone.`)) {
        const projectId = currentProject.id;
        showNoProjectSelected();
        currentProject = null;
        currentFile = null;
        await deleteProjectFromGithub(projectId);
        renderProjectList();
        renderArchivedList();
    }
});

// =============================================
// RENAME PROJECT
// =============================================

editProjectNameBtn?.addEventListener('click', () => {
    if (!checkTokenBeforeAction()) return;
    
    projectName.contentEditable = 'true';
    projectName.focus();
    document.execCommand('selectAll', false, null);
});

projectName?.addEventListener('blur', async () => {
    projectName.contentEditable = 'false';
    const newName = projectName.textContent.trim();
    
    if (newName && newName !== currentProject.name) {
        if (!checkTokenBeforeAction()) {
            projectName.textContent = currentProject.name;
            return;
        }
        
        currentProject.name = newName;
        await saveProjectToGithub(currentProject);
        renderProjectList();
        renderArchivedList();
        showToast('Renamed', 'success');
    } else {
        projectName.textContent = currentProject.name;
    }
});

projectName?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        projectName.blur();
    }
});

// =============================================
// NEW PROJECT
// =============================================

newProjectBtn?.addEventListener('click', () => {
    if (!checkTokenBeforeAction()) return;
    
    document.getElementById('newProjectName').value = '';
    document.getElementById('newProjectDesc').value = '';
    document.getElementById('makePublic').checked = false;
    document.querySelector('input[name="template"][value="blank"]').checked = true;
    newProjectModal.classList.add('active');
    document.getElementById('newProjectName').focus();
});

document.getElementById('createProjectBtn')?.addEventListener('click', async () => {
    if (!checkTokenBeforeAction()) return;
    
    const name = document.getElementById('newProjectName').value.trim();
    const description = document.getElementById('newProjectDesc').value.trim();
    const template = document.querySelector('input[name="template"]:checked').value;
    const isPublic = document.getElementById('makePublic').checked;
    
    if (!name) {
        showToast('Enter project name', 'error');
        return;
    }
    
    const project = {
        name,
        description,
        files: JSON.parse(JSON.stringify(templates[template].files)),
        archived: false,
        isPublic
    };
    
    try {
        const btn = document.getElementById('createProjectBtn');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Creating...';
        
        await saveProjectToGithub(project, true);
        
        closeAllModals();
        renderProjectList();
        selectProject(project.id);
        showToast('Project created!', 'success');
        
        btn.disabled = false;
        btn.innerHTML = '<i class="fab fa-github"></i> Create on GitHub';
    } catch (error) {
        const btn = document.getElementById('createProjectBtn');
        btn.disabled = false;
        btn.innerHTML = '<i class="fab fa-github"></i> Create on GitHub';
    }
});

// =============================================
// FILE OPERATIONS
// =============================================

addFileBtn?.addEventListener('click', () => {
    if (!checkTokenBeforeAction()) return;
    
    document.getElementById('newFileName').value = '';
    document.getElementById('newFileType').value = 'js';
    newFileModal.classList.add('active');
    document.getElementById('newFileName').focus();
});

document.getElementById('createFileBtn')?.addEventListener('click', async () => {
    if (!checkTokenBeforeAction()) return;
    
    const name = document.getElementById('newFileName').value.trim();
    const type = document.getElementById('newFileType').value;
    
    if (!name || !/^[a-zA-Z0-9_-]+$/.test(name)) {
        showToast('Invalid file name', 'error');
        return;
    }
    
    const filename = `${name}.${type}`;
    
    if (currentProject.files[filename]) {
        showToast('File already exists', 'error');
        return;
    }
    
    currentProject.files[filename] = '';
    await saveProjectToGithub(currentProject);
    closeAllModals();
    renderFileTabs();
    selectFile(filename);
    showToast('File added', 'success');
});

let contextMenuFile = null;

function showFileContextMenu(e, filename) {
    contextMenuFile = filename;
    fileContextMenu.style.left = e.pageX + 'px';
    fileContextMenu.style.top = e.pageY + 'px';
    fileContextMenu.classList.add('active');
}

document.addEventListener('click', () => fileContextMenu?.classList.remove('active'));

fileContextMenu?.querySelectorAll('.context-menu-item').forEach(item => {
    item.addEventListener('click', async () => {
        const action = item.dataset.action;
        
        if (action === 'rename') {
            if (!checkTokenBeforeAction()) return;
            
            const baseName = contextMenuFile.split('.').slice(0, -1).join('.');
            document.getElementById('renameFileName').value = baseName;
            renameFileModal.classList.add('active');
            document.getElementById('renameFileName').focus();
        } else if (action === 'delete') {
            if (!checkTokenBeforeAction()) return;
            
            if (Object.keys(currentProject.files).length <= 1) {
                showToast('Cannot delete last file', 'error');
                return;
            }
            
            if (confirm('Delete this file?')) {
                delete currentProject.files[contextMenuFile];
                await saveProjectToGithub(currentProject);
                
                if (currentFile === contextMenuFile) {
                    currentFile = Object.keys(currentProject.files)[0];
                }
                
                renderFileTabs();
                if (currentFile) selectFile(currentFile);
                showToast('File deleted', 'success');
            }
        }
    });
});

document.getElementById('confirmRenameFileBtn')?.addEventListener('click', async () => {
    if (!checkTokenBeforeAction()) return;
    
    const newBaseName = document.getElementById('renameFileName').value.trim();
    
    if (!newBaseName || !/^[a-zA-Z0-9_-]+$/.test(newBaseName)) {
        showToast('Invalid name', 'error');
        return;
    }
    
    const ext = contextMenuFile.split('.').pop();
    const newFilename = `${newBaseName}.${ext}`;
    
    if (currentProject.files[newFilename] && newFilename !== contextMenuFile) {
        showToast('File already exists', 'error');
        return;
    }
    
    const content = currentProject.files[contextMenuFile];
    delete currentProject.files[contextMenuFile];
    currentProject.files[newFilename] = content;
    
    if (currentFile === contextMenuFile) {
        currentFile = newFilename;
    }
    
    await saveProjectToGithub(currentProject);
    closeAllModals();
    renderFileTabs();
    selectFile(currentFile);
    showToast('File renamed', 'success');
});

// =============================================
// MODALS
// =============================================

document.querySelectorAll('.modal-close, .modal-cancel').forEach(btn => {
    btn.addEventListener('click', closeAllModals);
});

document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeAllModals();
    });
});

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
}

document.getElementById('newProjectName')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('createProjectBtn').click();
});

document.getElementById('newFileName')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('createFileBtn').click();
});

document.getElementById('renameFileName')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('confirmRenameFileBtn').click();
});

document.getElementById('newTokenInput')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('saveNewTokenBtn').click();
});

// =============================================
// SIDEBAR TABS
// =============================================

document.querySelectorAll('.sidebar-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const view = tab.dataset.view;
        
        document.querySelectorAll('.sidebar-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        document.querySelectorAll('.sidebar-view').forEach(v => v.classList.remove('active'));
        document.getElementById(`${view}View`)?.classList.add('active');
    });
});

// =============================================
// UTILITIES
// =============================================

function showToast(message, type = 'info') {
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        info: 'fas fa-info-circle'
    };
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="toast-icon ${icons[type]}"></i>
        <span class="toast-message">${escapeHtml(message)}</span>
    `;
    
    document.getElementById('toastContainer')?.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

window.addEventListener('beforeunload', () => {
    saveCurrentFile();
    if (runningGameWindow && !runningGameWindow.closed) {
        runningGameWindow.close();
    }
});

// =============================================
// INITIALIZE
// =============================================

document.addEventListener('DOMContentLoaded', init);

console.log('📝 Game Editor loaded - Account Switching & Token Expiry');
