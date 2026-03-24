// =============================================
// WebGL Game Editor - Main Application
// =============================================

// Broadcast Channel for cross-tab communication
const gameChannel = new BroadcastChannel('webgl_game_editor_channel');
let runningGameWindow = null;
let currentUser = null;
let currentProject = null;
let currentFile = null;
let projects = {};
let saveTimeout = null;

// DOM Elements
const loadingScreen = document.getElementById('loadingScreen');
const loginScreen = document.getElementById('loginScreen');
const mainApp = document.getElementById('mainApp');
const signOutBtn = document.getElementById('signOutBtn');
const userName = document.getElementById('userName');
const projectList = document.getElementById('projectList');
const archivedList = document.getElementById('archivedList');
const projectEditor = document.getElementById('projectEditor');
const noProjectSelected = document.getElementById('noProjectSelected');
const projectName = document.getElementById('projectName');
const fileTabs = document.getElementById('fileTabs');
const codeEditor = document.getElementById('codeEditor');
const authError = document.getElementById('authError');
const authSuccess = document.getElementById('authSuccess');

// Auth Forms
const signinForm = document.getElementById('signinForm');
const signupForm = document.getElementById('signupForm');

// Buttons
const newProjectBtn = document.getElementById('newProjectBtn');
const addFileBtn = document.getElementById('addFileBtn');
const downloadProjectBtn = document.getElementById('downloadProjectBtn');
const archiveProjectBtn = document.getElementById('archiveProjectBtn');
const deleteProjectBtn = document.getElementById('deleteProjectBtn');
const runProjectBtn = document.getElementById('runProjectBtn');
const editProjectNameBtn = document.getElementById('editProjectNameBtn');

// Modals
const newProjectModal = document.getElementById('newProjectModal');
const newFileModal = document.getElementById('newFileModal');
const renameFileModal = document.getElementById('renameFileModal');
const fileContextMenu = document.getElementById('fileContextMenu');

// =============================================
// TEMPLATES
// =============================================

const templates = {
    blank: {
        files: [
            { name: 'index', type: 'html', content: '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>My Game</title>\n</head>\n<body>\n    <h1>Hello World!</h1>\n</body>\n</html>' },
            { name: 'style', type: 'css', content: '/* Your styles here */\nbody {\n    margin: 0;\n    padding: 20px;\n    font-family: Arial, sans-serif;\n    background: #1a1a2e;\n    color: white;\n}' },
            { name: 'script', type: 'js', content: '// Your JavaScript code here\nconsole.log("Hello from JavaScript!");' }
        ]
    },
    webgl: {
        files: [
            { name: 'index', type: 'html', content: '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>WebGL Game</title>\n</head>\n<body>\n    <canvas id="glCanvas"></canvas>\n</body>\n</html>' },
            { name: 'style', type: 'css', content: '* {\n    margin: 0;\n    padding: 0;\n    box-sizing: border-box;\n}\n\nbody {\n    overflow: hidden;\n    background: #000;\n}\n\n#glCanvas {\n    display: block;\n    width: 100vw;\n    height: 100vh;\n}' },
            { name: 'main', type: 'js', content: `// WebGL Game Setup
const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

if (!gl) {
    alert('WebGL not supported!');
    throw new Error('WebGL not supported');
}

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
gl.viewport(0, 0, canvas.width, canvas.height);

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
});

// Clear to a nice color
gl.clearColor(0.1, 0.2, 0.3, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT);

console.log('WebGL initialized! Canvas size:', canvas.width, 'x', canvas.height);` }
        ]
    },
    canvas: {
        files: [
            { name: 'index', type: 'html', content: '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Canvas Game</title>\n</head>\n<body>\n    <canvas id="gameCanvas"></canvas>\n</body>\n</html>' },
            { name: 'style', type: 'css', content: '* {\n    margin: 0;\n    padding: 0;\n    box-sizing: border-box;\n}\n\nbody {\n    overflow: hidden;\n    background: #1a1a2e;\n}\n\n#gameCanvas {\n    display: block;\n}' },
            { name: 'game', type: 'js', content: `// Canvas 2D Game
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// Player
const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: 30,
    speed: 5,
    color: '#00ff88'
};

const keys = {};
document.addEventListener('keydown', e => keys[e.key] = true);
document.addEventListener('keyup', e => keys[e.key] = false);

function update() {
    if (keys['ArrowUp'] || keys['w']) player.y -= player.speed;
    if (keys['ArrowDown'] || keys['s']) player.y += player.speed;
    if (keys['ArrowLeft'] || keys['a']) player.x -= player.speed;
    if (keys['ArrowRight'] || keys['d']) player.x += player.speed;
    
    player.x = Math.max(player.size, Math.min(canvas.width - player.size, player.x));
    player.y = Math.max(player.size, Math.min(canvas.height - player.size, player.y));
}

function draw() {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
    ctx.fillStyle = player.color;
    ctx.fill();
    
    ctx.fillStyle = '#fff';
    ctx.font = '18px Arial';
    ctx.fillText('Use WASD or Arrow Keys to move', 20, 30);
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();` }
        ]
    }
};

