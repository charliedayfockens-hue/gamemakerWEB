// WebGL Game Editor - Main Application
class GameEditor {
    constructor() {
        this.projects = [];
        this.currentProject = null;
        this.currentFile = null;
        this.openTabs = [];
        this.contextTarget = null;
        this.contextType = null;
        
        this.init();
    }
    
    init() {
        this.loadFromStorage();
        this.bindEvents();
        this.renderProjects();
        this.updateLineNumbers();
    }
    
    // Storage Methods
    loadFromStorage() {
        const saved = localStorage.getItem('gameEditorProjects');
        if (saved) {
            this.projects = JSON.parse(saved);
        }
    }
    
    saveToStorage() {
        localStorage.setItem('gameEditorProjects', JSON.stringify(this.projects));
        this.showToast('Project saved', 'success');
    }
    
    // Event Binding
    bindEvents() {
        // Header Buttons
        document.getElementById('newProjectBtn').addEventListener('click', () => this.showModal('newProjectModal'));
        document.getElementById('runProjectBtn').addEventListener('click', () => this.runProject());
        
        // New Project Modal
        document.getElementById('createProjectBtn').addEventListener('click', () => this.createProject());
        document.getElementById('cancelProjectBtn').addEventListener('click', () => this.hideModal('newProjectModal'));
        document.getElementById('projectTypeSelect').addEventListener('change', (e) => this.updateProjectTypeInfo(e.target.value));
        
        // Rename Modal
        document.getElementById('confirmRenameBtn').addEventListener('click', () => this.confirmRename());
        document.getElementById('cancelRenameBtn').addEventListener('click', () => this.hideModal('renameModal'));
        
        // Add File Modal
        document.getElementById('addFileBtn').addEventListener('click', () => this.showModal('addFileModal'));
        document.getElementById('confirmAddFileBtn').addEventListener('click', () => this.addFile());
        document.getElementById('cancelAddFileBtn').addEventListener('click', () => this.hideModal('addFileModal'));
        
        // Template Buttons
        document.querySelectorAll('.template-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const ext = e.target.dataset.ext;
                document.getElementById('newFileNameInput').value = 'newfile' + ext;
            });
        });
        
        // Modal Close Buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.hideModal(e.target.dataset.modal);
            });
        });
        
        // Modal Overlays
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    modal.classList.remove('active');
                }
            });
        });
        
        // Code Editor
        const editor = document.getElementById('codeEditor');
        editor.addEventListener('input', () => this.onEditorChange());
        editor.addEventListener('keydown', (e) => this.handleEditorKeydown(e));
        editor.addEventListener('scroll', () => this.syncLineNumbers());
        editor.addEventListener('click', () => this.updateCursorPosition());
        editor.addEventListener('keyup', () => this.updateCursorPosition());
        
        // Context Menu
        document.addEventListener('click', () => this.hideContextMenu());
        document.querySelectorAll('.context-menu-item').forEach(item => {
            item.addEventListener('click', (e) => this.handleContextAction(e.currentTarget.dataset.action));
        });
        
        // Keyboard Shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.saveToStorage();
            }
        });
        
        // Enter key in modals
        document.getElementById('projectNameInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.createProject();
        });
        document.getElementById('renameInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.confirmRename();
        });
        document.getElementById('newFileNameInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.addFile();
        });
    }
    
    // Modal Methods
    showModal(modalId) {
        document.getElementById(modalId).classList.add('active');
        const input = document.querySelector(`#${modalId} input`);
        if (input) {
            input.focus();
            input.value = '';
        }
    }
    
    hideModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
    }
    
    // Project Methods
    createProject() {
        const nameInput = document.getElementById('projectNameInput');
        const typeSelect = document.getElementById('projectTypeSelect');
        
        const name = nameInput.value.trim();
        const type = typeSelect.value;
        
        if (!name) {
            this.showToast('Please enter a project name', 'error');
            return;
        }
        
        const project = {
            id: Date.now().toString(),
            name: name,
            type: type,
            files: this.getDefaultFiles(type),
            createdAt: new Date().toISOString()
        };
        
        this.projects.push(project);
        this.saveToStorage();
        this.hideModal('newProjectModal');
        this.renderProjects();
        this.selectProject(project.id);
        this.showToast(`Project "${name}" created!`, 'success');
    }
    
    getDefaultFiles(type) {
        const files = [
            { name: 'index.html', content: this.getHTMLTemplate(type) },
            { name: 'styles.css', content: this.getCSSTemplate(type) },
            { name: 'main.js', content: this.getJSTemplate(type) }
        ];
        return files;
    }
    
    getHTMLTemplate(type) {
        const titles = { '2d': '2D Game', 'app': 'Web App', '3d': 'WebGL 3D Game' };
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${titles[type]}</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    ${type === '2d' ? '<canvas id="gameCanvas"></canvas>' : ''}
    ${type === '3d' ? '<canvas id="glCanvas"></canvas>' : ''}
    ${type === 'app' ? '<div id="app">\n        <h1>Welcome to My App</h1>\n    </div>' : ''}
    <script src="main.js"><\/script>
</body>
</html>`;
    }
    
    getCSSTemplate(type) {
        let css = `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: Arial, sans-serif;
    background: #1a1a2e;
    color: white;
    min-height: 100vh;
`;
        
        if (type === '2d' || type === '3d') {
            css += `    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
}

