// =============================================
// WebGL Game Editor - Main Application (Supabase)
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
const googleSignInBtn = document.getElementById('googleSignInBtn');
const signOutBtn = document.getElementById('signOutBtn');
const userAvatar = document.getElementById('userAvatar');
const userName = document.getElementById('userName');
const projectList = document.getElementById('projectList');
const archivedList = document.getElementById('archivedList');
const projectEditor = document.getElementById('projectEditor');
const noProjectSelected = document.getElementById('noProjectSelected');
const projectName = document.getElementById('projectName');
const fileTabs = document.getElementById('fileTabs');
const codeEditor = document.getElementById('codeEditor');

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
            { name: 'style', type: 'css', content: '/* Your styles here */\nbody {\n    margin: 0;\n    padding: 20px;\n    font-family: Arial, sans-serif;\n}' },
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

// Set canvas size
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Vertex shader
const vsSource = \`
    attribute vec4 aVertexPosition;
    attribute vec4 aVertexColor;
    varying lowp vec4 vColor;
    void main() {
        gl_Position = aVertexPosition;
        vColor = aVertexColor;
    }
\`;

// Fragment shader
const fsSource = \`
    varying lowp vec4 vColor;
    void main() {
        gl_FragColor = vColor;
    }
\`;

// Compile shader
function compileShader(gl, source, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

// Create program
const vertexShader = compileShader(gl, vsSource, gl.VERTEX_SHADER);
const fragmentShader = compileShader(gl, fsSource, gl.FRAGMENT_SHADER);

const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);

if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program));
}

gl.useProgram(program);

// Create triangle
const positions = new Float32Array([
    0.0,  0.5, 0.0,
   -0.5, -0.5, 0.0,
    0.5, -0.5, 0.0
]);

const colors = new Float32Array([
    1.0, 0.0, 0.0, 1.0,
    0.0, 1.0, 0.0, 1.0,
    0.0, 0.0, 1.0, 1.0
]);

// Position buffer
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

const positionLocation = gl.getAttribLocation(program, 'aVertexPosition');
gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

// Color buffer
const colorBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);

const colorLocation = gl.getAttribLocation(program, 'aVertexColor');
gl.enableVertexAttribArray(colorLocation);
gl.vertexAttribPointer(colorLocation, 4, gl.FLOAT, false, 0, 0);

// Animation
let rotation = 0;

function render() {
    rotation += 0.01;
    
    gl.clearColor(0.1, 0.1, 0.15, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    
    requestAnimationFrame(render);
}

render();
console.log('WebGL game running!');` }
        ]
    },
    canvas: {
        files: [
            { name: 'index', type: 'html', content: '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Canvas Game</title>\n</head>\n<body>\n    <canvas id="gameCanvas"></canvas>\n</body>\n</html>' },
            { name: 'style', type: 'css', content: '* {\n    margin: 0;\n    padding: 0;\n    box-sizing: border-box;\n}\n\nbody {\n    overflow: hidden;\n    background: #1a1a2e;\n}\n\n#gameCanvas {\n    display: block;\n}' },
            { name: 'game', type: 'js', content: `// Canvas 2D Game Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Game state
const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: 30,
    speed: 5,
    color: '#00ff88'
};

const keys = {};

// Input handling
document.addEventListener('keydown', (e) => keys[e.key] = true);
document.addEventListener('keyup', (e) => keys[e.key] = false);

// Game loop
function update() {
    // Movement
    if (keys['ArrowUp'] || keys['w']) player.y -= player.speed;
    if (keys['ArrowDown'] || keys['s']) player.y += player.speed;
    if (keys['ArrowLeft'] || keys['a']) player.x -= player.speed;
    if (keys['ArrowRight'] || keys['d']) player.x += player.speed;
    
    // Keep player in bounds
    player.x = Math.max(player.size, Math.min(canvas.width - player.size, player.x));
    player.y = Math.max(player.size, Math.min(canvas.height - player.size, player.y));
}

function draw() {
    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw player
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
    ctx.fillStyle = player.color;
    ctx.fill();
    ctx.closePath();
    
    // Draw instructions
    ctx.fillStyle = '#ffffff';
    ctx.font = '18px Arial';
    ctx.fillText('Use WASD or Arrow Keys to move', 20, 30);
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
console.log('Canvas game running!');` }
        ]
    }
};

// =============================================
// AUTHENTICATION
// =============================================

// Check auth state
supabase.auth.onAuthStateChange(async (event, session) => {
    loadingScreen.classList.add('hidden');
    
    if (session) {
        currentUser = session.user;
        loginScreen.classList.add('hidden');
        mainApp.classList.remove('hidden');
        
        userAvatar.src = session.user.user_metadata.avatar_url || 'https://via.placeholder.com/32';
        userName.textContent = session.user.user_metadata.full_name || session.user.email;
        
        await loadProjects();
    } else {
        currentUser = null;
        loginScreen.classList.remove('hidden');
        mainApp.classList.add('hidden');
    }
});

