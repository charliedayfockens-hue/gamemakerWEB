// =============================================
// WebGL Game Editor - GitHub Personal Access Token Version
// NO OAUTH - NO CONFIG FILE - JUST WORKS!
// =============================================

const gameChannel = new BroadcastChannel('webgl_game_editor_channel');
let runningGameWindow = null;
let currentUser = null;
let currentProject = null;
let currentFile = null;
let projects = {};
let saveTimeout = null;
let accessToken = null;

// DOM Elements
const loadingScreen = document.getElementById('loadingScreen');
const loginScreen = document.getElementById('loginScreen');
const mainApp = document.getElementById('mainApp');
const connectBtn = document.getElementById('connectBtn');
const tokenInput = document.getElementById('tokenInput');
const loginError = document.getElementById('loginError');
const signOutBtn = document.getElementById('signOutBtn');
const syncBtn = document.getElementById('syncBtn');
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

// Buttons
const newProjectBtn = document.getElementById('newProjectBtn');
const addFileBtn = document.getElementById('addFileBtn');
const shareProjectBtn = document.getElementById('shareProjectBtn');
const downloadProjectBtn = document.getElementById('downloadProjectBtn');
const archiveProjectBtn = document.getElementById('archiveProjectBtn');
const deleteProjectBtn = document.getElementById('deleteProjectBtn');
const runProjectBtn = document.getElementById('runProjectBtn');
const editProjectNameBtn = document.getElementById('editProjectNameBtn');

// Modals
const newProjectModal = document.getElementById('newProjectModal');
const shareModal = document.getElementById('shareModal');
const newFileModal = document.getElementById('newFileModal');
const renameFileModal = document.getElementById('renameFileModal');
const fileContextMenu = document.getElementById('fileContextMenu');

// =============================================
// TEMPLATES
// =============================================

const templates = {
    blank: {
        files: {
            'index.html': '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>My Game</title>\n    <link rel="stylesheet" href="style.css">\n</head>\n<body>\n    <h1>Hello World!</h1>\n    <script src="script.js"></script>\n</body>\n</html>',
            'style.css': '/* Your styles here */\nbody {\n    margin: 0;\n    padding: 20px;\n    font-family: Arial, sans-serif;\n    background: #1a1a2e;\n    color: white;\n}',
            'script.js': '// Your JavaScript code here\nconsole.log("Hello from JavaScript!");'
        }
    },
    webgl: {
        files: {
            'index.html': '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>WebGL Game</title>\n    <link rel="stylesheet" href="style.css">\n</head>\n<body>\n    <canvas id="glCanvas"></canvas>\n    <script src="main.js"></script>\n</body>\n</html>',
            'style.css': '* {\n    margin: 0;\n    padding: 0;\n    box-sizing: border-box;\n}\n\nbody {\n    overflow: hidden;\n    background: #000;\n}\n\n#glCanvas {\n    display: block;\n    width: 100vw;\n    height: 100vh;\n}',
            'main.js': '// WebGL Setup\nconst canvas = document.getElementById("glCanvas");\nconst gl = canvas.getContext("webgl");\n\nif (!gl) {\n    alert("WebGL not supported!");\n}\n\ncanvas.width = window.innerWidth;\ncanvas.height = window.innerHeight;\ngl.viewport(0, 0, canvas.width, canvas.height);\n\ngl.clearColor(0.1, 0.2, 0.3, 1.0);\ngl.clear(gl.COLOR_BUFFER_BIT);\n\nconsole.log("WebGL ready!");'
        }
    },
    canvas: {
        files: {
            'index.html': '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Canvas Game</title>\n    <link rel="stylesheet" href="style.css">\n</head>\n<body>\n    <canvas id="gameCanvas"></canvas>\n    <script src="game.js"></script>\n</body>\n</html>',
            'style.css': '* {\n    margin: 0;\n    padding: 0;\n}\n\nbody {\n    overflow: hidden;\n    background: #1a1a2e;\n}\n\n#gameCanvas {\n    display: block;\n}',
            'game.js': 'const canvas = document.getElementById("gameCanvas");\nconst ctx = canvas.getContext("2d");\n\ncanvas.width = window.innerWidth;\ncanvas.height = window.innerHeight;\n\nconst player = {\n    x: canvas.width / 2,\n    y: canvas.height / 2,\n    size: 30,\n    speed: 5,\n    color: "#00ff88"\n};\n\nconst keys = {};\ndocument.addEventListener("keydown", e => keys[e.key] = true);\ndocument.addEventListener("keyup", e => keys[e.key] = false);\n\nfunction update() {\n    if (keys["ArrowUp"] || keys["w"]) player.y -= player.speed;\n    if (keys["ArrowDown"] || keys["s"]) player.y += player.speed;\n    if (keys["ArrowLeft"] || keys["a"]) player.x -= player.speed;\n    if (keys["ArrowRight"] || keys["d"]) player.x += player.speed;\n}\n\nfunction draw() {\n    ctx.fillStyle = "#1a1a2e";\n    ctx.fillRect(0, 0, canvas.width, canvas.height);\n    \n    ctx.beginPath();\n    ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);\n    ctx.fillStyle = player.color;\n    ctx.fill();\n    \n    ctx.fillStyle = "#fff";\n    ctx.font = "18px Arial";\n    ctx.fillText("Use WASD or Arrow Keys", 20, 30);\n}\n\nfunction gameLoop() {\n    update();\n    draw();\n    requestAnimationFrame(gameLoop);\n}\n\ngameLoop();'
        }
    }
};

