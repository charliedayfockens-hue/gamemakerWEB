// WebGL Game Editor - Main Application
class GameEditor {
    constructor() {
        this.projects = [];
        this.currentProject = null;
        this.currentFile = null;
        this.openTabs = [];
        this.contextTarget = null;
        this.contextType = null;
        this.saveTimeout = null;
        
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
        try {
            const saved = localStorage.getItem('gameEditorProjects');
            if (saved) {
                this.projects = JSON.parse(saved);
            }
        } catch (e) {
            console.error('Error loading from storage:', e);
            this.projects = [];
        }
    }
    
    saveToStorage() {
        try {
            localStorage.setItem('gameEditorProjects', JSON.stringify(this.projects));
        } catch (e) {
            console.error('Error saving to storage:', e);
        }
    }
    
    // Event Binding
    bindEvents() {
        // Header Buttons
        const newProjectBtn = document.getElementById('newProjectBtn');
        const runProjectBtn = document.getElementById('runProjectBtn');
        
        if (newProjectBtn) {
            newProjectBtn.addEventListener('click', () => {
                this.showModal('newProjectModal');
            });
        }
        
        if (runProjectBtn) {
            runProjectBtn.addEventListener('click', () => {
                this.runProject();
            });
        }
        
        // New Project Modal
        const createProjectBtn = document.getElementById('createProjectBtn');
        const cancelProjectBtn = document.getElementById('cancelProjectBtn');
        const projectTypeSelect = document.getElementById('projectTypeSelect');
        
        if (createProjectBtn) {
            createProjectBtn.addEventListener('click', () => {
                this.createProject();
            });
        }
        
        if (cancelProjectBtn) {
            cancelProjectBtn.addEventListener('click', () => {
                this.hideModal('newProjectModal');
            });
        }
        
        if (projectTypeSelect) {
            projectTypeSelect.addEventListener('change', (e) => {
                this.updateProjectTypeInfo(e.target.value);
            });
        }
        
        // Rename Modal
        const confirmRenameBtn = document.getElementById('confirmRenameBtn');
        const cancelRenameBtn = document.getElementById('cancelRenameBtn');
        
        if (confirmRenameBtn) {
            confirmRenameBtn.addEventListener('click', () => {
                this.confirmRename();
            });
        }
        
        if (cancelRenameBtn) {
            cancelRenameBtn.addEventListener('click', () => {
                this.hideModal('renameModal');
            });
        }
        
        // Add File Modal
        const addFileBtn = document.getElementById('addFileBtn');
        const confirmAddFileBtn = document.getElementById('confirmAddFileBtn');
        const cancelAddFileBtn = document.getElementById('cancelAddFileBtn');
        
        if (addFileBtn) {
            addFileBtn.addEventListener('click', () => {
                this.showModal('addFileModal');
            });
        }
        
        if (confirmAddFileBtn) {
            confirmAddFileBtn.addEventListener('click', () => {
                this.addFile();
            });
        }
        
        if (cancelAddFileBtn) {
            cancelAddFileBtn.addEventListener('click', () => {
                this.hideModal('addFileModal');
            });
        }
        
        // Template Buttons
        document.querySelectorAll('.template-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const ext = e.target.dataset.ext;
                const input = document.getElementById('newFileNameInput');
                if (input) {
                    input.value = 'newfile' + ext;
                }
            });
        });
        
        // Modal Close Buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modalId = e.target.dataset.modal;
                if (modalId) {
                    this.hideModal(modalId);
                }
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
        if (editor) {
            editor.addEventListener('input', () => this.onEditorChange());
            editor.addEventListener('keydown', (e) => this.handleEditorKeydown(e));
            editor.addEventListener('scroll', () => this.syncLineNumbers());
            editor.addEventListener('click', () => this.updateCursorPosition());
            editor.addEventListener('keyup', () => this.updateCursorPosition());
        }
        
        // Context Menu
        document.addEventListener('click', () => this.hideContextMenu());
        document.querySelectorAll('.context-menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                if (action) {
                    this.handleContextAction(action);
                }
            });
        });
        
        // Keyboard Shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.saveToStorage();
                this.showToast('Project saved', 'success');
            }
        });
        
        // Enter key in modals
        const projectNameInput = document.getElementById('projectNameInput');
        const renameInput = document.getElementById('renameInput');
        const newFileNameInput = document.getElementById('newFileNameInput');
        
        if (projectNameInput) {
            projectNameInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') this.createProject();
            });
        }
        
        if (renameInput) {
            renameInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') this.confirmRename();
            });
        }
        
        if (newFileNameInput) {
            newFileNameInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') this.addFile();
            });
        }
    }
    
    // Modal Methods
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            const input = modal.querySelector('input');
            if (input) {
                input.focus();
                input.value = '';
            }
        }
    }
    
    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    }
    
    // Project Methods
    createProject() {
        const nameInput = document.getElementById('projectNameInput');
        const typeSelect = document.getElementById('projectTypeSelect');
        
        if (!nameInput || !typeSelect) {
            console.error('Form elements not found');
            return;
        }
        
        const name = nameInput.value.trim();
        const type = typeSelect.value;
        
        if (!name) {
            this.showToast('Please enter a project name', 'error');
            nameInput.focus();
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
        this.showToast('Project "' + name + '" created!', 'success');
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
        var titles = { '2d': '2D Game', 'app': 'Web App', '3d': 'WebGL 3D Game' };
        var html = '<!DOCTYPE html>\n';
        html += '<html lang="en">\n';
        html += '<head>\n';
        html += '    <meta charset="UTF-8">\n';
        html += '    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n';
        html += '    <title>' + titles[type] + '</title>\n';
        html += '    <link rel="stylesheet" href="styles.css">\n';
        html += '</head>\n';
        html += '<body>\n';
        
        if (type === '2d') {
            html += '    <canvas id="gameCanvas"></canvas>\n';
        } else if (type === '3d') {
            html += '    <canvas id="glCanvas"></canvas>\n';
        } else {
            html += '    <div id="app">\n';
            html += '        <h1>Welcome to My App</h1>\n';
            html += '    </div>\n';
        }
        
        html += '    <script src="main.js"><\/script>\n';
        html += '</body>\n';
        html += '</html>';
        
        return html;
    }
    
    getCSSTemplate(type) {
        var css = '* {\n';
        css += '    margin: 0;\n';
        css += '    padding: 0;\n';
        css += '    box-sizing: border-box;\n';
        css += '}\n\n';
        css += 'body {\n';
        css += '    font-family: Arial, sans-serif;\n';
        css += '    background: #1a1a2e;\n';
        css += '    color: white;\n';
        css += '    min-height: 100vh;\n';
        
        if (type === '2d' || type === '3d') {
            css += '    display: flex;\n';
            css += '    justify-content: center;\n';
            css += '    align-items: center;\n';
            css += '    overflow: hidden;\n';
            css += '}\n\n';
            css += 'canvas {\n';
            css += '    border: 2px solid #4a4a6a;\n';
            css += '    border-radius: 8px;\n';
            css += '}';
        } else {
            css += '}\n\n';
            css += '#app {\n';
            css += '    max-width: 1200px;\n';
            css += '    margin: 0 auto;\n';
            css += '    padding: 20px;\n';
            css += '}\n\n';
            css += 'h1 {\n';
            css += '    text-align: center;\n';
            css += '    margin-top: 50px;\n';
            css += '}';
        }
        
        return css;
    }
    
    getJSTemplate(type) {
        if (type === '2d') {
            return this.get2DTemplate();
        } else if (type === '3d') {
            return this.get3DTemplate();
        } else {
            return this.getAppTemplate();
        }
    }
    
    get2DTemplate() {
        var js = '// 2D Game Setup\n';
        js += 'const canvas = document.getElementById("gameCanvas");\n';
        js += 'const ctx = canvas.getContext("2d");\n\n';
        js += 'canvas.width = 800;\n';
        js += 'canvas.height = 600;\n\n';
        js += '// Game variables\n';
        js += 'let player = {\n';
        js += '    x: canvas.width / 2,\n';
        js += '    y: canvas.height / 2,\n';
        js += '    size: 30,\n';
        js += '    speed: 5,\n';
        js += '    color: "#6366f1"\n';
        js += '};\n\n';
        js += 'let keys = {};\n\n';
        js += '// Input handling\n';
        js += 'document.addEventListener("keydown", (e) => keys[e.key] = true);\n';
        js += 'document.addEventListener("keyup", (e) => keys[e.key] = false);\n\n';
        js += '// Game loop\n';
        js += 'function gameLoop() {\n';
        js += '    update();\n';
        js += '    render();\n';
        js += '    requestAnimationFrame(gameLoop);\n';
        js += '}\n\n';
        js += 'function update() {\n';
        js += '    if (keys["ArrowUp"] || keys["w"]) player.y -= player.speed;\n';
        js += '    if (keys["ArrowDown"] || keys["s"]) player.y += player.speed;\n';
        js += '    if (keys["ArrowLeft"] || keys["a"]) player.x -= player.speed;\n';
        js += '    if (keys["ArrowRight"] || keys["d"]) player.x += player.speed;\n\n';
        js += '    // Keep player in bounds\n';
        js += '    player.x = Math.max(player.size, Math.min(canvas.width - player.size, player.x));\n';
        js += '    player.y = Math.max(player.size, Math.min(canvas.height - player.size, player.y));\n';
        js += '}\n\n';
        js += 'function render() {\n';
        js += '    // Clear canvas\n';
        js += '    ctx.fillStyle = "#1a1a2e";\n';
        js += '    ctx.fillRect(0, 0, canvas.width, canvas.height);\n\n';
        js += '    // Draw player\n';
        js += '    ctx.fillStyle = player.color;\n';
        js += '    ctx.beginPath();\n';
        js += '    ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);\n';
        js += '    ctx.fill();\n\n';
        js += '    // Draw instructions\n';
        js += '    ctx.fillStyle = "white";\n';
        js += '    ctx.font = "16px Arial";\n';
        js += '    ctx.fillText("Use WASD or Arrow keys to move", 20, 30);\n';
        js += '}\n\n';
        js += '// Start game\n';
        js += 'gameLoop();\n';
        js += 'console.log("2D Game initialized!");';
        return js;
    }
    
    get3DTemplate() {
        var js = '// WebGL 3D Game Setup\n';
        js += 'const canvas = document.getElementById("glCanvas");\n';
        js += 'const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");\n\n';
        js += 'canvas.width = 800;\n';
        js += 'canvas.height = 600;\n\n';
        js += 'if (!gl) {\n';
        js += '    alert("WebGL not supported!");\n';
        js += '    throw new Error("WebGL not supported");\n';
        js += '}\n\n';
        js += '// Vertex shader\n';
        js += 'const vsSource = [\n';
        js += '    "attribute vec4 aVertexPosition;",\n';
        js += '    "attribute vec4 aVertexColor;",\n';
        js += '    "uniform mat4 uModelViewMatrix;",\n';
        js += '    "uniform mat4 uProjectionMatrix;",\n';
        js += '    "varying lowp vec4 vColor;",\n';
        js += '    "void main() {",\n';
        js += '    "    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;",\n';
        js += '    "    vColor = aVertexColor;",\n';
        js += '    "}"\n';
        js += '].join("\\n");\n\n';
        js += '// Fragment shader\n';
        js += 'const fsSource = [\n';
        js += '    "varying lowp vec4 vColor;",\n';
        js += '    "void main() {",\n';
        js += '    "    gl_FragColor = vColor;",\n';
        js += '    "}"\n';
        js += '].join("\\n");\n\n';
        js += '// Shader compilation helper\n';
        js += 'function loadShader(gl, type, source) {\n';
        js += '    const shader = gl.createShader(type);\n';
        js += '    gl.shaderSource(shader, source);\n';
        js += '    gl.compileShader(shader);\n';
        js += '    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {\n';
        js += '        console.error("Shader compile error:", gl.getShaderInfoLog(shader));\n';
        js += '        gl.deleteShader(shader);\n';
        js += '        return null;\n';
        js += '    }\n';
        js += '    return shader;\n';
        js += '}\n\n';
        js += '// Initialize shaders\n';
        js += 'const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);\n';
        js += 'const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);\n\n';
        js += 'const shaderProgram = gl.createProgram();\n';
        js += 'gl.attachShader(shaderProgram, vertexShader);\n';
        js += 'gl.attachShader(shaderProgram, fragmentShader);\n';
        js += 'gl.linkProgram(shaderProgram);\n\n';
        js += 'if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {\n';
        js += '    console.error("Shader program error:", gl.getProgramInfoLog(shaderProgram));\n';
        js += '}\n\n';
        js += '// Get attribute/uniform locations\n';
        js += 'const programInfo = {\n';
        js += '    program: shaderProgram,\n';
        js += '    attribLocations: {\n';
        js += '        vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),\n';
        js += '        vertexColor: gl.getAttribLocation(shaderProgram, "aVertexColor"),\n';
        js += '    },\n';
        js += '    uniformLocations: {\n';
        js += '        projectionMatrix: gl.getUniformLocation(shaderProgram, "uProjectionMatrix"),\n';
        js += '        modelViewMatrix: gl.getUniformLocation(shaderProgram, "uModelViewMatrix"),\n';
        js += '    },\n';
        js += '};\n\n';
        js += '// Create cube buffers\n';
        js += 'function initBuffers(gl) {\n';
        js += '    const positions = [\n';
        js += '        -1, -1,  1,   1, -1,  1,   1,  1,  1,  -1,  1,  1,\n';
        js += '        -1, -1, -1,  -1,  1, -1,   1,  1, -1,   1, -1, -1,\n';
        js += '        -1,  1, -1,  -1,  1,  1,   1,  1,  1,   1,  1, -1,\n';
        js += '        -1, -1, -1,   1, -1, -1,   1, -1,  1,  -1, -1,  1,\n';
        js += '         1, -1, -1,   1,  1, -1,   1,  1,  1,   1, -1,  1,\n';
        js += '        -1, -1, -1,  -1, -1,  1,  -1,  1,  1,  -1,  1, -1,\n';
        js += '    ];\n\n';
        js += '    const colors = [\n';
        js += '        [1, 0, 0, 1], [0, 1, 0, 1], [0, 0, 1, 1],\n';
        js += '        [1, 1, 0, 1], [1, 0, 1, 1], [0, 1, 1, 1],\n';
        js += '    ];\n\n';
        js += '    let generatedColors = [];\n';
        js += '    for (let j = 0; j < 6; j++) {\n';
        js += '        const c = colors[j];\n';
        js += '        for (let i = 0; i < 4; i++) {\n';
        js += '            generatedColors = generatedColors.concat(c);\n';
        js += '        }\n';
        js += '    }\n\n';
        js += '    const indices = [\n';
        js += '        0,  1,  2,    0,  2,  3,\n';
        js += '        4,  5,  6,    4,  6,  7,\n';
        js += '        8,  9, 10,    8, 10, 11,\n';
        js += '        12, 13, 14,   12, 14, 15,\n';
        js += '        16, 17, 18,   16, 18, 19,\n';
        js += '        20, 21, 22,   20, 22, 23,\n';
        js += '    ];\n\n';
        js += '    const positionBuffer = gl.createBuffer();\n';
        js += '    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);\n';
        js += '    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);\n\n';
        js += '    const colorBuffer = gl.createBuffer();\n';
        js += '    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);\n';
        js += '    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(generatedColors), gl.STATIC_DRAW);\n\n';
        js += '    const indexBuffer = gl.createBuffer();\n';
        js += '    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);\n';
        js += '    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);\n\n';
        js += '    return { position: positionBuffer, color: colorBuffer, indices: indexBuffer };\n';
        js += '}\n\n';
        js += 'const buffers = initBuffers(gl);\n\n';
        js += '// Matrix functions\n';
        js += 'function perspective(fov, aspect, near, far) {\n';
        js += '    const f = 1.0 / Math.tan(fov / 2);\n';
        js += '    const nf = 1 / (near - far);\n';
        js += '    return [\n';
        js += '        f / aspect, 0, 0, 0,\n';
        js += '        0, f, 0, 0,\n';
        js += '        0, 0, (far + near) * nf, -1,\n';
        js += '        0, 0, 2 * far * near * nf, 0\n';
        js += '    ];\n';
        js += '}\n\n';
        js += 'function translate(m, v) {\n';
        js += '    const result = [...m];\n';
        js += '    result[12] = m[0] * v[0] + m[4] * v[1] + m[8] * v[2] + m[12];\n';
        js += '    result[13] = m[1] * v[0] + m[5] * v[1] + m[9] * v[2] + m[13];\n';
        js += '    result[14] = m[2] * v[0] + m[6] * v[1] + m[10] * v[2] + m[14];\n';
        js += '    return result;\n';
        js += '}\n\n';
        js += 'function rotateY(m, angle) {\n';
        js += '    const s = Math.sin(angle);\n';
        js += '    const c = Math.cos(angle);\n';
        js += '    const result = [...m];\n';
        js += '    result[0] = m[0] * c - m[8] * s;\n';
        js += '    result[1] = m[1] * c - m[9] * s;\n';
        js += '    result[2] = m[2] * c - m[10] * s;\n';
        js += '    result[8] = m[0] * s + m[8] * c;\n';
        js += '    result[9] = m[1] * s + m[9] * c;\n';
        js += '    result[10] = m[2] * s + m[10] * c;\n';
        js += '    return result;\n';
        js += '}\n\n';
        js += 'function rotateX(m, angle) {\n';
        js += '    const s = Math.sin(angle);\n';
        js += '    const c = Math.cos(angle);\n';
        js += '    const result = [...m];\n';
        js += '    result[4] = m[4] * c + m[8] * s;\n';
        js += '    result[5] = m[5] * c + m[9] * s;\n';
        js += '    result[6] = m[6] * c + m[10] * s;\n';
        js += '    result[8] = m[8] * c - m[4] * s;\n';
        js += '    result[9] = m[9] * c - m[5] * s;\n';
        js += '    result[10] = m[10] * c - m[6] * s;\n';
        js += '    return result;\n';
        js += '}\n\n';
        js += 'let rotation = 0;\n\n';
        js += 'function render(time) {\n';
        js += '    time *= 0.001;\n';
        js += '    rotation = time;\n\n';
        js += '    gl.viewport(0, 0, canvas.width, canvas.height);\n';
        js += '    gl.clearColor(0.1, 0.1, 0.15, 1.0);\n';
        js += '    gl.clearDepth(1.0);\n';
        js += '    gl.enable(gl.DEPTH_TEST);\n';
        js += '    gl.depthFunc(gl.LEQUAL);\n';
        js += '    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);\n\n';
        js += '    const projectionMatrix = perspective(45 * Math.PI / 180, canvas.width / canvas.height, 0.1, 100.0);\n';
        js += '    let modelViewMatrix = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];\n';
        js += '    modelViewMatrix = translate(modelViewMatrix, [0, 0, -6]);\n';
        js += '    modelViewMatrix = rotateY(modelViewMatrix, rotation);\n';
        js += '    modelViewMatrix = rotateX(modelViewMatrix, rotation * 0.7);\n\n';
        js += '    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);\n';
        js += '    gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0);\n';
        js += '    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);\n\n';
        js += '    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);\n';
        js += '    gl.vertexAttribPointer(programInfo.attribLocations.vertexColor, 4, gl.FLOAT, false, 0, 0);\n';
        js += '    gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);\n\n';
        js += '    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);\n';
        js += '    gl.useProgram(programInfo.program);\n\n';
        js += '    gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);\n';
        js += '    gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);\n\n';
        js += '    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);\n\n';
        js += '    requestAnimationFrame(render);\n';
        js += '}\n\n';
        js += 'requestAnimationFrame(render);\n';
        js += 'console.log("WebGL 3D Game initialized!");';
        return js;
    }
    
    getAppTemplate() {
        var js = '// Web App JavaScript\n';
        js += 'document.addEventListener("DOMContentLoaded", function() {\n';
        js += '    console.log("App initialized!");\n\n';
        js += '    var app = document.getElementById("app");\n\n';
        js += '    // Add interactive content\n';
        js += '    var button = document.createElement("button");\n';
        js += '    button.textContent = "Click Me!";\n';
        js += '    button.style.display = "block";\n';
        js += '    button.style.margin = "30px auto";\n';
        js += '    button.style.padding = "15px 30px";\n';
        js += '    button.style.fontSize = "18px";\n';
        js += '    button.style.background = "#6366f1";\n';
        js += '    button.style.color = "white";\n';
        js += '    button.style.border = "none";\n';
        js += '    button.style.borderRadius = "8px";\n';
        js += '    button.style.cursor = "pointer";\n\n';
        js += '    var clickCount = 0;\n';
        js += '    button.addEventListener("click", function() {\n';
        js += '        clickCount++;\n';
        js += '        button.textContent = "Clicked " + clickCount + " times!";\n';
        js += '    });\n\n';
        js += '    app.appendChild(button);\n';
        js += '});';
        return js;
    }
    
    selectProject(projectId) {
        this.currentProject = this.projects.find(p => p.id === projectId);
        this.openTabs = [];
        this.currentFile = null;
        
        this.renderProjects();
        this.renderFiles();
        
        var filesSection = document.getElementById('filesSection');
        if (filesSection) {
            filesSection.style.display = this.currentProject ? 'flex' : 'none';
        }
        
        if (this.currentProject && this.currentProject.files.length > 0) {
            this.openFile(this.currentProject.files[0].name);
        } else {
            var editor = document.getElementById('codeEditor');
            if (editor) editor.value = '';
            this.renderTabs();
        }
    }
    
    updateProjectTypeInfo(type) {
        var info = document.getElementById('projectTypeInfo');
        if (!info) return;
        
        var descriptions = {
            '2d': 'Create a 2D canvas-based game with sprite rendering capabilities.',
            'app': 'Build a web application with HTML, CSS, and JavaScript.',
            '3d': 'Create a WebGL-powered 3D game with shaders and 3D rendering.'
        };
        info.innerHTML = '<p>' + descriptions[type] + '</p>';
    }
    
    // File Methods
    addFile() {
        if (!this.currentProject) {
            this.showToast('Please select a project first', 'error');
            return;
        }
        
        var nameInput = document.getElementById('newFileNameInput');
        if (!nameInput) return;
        
        var name = nameInput.value.trim();
        
        if (!name) {
            this.showToast('Please enter a file name', 'error');
            return;
        }
        
        // Check for duplicate
        var exists = this.currentProject.files.find(f => f.name === name);
        if (exists) {
            this.showToast('File already exists', 'error');
            return;
        }
        
        var file = {
            name: name,
            content: this.getFileTemplate(name)
        };
        
        this.currentProject.files.push(file);
        this.saveToStorage();
        this.hideModal('addFileModal');
        this.renderFiles();
        this.openFile(name);
        this.showToast('File "' + name + '" created!', 'success');
    }
    
    getFileTemplate(filename) {
        var ext = filename.split('.').pop().toLowerCase();
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
        
        var file = this.currentProject.files.find(f => f.name === fileName);
        if (!file) return;
        
        this.currentFile = file;
        
        // Add to tabs if not already open
        if (this.openTabs.indexOf(fileName) === -1) {
            this.openTabs.push(fileName);
        }
        
        var editor = document.getElementById('codeEditor');
        if (editor) {
            editor.value = file.content;
        }
        
        this.updateLineNumbers();
        this.renderTabs();
        this.renderFiles();
        this.updateFileInfo();
    }
    
    closeTab(fileName) {
        var index = this.openTabs.indexOf(fileName);
        if (index > -1) {
            this.openTabs.splice(index, 1);
        }
        
        if (this.currentFile && this.currentFile.name === fileName) {
            if (this.openTabs.length > 0) {
                this.openFile(this.openTabs[this.openTabs.length - 1]);
            } else {
                this.currentFile = null;
                var editor = document.getElementById('codeEditor');
                if (editor) editor.value = '';
            }
        }
        
        this.renderTabs();
    }
    
    // Editor Methods
    onEditorChange() {
        var editor = document.getElementById('codeEditor');
        if (this.currentFile && editor) {
            this.currentFile.content = editor.value;
            this.updateLineNumbers();
            
            // Auto-save after delay
            var self = this;
            clearTimeout(this.saveTimeout);
            this.saveTimeout = setTimeout(function() {
                self.saveToStorage();
            }, 1000);
        }
    }
    
    handleEditorKeydown(e) {
        var editor = document.getElementById('codeEditor');
        if (!editor) return;
        
        // Tab key - insert spaces
        if (e.key === 'Tab') {
            e.preventDefault();
            var start = editor.selectionStart;
            var end = editor.selectionEnd;
            editor.value = editor.value.substring(0, start) + '    ' + editor.value.substring(end);
            editor.selectionStart = editor.selectionEnd = start + 4;
            this.onEditorChange();
        }
    }
    
    updateLineNumbers() {
        var editor = document.getElementById('codeEditor');
        var lineNumbers = document.getElementById('lineNumbers');
        if (!editor || !lineNumbers) return;
        
        var lines = editor.value.split('\n').length;
        var html = '';
        for (var i = 1; i <= lines; i++) {
            html += i + '\n';
        }
        lineNumbers.textContent = html;
    }
    
    syncLineNumbers() {
        var editor = document.getElementById('codeEditor');
        var lineNumbers = document.getElementById('lineNumbers');
        if (editor && lineNumbers) {
            lineNumbers.scrollTop = editor.scrollTop;
        }
    }
    
    updateCursorPosition() {
        var editor = document.getElementById('codeEditor');
        var cursorPos = document.getElementById('cursorPosition');
        if (!editor || !cursorPos) return;
        
        var value = editor.value.substring(0, editor.selectionStart);
        var lines = value.split('\n');
        var line = lines.length;
        var col = lines[lines.length - 1].length + 1;
        
        cursorPos.textContent = 'Ln ' + line + ', Col ' + col;
    }
    
    updateFileInfo() {
        var fileInfo = document.getElementById('currentFileInfo');
        var fileType = document.getElementById('fileType');
        
        if (this.currentFile) {
            var ext = this.currentFile.name.split('.').pop().toUpperCase();
            if (fileType) fileType.textContent = ext;
            if (fileInfo) fileInfo.textContent = this.currentFile.name;
        } else {
            if (fileType) fileType.textContent = '--';
            if (fileInfo) fileInfo.textContent = '';
        }
    }
    
    // Render Methods
    renderProjects() {
        var container = document.getElementById('projectsList');
        if (!container) return;
        
        if (this.projects.length === 0) {
            container.innerHTML = '<div class="empty-state">' +
                '<div class="empty-state-icon">📁</div>' +
                '<div class="empty-state-text">No projects yet.<br>Create your first project!</div>' +
                '</div>';
            return;
        }
        
        var icons = { '2d': '🎮', 'app': '📱', '3d': '🎲' };
        var types = { '2d': '2D Game', 'app': 'Web App', '3d': 'WebGL 3D' };
        var self = this;
        
        var html = '';
        this.projects.forEach(function(project) {
            var isActive = self.currentProject && self.currentProject.id === project.id;
            html += '<div class="project-item ' + (isActive ? 'active' : '') + '" data-id="' + project.id + '">' +
                '<span class="project-icon">' + icons[project.type] + '</span>' +
                '<div class="project-info">' +
                '<div class="project-name">' + project.name + '</div>' +
                '<div class="project-type">' + types[project.type] + '</div>' +
                '</div></div>';
        });
        
        container.innerHTML = html;
        
        container.querySelectorAll('.project-item').forEach(function(item) {
            item.addEventListener('click', function() {
                self.selectProject(item.dataset.id);
            });
            item.addEventListener('contextmenu', function(e) {
                e.preventDefault();
                self.showContextMenu(e, 'project', item.dataset.id);
            });
        });
    }
    
    renderFiles() {
        var container = document.getElementById('filesList');
        if (!container) return;
        
        if (!this.currentProject) {
            container.innerHTML = '';
            return;
        }
        
        var icons = {
            'html': '📄',
            'css': '🎨',
            'js': '⚡',
            'json': '📋',
            'default': '📝'
        };
        
        var self = this;
        var html = '';
        
        this.currentProject.files.forEach(function(file) {
            var ext = file.name.split('.').pop().toLowerCase();
            var icon = icons[ext] || icons.default;
            var isActive = self.currentFile && self.currentFile.name === file.name;
            
            html += '<div class="file-item ' + (isActive ? 'active' : '') + '" data-name="' + file.name + '">' +
                '<span class="file-icon">' + icon + '</span>' +
                '<span class="file-name">' + file.name + '</span>' +
                '</div>';
        });
        
        container.innerHTML = html;
        
        container.querySelectorAll('.file-item').forEach(function(item) {
            item.addEventListener('click', function() {
                self.openFile(item.dataset.name);
            });
            item.addEventListener('contextmenu', function(e) {
                e.preventDefault();
                self.showContextMenu(e, 'file', item.dataset.name);
            });
        });
    }
    
    renderTabs() {
        var container = document.getElementById('filesTabs');
        if (!container) return;
        
        var icons = {
            'html': '📄',
            'css': '🎨',
            'js': '⚡',
            'json': '📋',
            'default': '📝'
        };
        
        var self = this;
        var html = '';
        
        this.openTabs.forEach(function(fileName) {
            var ext = fileName.split('.').pop().toLowerCase();
            var icon = icons[ext] || icons.default;
            var isActive = self.currentFile && self.currentFile.name === fileName;
            
            html += '<div class="file-tab ' + (isActive ? 'active' : '') + '" data-name="' + fileName + '">' +
                '<span>' + icon + '</span>' +
                '<span>' + fileName + '</span>' +
                '<span class="tab-close" data-close="' + fileName + '">&times;</span>' +
                '</div>';
        });
        
        container.innerHTML = html;
        
        container.querySelectorAll('.file-tab').forEach(function(tab) {
            tab.addEventListener('click', function(e) {
                if (!e.target.classList.contains('tab-close')) {
                    self.openFile(tab.dataset.name);
                }
            });
        });
        
        container.querySelectorAll('.tab-close').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                self.closeTab(btn.dataset.close);
            });
        });
    }
    
    // Context Menu
    showContextMenu(event, type, target) {
        event.preventDefault();
        
        this.contextType = type;
        this.contextTarget = target;
        
        var menu = document.getElementById('contextMenu');
        if (menu) {
            menu.style.left = event.pageX + 'px';
            menu.style.top = event.pageY + 'px';
            menu.classList.add('active');
        }
    }
    
    hideContextMenu() {
        var menu = document.getElementById('contextMenu');
        if (menu) {
            menu.classList.remove('active');
        }
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
        var title = document.getElementById('renameTitle');
        var input = document.getElementById('renameInput');
        
        if (this.contextType === 'project') {
            var project = this.projects.find(p => p.id === this.contextTarget);
            if (title) title.textContent = '✏️ Rename Project';
            if (input) input.value = project ? project.name : '';
        } else {
            if (title) title.textContent = '✏️ Rename File';
            if (input) input.value = this.contextTarget || '';
        }
        
        this.showModal('renameModal');
    }
    
    confirmRename() {
        var input = document.getElementById('renameInput');
        if (!input) return;
        
        var newName = input.value.trim();
        
        if (!newName) {
            this.showToast('Please enter a name', 'error');
            return;
        }
        
        var self = this;
        
        if (this.contextType === 'project') {
            var project = this.projects.find(function(p) {
                return p.id === self.contextTarget;
            });
            if (project) {
                project.name = newName;
                this.saveToStorage();
                this.renderProjects();
                this.showToast('Project renamed!', 'success');
            }
        } else {
            if (this.currentProject) {
                var file = this.currentProject.files.find(function(f) {
                    return f.name === self.contextTarget;
                });
                if (file) {
                    var oldName = file.name;
                    file.name = newName;
                    
                    // Update tabs
                    var tabIndex = this.openTabs.indexOf(oldName);
                    if (tabIndex > -1) {
                        this.openTabs[tabIndex] = newName;
                    }
                    
                    if (this.currentFile && this.currentFile.name === oldName) {
                        this.currentFile = file;
                    }
                    
                    this.saveToStorage();
                    this.renderFiles();
                    this.renderTabs();
                    this.updateFileInfo();
                    this.showToast('File renamed!', 'success');
                }
            }
        }
        
        this.hideModal('renameModal');
    }
    
    duplicateItem() {
        var self = this;
        
        if (this.contextType === 'project') {
            var project = this.projects.find(function(p) {
                return p.id === self.contextTarget;
            });
            if (project) {
                var newProject = JSON.parse(JSON.stringify(project));
                newProject.id = Date.now().toString();
                newProject.name = project.name + ' (Copy)';
                newProject.createdAt = new Date().toISOString();
                
                this.projects.push(newProject);
                this.saveToStorage();
                this.renderProjects();
                this.showToast('Project duplicated!', 'success');
            }
        } else {
            if (this.currentProject) {
                var file = this.currentProject.files.find(function(f) {
                    return f.name === self.contextTarget;
                });
                if (file) {
                    var ext = file.name.indexOf('.') > -1 ? '.' + file.name.split('.').pop() : '';
                    var baseName = file.name.replace(ext, '');
                    var newFile = {
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
        var self = this;
        
        if (this.contextType === 'project') {
            var index = -1;
            for (var i = 0; i < this.projects.length; i++) {
                if (this.projects[i].id === this.contextTarget) {
                    index = i;
                    break;
                }
            }
            
            if (index > -1) {
                var name = this.projects[index].name;
                this.projects.splice(index, 1);
                
                if (this.currentProject && this.currentProject.id === this.contextTarget) {
                    this.currentProject = null;
                    this.currentFile = null;
                    this.openTabs = [];
                    var editor = document.getElementById('codeEditor');
                    if (editor) editor.value = '';
                    var filesSection = document.getElementById('filesSection');
                    if (filesSection) filesSection.style.display = 'none';
                }
                
                this.saveToStorage();
                this.renderProjects();
                this.renderTabs();
                this.showToast('Project "' + name + '" deleted', 'info');
            }
        } else {
            if (this.currentProject) {
                var fileIndex = -1;
                for (var j = 0; j < this.currentProject.files.length; j++) {
                    if (this.currentProject.files[j].name === this.contextTarget) {
                        fileIndex = j;
                        break;
                    }
                }
                
                if (fileIndex > -1) {
                    var fileName = this.currentProject.files[fileIndex].name;
                    this.currentProject.files.splice(fileIndex, 1);
                    
                    this.closeTab(this.contextTarget);
                    
                    this.saveToStorage();
                    this.renderFiles();
                    this.showToast('File "' + fileName + '" deleted', 'info');
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
        
        var htmlFile = this.currentProject.files.find(function(f) {
            return f.name.endsWith('.html');
        });
        
        if (!htmlFile) {
            this.showToast('No HTML file found in project', 'error');
            return;
        }
        
        var html = htmlFile.content;
        var self = this;
        
        // Inject CSS files
        this.currentProject.files.forEach(function(file) {
            if (file.name.endsWith('.css')) {
                var linkRegex = new RegExp('<link[^>]*href=["\']' + file.name + '["\'][^>]*>', 'gi');
                var styleContent = '<style>\n' + file.content + '\n</style>';
                html = html.replace(linkRegex, styleContent);
            }
        });
        
        // Inject JS files
        this.currentProject.files.forEach(function(file) {
            if (file.name.endsWith('.js')) {
                var scriptRegex = new RegExp('<script[^>]*src=["\']' + file.name + '["\'][^>]*></script>', 'gi');
                var scriptContent = '<script>\n' + file.content + '\n<\/script>';
                html = html.replace(scriptRegex, scriptContent);
            }
        });
        
        // Create blob and run
        var blob = new Blob([html], { type: 'text/html' });
        var url = URL.createObjectURL(blob);
        
        if (this.currentProject.type === '3d') {
            // Open in popup window for WebGL
            var width = 900;
            var height = 700;
            var left = (screen.width - width) / 2;
            var top = (screen.height - height) / 2;
            
            var popup = window.open(
                url,
                'WebGL_Preview_' + Date.now(),
                'width=' + width + ',height=' + height + ',left=' + left + ',top=' + top + ',menubar=no,toolbar=no,location=no,status=no'
            );
            
            if (popup) {
                popup.focus();
                this.showToast('WebGL preview opened in popup window', 'success');
            } else {
                this.showToast('Popup blocked! Please allow popups.', 'error');
            }
        } else {
            // Open in new tab for 2D and App
            var newTab = window.open(url, '_blank');
            if (newTab) {
                newTab.focus();
                this.showToast('Project opened in new tab', 'success');
            } else {
                this.showToast('Popup blocked! Please allow popups.', 'error');
            }
        }
        
        // Clean up URL after a delay
        setTimeout(function() {
            URL.revokeObjectURL(url);
        }, 2000);
    }
    
    // Toast Notifications
    showToast(message, type) {
        type = type || 'info';
        var container = document.getElementById('toastContainer');
        if (!container) return;
        
        var icons = {
            success: '✓',
            error: '✕',
            info: 'ℹ'
        };
        
        var toast = document.createElement('div');
        toast.className = 'toast toast-' + type;
        toast.innerHTML = '<span class="toast-icon">' + icons[type] + '</span>' +
            '<span class="toast-message">' + message + '</span>';
        
        container.appendChild(toast);
        
        setTimeout(function() {
            toast.style.animation = 'toastSlideIn 0.3s ease reverse';
            setTimeout(function() {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        }, 3000);
    }
}

// Initialize editor when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.editor = new GameEditor();
});
