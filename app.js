// ==================== STORAGE & STATE ====================
const STORAGE_KEY = 'webglGameEditorProjects';

let projects = [];
let currentProjectId = null;
let currentFileIndex = 0;
let saveTimeout = null;

// ==================== DOM ELEMENTS ====================
const elements = {
    projectsList: document.getElementById('projectsList'),
    projectEditor: document.getElementById('projectEditor'),
    noProjectMessage: document.getElementById('noProjectMessage'),
    projectName: document.getElementById('projectName'),
    projectType: document.getElementById('projectType'),
    fileTabs: document.getElementById('fileTabs'),
    codeEditor: document.getElementById('codeEditor'),
    currentFileName: document.getElementById('currentFileName'),
    saveStatus: document.getElementById('saveStatus'),
    
    // Modals
    newProjectModal: document.getElementById('newProjectModal'),
    addFileModal: document.getElementById('addFileModal'),
    renameModal: document.getElementById('renameModal'),
    
    // WebGL Window
    webglOverlay: document.getElementById('webglOverlay'),
    webglTestWindow: document.getElementById('webglTestWindow'),
    webglFrame: document.getElementById('webglFrame')
};

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    loadProjects();
    renderProjectsList();
    setupEventListeners();
});

// ==================== LOCAL STORAGE ====================
function loadProjects() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            projects = JSON.parse(stored);
        }
    } catch (e) {
        console.error('Error loading projects:', e);
        projects = [];
    }
}

function saveProjects() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    } catch (e) {
        console.error('Error saving projects:', e);
    }
}

function saveWithDebounce() {
    elements.saveStatus.textContent = 'Saving...';
    elements.saveStatus.classList.add('saving');
    
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        saveProjects();
        elements.saveStatus.textContent = 'Auto-saved';
        elements.saveStatus.classList.remove('saving');
    }, 500);
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
    // New Project
    document.getElementById('newProjectBtn').addEventListener('click', openNewProjectModal);
    document.getElementById('closeNewProjectModal').addEventListener('click', closeNewProjectModal);
    document.getElementById('cancelNewProject').addEventListener('click', closeNewProjectModal);
    document.getElementById('createProject').addEventListener('click', createProject);
    
    // Add File
    document.getElementById('addFileBtn').addEventListener('click', openAddFileModal);
    document.getElementById('closeAddFileModal').addEventListener('click', closeAddFileModal);
    document.getElementById('cancelAddFile').addEventListener('click', closeAddFileModal);
    document.getElementById('confirmAddFile').addEventListener('click', addFile);
    
    // File templates
    document.querySelectorAll('.template-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const ext = btn.dataset.name.split('.').pop();
            document.getElementById('newFileName').value = `new.${ext}`;
            document.getElementById('newFileName').select();
        });
    });
    
    // Rename Modal
    document.getElementById('closeRenameModal').addEventListener('click', closeRenameModal);
    document.getElementById('cancelRename').addEventListener('click', closeRenameModal);
    document.getElementById('confirmRename').addEventListener('click', confirmRename);
    
    // Run & Delete Project
    document.getElementById('runProjectBtn').addEventListener('click', runProject);
    document.getElementById('deleteProjectBtn').addEventListener('click', deleteCurrentProject);
    
    // Code Editor
    elements.codeEditor.addEventListener('input', handleCodeChange);
    elements.codeEditor.addEventListener('keydown', handleEditorKeydown);
    
    // Project name click to rename
    elements.projectName.addEventListener('click', openProjectRename);
    
    // WebGL Window
    document.getElementById('closeWebglTest').addEventListener('click', closeWebglWindow);
    document.getElementById('refreshWebgl').addEventListener('click', refreshWebgl);
    
    // Modal backdrop clicks
    elements.newProjectModal.addEventListener('click', (e) => {
        if (e.target === elements.newProjectModal) closeNewProjectModal();
    });
    elements.addFileModal.addEventListener('click', (e) => {
        if (e.target === elements.addFileModal) closeAddFileModal();
    });
    elements.renameModal.addEventListener('click', (e) => {
        if (e.target === elements.renameModal) closeRenameModal();
    });
    elements.webglOverlay.addEventListener('click', (e) => {
        if (e.target === elements.webglOverlay) closeWebglWindow();
    });
    
    // Enter key in inputs
    document.getElementById('newProjectName').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') createProject();
    });
    document.getElementById('newFileName').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') addFile();
    });
    document.getElementById('renameInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') confirmRename();
        if (e.key === 'Escape') closeRenameModal();
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + S to save (already auto-saves, but prevent default)
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            saveProjects();
            elements.saveStatus.textContent = 'Saved!';
            setTimeout(() => {
                elements.saveStatus.textContent = 'Auto-saved';
            }, 1000);
        }
        // Ctrl/Cmd + Enter to run
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && currentProjectId) {
            e.preventDefault();
            runProject();
        }
    });
}

