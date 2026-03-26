// ==================== DATA LAYER ====================
const STORAGE_KEY = 'gameforge_projects';

function loadProjects() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

function saveProjects(projects) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const icons = {
        'html': '🟧',
        'htm': '🟧',
        'css': '🟦',
        'js': '🟨',
        'json': '🟩',
        'md': '📝',
        'txt': '📄',
        'glsl': '🔮',
        'vert': '🔮',
        'frag': '🔮',
        'png': '🖼️',
        'jpg': '🖼️',
        'svg': '🖼️',
    };
    return icons[ext] || '📄';
}

function getDefaultFiles(type) {
    const files = {};

    if (type === '2d') {
        files['index.html'] = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>2D Game</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <canvas id="gameCanvas" width="800" height="600"></canvas>
    <script src="game.js"><\/script>
</body>
</html>`;

        files['style.css'] = `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background: #1a1a2e;
}

canvas {
    border: 2px solid #e94560;
    border-radius: 4px;
    box-shadow: 0 0 30px rgba(233, 69, 96, 0.3);
}`;

        files['game.js'] = `const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Player
const player = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 60,
    width: 50,
    height: 50,
    speed: 5,
    color: '#e94560'
};

// Input
const keys = {};
window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

// Game loop
function update() {
    if (keys['ArrowLeft'] || keys['a']) player.x -= player.speed;
    if (keys['ArrowRight'] || keys['d']) player.x += player.speed;
    if (keys['ArrowUp'] || keys['w']) player.y -= player.speed;
    if (keys['ArrowDown'] || keys['s']) player.y += player.speed;

    // Bounds
    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));
}

function draw() {
    ctx.fillStyle = '#0f3460';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    // Player
    ctx.fillStyle = player.color;
    ctx.shadowColor = player.color;
    ctx.shadowBlur = 20;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    ctx.shadowBlur = 0;

    // Instructions
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '14px sans-serif';
    ctx.fillText('Use WASD or Arrow Keys to move', 10, 25);
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
console.log('2D Game started!');`;

    } else if (type === 'app') {
        files['index.html'] = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Web App</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="app">
        <header>
            <h1>My Web App</h1>
            <p class="subtitle">Built with GameForge Editor</p>
        </header>
        <main>
            <div class="card">
                <h2>Welcome!</h2>
                <p>Start building your web application.</p>
                <button id="actionBtn" class="btn">Click Me</button>
                <p id="output" class="output"></p>
            </div>
        </main>
    </div>
    <script src="app.js"><\/script>
</body>
</html>`;

        files['style.css'] = `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: linear-gradient(135deg, #0c0c1d, #1a1a3e);
    min-height: 100vh;
    color: #e0e0e0;
}

.app {
    max-width: 800px;
    margin: 0 auto;
    padding: 40px 20px;
}

header {
    text-align: center;
    margin-bottom: 40px;
}

header h1 {
    font-size: 2.5em;
    background: linear-gradient(135deg, #667eea, #764ba2);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.subtitle {
    color: #888;
    margin-top: 8px;
}

.card {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 16px;
    padding: 32px;
    backdrop-filter: blur(10px);
}

.card h2 {
    margin-bottom: 12px;
}

.card p {
    color: #aaa;
    margin-bottom: 20px;
}

.btn {
    padding: 12px 28px;
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
}

.btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
}

.output {
    margin-top: 20px;
    padding: 12px;
    background: rgba(0,0,0,0.2);
    border-radius: 8px;
    font-family: monospace;
    min-height: 20px;
}`;

        files['app.js'] = `let clickCount = 0;

const btn = document.getElementById('actionBtn');
const output = document.getElementById('output');

btn.addEventListener('click', () => {
    clickCount++;
    const messages = [
        'Hello, World! 👋',
        'You clicked again! 🎉',
        'Keep going! 🚀',
        'You\\'re on fire! 🔥',
        'Unstoppable! ⚡'
    ];
    const msg = messages[Math.min(clickCount - 1, messages.length - 1)];
    output.textContent = \`Click #\${clickCount}: \${msg}\`;
});

console.log('Web App loaded!');`;

    } else if (type === 'webgl') {
        files['index.html'] = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WebGL 3D</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <canvas id="glCanvas"></canvas>
    <div id="info">WebGL 3D - Rotating Cube</div>
    <script src="main.js"><\/script>
</body>
</html>`;

        files['style.css'] = `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    overflow: hidden;
    background: #000;
}

