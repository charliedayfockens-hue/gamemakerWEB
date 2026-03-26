// WebGL Game Editor - Main Application

// Global state
var projects = [];
var currentProject = null;
var currentFile = null;
var openTabs = [];
var contextTarget = null;
var contextType = null;
var saveTimeout = null;

// Initialize when page loads
window.onload = function() {
    console.log("Page loaded, initializing editor...");
    loadFromStorage();
    bindEvents();
    renderProjects();
    updateLineNumbers();
    console.log("Editor initialized!");
};

// Storage Methods
function loadFromStorage() {
    try {
        var saved = localStorage.getItem('gameEditorProjects');
        if (saved) {
            projects = JSON.parse(saved);
            console.log("Loaded " + projects.length + " projects from storage");
        }
    } catch (e) {
        console.error('Error loading from storage:', e);
        projects = [];
    }
}

function saveToStorage() {
    try {
        localStorage.setItem('gameEditorProjects', JSON.stringify(projects));
        console.log("Saved to storage");
    } catch (e) {
        console.error('Error saving to storage:', e);
    }
}

// Event Binding
function bindEvents() {
    console.log("Binding events...");
    
    // New Project Button
    var newProjectBtn = document.getElementById('newProjectBtn');
    if (newProjectBtn) {
        newProjectBtn.onclick = function() {
            console.log("New Project button clicked");
            showModal('newProjectModal');
        };
    }
    
    // Run Project Button
    var runProjectBtn = document.getElementById('runProjectBtn');
    if (runProjectBtn) {
        runProjectBtn.onclick = function() {
            console.log("Run Project button clicked");
            runProject();
        };
    }
    
    // Create Project Button
    var createProjectBtn = document.getElementById('createProjectBtn');
    if (createProjectBtn) {
        createProjectBtn.onclick = function() {
            console.log("Create Project button clicked");
            createProject();
        };
    } else {
        console.error("createProjectBtn not found!");
    }
    
    // Cancel Project Button
    var cancelProjectBtn = document.getElementById('cancelProjectBtn');
    if (cancelProjectBtn) {
        cancelProjectBtn.onclick = function() {
            hideModal('newProjectModal');
        };
    }
    
    // Project Type Select
    var projectTypeSelect = document.getElementById('projectTypeSelect');
    if (projectTypeSelect) {
        projectTypeSelect.onchange = function() {
            updateProjectTypeInfo(this.value);
        };
    }
    
    // Rename Modal Buttons
    var confirmRenameBtn = document.getElementById('confirmRenameBtn');
    if (confirmRenameBtn) {
        confirmRenameBtn.onclick = function() {
            confirmRename();
        };
    }
    
    var cancelRenameBtn = document.getElementById('cancelRenameBtn');
    if (cancelRenameBtn) {
        cancelRenameBtn.onclick = function() {
            hideModal('renameModal');
        };
    }
    
    // Add File Modal Buttons
    var addFileBtn = document.getElementById('addFileBtn');
    if (addFileBtn) {
        addFileBtn.onclick = function() {
            showModal('addFileModal');
        };
    }
    
    var confirmAddFileBtn = document.getElementById('confirmAddFileBtn');
    if (confirmAddFileBtn) {
        confirmAddFileBtn.onclick = function() {
            addFile();
        };
    }
    
    var cancelAddFileBtn = document.getElementById('cancelAddFileBtn');
    if (cancelAddFileBtn) {
        cancelAddFileBtn.onclick = function() {
            hideModal('addFileModal');
        };
    }
    
    // Template Buttons
    var templateBtns = document.querySelectorAll('.template-btn');
    templateBtns.forEach(function(btn) {
        btn.onclick = function() {
            var ext = this.getAttribute('data-ext');
            var input = document.getElementById('newFileNameInput');
            if (input) {
                input.value = 'newfile' + ext;
            }
        };
    });
    
    // Modal Close Buttons
    var closeButtons = document.querySelectorAll('.modal-close');
    closeButtons.forEach(function(btn) {
        btn.onclick = function() {
            var modalId = this.getAttribute('data-modal');
            if (modalId) {
                hideModal(modalId);
            }
        };
    });
    
    // Modal Overlays
    var overlays = document.querySelectorAll('.modal-overlay');
    overlays.forEach(function(overlay) {
        overlay.onclick = function() {
            var modal = this.parentElement;
            if (modal) {
                modal.classList.remove('active');
            }
        };
    });
    
    // Code Editor
    var editor = document.getElementById('codeEditor');
    if (editor) {
        editor.oninput = function() {
            onEditorChange();
        };
        editor.onkeydown = function(e) {
            handleEditorKeydown(e);
        };
        editor.onscroll = function() {
            syncLineNumbers();
        };
        editor.onclick = function() {
            updateCursorPosition();
        };
        editor.onkeyup = function() {
            updateCursorPosition();
        };
    }
    
    // Context Menu - hide on click
    document.onclick = function() {
        hideContextMenu();
    };
    
    // Context Menu Items
    var contextItems = document.querySelectorAll('.context-menu-item');
    contextItems.forEach(function(item) {
        item.onclick = function(e) {
            e.stopPropagation();
            var action = this.getAttribute('data-action');
            if (action) {
                handleContextAction(action);
            }
        };
    });
    
    // Keyboard Shortcuts
    document.onkeydown = function(e) {
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            saveToStorage();
            showToast('Project saved', 'success');
        }
    };
    
    // Enter key in project name input
    var projectNameInput = document.getElementById('projectNameInput');
    if (projectNameInput) {
        projectNameInput.onkeydown = function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                createProject();
            }
        };
    }
    
    // Enter key in rename input
    var renameInput = document.getElementById('renameInput');
    if (renameInput) {
        renameInput.onkeydown = function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                confirmRename();
            }
        };
    }
    
    // Enter key in new file name input
    var newFileNameInput = document.getElementById('newFileNameInput');
    if (newFileNameInput) {
        newFileNameInput.onkeydown = function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                addFile();
            }
        };
    }
    
    console.log("Events bound successfully");
}