// =============================================
// INITIALIZATION
// =============================================

async function init() {
    console.log('🚀 Starting Game Editor...');
    
    // Check if Supabase is configured
    if (!supabaseConfigured || !supabase) {
        console.warn('⚠️ Supabase not configured');
        loadingScreen.classList.add('hidden');
        loginScreen.classList.remove('hidden');
        authError.textContent = '⚠️ Please configure Supabase in supabase-config.js (see console for help)';
        
        // Disable auth forms
        signinForm.querySelector('button').disabled = true;
        signupForm.querySelector('button').disabled = true;
        return;
    }
    
    try {
        // Check for existing session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (session && session.user) {
            console.log('✅ Found existing session');
            await handleSignIn(session.user);
        } else {
            console.log('ℹ️ No session found, showing login');
            showLoginScreen();
        }
        
        // Listen for auth changes
        supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth event:', event);
            
            if (event === 'SIGNED_IN' && session?.user) {
                await handleSignIn(session.user);
            } else if (event === 'SIGNED_OUT') {
                showLoginScreen();
            }
        });
        
    } catch (error) {
        console.error('Init error:', error);
        showLoginScreen();
    }
}

async function handleSignIn(user) {
    currentUser = user;
    loadingScreen.classList.add('hidden');
    loginScreen.classList.add('hidden');
    mainApp.classList.remove('hidden');
    
    userName.textContent = user.email;
    
    await loadProjects();
}

function showLoginScreen() {
    loadingScreen.classList.add('hidden');
    loginScreen.classList.remove('hidden');
    mainApp.classList.add('hidden');
    currentUser = null;
    projects = {};
    currentProject = null;
    currentFile = null;
    authError.textContent = '';
    authSuccess.textContent = '';
}

// Start the app
document.addEventListener('DOMContentLoaded', init);

// Fallback if still loading after 5 seconds
setTimeout(() => {
    if (!loadingScreen.classList.contains('hidden')) {
        showLoginScreen();
    }
}, 5000);

// =============================================
// AUTH TABS
// =============================================

document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        document.getElementById(`${tabName}Form`).classList.add('active');
        
        authError.textContent = '';
        authSuccess.textContent = '';
    });
});

// =============================================
// SIGN IN
// =============================================

signinForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!supabaseConfigured) {
        authError.textContent = 'Supabase not configured';
        return;
    }
    
    const email = document.getElementById('signinEmail').value.trim();
    const password = document.getElementById('signinPassword').value;
    
    const btn = signinForm.querySelector('button');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
    authError.textContent = '';
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) throw error;
        
        // Success - onAuthStateChange will handle the rest
        
    } catch (error) {
        console.error('Sign in error:', error);
        authError.textContent = error.message || 'Sign in failed';
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
    }
});

// =============================================
// SIGN UP
// =============================================

signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!supabaseConfigured) {
        authError.textContent = 'Supabase not configured';
        return;
    }
    
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirm = document.getElementById('signupConfirm').value;
    
    if (password !== confirm) {
        authError.textContent = 'Passwords do not match';
        return;
    }
    
    if (password.length < 6) {
        authError.textContent = 'Password must be at least 6 characters';
        return;
    }
    
    const btn = signupForm.querySelector('button');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
    authError.textContent = '';
    
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password
        });
        
        if (error) throw error;
        
        // Check if email confirmation is required
        if (data.user && !data.session) {
            authSuccess.textContent = '✓ Account created! Check your email to confirm.';
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
        }
        // If session exists, user is signed in (email confirmation disabled)
        
    } catch (error) {
        console.error('Sign up error:', error);
        authError.textContent = error.message || 'Sign up failed';
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
    }
});