// =============================================
// INITIALIZATION
// =============================================

async function init() {
    console.log('🚀 Initializing Game Editor...');
    
    // Check for stored token
    accessToken = localStorage.getItem('github_token');
    
    if (accessToken) {
        console.log('🔑 Found stored token, validating...');
        try {
            await loadUserData();
        } catch (error) {
            console.error('Token invalid:', error);
            localStorage.removeItem('github_token');
            accessToken = null;
            showLoginScreen();
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
}

function showMainApp() {
    loadingScreen.classList.add('hidden');
    loginScreen.classList.add('hidden');
    mainApp.classList.remove('hidden');
}

// Timeout fallback
setTimeout(() => {
    if (loadingScreen && !loadingScreen.classList.contains('hidden')) {
        showLoginScreen();
    }
}, 5000);

// =============================================
// AUTHENTICATION
// =============================================

connectBtn.addEventListener('click', async () => {
    const token = tokenInput.value.trim();
    
    if (!token) {
        loginError.textContent = 'Please enter your GitHub token';
        return;
    }
    
    if (!token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
        loginError.textContent = 'Invalid token format. Token should start with ghp_ or github_pat_';
        return;
    }
    
    connectBtn.disabled = true;
    connectBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting...';
    loginError.textContent = '';
    
    try {
        accessToken = token;
        await loadUserData();
        
        // Save token
        localStorage.setItem('github_token', token);
        tokenInput.value = '';
        
    } catch (error) {
        console.error('Login error:', error);
        loginError.textContent = 'Invalid token. Please check and try again.';
        accessToken = null;
        
        connectBtn.disabled = false;
        connectBtn.innerHTML = '<i class="fab fa-github"></i> Connect to GitHub';
    }
});

tokenInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        connectBtn.click();
    }
});

async function loadUserData() {
    const response = await githubRequest('/user');
    currentUser = response;
    
    userAvatar.src = currentUser.avatar_url;
    userName.textContent = currentUser.login;
    
    showMainApp();
    await loadProjects();
    
    console.log('✅ Logged in as:', currentUser.login);
}

signOutBtn.addEventListener('click', () => {
    if (confirm('Sign out?')) {
        localStorage.removeItem('github_token');
        accessToken = null;
        currentUser = null;
        projects = {};
        currentProject = null;
        currentFile = null;
        showLoginScreen();
        showToast('Signed out', 'info');
    }
});