canvas {
    display: block;
    width: 100vw;
    height: 100vh;
}

#info {
    position: fixed;
    top: 10px;
    left: 10px;
    color: rgba(255,255,255,0.6);
    font-family: monospace;
    font-size: 14px;
    pointer-events: none;
}`;

        files['main.js'] = `const canvas = document.getElementById('glCanvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const gl = canvas.getContext('webgl');
if (!gl) {
    alert('WebGL not supported!');
    throw new Error('WebGL not supported');
}

// Vertex shader
const vsSource = \`
    attribute vec4 aPosition;
    attribute vec4 aColor;
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    varying lowp vec4 vColor;
    void main() {
        gl_Position = uProjectionMatrix * uModelViewMatrix * aPosition;
        vColor = aColor;
    }
\`;

// Fragment shader
const fsSource = \`
    varying lowp vec4 vColor;
    void main() {
        gl_FragColor = vColor;
    }
\`;

function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);

const program = gl.createProgram();
gl.attachShader(program, vs);
gl.attachShader(program, fs);
gl.linkProgram(program);

if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
}

const aPosition = gl.getAttribLocation(program, 'aPosition');
const aColor = gl.getAttribLocation(program, 'aColor');
const uModelView = gl.getUniformLocation(program, 'uModelViewMatrix');
const uProjection = gl.getUniformLocation(program, 'uProjectionMatrix');

// Cube vertices
const positions = [
    // Front
    -1,-1, 1,  1,-1, 1,  1, 1, 1, -1, 1, 1,
    // Back
    -1,-1,-1, -1, 1,-1,  1, 1,-1,  1,-1,-1,
    // Top
    -1, 1,-1, -1, 1, 1,  1, 1, 1,  1, 1,-1,
    // Bottom
    -1,-1,-1,  1,-1,-1,  1,-1, 1, -1,-1, 1,
    // Right
     1,-1,-1,  1, 1,-1,  1, 1, 1,  1,-1, 1,
    // Left
    -1,-1,-1, -1,-1, 1, -1, 1, 1, -1, 1,-1,
];

const faceColors = [
    [1.0, 0.3, 0.3, 1.0], // Front - red
    [0.3, 1.0, 0.3, 1.0], // Back - green
    [0.3, 0.3, 1.0, 1.0], // Top - blue
    [1.0, 1.0, 0.3, 1.0], // Bottom - yellow
    [1.0, 0.3, 1.0, 1.0], // Right - purple
    [0.3, 1.0, 1.0, 1.0], // Left - cyan
];

let colors = [];
faceColors.forEach(c => { for(let i = 0; i < 4; i++) colors = colors.concat(c); });

const indices = [
    0,1,2,  0,2,3,    4,5,6,  4,6,7,
    8,9,10, 8,10,11,  12,13,14, 12,14,15,
    16,17,18, 16,18,19, 20,21,22, 20,22,23
];

const posBuf = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

const colBuf = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, colBuf);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

const idxBuf = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

// Simple matrix math
function perspective(fov, aspect, near, far) {
    const f = 1.0 / Math.tan(fov / 2);
    const nf = 1 / (near - far);
    return [
        f/aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (far+near)*nf, -1,
        0, 0, 2*far*near*nf, 0
    ];
}

function multiply(a, b) {
    const r = new Array(16).fill(0);
    for(let i=0;i<4;i++) for(let j=0;j<4;j++) for(let k=0;k<4;k++)
        r[j*4+i] += a[k*4+i]*b[j*4+k];
    return r;
}

function rotateY(m, a) {
    const c=Math.cos(a), s=Math.sin(a);
    const r=[c,0,s,0, 0,1,0,0, -s,0,c,0, 0,0,0,1];
    return multiply(m,r);
}

function rotateX(m, a) {
    const c=Math.cos(a), s=Math.sin(a);
    const r=[1,0,0,0, 0,c,-s,0, 0,s,c,0, 0,0,0,1];
    return multiply(m,r);
}

function translate(m, x, y, z) {
    const t=[1,0,0,0, 0,1,0,0, 0,0,1,0, x,y,z,1];
    return multiply(m,t);
}

const identity = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];

let rotation = 0;

function render() {
    rotation += 0.01;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.clearColor(0.06, 0.06, 0.12, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const proj = perspective(45*Math.PI/180, canvas.width/canvas.height, 0.1, 100);
    let mv = translate([...identity], 0, 0, -6);
    mv = rotateY(mv, rotation);
    mv = rotateX(mv, rotation * 0.7);

    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aPosition);

    gl.bindBuffer(gl.ARRAY_BUFFER, colBuf);
    gl.vertexAttribPointer(aColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aColor);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
    gl.useProgram(program);
    gl.uniformMatrix4fv(uProjection, false, proj);
    gl.uniformMatrix4fv(uModelView, false, mv);

    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
    requestAnimationFrame(render);
}

render();
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

console.log('WebGL 3D Engine started!');`;
    }

    return files;
}