function handleCodeChange() {
    if (currentProjectId !== null) {
        const project = projects.find(p => p.id === currentProjectId);
        if (project && project.files[currentFileIndex]) {
            project.files[currentFileIndex].content = elements.codeEditor.value;
            saveWithDebounce();
        }
    }
}

function handleEditorKeydown(e) {
    if (e.key === 'Tab') {
        e.preventDefault();
        const start = elements.codeEditor.selectionStart;
        const end = elements.codeEditor.selectionEnd;
        const value = elements.codeEditor.value;
        
        if (e.shiftKey) {
            // Remove indent
            const lineStart = value.lastIndexOf('\n', start - 1) + 1;
            const lineContent = value.substring(lineStart, start);
            if (lineContent.startsWith('    ')) {
                elements.codeEditor.value = value.substring(0, lineStart) + 
                    value.substring(lineStart + 4);
                elements.codeEditor.selectionStart = elements.codeEditor.selectionEnd = start - 4;
            }
        } else {
            // Add indent
            elements.codeEditor.value = value.substring(0, start) + '    ' + value.substring(end);
            elements.codeEditor.selectionStart = elements.codeEditor.selectionEnd = start + 4;
        }
        
        handleCodeChange();
    }
}

// ==================== MODAL FUNCTIONS ====================
function openNewProjectModal() {
    elements.newProjectModal.classList.add('active');
    document.getElementById('newProjectName').value = '';
    document.getElementById('newProjectName').focus();
}

function closeNewProjectModal() {
    elements.newProjectModal.classList.remove('active');
}

function openAddFileModal() {
    elements.addFileModal.classList.add('active');
    document.getElementById('newFileName').value = '';
    document.getElementById('newFileName').focus();
}

function closeAddFileModal() {
    elements.addFileModal.classList.remove('active');
}

let renameTarget = null; // { type: 'project' | 'file', index?: number }

function openProjectRename() {
    const project = projects.find(p => p.id === currentProjectId);
    if (!project) return;
    
    renameTarget = { type: 'project' };
    document.getElementById('renameModalTitle').textContent = 'Rename Project';
    document.getElementById('renameInput').value = project.name;
    elements.renameModal.classList.add('active');
    setTimeout(() => document.getElementById('renameInput').select(), 50);
}

function openFileRename(index) {
    const project = projects.find(p => p.id === currentProjectId);
    if (!project || !project.files[index]) return;
    
    renameTarget = { type: 'file', index };
    document.getElementById('renameModalTitle').textContent = 'Rename File';
    document.getElementById('renameInput').value = project.files[index].name;
    elements.renameModal.classList.add('active');
    setTimeout(() => document.getElementById('renameInput').select(), 50);
}

function closeRenameModal() {
    elements.renameModal.classList.remove('active');
    renameTarget = null;
}