// Google Sign In
googleSignInBtn.addEventListener('click', async () => {
    try {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin
            }
        });
        
        if (error) throw error;
    } catch (error) {
        console.error('Sign in error:', error);
        showToast('Sign in failed: ' + error.message, 'error');
    }
});

// Sign Out
signOutBtn.addEventListener('click', async () => {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        projects = {};
        currentProject = null;
        currentFile = null;
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
        data.forEach(project => {
            projects[project.id] = project;
        });
        
        renderProjectList();
        renderArchivedList();
    } catch (error) {
        console.error('Load projects error:', error);
        showToast('Failed to load projects', 'error');
    }
}

async function saveProject(project) {
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
        console.error('Save project error:', error);
        showToast('Failed to save project', 'error');
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
        
        if (currentProject && currentProject.id === projectId) {
            currentProject = null;
            currentFile = null;
            showNoProjectSelected();
        }
        
        renderProjectList();
        renderArchivedList();
        showToast('Project deleted', 'success');
    } catch (error) {
        console.error('Delete project error:', error);
        showToast('Failed to delete project', 'error');
    }
}

function renderProjectList() {
    const activeProjects = Object.values(projects).filter(p => !p.archived);
    
    projectList.innerHTML = activeProjects.length === 0 
        ? '<p class="no-items">No projects yet</p>'
        : '';
    
    activeProjects.forEach(project => {
        const item = document.createElement('div');
        item.className = `project-item ${currentProject && currentProject.id === project.id ? 'active' : ''}`;
        item.innerHTML = `
            <i class="fas fa-folder"></i>
            <span class="project-item-name">${escapeHtml(project.name)}</span>
        `;
        item.addEventListener('click', () => selectProject(project.id));
        projectList.appendChild(item);
    });
}