// =============================================
// SIGN OUT
// =============================================

signOutBtn.addEventListener('click', async () => {
    try {
        await supabase.auth.signOut();
        showLoginScreen();
        showToast('Signed out', 'info');
    } catch (error) {
        console.error('Sign out error:', error);
        showToast('Sign out failed', 'error');
    }
});

// =============================================
// PROJECT MANAGEMENT
// =============================================

async function loadProjects() {
    try {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        projects = {};
        (data || []).forEach(project => {
            projects[project.id] = project;
        });
        
        renderProjectList();
        renderArchivedList();
        console.log(`✅ Loaded ${Object.keys(projects).length} projects`);
        
    } catch (error) {
        console.error('Load projects error:', error);
        showToast('Failed to load projects', 'error');
    }
}

async function saveProject(project) {
    if (!currentUser) return;
    
    try {
        const { error } = await supabase
            .from('projects')
            .upsert({
                id: project.id,
                user_id: currentUser.id,
                name: project.name,
                files: project.files,
                archived: project.archived || false,
                updated_at: new Date().toISOString()
            });
        
        if (error) throw error;
        
    } catch (error) {
        console.error('Save error:', error);
        showToast('Failed to save', 'error');
    }
}

async function deleteProject(projectId) {
    try {
        const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', projectId);
        
        if (error) throw error;
        
        delete projects[projectId];
        
        if (currentProject?.id === projectId) {
            currentProject = null;
            currentFile = null;
            showNoProjectSelected();
        }
        
        renderProjectList();
        renderArchivedList();
        showToast('Project deleted', 'success');
        
    } catch (error) {
        console.error('Delete error:', error);
        showToast('Failed to delete', 'error');
    }
}

function renderProjectList() {
    const active = Object.values(projects).filter(p => !p.archived);
    
    projectList.innerHTML = active.length === 0 
        ? '<p class="no-items">No projects yet</p>' 
        : '';
    
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
    
    archivedList.innerHTML = archived.length === 0 
        ? '<p class="no-items">No archived projects</p>' 
        : '';
    
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
    currentProject = projects[projectId];
    currentFile = null;
    
    if (currentProject) {
        noProjectSelected.classList.add('hidden');
        projectEditor.classList.remove('hidden');
        projectName.textContent = currentProject.name;
        renderFileTabs();
        
        if (currentProject.files?.length > 0) {
            selectFile(0);
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
}

// Global function for restore button
window.restoreProject = async function(projectId) {
    const project = projects[projectId];
    if (!project) return;
    
    project.archived = false;
    await saveProject(project);
    renderProjectList();
    renderArchivedList();
    showToast('Project restored', 'success');
};

// =============================================
// FILE MANAGEMENT
// =============================================

function renderFileTabs() {
    fileTabs.innerHTML = '';
    
    if (!currentProject?.files) return;
    
    currentProject.files.forEach((file, index) => {
        const tab = document.createElement('div');
        tab.className = `file-tab ${currentFile === index ? 'active' : ''}`;
        tab.innerHTML = `
            <i class="file-tab-icon ${file.type} ${getFileIcon(file.type)}"></i>
            <span>${escapeHtml(file.name)}.${file.type}</span>
        `;
        tab.addEventListener('click', () => selectFile(index));
        tab.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            showFileContextMenu(e, index);
        });
        fileTabs.appendChild(tab);
    });
}

function getFileIcon(type) {
    const icons = { html: 'fab fa-html5', css: 'fab fa-css3-alt', js: 'fab fa-js-square' };
    return icons[type] || 'fas fa-file';
}

function selectFile(index) {
    if (!currentProject?.files?.[index]) return;
    
    // Save current file
    if (currentFile !== null && currentProject.files[currentFile]) {
        currentProject.files[currentFile].content = codeEditor.value;
    }
    
    currentFile = index;
    codeEditor.value = currentProject.files[index].content;
    codeEditor.disabled = false;
    renderFileTabs();
}