// =============================================
// GITHUB API
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
    try {
        setEditorStatus('syncing', 'Syncing...');
        
        const gists = await githubRequest('/gists');
        projects = {};
        
        for (const gist of gists) {
            if (gist.description && gist.description.startsWith('[GameEditor]')) {
                const projectData = parseGistToProject(gist);
                projects[gist.id] = projectData;
            }
        }
        
        renderProjectList();
        renderArchivedList();
        setEditorStatus('saved', 'Synced');
        
        console.log(`✅ Loaded ${Object.keys(projects).length} projects`);
    } catch (error) {
        console.error('Load projects error:', error);
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
        setEditorStatus('error', 'Save failed');
        showToast('Failed to save', 'error');
        throw error;
    }
}

async function deleteProjectFromGithub(projectId) {
    try {
        await githubRequest(`/gists/${projectId}`, { method: 'DELETE' });
        delete projects[projectId];
        showToast('Project deleted', 'success');
    } catch (error) {
        console.error('Delete error:', error);
        showToast('Failed to delete', 'error');
    }
}

// Sync button
syncBtn?.addEventListener('click', async () => {
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

codeEditor.addEventListener('input', () => {
    if (currentProject && currentFile) {
        currentProject.files[currentFile] = codeEditor.value;
        
        clearTimeout(saveTimeout);
        setEditorStatus('saving', 'Saving...');
        saveTimeout = setTimeout(async () => {
            try {
                await saveProjectToGithub(currentProject);
            } catch (error) {
                console.error('Auto-save failed:', error);
            }
        }, 2000);
    }
});

codeEditor.addEventListener('keydown', (e) => {
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
// RUN PROJECT
// =============================================

runProjectBtn.addEventListener('click', () => {
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
// DOWNLOAD PROJECT
// =============================================

downloadProjectBtn.addEventListener('click', async () => {
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

archiveProjectBtn.addEventListener('click', async () => {
    if (!currentProject) return;
    
    currentProject.archived = true;
    await saveProjectToGithub(currentProject);
    showNoProjectSelected();
    currentProject = null;
    currentFile = null;
    renderProjectList();
    renderArchivedList();
    showToast('Project archived', 'success');
});

deleteProjectBtn.addEventListener('click', async () => {
    if (!currentProject) return;
    
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

editProjectNameBtn.addEventListener('click', () => {
    projectName.contentEditable = 'true';
    projectName.focus();
    document.execCommand('selectAll', false, null);
});

projectName.addEventListener('blur', async () => {
    projectName.contentEditable = 'false';
    const newName = projectName.textContent.trim();
    
    if (newName && newName !== currentProject.name) {
        currentProject.name = newName;
        await saveProjectToGithub(currentProject);
        renderProjectList();
        renderArchivedList();
        showToast('Renamed', 'success');
    } else {
        projectName.textContent = currentProject.name;
    }
});

projectName.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        projectName.blur();
    }
});

// =============================================
// NEW PROJECT
// =============================================

newProjectBtn.addEventListener('click', () => {
    document.getElementById('newProjectName').value = '';
    document.getElementById('newProjectDesc').value = '';
    document.getElementById('makePublic').checked = false;
    document.querySelector('input[name="template"][value="blank"]').checked = true;
    newProjectModal.classList.add('active');
    document.getElementById('newProjectName').focus();
});

document.getElementById('createProjectBtn').addEventListener('click', async () => {
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

addFileBtn.addEventListener('click', () => {
    document.getElementById('newFileName').value = '';
    document.getElementById('newFileType').value = 'js';
    newFileModal.classList.add('active');
    document.getElementById('newFileName').focus();
});

document.getElementById('createFileBtn').addEventListener('click', async () => {
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

document.addEventListener('click', () => fileContextMenu.classList.remove('active'));

fileContextMenu.querySelectorAll('.context-menu-item').forEach(item => {
    item.addEventListener('click', async () => {
        const action = item.dataset.action;
        
        if (action === 'rename') {
            const baseName = contextMenuFile.split('.').slice(0, -1).join('.');
            document.getElementById('renameFileName').value = baseName;
            renameFileModal.classList.add('active');
            document.getElementById('renameFileName').focus();
        } else if (action === 'delete') {
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

document.getElementById('confirmRenameFileBtn').addEventListener('click', async () => {
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

console.log('📝 Game Editor loaded - Personal Access Token version');