function renderArchivedList() {
    const archivedProjects = Object.values(projects).filter(p => p.archived);
    
    archivedList.innerHTML = archivedProjects.length === 0 
        ? '<p class="no-items">No archived projects</p>'
        : '';
    
    archivedProjects.forEach(project => {
        const item = document.createElement('div');
        item.className = `project-item ${currentProject && currentProject.id === project.id ? 'active' : ''}`;
        item.innerHTML = `
            <i class="fas fa-archive"></i>
            <span class="project-item-name">${escapeHtml(project.name)}</span>
            <div class="project-item-actions">
                <button title="Restore" onclick="event.stopPropagation(); unarchiveProject('${project.id}')">
                    <i class="fas fa-box-open"></i>
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
        
        // Select first file
        if (currentProject.files && currentProject.files.length > 0) {
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

// =============================================
// FILE MANAGEMENT
// =============================================

function renderFileTabs() {
    fileTabs.innerHTML = '';
    
    if (!currentProject || !currentProject.files) return;
    
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
    switch(type) {
        case 'html': return 'fab fa-html5';
        case 'css': return 'fab fa-css3-alt';
        case 'js': return 'fab fa-js-square';
        default: return 'fas fa-file';
    }
}

function selectFile(index) {
    if (!currentProject || !currentProject.files[index]) return;
    
    // Save current file before switching
    if (currentFile !== null && currentProject.files[currentFile]) {
        currentProject.files[currentFile].content = codeEditor.value;
    }
    
    currentFile = index;
    codeEditor.value = currentProject.files[index].content;
    codeEditor.disabled = false;
    
    renderFileTabs();
}

function addFile(name, type, content = '') {
    if (!currentProject) return;
    
    if (!currentProject.files) {
        currentProject.files = [];
    }
    
    // Check for duplicate names
    const exists = currentProject.files.some(f => f.name === name && f.type === type);
    if (exists) {
        showToast('A file with this name already exists', 'error');
        return false;
    }
    
    currentProject.files.push({ name, type, content: content || getDefaultContent(type) });
    projects[currentProject.id] = currentProject;
    saveProject(currentProject);
    
    renderFileTabs();
    selectFile(currentProject.files.length - 1);
    showToast('File added', 'success');
    return true;
}

function getDefaultContent(type) {
    switch(type) {
        case 'html': return '<!DOCTYPE html>\n<html>\n<head>\n    <title></title>\n</head>\n<body>\n    \n</body>\n</html>';
        case 'css': return '/* Styles */\n';
        case 'js': return '// JavaScript\n';
        default: return '';
    }
}

function renameFile(index, newName) {
    if (!currentProject || !currentProject.files[index]) return;
    
    const file = currentProject.files[index];
    const exists = currentProject.files.some((f, i) => i !== index && f.name === newName && f.type === file.type);
    
    if (exists) {
        showToast('A file with this name already exists', 'error');
        return false;
    }
    
    file.name = newName;
    projects[currentProject.id] = currentProject;
    saveProject(currentProject);
    renderFileTabs();
    showToast('File renamed', 'success');
    return true;
}

function deleteFile(index) {
    if (!currentProject || !currentProject.files[index]) return;
    
    if (currentProject.files.length <= 1) {
        showToast('Cannot delete the last file', 'error');
        return;
    }
    
    currentProject.files.splice(index, 1);
    projects[currentProject.id] = currentProject;
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
        
        // Debounced save
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            projects[currentProject.id] = currentProject;
            saveProject(currentProject);
        }, 1000);
    }
});

// Tab key support
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
    if (!currentProject || !currentProject.files) return;
    
    // Save current file
    if (currentFile !== null && currentProject.files[currentFile]) {
        currentProject.files[currentFile].content = codeEditor.value;
        saveProject(currentProject);
    }
    
    // Notify other tabs to close their game windows
    gameChannel.postMessage({ type: 'close_game' });
    
    // Close current game window if exists
    if (runningGameWindow && !runningGameWindow.closed) {
        runningGameWindow.close();
    }
    
    // Build the game
    let htmlContent = '';
    let cssContent = '';
    let jsContent = '';
    
    // Find main HTML file or first HTML file
    const htmlFile = currentProject.files.find(f => f.type === 'html' && f.name === 'index') 
                  || currentProject.files.find(f => f.type === 'html');
    
    if (htmlFile) {
        htmlContent = htmlFile.content;
    } else {
        htmlContent = '<!DOCTYPE html><html><head></head><body></body></html>';
    }
    
    // Collect all CSS
    currentProject.files.filter(f => f.type === 'css').forEach(file => {
        cssContent += `/* ${file.name}.css */\n${file.content}\n\n`;
    });
    
    // Collect all JS
    currentProject.files.filter(f => f.type === 'js').forEach(file => {
        jsContent += `// ${file.name}.js\n${file.content}\n\n`;
    });
    
    // Inject CSS and JS into HTML
    const finalHtml = htmlContent
        .replace('</head>', `<style>${cssContent}</style></head>`)
        .replace('</body>', `<script>${jsContent}<\/script></body>`);
    
    // Open in new window
    runningGameWindow = window.open('', '_blank', 'width=1024,height=768');
    
    if (runningGameWindow) {
        runningGameWindow.document.open();
        runningGameWindow.document.write(finalHtml);
        runningGameWindow.document.close();
        
        showToast('Game running!', 'success');
        
        // Monitor window close
        const checkClosed = setInterval(() => {
            if (runningGameWindow && runningGameWindow.closed) {
                clearInterval(checkClosed);
                runningGameWindow = null;
            }
        }, 1000);
    } else {
        showToast('Please allow popups to run your game', 'error');
    }
}

// Listen for cross-tab messages
gameChannel.addEventListener('message', (event) => {
    if (event.data.type === 'close_game') {
        if (runningGameWindow && !runningGameWindow.closed) {
            runningGameWindow.close();
            runningGameWindow = null;
        }
    }
});

// =============================================
// DOWNLOAD PROJECT
// =============================================

downloadProjectBtn.addEventListener('click', downloadProject);