// ==================== APP STATE ====================
let projects = loadProjects();
let currentProjectId = null;
let currentFileId = null;
let openTabs = [];
let contextTarget = null;
let autoSaveTimer = null;

// ==================== DOM REFERENCES ====================
const $ = id => document.getElementById(id);

const dashboard = $('dashboard');
const editorView = $('editor');
const projectGrid = $('projectGrid');
const emptyState = $('emptyState');
const searchInput = $('searchProjects');

const newProjectModal = $('newProjectModal');
const projectNameInput = $('projectName');
const typeCards = document.querySelectorAll('.type-card');
let selectedType = '2d';

const renameModal = $('renameModal');
const renameInput = $('renameInput');
const renameModalTitle = $('renameModalTitle');
const renameLabel = $('renameLabel');
let renameCallback = null;

const addFileModal = $('addFileModal');
const newFileNameInput = $('newFileName');

const editorProjectName = $('editorProjectName');
const projectTypeBadge = $('projectTypeBadge');
const fileList = $('fileList');
const codeTabs = $('codeTabs');
const codeEditor = $('codeEditor');
const lineNumbers = $('lineNumbers');

const webglPreview = $('webglPreview');
const webglFrame = $('webglFrame');

const contextMenu = $('contextMenu');
const toastContainer = $('toastContainer');

// ==================== TOAST ====================
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(20px)';
        toast.style.transition = '0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ==================== SAVE ====================
function autoSave() {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
        saveProjects(projects);
    }, 300);
}

function getCurrentProject() {
    return projects.find(p => p.id === currentProjectId);
}

// ==================== DASHBOARD ====================
function renderDashboard(filter = '') {
    const filtered = projects.filter(p =>
        p.name.toLowerCase().includes(filter.toLowerCase())
    );

    projectGrid.innerHTML = '';
    emptyState.style.display = filtered.length === 0 ? 'flex' : 'none';

    filtered.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

    filtered.forEach(project => {
        const card = document.createElement('div');
        card.className = 'project-card';
        card.dataset.type = project.type;
        card.dataset.id = project.id;

        const fileCount = Object.keys(project.files).length;
        const date = project.updatedAt ? new Date(project.updatedAt).toLocaleDateString() : 'N/A';
        const badgeClass = `badge-${project.type}`;
        const typeLabel = project.type === '2d' ? '2D Game' :
                         project.type === 'app' ? 'Web App' : 'WebGL 3D';

        card.innerHTML = `
            <div class="project-card-header">
                <div class="project-card-title">${escapeHtml(project.name)}</div>
                <span class="project-card-badge ${badgeClass}">${typeLabel}</span>
            </div>
            <div class="project-card-meta">
                <span>📁 ${fileCount} files</span>
                <span>📅 ${date}</span>
            </div>
            <div class="project-card-actions">
                <button class="btn btn-sm card-rename" data-id="${project.id}">✏️ Rename</button>
                <button class="btn btn-sm card-delete" data-id="${project.id}" style="color:var(--danger)">🗑️</button>
            </div>
        `;

        card.addEventListener('click', (e) => {
            if (e.target.closest('.card-rename') || e.target.closest('.card-delete')) return;
            openProject(project.id);
        });

        projectGrid.appendChild(card);
    });

    // Attach card action listeners
    document.querySelectorAll('.card-rename').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const proj = projects.find(p => p.id === btn.dataset.id);
            if (proj) {
                showRenameModal('Rename Project', 'Project Name', proj.name, (newName) => {
                    if (newName.trim()) {
                        proj.name = newName.trim();
                        proj.updatedAt = Date.now();
                        saveProjects(projects);
                        renderDashboard(searchInput.value);
                        showToast('Project renamed', 'success');
                    }
                });
            }
        });
    });

    document.querySelectorAll('.card-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm('Delete this project? This cannot be undone.')) {
                projects = projects.filter(p => p.id !== btn.dataset.id);
                saveProjects(projects);
                renderDashboard(searchInput.value);
                showToast('Project deleted', 'error');
            }
        });
    });
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ==================== PROJECT CREATION ====================
function showNewProjectModal() {
    newProjectModal.classList.add('active');
    projectNameInput.value = '';
    projectNameInput.focus();
    selectedType = '2d';
    typeCards.forEach(c => c.classList.toggle('selected', c.dataset.type === '2d'));
}