function confirmRename() {
    const newName = document.getElementById('renameInput').value.trim();
    if (!newName || !renameTarget) {
        closeRenameModal();
        return;
    }
    
    const project = projects.find(p => p.id === currentProjectId);
    if (!project) {
        closeRenameModal();
        return;
    }
    
    if (renameTarget.type === 'project') {
        project.name = newName;
        elements.projectName.textContent = newName;
        renderProjectsList();
    } else if (renameTarget.type === 'file') {
        const index = renameTarget.index;
        // Check for duplicate
        const duplicate = project.files.some((f, i) => 
            i !== index && f.name.toLowerCase() === newName.toLowerCase()
        );
        if (duplicate) {
            alert('A file with this name already exists!');
            return;
        }
        project.files[index].name = newName;
        renderFileTabs();
        updateCurrentFileName();
    }
    
    saveProjects();
    closeRenameModal();
}

// ==================== PROJECT FUNCTIONS ====================
function createProject() {
    const nameInput = document.getElementById('newProjectName');
    const typeInput = document.querySelector('input[name="projectType"]:checked');
    
    const name = nameInput.value.trim() || 'Untitled Project';
    const type = typeInput.value;
    
    const project = {
        id: Date.now(),
        name: name,
        type: type,
        files: getDefaultFiles(type),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    projects.unshift(project);
    saveProjects();
    renderProjectsList();
    selectProject(project.id);
    closeNewProjectModal();
}

function getDefaultFiles(type) {
    return [
        { name: 'index.html', content: getDefaultHTML(type) },
        { name: 'style.css', content: getDefaultCSS(type) },
        { name: 'script.js', content: getDefaultJS(type) }
    ];
}

function getDefaultHTML(type) {
    const titles = { '2d': '2D Game', 'app': 'Web App', 'webgl': 'WebGL 3D Game' };
    const canvasId = type === 'webgl' ? 'glCanvas' : type === '2d' ? 'gameCanvas' : null;
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${titles[type]}</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    ${canvasId ? `<canvas id="${canvasId}"></canvas>` : `<div id="app">
        <h1>Welcome!</h1>
        <p>Start building your web app.</p>
    </div>`}
    <script src="script.js"><\/script>
</body>
</html>`;
}

function getDefaultCSS(type) {
    const base = `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

`;
    
    if (type === 'webgl') {
        return base + `body {
    overflow: hidden;
    background: #000;
}

#glCanvas {
    width: 100vw;
    height: 100vh;
    display: block;
}`;
    } else if (type === '2d') {
        return base + `body {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background: linear-gradient(135deg, #1a1a2e, #16162a);
}

#gameCanvas {
    border: 3px solid #6366f1;
    border-radius: 8px;
    box-shadow: 0 0 30px rgba(99, 102, 241, 0.3);
}`;
    } else {
        return base + `body {
    font-family: 'Segoe UI', system-ui, sans-serif;
    background: linear-gradient(135deg, #0f0f1a, #1a1a2e);
    min-height: 100vh;
    color: #fff;
}

#app {
    max-width: 900px;
    margin: 0 auto;
    padding: 60px 24px;
    text-align: center;
}

h1 {
    font-size: 3.5rem;
    margin-bottom: 20px;
    background: linear-gradient(135deg, #6366f1, #a855f7, #ec4899);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

p {
    font-size: 1.3rem;
    color: #8888aa;
}`;
    }
}

function getDefaultJS(type) {
    if (type === 'webgl') {
        return `// WebGL 3D Game - Rotating Cube Demo
const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl');

if (!gl) {
    alert('WebGL not supported!');
    throw new Error('WebGL not supported');
}

// Resize
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
}
resize();
window.addEventListener('resize', resize);

// Shaders
const vsSource = \`
    attribute vec4 aPosition;
    attribute vec4 aColor;
    uniform mat4 uMatrix;
    varying vec4 vColor;
    void main() {
        gl_Position = uMatrix * aPosition;
        vColor = aColor;
    }
\`;

const fsSource = \`
    precision mediump float;
    varying vec4 vColor;
    void main() {
        gl_FragColor = vColor;
    }
\`;

function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
}

const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);

const program = gl.createProgram();
gl.attachShader(program, vs);
gl.attachShader(program, fs);
gl.linkProgram(program);
gl.useProgram(program);

// Cube vertices
const positions = new Float32Array([
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
]);

const colors = new Float32Array([
    1,0,0,1, 1,0,0,1, 1,0,0,1, 1,0,0,1,
    0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1,
    0,0,1,1, 0,0,1,1, 0,0,1,1, 0,0,1,1,
    1,1,0,1, 1,1,0,1, 1,1,0,1, 1,1,0,1,
    1,0,1,1, 1,0,1,1, 1,0,1,1, 1,0,1,1,
    0,1,1,1, 0,1,1,1, 0,1,1,1, 0,1,1,1,
]);

const indices = new Uint16Array([
    0,1,2, 0,2,3, 4,5,6, 4,6,7,
    8,9,10, 8,10,11, 12,13,14, 12,14,15,
    16,17,18, 16,18,19, 20,21,22, 20,22,23
]);

// Buffers
const posBuf = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
const aPos = gl.getAttribLocation(program, 'aPosition');
gl.enableVertexAttribArray(aPos);
gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);

const colBuf = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, colBuf);
gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
const aCol = gl.getAttribLocation(program, 'aColor');
gl.enableVertexAttribArray(aCol);
gl.vertexAttribPointer(aCol, 4, gl.FLOAT, false, 0, 0);

const idxBuf = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

const uMatrix = gl.getUniformLocation(program, 'uMatrix');

gl.enable(gl.DEPTH_TEST);
gl.clearColor(0.05, 0.05, 0.1, 1);

let rotation = 0;

function render() {
    rotation += 0.01;
    
    const aspect = canvas.width / canvas.height;
    const matrix = perspective(45, aspect, 0.1, 100);
    translate(matrix, 0, 0, -6);
    rotateX(matrix, rotation * 0.7);
    rotateY(matrix, rotation);
    
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniformMatrix4fv(uMatrix, false, matrix);
    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
    
    requestAnimationFrame(render);
}

// Matrix helpers
function perspective(fov, aspect, near, far) {
    const f = 1 / Math.tan(fov * Math.PI / 360);
    const nf = 1 / (near - far);
    return new Float32Array([
        f/aspect,0,0,0, 0,f,0,0,
        0,0,(far+near)*nf,-1,
        0,0,2*far*near*nf,0
    ]);
}

function translate(m, x, y, z) {
    m[12] += x; m[13] += y; m[14] += z;
}

function rotateX(m, a) {
    const c = Math.cos(a), s = Math.sin(a);
    const m4=m[4], m5=m[5], m6=m[6], m7=m[7];
    m[4]=m4*c+m[8]*s; m[5]=m5*c+m[9]*s;
    m[6]=m6*c+m[10]*s; m[7]=m7*c+m[11]*s;
    m[8]=m[8]*c-m4*s; m[9]=m[9]*c-m5*s;
    m[10]=m[10]*c-m6*s; m[11]=m[11]*c-m7*s;
}

function rotateY(m, a) {
    const c = Math.cos(a), s = Math.sin(a);
    const m0=m[0], m1=m[1], m2=m[2], m3=m[3];
    m[0]=m0*c-m[8]*s; m[1]=m1*c-m[9]*s;
    m[2]=m2*c-m[10]*s; m[3]=m3*c-m[11]*s;
    m[8]=m0*s+m[8]*c; m[9]=m1*s+m[9]*c;
    m[10]=m2*s+m[10]*c; m[11]=m3*s+m[11]*c;
}

render();
console.log('🎲 WebGL 3D Demo Running!');`;
    } else if (type === '2d') {
        return `// 2D Game - Player Movement Demo
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 25,
    speed: 6,
    color: '#6366f1',
    trail: []
};

const keys = {};
const particles = [];

// Input
window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

// Particle class
class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
        this.life = 1;
        this.color = \`hsl(\${Math.random() * 60 + 240}, 80%, 60%)\`;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= 0.02;
    }
    
    draw() {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 4 * this.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

function update() {
    let dx = 0, dy = 0;
    
    if (keys['w'] || keys['arrowup']) dy -= 1;
    if (keys['s'] || keys['arrowdown']) dy += 1;
    if (keys['a'] || keys['arrowleft']) dx -= 1;
    if (keys['d'] || keys['arrowright']) dx += 1;
    
    if (dx !== 0 || dy !== 0) {
        const len = Math.sqrt(dx*dx + dy*dy);
        player.x += (dx / len) * player.speed;
        player.y += (dy / len) * player.speed;
        
        // Add particles
        if (Math.random() > 0.5) {
            particles.push(new Particle(player.x, player.y));
        }
    }
    
    // Bounds
    player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));
    
    // Trail
    player.trail.push({ x: player.x, y: player.y });
    if (player.trail.length > 20) player.trail.shift();
    
    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        if (particles[i].life <= 0) particles.splice(i, 1);
    }
}

function render() {
    // Background
    ctx.fillStyle = '#0f0f1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Grid
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    
    // Trail
    player.trail.forEach((pos, i) => {
        const alpha = i / player.trail.length * 0.5;
        ctx.fillStyle = \`rgba(99, 102, 241, \${alpha})\`;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, player.radius * (i / player.trail.length), 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Particles
    particles.forEach(p => p.draw());
    
    // Player
    const gradient = ctx.createRadialGradient(
        player.x, player.y, 0,
        player.x, player.y, player.radius
    );
    gradient.addColorStop(0, '#a855f7');
    gradient.addColorStop(1, '#6366f1');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Glow
    ctx.shadowColor = '#6366f1';
    ctx.shadowBlur = 20;
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Instructions
    ctx.fillStyle = '#666';
    ctx.font = '16px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('Use WASD or Arrow keys to move', canvas.width / 2, 30);
}

function gameLoop() {
    update();
    render();
    requestAnimationFrame(gameLoop);
}

gameLoop();
console.log('🎮 2D Game Running!');`;
    } else {
        return `// Web App - Interactive Demo
console.log('📱 Web App Started!');

document.addEventListener('DOMContentLoaded', () => {
    const app = document.getElementById('app');
    
    // Create interactive button
    const button = document.createElement('button');
    button.textContent = '✨ Click Me!';
    button.style.cssText = \`
        margin-top: 30px;
        padding: 16px 32px;
        font-size: 1.1rem;
        font-weight: 600;
        background: linear-gradient(135deg, #6366f1, #a855f7);
        color: white;
        border: none;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
    \`;
    
    let clickCount = 0;
    
    button.addEventListener('mouseenter', () => {
        button.style.transform = 'translateY(-3px) scale(1.05)';
        button.style.boxShadow = '0 8px 25px rgba(99, 102, 241, 0.5)';
    });
    
    button.addEventListener('mouseleave', () => {
        button.style.transform = 'translateY(0) scale(1)';
        button.style.boxShadow = '0 4px 15px rgba(99, 102, 241, 0.4)';
    });
    
    button.addEventListener('click', () => {
        clickCount++;
        
        // Create floating number
        const float = document.createElement('span');
        float.textContent = '+1';
        float.style.cssText = \`
            position: fixed;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            font-size: 2rem;
            font-weight: bold;
            color: #22c55e;
            pointer-events: none;
            animation: floatUp 1s ease-out forwards;
        \`;
        document.body.appendChild(float);
        setTimeout(() => float.remove(), 1000);
        
        button.textContent = \`✨ Clicked \${clickCount} times!\`;
    });
    
    app.appendChild(button);
    
    // Add animation keyframes
    const style = document.createElement('style');
    style.textContent = \`
        @keyframes floatUp {
            0% { opacity: 1; transform: translate(-50%, -50%); }
            100% { opacity: 0; transform: translate(-50%, -150%); }
        }
    \`;
    document.head.appendChild(style);
    
    // Add counter display
    const counter = document.createElement('div');
    counter.style.cssText = \`
        margin-top: 40px;
        padding: 20px;
        background: rgba(255,255,255,0.05);
        border-radius: 12px;
        border: 1px solid rgba(255,255,255,0.1);
    \`;
    counter.innerHTML = '<p style="color:#6366f1;font-size:0.9rem;">Start clicking to see the magic! 🎉</p>';
    app.appendChild(counter);
});`;
    }
}