canvas {
    border: 2px solid #4a4a6a;
    border-radius: 8px;
}`;
        } else {
            css += `}

#app {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

h1 {
    text-align: center;
    margin-top: 50px;
}`;
        }
        
        return css;
    }
    
    getJSTemplate(type) {
        if (type === '2d') {
            return `// 2D Game Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

// Game variables
let player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: 30,
    speed: 5,
    color: '#6366f1'
};

let keys = {};

// Input handling
document.addEventListener('keydown', (e) => keys[e.key] = true);
document.addEventListener('keyup', (e) => keys[e.key] = false);

// Game loop
function gameLoop() {
    update();
    render();
    requestAnimationFrame(gameLoop);
}

function update() {
    if (keys['ArrowUp'] || keys['w']) player.y -= player.speed;
    if (keys['ArrowDown'] || keys['s']) player.y += player.speed;
    if (keys['ArrowLeft'] || keys['a']) player.x -= player.speed;
    if (keys['ArrowRight'] || keys['d']) player.x += player.speed;
    
    // Keep player in bounds
    player.x = Math.max(player.size, Math.min(canvas.width - player.size, player.x));
    player.y = Math.max(player.size, Math.min(canvas.height - player.size, player.y));
}

function render() {
    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw player
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw instructions
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.fillText('Use WASD or Arrow keys to move', 20, 30);
}

// Start game
gameLoop();
console.log('2D Game initialized!');`;
        } else if (type === '3d') {
            return `// WebGL 3D Game Setup
const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

canvas.width = 800;
canvas.height = 600;

if (!gl) {
    alert('WebGL not supported!');
    throw new Error('WebGL not supported');
}