function hideNewProjectModal() {
    newProjectModal.classList.remove('active');
}

function createNewProject() {
    const name = projectNameInput.value.trim() || 'Untitled Project';

    const project = {
        id: generateId(),
        name: name,
        type: selectedType,
        files: getDefaultFiles(selectedType),
        createdAt: Date.now(),
        updatedAt: Date.now()
    };

    projects.push(project);
    saveProjects(projects);
    hideNewProjectModal();
    renderDashboard();
    showToast(`Project "${name}" created!`, 'success');
    openProject(project.id);
}

// ==================== EDITOR ====================
function openProject(projectId) {
    currentProjectId = projectId;
    const project = getCurrentProject();
    if (!project) return;

    openTabs = [];
    currentFileId = null;

    dashboard.classList.remove('active');
    editorView.classList.add('active');

    // Set header info
    editorProjectName.textContent = project.name;
    const typeLabel = project.type === '2d' ? '2D' : project.type === 'app' ? 'APP' : 'WebGL';
    const typeClass = `badge-${project.type}`;
    projectTypeBadge.textContent = typeLabel;
    projectTypeBadge.className = `project-type-badge ${typeClass}`;

    renderFileList();

    // Open first file
    const firstFile = Object.keys(project.files)[0];
    if (firstFile) {
        openFile(firstFile);
    } else {
        codeEditor.value = '';
        updateLineNumbers();
    }
}

function backToDashboard() {
    editorView.classList.remove('active');
    dashboard.classList.add('active');
    currentProjectId = null;
    currentFileId = null;
    openTabs = [];
    closeWebGLPreview();
    renderDashboard(searchInput.value);
}

function renderFileList() {
    const project = getCurrentProject();
    if (!project) return;

    fileList.innerHTML = '';
    const fileNames = Object.keys(project.files);

    fileNames.forEach(fileName => {
        const item = document.createElement('div');
        item.className = `file-item ${fileName === currentFileId ? 'active' : ''}`;
        item.dataset.file = fileName;

        item.innerHTML = `
            <span class="file-icon">${getFileIcon(fileName)}</span>
            <span class="file-name">${escapeHtml(fileName)}</span>
            <div class="file-actions">
                <button class="file-action-btn rename-file" title="Rename">✏️</button>
                <button class="file-action-btn delete file-delete-btn" title="Delete">🗑️</button>
            </div>
        `;

        item.addEventListener('click', (e) => {
            if (e.target.closest('.file-action-btn')) return;
            openFile(fileName);
        });

        item.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            showContextMenu(e.clientX, e.clientY, fileName);
        });

        fileList.appendChild(item);
    });

    // Attach file action listeners
    document.querySelectorAll('.rename-file').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const fileName = btn.closest('.file-item').dataset.file;
            renameFile(fileName);
        });
    });

    document.querySelectorAll('.file-delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const fileName = btn.closest('.file-item').dataset.file;
            deleteFile(fileName);
        });
    });
}

function openFile(fileName) {
    const project = getCurrentProject();
    if (!project || !(fileName in project.files)) return;

    // Save current file
    saveCurrentFile();

    currentFileId = fileName;

    // Add to tabs if not already open
    if (!openTabs.includes(fileName)) {
        openTabs.push(fileName);
    }

    // Load content
    codeEditor.value = project.files[fileName];
    updateLineNumbers();
    renderTabs();
    renderFileList();
    codeEditor.focus();
}