function addFile(name, type, content = '') {
    if (!currentProject) return false;
    
    if (!currentProject.files) currentProject.files = [];
    
    if (currentProject.files.some(f => f.name === name && f.type === type)) {
        showToast('File already exists', 'error');
        return false;
    }
    
    const defaultContent = {
        html: '<!DOCTYPE html>\n<html>\n<head>\n    <title></title>\n</head>\n<body>\n    \n</body>\n</html>',
        css: '/* Styles */\n',
        js: '// JavaScript\n'
    };
    
    currentProject.files.push({ 
        name, 
        type, 
        content: content || defaultContent[type] || '' 
    });
    
    saveProject(currentProject);
    renderFileTabs();
    selectFile(currentProject.files.length - 1);
    showToast('File added', 'success');
    return true;
}

function renameFile(index, newName) {
    if (!currentProject?.files?.[index]) return false;
    
    const file = currentProject.files[index];
    if (currentProject.files.some((f, i) => i !== index && f.name === newName && f.type === file.type)) {
        showToast('File name exists', 'error');
        return false;
    }
    
    file.name = newName;
    saveProject(currentProject);
    renderFileTabs();
    showToast('File renamed', 'success');
    return true;
}

function deleteFile(index) {
    if (!currentProject?.files?.[index]) return;
    
    if (currentProject.files.length <= 1) {
        showToast('Cannot delete last file', 'error');
        return;
    }
    
    currentProject.files.splice(index, 1);
    saveProject(currentProject);
    
    if (currentFile >= currentProject.files.length) {
        currentFile = currentProject.files.length - 1;
    }
    
    renderFileTabs();
    selectFile(currentFile);
    showToast('File deleted', 'success');
}

// =============================================
// CODE EDITOR
// =============================================