// Modal Methods
function showModal(modalId) {
    console.log("Showing modal: " + modalId);
    var modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        var input = modal.querySelector('input');
        if (input) {
            input.value = '';
            input.focus();
        }
    } else {
        console.error("Modal not found: " + modalId);
    }
}

function hideModal(modalId) {
    console.log("Hiding modal: " + modalId);
    var modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

// Create Project
function createProject() {
    console.log("createProject() called");
    
    var nameInput = document.getElementById('projectNameInput');
    var typeSelect = document.getElementById('projectTypeSelect');
    
    if (!nameInput) {
        console.error("projectNameInput not found!");
        return;
    }
    
    if (!typeSelect) {
        console.error("projectTypeSelect not found!");
        return;
    }
    
    var name = nameInput.value.trim();
    var type = typeSelect.value;
    
    console.log("Project name: " + name);
    console.log("Project type: " + type);
    
    if (!name) {
        showToast('Please enter a project name', 'error');
        nameInput.focus();
        return;
    }
    
    var project = {
        id: Date.now().toString(),
        name: name,
        type: type,
        files: getDefaultFiles(type),
        createdAt: new Date().toISOString()
    };
    
    console.log("Created project:", project);
    
    projects.push(project);
    saveToStorage();
    hideModal('newProjectModal');
    renderProjects();
    selectProject(project.id);
    showToast('Project "' + name + '" created!', 'success');
}

function getDefaultFiles(type) {
    return [
        { name: 'index.html', content: getHTMLTemplate(type) },
        { name: 'styles.css', content: getCSSTemplate(type) },
        { name: 'main.js', content: getJSTemplate(type) }
    ];
}

function getHTMLTemplate(type) {
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

function getCSSTemplate(type) {
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

function getJSTemplate(type) {
    if (type === '2d') {
        return get2DTemplate();
    } else if (type === '3d') {
        return get3DTemplate();
    } else {
        return getAppTemplate();
    }
}

function get2DTemplate() {
    var js = '// 2D Game Setup\n';
    js += 'var canvas = document.getElementById("gameCanvas");\n';
    js += 'var ctx = canvas.getContext("2d");\n\n';
    js += 'canvas.width = 800;\n';
    js += 'canvas.height = 600;\n\n';
    js += '// Game variables\n';
    js += 'var player = {\n';
    js += '    x: canvas.width / 2,\n';
    js += '    y: canvas.height / 2,\n';
    js += '    size: 30,\n';
    js += '    speed: 5,\n';
    js += '    color: "#6366f1"\n';
    js += '};\n\n';
    js += 'var keys = {};\n\n';
    js += '// Input handling\n';
    js += 'document.addEventListener("keydown", function(e) { keys[e.key] = true; });\n';
    js += 'document.addEventListener("keyup", function(e) { keys[e.key] = false; });\n\n';
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
    js += '    player.x = Math.max(player.size, Math.min(canvas.width - player.size, player.x));\n';
    js += '    player.y = Math.max(player.size, Math.min(canvas.height - player.size, player.y));\n';
    js += '}\n\n';
    js += 'function render() {\n';
    js += '    ctx.fillStyle = "#1a1a2e";\n';
    js += '    ctx.fillRect(0, 0, canvas.width, canvas.height);\n\n';
    js += '    ctx.fillStyle = player.color;\n';
    js += '    ctx.beginPath();\n';
    js += '    ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);\n';
    js += '    ctx.fill();\n\n';
    js += '    ctx.fillStyle = "white";\n';
    js += '    ctx.font = "16px Arial";\n';
    js += '    ctx.fillText("Use WASD or Arrow keys to move", 20, 30);\n';
    js += '}\n\n';
    js += 'gameLoop();\n';
    js += 'console.log("2D Game initialized!");';
    return js;
}

function get3DTemplate() {
    var js = '// WebGL 3D Game Setup\n';
    js += 'var canvas = document.getElementById("glCanvas");\n';
    js += 'var gl = canvas.getContext("webgl");\n\n';
    js += 'canvas.width = 800;\n';
    js += 'canvas.height = 600;\n\n';
    js += 'if (!gl) {\n';
    js += '    alert("WebGL not supported!");\n';
    js += '}\n\n';
    js += '// Vertex shader source\n';
    js += 'var vsSource = "";\n';
    js += 'vsSource += "attribute vec4 aVertexPosition;";\n';
    js += 'vsSource += "attribute vec4 aVertexColor;";\n';
    js += 'vsSource += "uniform mat4 uModelViewMatrix;";\n';
    js += 'vsSource += "uniform mat4 uProjectionMatrix;";\n';
    js += 'vsSource += "varying lowp vec4 vColor;";\n';
    js += 'vsSource += "void main() {";\n';
    js += 'vsSource += "  gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;";\n';
    js += 'vsSource += "  vColor = aVertexColor;";\n';
    js += 'vsSource += "}";\n\n';
    js += '// Fragment shader source\n';
    js += 'var fsSource = "";\n';
    js += 'fsSource += "varying lowp vec4 vColor;";\n';
    js += 'fsSource += "void main() {";\n';
    js += 'fsSource += "  gl_FragColor = vColor;";\n';
    js += 'fsSource += "}";\n\n';
    js += '// Create shader\n';
    js += 'function loadShader(gl, type, source) {\n';
    js += '    var shader = gl.createShader(type);\n';
    js += '    gl.shaderSource(shader, source);\n';
    js += '    gl.compileShader(shader);\n';
    js += '    return shader;\n';
    js += '}\n\n';
    js += 'var vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);\n';
    js += 'var fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);\n\n';
    js += 'var shaderProgram = gl.createProgram();\n';
    js += 'gl.attachShader(shaderProgram, vertexShader);\n';
    js += 'gl.attachShader(shaderProgram, fragmentShader);\n';
    js += 'gl.linkProgram(shaderProgram);\n';
    js += 'gl.useProgram(shaderProgram);\n\n';
    js += '// Simple rotating square\n';
    js += 'var rotation = 0;\n\n';
    js += 'function render() {\n';
    js += '    rotation += 0.01;\n';
    js += '    gl.viewport(0, 0, canvas.width, canvas.height);\n';
    js += '    gl.clearColor(0.1, 0.1, 0.2, 1.0);\n';
    js += '    gl.clear(gl.COLOR_BUFFER_BIT);\n\n';
    js += '    // Draw a simple colored background that changes\n';
    js += '    var r = Math.sin(rotation) * 0.5 + 0.5;\n';
    js += '    var g = Math.sin(rotation + 2) * 0.5 + 0.5;\n';
    js += '    var b = Math.sin(rotation + 4) * 0.5 + 0.5;\n';
    js += '    gl.clearColor(r * 0.3, g * 0.3, b * 0.3, 1.0);\n';
    js += '    gl.clear(gl.COLOR_BUFFER_BIT);\n\n';
    js += '    requestAnimationFrame(render);\n';
    js += '}\n\n';
    js += 'render();\n';
    js += 'console.log("WebGL 3D Game initialized!");';
    return js;
}

function getAppTemplate() {
    var js = '// Web App JavaScript\n';
    js += 'document.addEventListener("DOMContentLoaded", function() {\n';
    js += '    console.log("App initialized!");\n\n';
    js += '    var app = document.getElementById("app");\n\n';
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
    js += '    button.onclick = function() {\n';
    js += '        clickCount++;\n';
    js += '        button.textContent = "Clicked " + clickCount + " times!";\n';
    js += '    };\n\n';
    js += '    app.appendChild(button);\n';
    js += '});';
    return js;
}

// Select Project
function selectProject(projectId) {
    console.log("Selecting project: " + projectId);
    
    currentProject = null;
    for (var i = 0; i < projects.length; i++) {
        if (projects[i].id === projectId) {
            currentProject = projects[i];
            break;
        }
    }
    
    openTabs = [];
    currentFile = null;
    
    renderProjects();
    renderFiles();
    
    var filesSection = document.getElementById('filesSection');
    if (filesSection) {
        filesSection.style.display = currentProject ? 'flex' : 'none';
    }
    
    if (currentProject && currentProject.files.length > 0) {
        openFile(currentProject.files[0].name);
    } else {
        var editor = document.getElementById('codeEditor');
        if (editor) editor.value = '';
        renderTabs();
    }
}

function updateProjectTypeInfo(type) {
    var info = document.getElementById('projectTypeInfo');
    if (!info) return;
    
    var descriptions = {
        '2d': 'Create a 2D canvas-based game with sprite rendering.',
        'app': 'Build a web application with HTML, CSS, and JavaScript.',
        '3d': 'Create a WebGL-powered 3D game with shaders.'
    };
    info.innerHTML = '<p>' + descriptions[type] + '</p>';
}

// File Methods
function addFile() {
    if (!currentProject) {
        showToast('Please select a project first', 'error');
        return;
    }
    
    var nameInput = document.getElementById('newFileNameInput');
    if (!nameInput) return;
    
    var name = nameInput.value.trim();
    
    if (!name) {
        showToast('Please enter a file name', 'error');
        return;
    }
    
    // Check duplicate
    for (var i = 0; i < currentProject.files.length; i++) {
        if (currentProject.files[i].name === name) {
            showToast('File already exists', 'error');
            return;
        }
    }
    
    var file = {
        name: name,
        content: getFileTemplate(name)
    };
    
    currentProject.files.push(file);
    saveToStorage();
    hideModal('addFileModal');
    renderFiles();
    openFile(name);
    showToast('File "' + name + '" created!', 'success');
}

function getFileTemplate(filename) {
    var ext = filename.split('.').pop().toLowerCase();
    if (ext === 'html') {
        return '<!DOCTYPE html>\n<html>\n<head>\n    <title>New Page</title>\n</head>\n<body>\n    \n</body>\n</html>';
    } else if (ext === 'css') {
        return '/* Styles */\n';
    } else if (ext === 'js') {
        return '// JavaScript\n';
    } else if (ext === 'json') {
        return '{\n    \n}';
    }
    return '';
}

function openFile(fileName) {
    if (!currentProject) return;
    
    currentFile = null;
    for (var i = 0; i < currentProject.files.length; i++) {
        if (currentProject.files[i].name === fileName) {
            currentFile = currentProject.files[i];
            break;
        }
    }
    
    if (!currentFile) return;
    
    // Add to tabs
    if (openTabs.indexOf(fileName) === -1) {
        openTabs.push(fileName);
    }
    
    var editor = document.getElementById('codeEditor');
    if (editor) {
        editor.value = currentFile.content;
    }
    
    updateLineNumbers();
    renderTabs();
    renderFiles();
    updateFileInfo();
}

function closeTab(fileName) {
    var index = openTabs.indexOf(fileName);
    if (index > -1) {
        openTabs.splice(index, 1);
    }
    
    if (currentFile && currentFile.name === fileName) {
        if (openTabs.length > 0) {
            openFile(openTabs[openTabs.length - 1]);
        } else {
            currentFile = null;
            var editor = document.getElementById('codeEditor');
            if (editor) editor.value = '';
        }
    }
    
    renderTabs();
}

// Editor Methods
function onEditorChange() {
    var editor = document.getElementById('codeEditor');
    if (currentFile && editor) {
        currentFile.content = editor.value;
        updateLineNumbers();
        
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(function() {
            saveToStorage();
        }, 1000);
    }
}

function handleEditorKeydown(e) {
    var editor = document.getElementById('codeEditor');
    if (!editor) return;
    
    if (e.key === 'Tab') {
        e.preventDefault();
        var start = editor.selectionStart;
        var end = editor.selectionEnd;
        editor.value = editor.value.substring(0, start) + '    ' + editor.value.substring(end);
        editor.selectionStart = editor.selectionEnd = start + 4;
        onEditorChange();
    }
}

function updateLineNumbers() {
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

function syncLineNumbers() {
    var editor = document.getElementById('codeEditor');
    var lineNumbers = document.getElementById('lineNumbers');
    if (editor && lineNumbers) {
        lineNumbers.scrollTop = editor.scrollTop;
    }
}

function updateCursorPosition() {
    var editor = document.getElementById('codeEditor');
    var cursorPos = document.getElementById('cursorPosition');
    if (!editor || !cursorPos) return;
    
    var value = editor.value.substring(0, editor.selectionStart);
    var lines = value.split('\n');
    var line = lines.length;
    var col = lines[lines.length - 1].length + 1;
    
    cursorPos.textContent = 'Ln ' + line + ', Col ' + col;
}

function updateFileInfo() {
    var fileInfo = document.getElementById('currentFileInfo');
    var fileType = document.getElementById('fileType');
    
    if (currentFile) {
        var ext = currentFile.name.split('.').pop().toUpperCase();
        if (fileType) fileType.textContent = ext;
        if (fileInfo) fileInfo.textContent = currentFile.name;
    } else {
        if (fileType) fileType.textContent = '--';
        if (fileInfo) fileInfo.textContent = '';
    }
}

// Render Methods
function renderProjects() {
    var container = document.getElementById('projectsList');
    if (!container) return;
    
    if (projects.length === 0) {
        container.innerHTML = '<div class="empty-state">' +
            '<div class="empty-state-icon">📁</div>' +
            '<div class="empty-state-text">No projects yet.<br>Create your first project!</div>' +
            '</div>';
        return;
    }
    
    var icons = { '2d': '🎮', 'app': '📱', '3d': '🎲' };
    var types = { '2d': '2D Game', 'app': 'Web App', '3d': 'WebGL 3D' };
    
    var html = '';
    for (var i = 0; i < projects.length; i++) {
        var project = projects[i];
        var isActive = currentProject && currentProject.id === project.id;
        html += '<div class="project-item ' + (isActive ? 'active' : '') + '" data-id="' + project.id + '">';
        html += '<span class="project-icon">' + icons[project.type] + '</span>';
        html += '<div class="project-info">';
        html += '<div class="project-name">' + project.name + '</div>';
        html += '<div class="project-type">' + types[project.type] + '</div>';
        html += '</div></div>';
    }
    
    container.innerHTML = html;
    
    // Bind click events
    var items = container.querySelectorAll('.project-item');
    items.forEach(function(item) {
        item.onclick = function(e) {
            var id = this.getAttribute('data-id');
            selectProject(id);
        };
        item.oncontextmenu = function(e) {
            e.preventDefault();
            var id = this.getAttribute('data-id');
            showContextMenu(e, 'project', id);
        };
    });
}

function renderFiles() {
    var container = document.getElementById('filesList');
    if (!container) return;
    
    if (!currentProject) {
        container.innerHTML = '';
        return;
    }
    
    var icons = {
        'html': '📄',
        'css': '🎨',
        'js': '⚡',
        'json': '📋'
    };
    
    var html = '';
    for (var i = 0; i < currentProject.files.length; i++) {
        var file = currentProject.files[i];
        var ext = file.name.split('.').pop().toLowerCase();
        var icon = icons[ext] || '📝';
        var isActive = currentFile && currentFile.name === file.name;
        
        html += '<div class="file-item ' + (isActive ? 'active' : '') + '" data-name="' + file.name + '">';
        html += '<span class="file-icon">' + icon + '</span>';
        html += '<span class="file-name">' + file.name + '</span>';
        html += '</div>';
    }
    
    container.innerHTML = html;
    
    var items = container.querySelectorAll('.file-item');
    items.forEach(function(item) {
        item.onclick = function() {
            var name = this.getAttribute('data-name');
            openFile(name);
        };
        item.oncontextmenu = function(e) {
            e.preventDefault();
            var name = this.getAttribute('data-name');
            showContextMenu(e, 'file', name);
        };
    });
}

function renderTabs() {
    var container = document.getElementById('filesTabs');
    if (!container) return;
    
    var icons = {
        'html': '📄',
        'css': '🎨',
        'js': '⚡',
        'json': '📋'
    };
    
    var html = '';
    for (var i = 0; i < openTabs.length; i++) {
        var fileName = openTabs[i];
        var ext = fileName.split('.').pop().toLowerCase();
        var icon = icons[ext] || '📝';
        var isActive = currentFile && currentFile.name === fileName;
        
        html += '<div class="file-tab ' + (isActive ? 'active' : '') + '" data-name="' + fileName + '">';
        html += '<span>' + icon + '</span>';
        html += '<span>' + fileName + '</span>';
        html += '<span class="tab-close" data-close="' + fileName + '">&times;</span>';
        html += '</div>';
    }
    
    container.innerHTML = html;
    
    var tabs = container.querySelectorAll('.file-tab');
    tabs.forEach(function(tab) {
        tab.onclick = function(e) {
            if (!e.target.classList.contains('tab-close')) {
                var name = this.getAttribute('data-name');
                openFile(name);
            }
        };
    });
    
    var closeBtns = container.querySelectorAll('.tab-close');
    closeBtns.forEach(function(btn) {
        btn.onclick = function(e) {
            e.stopPropagation();
            var name = this.getAttribute('data-close');
            closeTab(name);
        };
    });
}

// Context Menu
function showContextMenu(event, type, target) {
    event.preventDefault();
    event.stopPropagation();
    
    contextType = type;
    contextTarget = target;
    
    var menu = document.getElementById('contextMenu');
    if (menu) {
        menu.style.left = event.pageX + 'px';
        menu.style.top = event.pageY + 'px';
        menu.classList.add('active');
    }
}

function hideContextMenu() {
    var menu = document.getElementById('contextMenu');
    if (menu) {
        menu.classList.remove('active');
    }
}

function handleContextAction(action) {
    hideContextMenu();
    
    if (action === 'rename') {
        showRenameModal();
    } else if (action === 'duplicate') {
        duplicateItem();
    } else if (action === 'delete') {
        deleteItem();
    }
}

function showRenameModal() {
    var title = document.getElementById('renameTitle');
    var input = document.getElementById('renameInput');
    
    if (contextType === 'project') {
        var project = null;
        for (var i = 0; i < projects.length; i++) {
            if (projects[i].id === contextTarget) {
                project = projects[i];
                break;
            }
        }
        if (title) title.textContent = '✏️ Rename Project';
        if (input) input.value = project ? project.name : '';
    } else {
        if (title) title.textContent = '✏️ Rename File';
        if (input) input.value = contextTarget || '';
    }
    
    showModal('renameModal');
}

function confirmRename() {
    var input = document.getElementById('renameInput');
    if (!input) return;
    
    var newName = input.value.trim();
    
    if (!newName) {
        showToast('Please enter a name', 'error');
        return;
    }
    
    if (contextType === 'project') {
        for (var i = 0; i < projects.length; i++) {
            if (projects[i].id === contextTarget) {
                projects[i].name = newName;
                break;
            }
        }
        saveToStorage();
        renderProjects();
        showToast('Project renamed!', 'success');
    } else {
        if (currentProject) {
            for (var j = 0; j < currentProject.files.length; j++) {
                if (currentProject.files[j].name === contextTarget) {
                    var oldName = currentProject.files[j].name;
                    currentProject.files[j].name = newName;
                    
                    var tabIndex = openTabs.indexOf(oldName);
                    if (tabIndex > -1) {
                        openTabs[tabIndex] = newName;
                    }
                    
                    if (currentFile && currentFile.name === oldName) {
                        currentFile = currentProject.files[j];
                    }
                    break;
                }
            }
            saveToStorage();
            renderFiles();
            renderTabs();
            updateFileInfo();
            showToast('File renamed!', 'success');
        }
    }
    
    hideModal('renameModal');
}

function duplicateItem() {
    if (contextType === 'project') {
        for (var i = 0; i < projects.length; i++) {
            if (projects[i].id === contextTarget) {
                var newProject = JSON.parse(JSON.stringify(projects[i]));
                newProject.id = Date.now().toString();
                newProject.name = projects[i].name + ' (Copy)';
                newProject.createdAt = new Date().toISOString();
                projects.push(newProject);
                break;
            }
        }
        saveToStorage();
        renderProjects();
        showToast('Project duplicated!', 'success');
    } else {
        if (currentProject) {
            for (var j = 0; j < currentProject.files.length; j++) {
                if (currentProject.files[j].name === contextTarget) {
                    var file = currentProject.files[j];
                    var ext = file.name.indexOf('.') > -1 ? '.' + file.name.split('.').pop() : '';
                    var baseName = file.name.replace(ext, '');
                    var newFile = {
                        name: baseName + '_copy' + ext,
                        content: file.content
                    };
                    currentProject.files.push(newFile);
                    break;
                }
            }
            saveToStorage();
            renderFiles();
            showToast('File duplicated!', 'success');
        }
    }
}

function deleteItem() {
    if (contextType === 'project') {
        for (var i = 0; i < projects.length; i++) {
            if (projects[i].id === contextTarget) {
                var name = projects[i].name;
                projects.splice(i, 1);
                
                if (currentProject && currentProject.id === contextTarget) {
                    currentProject = null;
                    currentFile = null;
                    openTabs = [];
                    var editor = document.getElementById('codeEditor');
                    if (editor) editor.value = '';
                    var filesSection = document.getElementById('filesSection');
                    if (filesSection) filesSection.style.display = 'none';
                }
                
                saveToStorage();
                renderProjects();
                renderTabs();
                showToast('Project "' + name + '" deleted', 'info');
                break;
            }
        }
    } else {
        if (currentProject) {
            for (var j = 0; j < currentProject.files.length; j++) {
                if (currentProject.files[j].name === contextTarget) {
                    var fileName = currentProject.files[j].name;
                    currentProject.files.splice(j, 1);
                    closeTab(contextTarget);
                    saveToStorage();
                    renderFiles();
                    showToast('File "' + fileName + '" deleted', 'info');
                    break;
                }
            }
        }
    }
}

// Run Project
function runProject() {
    if (!currentProject) {
        showToast('Please select a project first', 'error');
        return;
    }
    
    var htmlFile = null;
    for (var i = 0; i < currentProject.files.length; i++) {
        if (currentProject.files[i].name.endsWith('.html')) {
            htmlFile = currentProject.files[i];
            break;
        }
    }
    
    if (!htmlFile) {
        showToast('No HTML file found in project', 'error');
        return;
    }
    
    var html = htmlFile.content;
    
    // Inject CSS
    for (var j = 0; j < currentProject.files.length; j++) {
        var file = currentProject.files[j];
        if (file.name.endsWith('.css')) {
            var cssRegex = new RegExp('<link[^>]*href=["\']' + file.name.replace('.', '\\.') + '["\'][^>]*>', 'gi');
            html = html.replace(cssRegex, '<style>\n' + file.content + '\n</style>');
        }
    }
    
    // Inject JS
    for (var k = 0; k < currentProject.files.length; k++) {
        var jsFile = currentProject.files[k];
        if (jsFile.name.endsWith('.js')) {
            var jsRegex = new RegExp('<script[^>]*src=["\']' + jsFile.name.replace('.', '\\.') + '["\'][^>]*></script>', 'gi');
            html = html.replace(jsRegex, '<script>\n' + jsFile.content + '\n<\/script>');
        }
    }
    
    var blob = new Blob([html], { type: 'text/html' });
    var url = URL.createObjectURL(blob);
    
    if (currentProject.type === '3d') {
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
            showToast('WebGL preview opened in popup', 'success');
        } else {
            showToast('Popup blocked! Please allow popups.', 'error');
        }
    } else {
        var newTab = window.open(url, '_blank');
        if (newTab) {
            newTab.focus();
            showToast('Project opened in new tab', 'success');
        } else {
            showToast('Popup blocked! Please allow popups.', 'error');
        }
    }
    
    setTimeout(function() {
        URL.revokeObjectURL(url);
    }, 2000);
}

// Toast Notifications
function showToast(message, type) {
    type = type || 'info';
    var container = document.getElementById('toastContainer');
    if (!container) {
        console.log("Toast: " + message);
        return;
    }
    
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
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(function() {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}