async function downloadProject() {
    if (!currentProject || !currentProject.files) return;
    
    // Save current file first
    if (currentFile !== null && currentProject.files[currentFile]) {
        currentProject.files[currentFile].content = codeEditor.value;
    }
    
    const zip = new JSZip();
    
    currentProject.files.forEach(file => {
        zip.file(`${file.name}.${file.type}`, file.content);
    });
    
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentProject.name}.zip`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('Project downloaded!', 'success');
}

// =============================================
// ARCHIVE PROJECT
// =============================================

archiveProjectBtn.addEventListener('click', () => {
    if (!currentProject) return;
    
    currentProject.archived = true;
    projects[currentProject.id] = currentProject;
    saveProject(currentProject);
    
    renderProjectList();
    renderArchivedList();
    showToast('Project archived', 'success');
});

window.unarchiveProject = async function(projectId) {
    const project = projects[projectId];
    if (!project) return;
    
    project.archived = false;
    projects[projectId] = project;
    await saveProject(project);
    
    renderProjectList();
    renderArchivedList();
    showToast('Project restored', 'success');
};

// =============================================
// DELETE PROJECT
// =============================================

deleteProjectBtn.addEventListener('click', () => {
    if (!currentProject) return;
    
    if (confirm(`Are you sure you want to delete "${currentProject.name}"? This cannot be undone.`)) {
        deleteProject(currentProject.id);
    }
});

// =============================================
// RENAME PROJECT
// =============================================

editProjectNameBtn.addEventListener('click', () => {
    projectName.contentEditable = 'true';
    projectName.focus();
    
    // Select all text
    const range = document.createRange();
    range.selectNodeContents(projectName);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
});

projectName.addEventListener('blur', saveProjectName);
projectName.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        projectName.blur();
    }
    if (e.key === 'Escape') {
        projectName.textContent = currentProject.name;
        projectName.blur();
    }
});

function saveProjectName() {
    projectName.contentEditable = 'false';
    const newName = projectName.textContent.trim();
    
    if (newName && newName !== currentProject.name) {
        currentProject.name = newName;
        projects[currentProject.id] = currentProject;
        saveProject(currentProject);
        renderProjectList();
        renderArchivedList();
        showToast('Project renamed', 'success');
    } else {
        projectName.textContent = currentProject.name;
    }
}

// =============================================
// MODALS
// =============================================

// New Project Modal
newProjectBtn.addEventListener('click', () => {
    document.getElementById('newProjectName').value = '';
    document.querySelector('input[name="template"][value="blank"]').checked = true;
    newProjectModal.classList.add('active');
    document.getElementById('newProjectName').focus();
});

document.getElementById('createProjectBtn').addEventListener('click', createNewProject);

async function createNewProject() {
    const name = document.getElementById('newProjectName').value.trim();
    const template = document.querySelector('input[name="template"]:checked').value;
    
    if (!name) {
        showToast('Please enter a project name', 'error');
        return;
    }
    
    const project = {
        user_id: currentUser.id,
        name: name,
        files: JSON.parse(JSON.stringify(templates[template].files)),
        archived: false
    };
    
    try {
        const { data, error } = await supabase
            .from('projects')
            .insert(project)
            .select()
            .single();
        
        if (error) throw error;
        
        projects[data.id] = data;
        
        closeAllModals();
        renderProjectList();
        selectProject(data.id);
        showToast('Project created!', 'success');
    } catch (error) {
        console.error('Create project error:', error);
        showToast('Failed to create project', 'error');
    }
}

// New File Modal
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
        showToast('Please enter a file name', 'error');
        return;
    }
    
    if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
        showToast('File name can only contain letters, numbers, hyphens, and underscores', 'error');
        return;
    }
    
    if (addFile(name, type)) {
        closeAllModals();
    }
});

// File Context Menu
let contextMenuFileIndex = null;

function showFileContextMenu(e, index) {
    contextMenuFileIndex = index;
    fileContextMenu.style.left = e.pageX + 'px';
    fileContextMenu.style.top = e.pageY + 'px';
    fileContextMenu.classList.add('active');
}

document.addEventListener('click', () => {
    fileContextMenu.classList.remove('active');
});

fileContextMenu.querySelectorAll('.context-menu-item').forEach(item => {
    item.addEventListener('click', () => {
        const action = item.dataset.action;
        
        if (action === 'rename') {
            const file = currentProject.files[contextMenuFileIndex];
            document.getElementById('renameFileName').value = file.name;
            renameFileModal.classList.add('active');
            document.getElementById('renameFileName').focus();
        } else if (action === 'delete') {
            if (confirm('Are you sure you want to delete this file?')) {
                deleteFile(contextMenuFileIndex);
            }
        }
    });
});

// Rename File Modal
document.getElementById('confirmRenameFileBtn').addEventListener('click', () => {
    const newName = document.getElementById('renameFileName').value.trim();
    
    if (!newName) {
        showToast('Please enter a file name', 'error');
        return;
    }
    
    if (!/^[a-zA-Z0-9_-]+$/.test(newName)) {
        showToast('File name can only contain letters, numbers, hyphens, and underscores', 'error');
        return;
    }
    
    if (renameFile(contextMenuFileIndex, newName)) {
        closeAllModals();
    }
});

// Close modals
document.querySelectorAll('.modal-close, .modal-cancel').forEach(btn => {
    btn.addEventListener('click', closeAllModals);
});

document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeAllModals();
        }
    });
});

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
}

// Enter key in modals
document.getElementById('newProjectName').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') createNewProject();
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
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        info: 'fas fa-info-circle'
    };
    
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

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    // Save current file
    if (currentProject && currentFile !== null && currentProject.files[currentFile]) {
        currentProject.files[currentFile].content = codeEditor.value;
        saveProject(currentProject);
    }
    
    // Close game window
    if (runningGameWindow && !runningGameWindow.closed) {
        runningGameWindow.close();
    }
});