codeEditor.addEventListener('input', () => {
    if (currentProject && currentFile !== null) {
        currentProject.files[currentFile].content = codeEditor.value;
        
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => saveProject(currentProject), 1000);
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

// =============================================
// RUN PROJECT
// =============================================

runProjectBtn.addEventListener('click', runProject);

function runProject() {
    if (!currentProject?.files) return;
    
    // Save current file
    if (currentFile !== null && currentProject.files[currentFile]) {
        currentProject.files[currentFile].content = codeEditor.value;
        saveProject(currentProject);
    }
    
    // Close other game windows
    gameChannel.postMessage({ type: 'close_game' });
    
    if (runningGameWindow && !runningGameWindow.closed) {
        runningGameWindow.close();
    }
    
    // Build HTML
    let html = '', css = '', js = '';
    
    const htmlFile = currentProject.files.find(f => f.type === 'html' && f.name === 'index') 
                  || currentProject.files.find(f => f.type === 'html');
    
    html = htmlFile?.content || '<!DOCTYPE html><html><head></head><body></body></html>';
    
    currentProject.files.filter(f => f.type === 'css').forEach(f => {
        css += `/* ${f.name}.css */\n${f.content}\n\n`;
    });
    
    currentProject.files.filter(f => f.type === 'js').forEach(f => {
        js += `// ${f.name}.js\n${f.content}\n\n`;
    });
    
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
}

gameChannel.addEventListener('message', (e) => {
    if (e.data.type === 'close_game' && runningGameWindow && !runningGameWindow.closed) {
        runningGameWindow.close();
        runningGameWindow = null;
    }
});

// =============================================
// DOWNLOAD PROJECT
// =============================================

downloadProjectBtn.addEventListener('click', async () => {
    if (!currentProject?.files) return;
    
    if (currentFile !== null && currentProject.files[currentFile]) {
        currentProject.files[currentFile].content = codeEditor.value;
    }
    
    const zip = new JSZip();
    currentProject.files.forEach(f => zip.file(`${f.name}.${f.type}`, f.content));
    
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
// ARCHIVE & DELETE PROJECT
// =============================================

archiveProjectBtn.addEventListener('click', () => {
    if (!currentProject) return;
    
    currentProject.archived = true;
    saveProject(currentProject);
    showNoProjectSelected();
    currentProject = null;
    currentFile = null;
    renderProjectList();
    renderArchivedList();
    showToast('Project archived', 'success');
});

deleteProjectBtn.addEventListener('click', () => {
    if (!currentProject) return;
    
    if (confirm(`Delete "${currentProject.name}"? This cannot be undone.`)) {
        deleteProject(currentProject.id);
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

projectName.addEventListener('blur', () => {
    projectName.contentEditable = 'false';
    const newName = projectName.textContent.trim();
    
    if (newName && newName !== currentProject.name) {
        currentProject.name = newName;
        saveProject(currentProject);
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
// MODALS
// =============================================

// New Project
newProjectBtn.addEventListener('click', () => {
    document.getElementById('newProjectName').value = '';
    document.querySelector('input[name="template"][value="blank"]').checked = true;
    newProjectModal.classList.add('active');
    document.getElementById('newProjectName').focus();
});

document.getElementById('createProjectBtn').addEventListener('click', async () => {
    const name = document.getElementById('newProjectName').value.trim();
    const template = document.querySelector('input[name="template"]:checked').value;
    
    if (!name) {
        showToast('Enter project name', 'error');
        return;
    }
    
    try {
        const { data, error } = await supabase
            .from('projects')
            .insert({
                user_id: currentUser.id,
                name,
                files: JSON.parse(JSON.stringify(templates[template].files)),
                archived: false
            })
            .select()
            .single();
        
        if (error) throw error;
        
        projects[data.id] = data;
        closeAllModals();
        renderProjectList();
        selectProject(data.id);
        showToast('Project created!', 'success');
        
    } catch (error) {
        console.error('Create error:', error);
        showToast('Failed to create project', 'error');
    }
});

// New File
addFileBtn.addEventListener('click', () => {
    document.getElementById('newFileName').value = '';
    document.getElementById('newFileType').value = 'js';
    newFileModal.classList.add('active');
    document.getElementById('newFileName').focus();
});

document.getElementById('createFileBtn').addEventListener('click', () => {
    const name = document.getElementById('newFileName').value.trim();
    const type = document.getElementById('newFileType').value;
    
    if (!name) {
        showToast('Enter file name', 'error');
        return;
    }
    
    if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
        showToast('Invalid file name', 'error');
        return;
    }
    
    if (addFile(name, type)) closeAllModals();
});

// File Context Menu
let contextMenuFileIndex = null;

function showFileContextMenu(e, index) {
    contextMenuFileIndex = index;
    fileContextMenu.style.left = e.pageX + 'px';
    fileContextMenu.style.top = e.pageY + 'px';
    fileContextMenu.classList.add('active');
}

document.addEventListener('click', () => fileContextMenu.classList.remove('active'));

fileContextMenu.querySelectorAll('.context-menu-item').forEach(item => {
    item.addEventListener('click', () => {
        const action = item.dataset.action;
        
        if (action === 'rename') {
            const file = currentProject.files[contextMenuFileIndex];
            document.getElementById('renameFileName').value = file.name;
            renameFileModal.classList.add('active');
            document.getElementById('renameFileName').focus();
        } else if (action === 'delete') {
            if (confirm('Delete this file?')) deleteFile(contextMenuFileIndex);
        }
    });
});

// Rename File
document.getElementById('confirmRenameFileBtn').addEventListener('click', () => {
    const newName = document.getElementById('renameFileName').value.trim();
    
    if (!newName || !/^[a-zA-Z0-9_-]+$/.test(newName)) {
        showToast('Invalid name', 'error');
        return;
    }
    
    if (renameFile(contextMenuFileIndex, newName)) closeAllModals();
});

// Close modals
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

// Enter key shortcuts
document.getElementById('newProjectName').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('createProjectBtn').click();
});

document.getElementById('newFileName').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('createFileBtn').click();
});

document.getElementById('renameFileName').addEventListener('keydown', (e) => {
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
        document.getElementById(`${view}View`).classList.add('active');
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
    
    document.getElementById('toastContainer').appendChild(toast);
    
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

// Cleanup on close
window.addEventListener('beforeunload', () => {
    if (currentProject && currentFile !== null && currentProject.files?.[currentFile]) {
        currentProject.files[currentFile].content = codeEditor.value;
        saveProject(currentProject);
    }
    
    if (runningGameWindow && !runningGameWindow.closed) {
        runningGameWindow.close();
    }
});