function saveCurrentFile() {
    if (!currentFileId) return;
    const project = getCurrentProject();
    if (!project || !(currentFileId in project.files)) return;

    project.files[currentFileId] = codeEditor.value;
    project.updatedAt = Date.now();
    autoSave();
}

function renderTabs() {
    codeTabs.innerHTML = '';
    const project = getCurrentProject();
    if (!project) return;

    // Remove tabs for deleted files
    openTabs = openTabs.filter(f => f in project.files);

    openTabs.forEach(fileName => {
        const tab = document.createElement('div');
        tab.className = `code-tab ${fileName === currentFileId ? 'active' : ''}`;
        tab.innerHTML = `
            <span class="code-tab-icon">${getFileIcon(fileName)}</span>
            <span>${escapeHtml(fileName)}</span>
            <button class="code-tab-close" data-file="${fileName}">&times;</button>
        `;

        tab.addEventListener('click', (e) => {
            if (e.target.closest('.code-tab-close')) return;
            openFile(fileName);
        });

        codeTabs.appendChild(tab);
    });

    // Close tab buttons
    document.querySelectorAll('.code-tab-close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeTab(btn.dataset.file);
        });
    });
}

function closeTab(fileName) {
    const idx = openTabs.indexOf(fileName);
    if (idx === -1) return;

    openTabs.splice(idx, 1);

    if (fileName === currentFileId) {
        if (openTabs.length > 0) {
            const newIdx = Math.min(idx, openTabs.length - 1);
            openFile(openTabs[newIdx]);
        } else {
            currentFileId = null;
            codeEditor.value = '';
            updateLineNumbers();
        }
    }

    renderTabs();
    renderFileList();
}

function updateLineNumbers() {
    const lines = codeEditor.value.split('\n').length;
    let html = '';
    for (let i = 1; i <= lines; i++) {
        html += i + '\n';
    }
    lineNumbers.textContent = html;
}

// ==================== FILE OPERATIONS ====================
function addFile() {
    addFileModal.classList.add('active');
    newFileNameInput.value = '';
    newFileNameInput.focus();
}

function confirmAddFile() {
    const project = getCurrentProject();
    if (!project) return;

    let fileName = newFileNameInput.value.trim();
    if (!fileName) {
        showToast('Please enter a file name', 'error');
        return;
    }

    // Add default extension if none provided
    if (!fileName.includes('.')) {
        fileName += '.js';
    }

    if (fileName in project.files) {
        showToast('A file with that name already exists', 'error');
        return;
    }

    project.files[fileName] = '';
    project.updatedAt = Date.now();
    saveProjects(projects);
    addFileModal.classList.remove('active');
    renderFileList();
    openFile(fileName);
    showToast(`File "${fileName}" created`, 'success');
}

function renameFile(oldName) {
    const project = getCurrentProject();
    if (!project) return;

    showRenameModal('Rename File', 'File Name', oldName, (newName) => {
        newName = newName.trim();
        if (!newName) return;
        if (newName === oldName) return;
        if (newName in project.files) {
            showToast('A file with that name already exists', 'error');
            return;
        }

        project.files[newName] = project.files[oldName];
        delete project.files[oldName];
        project.updatedAt = Date.now();
        saveProjects(projects);

        // Update tabs
        const tabIdx = openTabs.indexOf(oldName);
        if (tabIdx !== -1) openTabs[tabIdx] = newName;
        if (currentFileId === oldName) currentFileId = newName;

        renderFileList();
        renderTabs();
        showToast(`File renamed to "${newName}"`, 'success');
    });
}

function deleteFile(fileName) {
    const project = getCurrentProject();
    if (!project) return;

    const fileCount = Object.keys(project.files).length;
    if (fileCount <= 1) {
        showToast('Cannot delete the last file', 'error');
        return;
    }

    if (!confirm(`Delete "${fileName}"?`)) return;

    delete project.files[fileName];
    project.updatedAt = Date.now();
    saveProjects(projects);

    closeTab(fileName);
    renderFileList();
    renderTabs();

    if (currentFileId === fileName || !currentFileId) {
        const firstFile = Object.keys(project.files)[0];
        if (firstFile) openFile(firstFile);
    }

    showToast(`File "${fileName}" deleted`, 'info');
}