function renderProjectsList() {
    elements.projectsList.innerHTML = '';
    
    if (projects.length === 0) {
        elements.projectsList.innerHTML = `
            <div class="empty-projects">
                <div class="empty-projects-icon">📁</div>
                <p>No projects yet.<br>Create your first project!</p>
            </div>
        `;
        return;
    }
    
    projects.forEach(project => {
        const item = document.createElement('div');
        item.className = `project-item${project.id === currentProjectId ? ' active' : ''}`;
        
        const date = new Date(project.updatedAt || project.createdAt);
        const dateStr = date.toLocaleDateString();
        
        item.innerHTML = `
            <div class="project-item-name">${escapeHtml(project.name)}</div>
            <div class="project-item-type">${getTypeIcon(project.type)} ${getTypeLabel(project.type)}</div>
            <div class="project-item-date">Last edited: ${dateStr}</div>
        `;
        
        item.addEventListener('click', () => selectProject(project.id));
        elements.projectsList.appendChild(item);
    });
}

function getTypeIcon(type) {
    return { '2d': '🎮', 'app': '📱', 'webgl': '🎲' }[type] || '📄';
}

function getTypeLabel(type) {
    return { '2d': '2D Game', 'app': 'Web App', 'webgl': 'WebGL 3D' }[type] || type;
}