// Vertex shader
const vsSource = \`
    attribute vec4 aVertexPosition;
    attribute vec4 aVertexColor;
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    varying lowp vec4 vColor;
    void main() {
        gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
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

// Shader compilation helper
function loadShader(gl, type, source) {
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

// Initialize shaders
const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

const shaderProgram = gl.createProgram();
gl.attachShader(shaderProgram, vertexShader);
gl.attachShader(shaderProgram, fragmentShader);
gl.linkProgram(shaderProgram);

if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.error('Shader program error:', gl.getProgramInfoLog(shaderProgram));
}

// Get attribute/uniform locations
const programInfo = {
    program: shaderProgram,
    attribLocations: {
        vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
        vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor'),
    },
    uniformLocations: {
        projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
        modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
    },
};

// Create cube buffers
function initBuffers(gl) {
    const positions = [
        // Front face
        -1, -1,  1,   1, -1,  1,   1,  1,  1,  -1,  1,  1,
        // Back face
        -1, -1, -1,  -1,  1, -1,   1,  1, -1,   1, -1, -1,
        // Top face
        -1,  1, -1,  -1,  1,  1,   1,  1,  1,   1,  1, -1,
        // Bottom face
        -1, -1, -1,   1, -1, -1,   1, -1,  1,  -1, -1,  1,
        // Right face
         1, -1, -1,   1,  1, -1,   1,  1,  1,   1, -1,  1,
        // Left face
        -1, -1, -1,  -1, -1,  1,  -1,  1,  1,  -1,  1, -1,
    ];
    
    const colors = [
        [1, 0, 0, 1], [0, 1, 0, 1], [0, 0, 1, 1],
        [1, 1, 0, 1], [1, 0, 1, 1], [0, 1, 1, 1],
    ];
    
    let generatedColors = [];
    for (let j = 0; j < 6; j++) {
        const c = colors[j];
        for (let i = 0; i < 4; i++) {
            generatedColors = generatedColors.concat(c);
        }
    }
    
    const indices = [
        0,  1,  2,    0,  2,  3,
        4,  5,  6,    4,  6,  7,
        8,  9, 10,    8, 10, 11,
        12, 13, 14,   12, 14, 15,
        16, 17, 18,   16, 18, 19,
        20, 21, 22,   20, 22, 23,
    ];
    
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(generatedColors), gl.STATIC_DRAW);
    
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    
    return { position: positionBuffer, color: colorBuffer, indices: indexBuffer };
}

const buffers = initBuffers(gl);

// Simple matrix functions
function perspective(fov, aspect, near, far) {
    const f = 1.0 / Math.tan(fov / 2);
    const nf = 1 / (near - far);
    return [
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (far + near) * nf, -1,
        0, 0, 2 * far * near * nf, 0
    ];
}

function translate(m, v) {
    const result = [...m];
    result[12] = m[0] * v[0] + m[4] * v[1] + m[8] * v[2] + m[12];
    result[13] = m[1] * v[0] + m[5] * v[1] + m[9] * v[2] + m[13];
    result[14] = m[2] * v[0] + m[6] * v[1] + m[10] * v[2] + m[14];
    return result;
}

function rotateY(m, angle) {
    const s = Math.sin(angle);
    const c = Math.cos(angle);
    const result = [...m];
    result[0] = m[0] * c - m[8] * s;
    result[1] = m[1] * c - m[9] * s;
    result[2] = m[2] * c - m[10] * s;
    result[8] = m[0] * s + m[8] * c;
    result[9] = m[1] * s + m[9] * c;
    result[10] = m[2] * s + m[10] * c;
    return result;
}

function rotateX(m, angle) {
    const s = Math.sin(angle);
    const c = Math.cos(angle);
    const result = [...m];
    result[4] = m[4] * c + m[8] * s;
    result[5] = m[5] * c + m[9] * s;
    result[6] = m[6] * c + m[10] * s;
    result[8] = m[8] * c - m[4] * s;
    result[9] = m[9] * c - m[5] * s;
    result[10] = m[10] * c - m[6] * s;
    return result;
}

let rotation = 0;

function render(time) {
    time *= 0.001;
    rotation = time;
    
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.1, 0.1, 0.15, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    const projectionMatrix = perspective(45 * Math.PI / 180, canvas.width / canvas.height, 0.1, 100.0);
    let modelViewMatrix = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
    modelViewMatrix = translate(modelViewMatrix, [0, 0, -6]);
    modelViewMatrix = rotateY(modelViewMatrix, rotation);
    modelViewMatrix = rotateX(modelViewMatrix, rotation * 0.7);
    
    // Bind position buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
    
    // Bind color buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
    gl.vertexAttribPointer(programInfo.attribLocations.vertexColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
    gl.useProgram(programInfo.program);
    
    gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
    gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
    
    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
    
    requestAnimationFrame(render);
}

requestAnimationFrame(render);
console.log('WebGL 3D Game initialized!');`;
        } else {
            return `// Web App JavaScript
document.addEventListener('DOMContentLoaded', () => {
    console.log('App initialized!');
    
    const app = document.getElementById('app');
    
    // Add some interactive content
    const button = document.createElement('button');
    button.textContent = 'Click Me!';
    button.style.cssText = \`
        display: block;
        margin: 30px auto;
        padding: 15px 30px;
        font-size: 18px;
        background: #6366f1;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: transform 0.2s, background 0.2s;
    \`;
    
    button.addEventListener('mouseover', () => {
        button.style.background = '#818cf8';
        button.style.transform = 'scale(1.05)';
    });
    
    button.addEventListener('mouseout', () => {
        button.style.background = '#6366f1';
        button.style.transform = 'scale(1)';
    });
    
    let clickCount = 0;
    button.addEventListener('click', () => {
        clickCount++;
        button.textContent = \`Clicked \${clickCount} times!\`;
    });
    
    app.appendChild(button);
});`;
        }
    }
    
    selectProject(projectId) {
        this.currentProject = this.projects.find(p => p.id === projectId);
        this.openTabs = [];
        this.currentFile = null;
        
        this.renderProjects();
        this.renderFiles();
        
        document.getElementById('filesSection').style.display = this.currentProject ? 'flex' : 'none';
        
        if (this.currentProject && this.currentProject.files.length > 0) {
            this.openFile(this.currentProject.files[0].name);
        } else {
            document.getElementById('codeEditor').value = '';
            this.renderTabs();
        }
    }
    
    updateProjectTypeInfo(type) {
        const info = document.getElementById('projectTypeInfo');
        const descriptions = {
            '2d': 'Create a 2D canvas-based game with sprite rendering capabilities.',
            'app': 'Build a web application with HTML, CSS, and JavaScript.',
            '3d': 'Create a WebGL-powered 3D game with shaders and 3D rendering.'
        };
        info.innerHTML = `<p>${descriptions[type]}</p>`;
    }
    
    // File Methods
    addFile() {
        if (!this.currentProject) {
            this.showToast('Please select a project first', 'error');
            return;
        }
        
        const nameInput = document.getElementById('newFileNameInput');
        let name = nameInput.value.trim();
        
        if (!name) {
            this.showToast('Please enter a file name', 'error');
            return;
        }
        
        // Check for duplicate
        if (this.currentProject.files.find(f => f.name === name)) {
            this.showToast('File already exists', 'error');
            return;
        }
        
        const file = {
            name: name,
            content: this.getFileTemplate(name)
        };
        
        this.currentProject.files.push(file);
        this.saveToStorage();
        this.hideModal('addFileModal');
        this.renderFiles();
        this.openFile(name);
        this.showToast(`File "${name}" created!`, 'success');
    }
    
    getFileTemplate(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        switch (ext) {
            case 'html':
                return '<!DOCTYPE html>\n<html>\n<head>\n    <title>New Page</title>\n</head>\n<body>\n    \n</body>\n</html>';
            case 'css':
                return '/* Styles */\n';
            case 'js':
                return '// JavaScript\n';
            case 'json':
                return '{\n    \n}';
            default:
                return '';
        }
    }
    
    openFile(fileName) {
        if (!this.currentProject) return;
        
        const file = this.currentProject.files.find(f => f.name === fileName);
        if (!file) return;
        
        this.currentFile = file;
        
        // Add to tabs if not already open
        if (!this.openTabs.includes(fileName)) {
            this.openTabs.push(fileName);
        }
        
        document.getElementById('codeEditor').value = file.content;
        this.updateLineNumbers();
        this.renderTabs();
        this.renderFiles();
        this.updateFileInfo();
    }
    
    closeTab(fileName) {
        const index = this.openTabs.indexOf(fileName);
        if (index > -1) {
            this.openTabs.splice(index, 1);
        }
        
        if (this.currentFile && this.currentFile.name === fileName) {
            if (this.openTabs.length > 0) {
                this.openFile(this.openTabs[this.openTabs.length - 1]);
            } else {
                this.currentFile = null;
                document.getElementById('codeEditor').value = '';
            }
        }
        
        this.renderTabs();
    }
    
    // Editor Methods
    onEditorChange() {
        if (this.currentFile) {
            this.currentFile.content = document.getElementById('codeEditor').value;
            this.updateLineNumbers();
            
            // Auto-save after delay
            clearTimeout(this.saveTimeout);
            this.saveTimeout = setTimeout(() => {
                this.saveToStorage();
            }, 1000);
        }
    }
    
    handleEditorKeydown(e) {
        const editor = document.getElementById('codeEditor');
        
        // Tab key - insert spaces
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = editor.selectionStart;
            const end = editor.selectionEnd;
            editor.value = editor.value.substring(0, start) + '    ' + editor.value.substring(end);
            editor.selectionStart = editor.selectionEnd = start + 4;
            this.onEditorChange();
        }
        
        // Auto-close brackets
        const pairs = { '(': ')', '[': ']', '{': '}', '"': '"', "'": "'" };
        if (pairs[e.key]) {
            e.preventDefault();
            const start = editor.selectionStart;
            const end = editor.selectionEnd;
            const selected = editor.value.substring(start, end);
            editor.value = editor.value.substring(0, start) + e.key + selected + pairs[e.key] + editor.value.substring(end);
            editor.selectionStart = editor.selectionEnd = start + 1;
            this.onEditorChange();
        }
    }
    
    updateLineNumbers() {
        const editor = document.getElementById('codeEditor');
        const lines = editor.value.split('\n').length;
        const lineNumbers = document.getElementById('lineNumbers');
        
        let html = '';
        for (let i = 1; i <= lines; i++) {
            html += i + '\n';
        }
        lineNumbers.textContent = html;
    }
    
    syncLineNumbers() {
        const editor = document.getElementById('codeEditor');
        const lineNumbers = document.getElementById('lineNumbers');
        lineNumbers.scrollTop = editor.scrollTop;
    }
    
    updateCursorPosition() {
        const editor = document.getElementById('codeEditor');
        const value = editor.value.substring(0, editor.selectionStart);
        const lines = value.split('\n');
        const line = lines.length;
        const col = lines[lines.length - 1].length + 1;
        
        document.getElementById('cursorPosition').textContent = `Ln ${line}, Col ${col}`;
    }
    
    updateFileInfo() {
        const fileInfo = document.getElementById('currentFileInfo');
        const fileType = document.getElementById('fileType');
        
        if (this.currentFile) {
            const ext = this.currentFile.name.split('.').pop().toUpperCase();
            fileType.textContent = ext;
            fileInfo.textContent = this.currentFile.name;
        } else {
            fileType.textContent = '--';
            fileInfo.textContent = '';
        }
    }
    
    // Render Methods
    renderProjects() {
        const container = document.getElementById('projectsList');
        
        if (this.projects.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📁</div>
                    <div class="empty-state-text">No projects yet.<br>Create your first project!</div>
                </div>
            `;
            return;
        }
        
        const icons = { '2d': '🎮', 'app': '📱', '3d': '🎲' };
        const types = { '2d': '2D Game', 'app': 'Web App', '3d': 'WebGL 3D' };
        
        container.innerHTML = this.projects.map(project => `
            <div class="project-item ${this.currentProject?.id === project.id ? 'active' : ''}" 
                 data-id="${project.id}"
                 oncontextmenu="editor.showContextMenu(event, 'project', '${project.id}')">
                <span class="project-icon">${icons[project.type]}</span>
                <div class="project-info">
                    <div class="project-name">${project.name}</div>
                    <div class="project-type">${types[project.type]}</div>
                </div>
            </div>
        `).join('');
        
        container.querySelectorAll('.project-item').forEach(item => {
            item.addEventListener('click', () => this.selectProject(item.dataset.id));
        });
    }
    
    renderFiles() {
        const container = document.getElementById('filesList');
        
        if (!this.currentProject) {
            container.innerHTML = '';
            return;
        }
        
        const icons = {
            'html': '📄',
            'css': '🎨',
            'js': '⚡',
            'json': '📋',
            'default': '📝'
        };
        
        container.innerHTML = this.currentProject.files.map(file => {
            const ext = file.name.split('.').pop().toLowerCase();
            const icon = icons[ext] || icons.default;
            return `
                <div class="file-item ${this.currentFile?.name === file.name ? 'active' : ''}"
                     data-name="${file.name}"
                     oncontextmenu="editor.showContextMenu(event, 'file', '${file.name}')">
                    <span class="file-icon">${icon}</span>
                    <span class="file-name">${file.name}</span>
                </div>
            `;
        }).join('');
        
        container.querySelectorAll('.file-item').forEach(item => {
            item.addEventListener('click', () => this.openFile(item.dataset.name));
        });
    }
    
    renderTabs() {
        const container = document.getElementById('filesTabs');
        
        const icons = {
            'html': '📄',
            'css': '🎨',
            'js': '⚡',
            'json': '📋',
            'default': '📝'
        };
        
        container.innerHTML = this.openTabs.map(fileName => {
            const ext = fileName.split('.').pop().toLowerCase();
            const icon = icons[ext] || icons.default;
            return `
                <div class="file-tab ${this.currentFile?.name === fileName ? 'active' : ''}" data-name="${fileName}">
                    <span>${icon}</span>
                    <span>${fileName}</span>
                    <span class="tab-close" data-close="${fileName}">&times;</span>
                </div>
            `;
        }).join('');
        
        container.querySelectorAll('.file-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                if (!e.target.classList.contains('tab-close')) {
                    this.openFile(tab.dataset.name);
                }
            });
        });
        
        container.querySelectorAll('.tab-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.closeTab(btn.dataset.close);
            });
        });
    }
    
    // Context Menu
    showContextMenu(event, type, target) {
        event.preventDefault();
        
        this.contextType = type;
        this.contextTarget = target;
        
        const menu = document.getElementById('contextMenu');
        menu.style.left = event.pageX + 'px';
        menu.style.top = event.pageY + 'px';
        menu.classList.add('active');
    }
    
    hideContextMenu() {
        document.getElementById('contextMenu').classList.remove('active');
    }
    
    handleContextAction(action) {
        this.hideContextMenu();
        
        switch (action) {
            case 'rename':
                this.showRenameModal();
                break;
            case 'duplicate':
                this.duplicateItem();
                break;
            case 'delete':
                this.deleteItem();
                break;
        }
    }
    
    showRenameModal() {
        const title = document.getElementById('renameTitle');
        const input = document.getElementById('renameInput');
        
        if (this.contextType === 'project') {
            const project = this.projects.find(p => p.id === this.contextTarget);
            title.textContent = '✏️ Rename Project';
            input.value = project?.name || '';
        } else {
            title.textContent = '✏️ Rename File';
            input.value = this.contextTarget || '';
        }
        
        this.showModal('renameModal');
    }
    
    confirmRename() {
        const newName = document.getElementById('renameInput').value.trim();
        
        if (!newName) {
            this.showToast('Please enter a name', 'error');
            return;
        }
        
        if (this.contextType === 'project') {
            const project = this.projects.find(p => p.id === this.contextTarget);
            if (project) {
                project.name = newName;
                this.saveToStorage();
                this.renderProjects();
                this.showToast('Project renamed!', 'success');
            }
        } else {
            if (this.currentProject) {
                const file = this.currentProject.files.find(f => f.name === this.contextTarget);
                if (file) {
                    const oldName = file.name;
                    file.name = newName;
                    
                    // Update tabs
                    const tabIndex = this.openTabs.indexOf(oldName);
                    if (tabIndex > -1) {
                        this.openTabs[tabIndex] = newName;
                    }
                    
                    if (this.currentFile?.name === oldName) {
                        this.currentFile = file;
                    }
                    
                    this.saveToStorage();
                    this.renderFiles();
                    this.renderTabs();
                    this.showToast('File renamed!', 'success');
                }
            }
        }
        
        this.hideModal('renameModal');
    }
    
    duplicateItem() {
        if (this.contextType === 'project') {
            const project = this.projects.find(p => p.id === this.contextTarget);
            if (project) {
                const newProject = {
                    ...JSON.parse(JSON.stringify(project)),
                    id: Date.now().toString(),
                    name: project.name + ' (Copy)',
                    createdAt: new Date().toISOString()
                };
                this.projects.push(newProject);
                this.saveToStorage();
                this.renderProjects();
                this.showToast('Project duplicated!', 'success');
            }
        } else {
            if (this.currentProject) {
                const file = this.currentProject.files.find(f => f.name === this.contextTarget);
                if (file) {
                    const ext = file.name.includes('.') ? '.' + file.name.split('.').pop() : '';
                    const baseName = file.name.replace(ext, '');
                    const newFile = {
                        name: baseName + '_copy' + ext,
                        content: file.content
                    };
                    this.currentProject.files.push(newFile);
                    this.saveToStorage();
                    this.renderFiles();
                    this.showToast('File duplicated!', 'success');
                }
            }
        }
    }
    
    deleteItem() {
        if (this.contextType === 'project') {
            const index = this.projects.findIndex(p => p.id === this.contextTarget);
            if (index > -1) {
                const name = this.projects[index].name;
                this.projects.splice(index, 1);
                
                if (this.currentProject?.id === this.contextTarget) {
                    this.currentProject = null;
                    this.currentFile = null;
                    this.openTabs = [];
                    document.getElementById('codeEditor').value = '';
                    document.getElementById('filesSection').style.display = 'none';
                }
                
                this.saveToStorage();
                this.renderProjects();
                this.renderTabs();
                this.showToast(`Project "${name}" deleted`, 'info');
            }
        } else {
            if (this.currentProject) {
                const index = this.currentProject.files.findIndex(f => f.name === this.contextTarget);
                if (index > -1) {
                    const name = this.currentProject.files[index].name;
                    this.currentProject.files.splice(index, 1);
                    
                    // Close tab if open
                    this.closeTab(this.contextTarget);
                    
                    this.saveToStorage();
                    this.renderFiles();
                    this.showToast(`File "${name}" deleted`, 'info');
                }
            }
        }
    }
    
    // Run Project
    runProject() {
        if (!this.currentProject) {
            this.showToast('Please select a project first', 'error');
            return;
        }
        
        const htmlFile = this.currentProject.files.find(f => f.name.endsWith('.html'));
        if (!htmlFile) {
            this.showToast('No HTML file found in project', 'error');
            return;
        }
        
        // Build the HTML with embedded CSS and JS
        let html = htmlFile.content;
        
        // Inject CSS files
        this.currentProject.files.filter(f => f.name.endsWith('.css')).forEach(file => {
            const linkTag = new RegExp(`<link[^>]*href=["']${file.name}["'][^>]*>`, 'gi');
            const styleContent = `<style>\n${file.content}\n</style>`;
            html = html.replace(linkTag, styleContent);
        });
        
        // Inject JS files
        this.currentProject.files.filter(f => f.name.endsWith('.js')).forEach(file => {
            const scriptTag = new RegExp(`<script[^>]*src=["']${file.name}["'][^>]*><\\/script>`, 'gi');
            const scriptContent = `<script>\n${file.content}\n<\/script>`;
            html = html.replace(scriptTag, scriptContent);
        });
        
        // Create blob and run
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        
        if (this.currentProject.type === '3d') {
            // Open in popup window for WebGL
            const width = 900;
            const height = 700;
            const left = (screen.width - width) / 2;
            const top = (screen.height - height) / 2;
            
            const popup = window.open(
                url,
                'WebGL Preview',
                `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no`
            );
            
            if (popup) {
                popup.focus();
                this.showToast('WebGL preview opened in popup window', 'success');
            } else {
                this.showToast('Popup blocked! Please allow popups for this site.', 'error');
            }
        } else {
            // Open in new tab for 2D and App
            const newTab = window.open(url, '_blank');
            if (newTab) {
                newTab.focus();
                this.showToast('Project opened in new tab', 'success');
            } else {
                this.showToast('Popup blocked! Please allow popups for this site.', 'error');
            }
        }
        
        // Clean up URL after a delay
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
    
    // Toast Notifications
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        
        const icons = {
            success: '✓',
            error: '✕',
            info: 'ℹ'
        };
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${icons[type]}</span>
            <span class="toast-message">${message}</span>
        `;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'toastSlideIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Initialize editor
const editor = new GameEditor();