function duplicateFile(fileName) {
    const project = getCurrentProject();
    if (!project) return;

    const ext = fileName.includes('.') ? '.' + fileName.split('.').pop() : '';
    const base = fileName.includes('.') ? fileName.substring(0, fileName.lastIndexOf('.')) : fileName;
    let newName = `${base}_copy${ext}`;
    let counter = 1;
    while (newName in project.files) {
        counter++;
        newName = `${base}_copy${counter}${ext}`;
    }

    project.files[newName] = project.files[fileName];
    project.updatedAt = Date.now();
    saveProjects(projects);
    renderFileList();
    openFile(newName);
    showToast(`File duplicated as "${newName}"`, 'success');
}

// ==================== RENAME MODAL ====================
function showRenameModal(title, label, currentValue, callback) {
    renameModalTitle.textContent = title;
    renameLabel.textContent = label;
    renameInput.value = currentValue;
    renameCallback = callback;
    renameModal.classList.add('active');
    renameInput.focus();
    renameInput.select();
}

function confirmRename() {
    if (renameCallback) {
        renameCallback(renameInput.value);
    }
    renameModal.classList.remove('active');
    renameCallback = null;
}

// ==================== CONTEXT MENU ====================
function showContextMenu(x, y, fileName) {
    contextTarget = fileName;
    contextMenu.style.left = x + 'px';
    contextMenu.style.top = y + 'px';
    contextMenu.classList.add('active');

    // Adjust position if off-screen
    const rect = contextMenu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
        contextMenu.style.left = (x - rect.width) + 'px';
    }
    if (rect.bottom > window.innerHeight) {
        contextMenu.style.top = (y - rect.height) + 'px';
    }
}

function hideContextMenu() {
    contextMenu.classList.remove('active');
    contextTarget = null;
}

// ==================== RUN PROJECT ====================
function runProject() {
    const project = getCurrentProject();
    if (!project) return;

    saveCurrentFile();
    saveProjects(projects);

    if (project.type === 'webgl') {
        runWebGL(project);
    } else {
        runInNewTab(project);
    }
}

function runInNewTab(project) {
    const htmlContent = buildProjectHTML(project);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    // Revoke after a delay to allow loading
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    showToast('Project launched in new tab', 'success');
}

function runWebGL(project) {
    const htmlContent = buildProjectHTML(project);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    webglFrame.src = url;
    webglPreview.classList.add('active');
    showToast('WebGL preview opened', 'success');

    setTimeout(() => URL.revokeObjectURL(url), 10000);
}

function buildProjectHTML(project) {
    // Find the main HTML file
    let htmlFile = null;
    let htmlContent = '';

    const htmlFiles = Object.keys(project.files).filter(f =>
        f.endsWith('.html') || f.endsWith('.htm')
    );

    if (htmlFiles.includes('index.html')) {
        htmlFile = 'index.html';
    } else if (htmlFiles.length > 0) {
        htmlFile = htmlFiles[0];
    }

    if (htmlFile) {
        htmlContent = project.files[htmlFile];
    } else {
        // No HTML file, create a basic one
        htmlContent = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body></body></html>';
    }

    // Inline CSS files
    const cssFiles = Object.keys(project.files).filter(f => f.endsWith('.css'));
    cssFiles.forEach(cssFile => {
        const cssContent = project.files[cssFile];
        // Replace link tag references
        const linkRegex = new RegExp(`<link[^>]*href=["']${escapeRegExp(cssFile)}["'][^>]*/?>`, 'gi');
        if (linkRegex.test(htmlContent)) {
            htmlContent = htmlContent.replace(linkRegex, `<style>\n${cssContent}\n</style>`);
        } else {
            // Inject before </head>
            htmlContent = htmlContent.replace('</head>', `<style>\n${cssContent}\n</style>\n</head>`);
        }
    });

    // Inline JS files
    const jsFiles = Object.keys(project.files).filter(f => f.endsWith('.js'));
    jsFiles.forEach(jsFile => {
        const jsContent = project.files[jsFile];
        // Replace script tag references
        const scriptRegex = new RegExp(`<script[^>]*src=["']${escapeRegExp(jsFile)}["'][^>]*>[\\s\\S]*?<\\/script>`, 'gi');
        if (scriptRegex.test(htmlContent)) {
            htmlContent = htmlContent.replace(scriptRegex, `<script>\n${jsContent}\n<\/script>`);
        } else {
            // Inject before </body>
            htmlContent = htmlContent.replace('</body>', `<script>\n${jsContent}\n<\/script>\n</body>`);
        }
    });

    return htmlContent;
}