function selectProject(id) {
    currentProjectId = id;
    currentFileIndex = 0;
    
    const project = projects.find(p => p.id === id);
    
    if (project) {
        elements.noProjectMessage.style.display = 'none';
        elements.projectEditor.style.display = 'flex';
        
        elements.projectName.textContent = project.name;
        elements.projectType.textContent = `${getTypeIcon(project.type)} ${getTypeLabel(project.type)}`;
        elements.projectType.className = `project-type-badge type-${project.type}`;
        
        renderFileTabs();
        loadFileContent();
    }
    
    renderProjectsList();
}

function deleteCurrentProject() {
    const project = projects.find(p => p.id === currentProjectId);
    if (!project) return;
    
    if (confirm(`Are you sure you want to delete "${project.name}"?\nThis cannot be undone.`)) {
        projects = projects.filter(p => p.id !== currentProjectId);
        saveProjects();
        currentProjectId = null;
        
        elements.noProjectMessage.style.display = 'flex';
        elements.projectEditor.style.display = 'none';
        
        renderProjectsList();
    }
}

// ==================== FILE FUNCTIONS ====================
function renderFileTabs() {
    const project = projects.find(p => p.id === currentProjectId);
    if (!project) return;
    
    elements.fileTabs.innerHTML = '';
    
    project.files.forEach((file, index) => {
        const tab = document.createElement('div');
        tab.className = `file-tab${index === currentFileIndex ? ' active' : ''}`;
        
        const icon = getFileIcon(file.name);
        
        tab.innerHTML = `
            <span class="file-tab-icon">${icon}</span>
            <span class="file-tab-name">${escapeHtml(file.name)}</span>
            <div class="file-tab-actions">
                <button class="file-tab-btn rename" title="Rename">✏️</button>
                ${project.files.length > 1 ? '<button class="file-tab-btn delete" title="Delete">×</button>' : ''}
            </div>
        `;
        
        tab.addEventListener('click', (e) => {
            if (!e.target.closest('.file-tab-btn')) {
                currentFileIndex = index;
                renderFileTabs();
                loadFileContent();
            }
        });
        
        tab.querySelector('.rename').addEventListener('click', (e) => {
            e.stopPropagation();
            openFileRename(index);
        });
        
        const deleteBtn = tab.querySelector('.delete');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteFile(index);
            });
        }
        
        elements.fileTabs.appendChild(tab);
    });
}

function getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const icons = {
        'html': '🌐',
        'css': '🎨',
        'js': '⚡',
        'json': '📋',
        'md': '📝',
        'txt': '📄'
    };
    return icons[ext] || '📄';
}

function loadFileContent() {
    const project = projects.find(p => p.id === currentProjectId);
    if (!project || !project.files[currentFileIndex]) return;
    
    elements.codeEditor.value = project.files[currentFileIndex].content;
    updateCurrentFileName();
}

function updateCurrentFileName() {
    const project = projects.find(p => p.id === currentProjectId);
    if (!project || !project.files[currentFileIndex]) return;
    
    elements.currentFileName.textContent = project.files[currentFileIndex].name;
}

function addFile() {
    const project = projects.find(p => p.id === currentProjectId);
    if (!project) return;
    
    const fileName = document.getElementById('newFileName').value.trim();
    if (!fileName) {
        alert('Please enter a file name');
        return;
    }
    
    // Check for duplicate
    if (project.files.some(f => f.name.toLowerCase() === fileName.toLowerCase())) {
        alert('A file with this name already exists!');
        return;
    }
    
    project.files.push({
        name: fileName,
        content: getDefaultFileContent(fileName)
    });
    
    project.updatedAt = new Date().toISOString();
    saveProjects();
    currentFileIndex = project.files.length - 1;
    renderFileTabs();
    loadFileContent();
    closeAddFileModal();
}

function getDefaultFileContent(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    
    if (ext === 'js') return '// JavaScript\n\n';
    if (ext === 'css') return '/* Styles */\n\n';
    if (ext === 'html') return '<!DOCTYPE html>\n<html>\n<head>\n    <title></title>\n</head>\n<body>\n    \n</body>\n</html>';
    if (ext === 'json') return '{\n    \n}';
    
    return '';
}

function deleteFile(index) {
    const project = projects.find(p => p.id === currentProjectId);
    if (!project || project.files.length <= 1) return;
    
    const fileName = project.files[index].name;
    if (confirm(`Delete "${fileName}"?`)) {
        project.files.splice(index, 1);
        project.updatedAt = new Date().toISOString();
        saveProjects();
        
        if (currentFileIndex >= project.files.length) {
            currentFileIndex = project.files.length - 1;
        }
        
        renderFileTabs();
        loadFileContent();
    }
}

// ==================== RUN PROJECT ====================
function runProject() {
    const project = projects.find(p => p.id === currentProjectId);
    if (!project) return;
    
    // Find HTML file
    let htmlFile = project.files.find(f => f.name === 'index.html') || 
                   project.files.find(f => f.name.endsWith('.html'));
    
    if (!htmlFile) {
        alert('No HTML file found in project!');
        return;
    }
    
    let html = htmlFile.content;
    
    // Inline CSS files
    project.files.filter(f => f.name.endsWith('.css')).forEach(cssFile => {
        const linkRegex = new RegExp(
            `<link[^>]*href=["']${escapeRegex(cssFile.name)}["'][^>]*>`, 'gi'
        );
        html = html.replace(linkRegex, `<style>\n${cssFile.content}\n</style>`);
    });
    
    // Inline JS files
    project.files.filter(f => f.name.endsWith('.js')).forEach(jsFile => {
        const scriptRegex = new RegExp(
            `<script[^>]*src=["']${escapeRegex(jsFile.name)}["'][^>]*></script>`, 'gi'
        );
        html = html.replace(scriptRegex, `<script>\n${jsFile.content}\n<\/script>`);
    });
    
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    if (project.type === 'webgl') {
        // Show in embedded test window
        elements.webglOverlay.style.display = 'flex';
        elements.webglFrame.src = url;
    } else {
        // Open in new tab
        window.open(url, '_blank');
    }
}

function closeWebglWindow() {
    elements.webglOverlay.style.display = 'none';
    elements.webglFrame.src = 'about:blank';
}

function refreshWebgl() {
    runProject();
}

// ==================== UTILITIES ====================
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