function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function closeWebGLPreview() {
    webglPreview.classList.remove('active');
    webglFrame.src = 'about:blank';
}

// ==================== WEBGL PREVIEW DRAG & RESIZE ====================
let isDragging = false;
let isResizing = false;
let dragOffsetX, dragOffsetY;

const webglHeader = document.querySelector('.webgl-preview-header');
const webglResizeHandle = $('webglResizeHandle');

webglHeader.addEventListener('mousedown', (e) => {
    if (e.target.closest('button')) return;
    isDragging = true;
    const rect = webglPreview.getBoundingClientRect();
    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;
    e.preventDefault();
});

webglResizeHandle.addEventListener('mousedown', (e) => {
    isResizing = true;
    e.preventDefault();
    e.stopPropagation();
});

document.addEventListener('mousemove', (e) => {
    if (isDragging) {
        webglPreview.style.left = (e.clientX - dragOffsetX) + 'px';
        webglPreview.style.top = (e.clientY - dragOffsetY) + 'px';
        webglPreview.style.right = 'auto';
    }
    if (isResizing) {
        const rect = webglPreview.getBoundingClientRect();
        const newWidth = Math.max(320, e.clientX - rect.left);
        const newHeight = Math.max(240, e.clientY - rect.top);
        webglPreview.style.width = newWidth + 'px';
        webglPreview.style.height = newHeight + 'px';
    }
});

document.addEventListener('mouseup', () => {
    isDragging = false;
    isResizing = false;
});

// ==================== TAB KEY SUPPORT ====================
codeEditor.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
        e.preventDefault();
        const start = codeEditor.selectionStart;
        const end = codeEditor.selectionEnd;

        if (e.shiftKey) {
            // Unindent
            const before = codeEditor.value.substring(0, start);
            const lastNewline = before.lastIndexOf('\n');
            const lineStart = lastNewline + 1;
            const lineContent = codeEditor.value.substring(lineStart);
            if (lineContent.startsWith('    ')) {
                codeEditor.value = codeEditor.value.substring(0, lineStart) + lineContent.substring(4);
                codeEditor.selectionStart = codeEditor.selectionEnd = Math.max(lineStart, start - 4);
            } else if (lineContent.startsWith('\t')) {
                codeEditor.value = codeEditor.value.substring(0, lineStart) + lineContent.substring(1);
                codeEditor.selectionStart = codeEditor.selectionEnd = Math.max(lineStart, start - 1);
            }
        } else {
            codeEditor.value = codeEditor.value.substring(0, start) + '    ' + codeEditor.value.substring(end);
            codeEditor.selectionStart = codeEditor.selectionEnd = start + 4;
        }

        updateLineNumbers();
        saveCurrentFile();
    }

    // Auto-close brackets
    const pairs = { '(': ')', '{': '}', '[': ']', '"': '"', "'": "'", '`': '`' };
    if (pairs[e.key]) {
        const start = codeEditor.selectionStart;
        const end = codeEditor.selectionEnd;
        if (start !== end) {
            // Wrap selection
            e.preventDefault();
            const selected = codeEditor.value.substring(start, end);
            codeEditor.value = codeEditor.value.substring(0, start) + e.key + selected + pairs[e.key] + codeEditor.value.substring(end);
            codeEditor.selectionStart = start + 1;
            codeEditor.selectionEnd = end + 1;
            updateLineNumbers();
            saveCurrentFile();
        }
    }

    // Enter - auto indent
    if (e.key === 'Enter') {
        const start = codeEditor.selectionStart;
        const before = codeEditor.value.substring(0, start);
        const currentLine = before.split('\n').pop();
        const indent = currentLine.match(/^\s*/)[0];
        const lastChar = before.trim().slice(-1);
        let extra = '';
        if (lastChar === '{' || lastChar === '(' || lastChar === '[') {
            extra = '    ';
        }
        e.preventDefault();
        const insertion = '\n' + indent + extra;
        codeEditor.value = codeEditor.value.substring(0, start) + insertion + codeEditor.value.substring(codeEditor.selectionEnd);
        codeEditor.selectionStart = codeEditor.selectionEnd = start + insertion.length;
        updateLineNumbers();
        saveCurrentFile();
    }

    // Ctrl+S
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveCurrentFile();
        saveProjects(projects);
        showToast('Saved!', 'success');
    }
});

// ==================== EVENT LISTENERS ====================

// Dashboard
$('newProjectBtn').addEventListener('click', showNewProjectModal);
searchInput.addEventListener('input', () => renderDashboard(searchInput.value));

// New Project Modal
$('closeModal').addEventListener('click', hideNewProjectModal);
$('cancelProject').addEventListener('click', hideNewProjectModal);
$('createProject').addEventListener('click', createNewProject);
projectNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') createNewProject();
});

typeCards.forEach(card => {
    card.addEventListener('click', () => {
        typeCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        selectedType = card.dataset.type;
    });
});

// Editor
$('backToDash').addEventListener('click', () => {
    saveCurrentFile();
    saveProjects(projects);
    backToDashboard();
});

editorProjectName.addEventListener('click', () => {
    const project = getCurrentProject();
    if (!project) return;
    showRenameModal('Rename Project', 'Project Name', project.name, (newName) => {
        if (newName.trim()) {
            project.name = newName.trim();
            project.updatedAt = Date.now();
            saveProjects(projects);
            editorProjectName.textContent = project.name;
            showToast('Project renamed', 'success');
        }
    });
});

$('runProject').addEventListener('click', runProject);

$('deleteProject').addEventListener('click', () => {
    if (confirm('Delete this entire project? This cannot be undone.')) {
        projects = projects.filter(p => p.id !== currentProjectId);
        saveProjects(projects);
        showToast('Project deleted', 'error');
        backToDashboard();
    }
});

$('addFileBtn').addEventListener('click', addFile);

// Add File Modal
$('closeAddFileModal').addEventListener('click', () => addFileModal.classList.remove('active'));
$('cancelAddFile').addEventListener('click', () => addFileModal.classList.remove('active'));
$('confirmAddFile').addEventListener('click', confirmAddFile);
newFileNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') confirmAddFile();
});

// Rename Modal
$('closeRenameModal').addEventListener('click', () => renameModal.classList.remove('active'));
$('cancelRename').addEventListener('click', () => renameModal.classList.remove('active'));
$('confirmRename').addEventListener('click', confirmRename);
renameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') confirmRename();
});

// Code Editor
codeEditor.addEventListener('input', () => {
    updateLineNumbers();
    saveCurrentFile();
});

codeEditor.addEventListener('scroll', () => {
    lineNumbers.scrollTop = codeEditor.scrollTop;
});

// WebGL Preview
$('webglClose').addEventListener('click', closeWebGLPreview);
$('webglReload').addEventListener('click', () => {
    saveCurrentFile();
    saveProjects(projects);
    const project = getCurrentProject();
    if (project) runWebGL(project);
});

// Context Menu
document.addEventListener('click', () => hideContextMenu());
document.querySelectorAll('.context-item').forEach(item => {
    item.addEventListener('click', () => {
        const action = item.dataset.action;
        if (!contextTarget) return;
        switch (action) {
            case 'rename':
                renameFile(contextTarget);
                break;
            case 'duplicate':
                duplicateFile(contextTarget);
                break;
            case 'delete':
                deleteFile(contextTarget);
                break;
        }
        hideContextMenu();
    });
});

// Close modals on overlay click
[newProjectModal, renameModal, addFileModal].forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        newProjectModal.classList.remove('active');
        renameModal.classList.remove('active');
        addFileModal.classList.remove('active');
        hideContextMenu();
    }
});

// Auto-save on page unload
window.addEventListener('beforeunload', () => {
    saveCurrentFile();
    saveProjects(projects);
});

// ==================== INIT ====================
renderDashboard();
