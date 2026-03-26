// ==================== STORAGE & STATE ====================
const STORAGE_KEY = 'webglGameEditorProjects';

let projects = [];
let currentProjectId = null;
let currentFileIndex = 0;
let saveTimeout = null;
let renameTarget = null;

// ==================== INITIALIZATION ====================
function init() {
    loadProjects();
    renderProjectsList();
    setupEventListeners();
    console.log('Editor initialized successfully');
}

// Wait for DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

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
    const saveStatus = document.getElementById('saveStatus');
    if (saveStatus) {
        saveStatus.textContent = 'Saving...';
        saveStatus.classList.add('saving');
    }

    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        saveProjects();
        if (saveStatus) {
            saveStatus.textContent = 'Auto-saved';
            saveStatus.classList.remove('saving');
        }
    }, 500);
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
    // New Project Button
    const newProjectBtn = document.getElementById('newProjectBtn');
    if (newProjectBtn) {
        newProjectBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('New Project button clicked');
            openNewProjectModal();
        });
    } else {
        console.error('newProjectBtn not found!');
    }

    // Close / Cancel new project modal
    const closeNewProjectModal = document.getElementById('closeNewProjectModal');
    if (closeNewProjectModal) {
        closeNewProjectModal.addEventListener('click', function (e) {
            e.preventDefault();
            hideNewProjectModal();
        });
    }

    const cancelNewProject = document.getElementById('cancelNewProject');
    if (cancelNewProject) {
        cancelNewProject.addEventListener('click', function (e) {
            e.preventDefault();
            hideNewProjectModal();
        });
    }

    // Create Project
    const createProjectBtn = document.getElementById('createProject');
    if (createProjectBtn) {
        createProjectBtn.addEventListener('click', function (e) {
            e.preventDefault();
            console.log('Create project clicked');
            createProject();
        });
    }

    // Add File
    const addFileBtn = document.getElementById('addFileBtn');
    if (addFileBtn) {
        addFileBtn.addEventListener('click', function (e) {
            e.preventDefault();
            openAddFileModal();
        });
    }

    const closeAddFileModal = document.getElementById('closeAddFileModal');
    if (closeAddFileModal) {
        closeAddFileModal.addEventListener('click', function (e) {
            e.preventDefault();
            hideAddFileModal();
        });
    }

    const cancelAddFile = document.getElementById('cancelAddFile');
    if (cancelAddFile) {
        cancelAddFile.addEventListener('click', function (e) {
            e.preventDefault();
            hideAddFileModal();
        });
    }

    const confirmAddFile = document.getElementById('confirmAddFile');
    if (confirmAddFile) {
        confirmAddFile.addEventListener('click', function (e) {
            e.preventDefault();
            addFile();
        });
    }

    // File templates
    document.querySelectorAll('.template-btn').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            var ext = btn.getAttribute('data-name').split('.').pop();
            var input = document.getElementById('newFileName');
            if (input) {
                input.value = 'new.' + ext;
                input.select();
            }
        });
    });

    // Rename Modal
    const closeRenameModal = document.getElementById('closeRenameModal');
    if (closeRenameModal) {
        closeRenameModal.addEventListener('click', function (e) {
            e.preventDefault();
            hideRenameModal();
        });
    }

    const cancelRename = document.getElementById('cancelRename');
    if (cancelRename) {
        cancelRename.addEventListener('click', function (e) {
            e.preventDefault();
            hideRenameModal();
        });
    }

    const confirmRename = document.getElementById('confirmRename');
    if (confirmRename) {
        confirmRename.addEventListener('click', function (e) {
            e.preventDefault();
            doConfirmRename();
        });
    }

    // Run & Delete Project
    const runProjectBtn = document.getElementById('runProjectBtn');
    if (runProjectBtn) {
        runProjectBtn.addEventListener('click', function (e) {
            e.preventDefault();
            runProject();
        });
    }

    const deleteProjectBtn = document.getElementById('deleteProjectBtn');
    if (deleteProjectBtn) {
        deleteProjectBtn.addEventListener('click', function (e) {
            e.preventDefault();
            deleteCurrentProject();
        });
    }

    // Code Editor
    const codeEditor = document.getElementById('codeEditor');
    if (codeEditor) {
        codeEditor.addEventListener('input', handleCodeChange);
        codeEditor.addEventListener('keydown', handleEditorKeydown);
    }

    // Project name click to rename
    const projectName = document.getElementById('projectName');
    if (projectName) {
        projectName.addEventListener('click', function (e) {
            e.preventDefault();
            openProjectRename();
        });
    }

    // WebGL Window
    const closeWebglTest = document.getElementById('closeWebglTest');
    if (closeWebglTest) {
        closeWebglTest.addEventListener('click', function (e) {
            e.preventDefault();
            closeWebglWindow();
        });
    }

    const refreshWebgl = document.getElementById('refreshWebgl');
    if (refreshWebgl) {
        refreshWebgl.addEventListener('click', function (e) {
            e.preventDefault();
            refreshWebglWindow();
        });
    }

    // Modal backdrop clicks
    var newProjectModal = document.getElementById('newProjectModal');
    if (newProjectModal) {
        newProjectModal.addEventListener('click', function (e) {
            if (e.target === newProjectModal) {
                hideNewProjectModal();
            }
        });
    }

    var addFileModal = document.getElementById('addFileModal');
    if (addFileModal) {
        addFileModal.addEventListener('click', function (e) {
            if (e.target === addFileModal) {
                hideAddFileModal();
            }
        });
    }

    var renameModalEl = document.getElementById('renameModal');
    if (renameModalEl) {
        renameModalEl.addEventListener('click', function (e) {
            if (e.target === renameModalEl) {
                hideRenameModal();
            }
        });
    }

    var webglOverlay = document.getElementById('webglOverlay');
    if (webglOverlay) {
        webglOverlay.addEventListener('click', function (e) {
            if (e.target === webglOverlay) {
                closeWebglWindow();
            }
        });
    }

    // Enter key in inputs
    var newProjectNameInput = document.getElementById('newProjectName');
    if (newProjectNameInput) {
        newProjectNameInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                createProject();
            }
        });
    }

    var newFileNameInput = document.getElementById('newFileName');
    if (newFileNameInput) {
        newFileNameInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                addFile();
            }
        });
    }

    var renameInput = document.getElementById('renameInput');
    if (renameInput) {
        renameInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                doConfirmRename();
            }
            if (e.key === 'Escape') {
                hideRenameModal();
            }
        });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', function (e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            saveProjects();
            var saveStatus = document.getElementById('saveStatus');
            if (saveStatus) {
                saveStatus.textContent = 'Saved!';
                setTimeout(function () {
                    saveStatus.textContent = 'Auto-saved';
                }, 1000);
            }
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && currentProjectId) {
            e.preventDefault();
            runProject();
        }
    });
}

function handleCodeChange() {
    if (currentProjectId !== null) {
        var project = getProject(currentProjectId);
        if (project && project.files[currentFileIndex]) {
            var editor = document.getElementById('codeEditor');
            if (editor) {
                project.files[currentFileIndex].content = editor.value;
                project.updatedAt = new Date().toISOString();
                saveWithDebounce();
            }
        }
    }
}

function handleEditorKeydown(e) {
    if (e.key === 'Tab') {
        e.preventDefault();
        var editor = document.getElementById('codeEditor');
        if (!editor) return;

        var start = editor.selectionStart;
        var end = editor.selectionEnd;
        var value = editor.value;

        if (e.shiftKey) {
            var lineStart = value.lastIndexOf('\n', start - 1) + 1;
            var lineContent = value.substring(lineStart, start);
            if (lineContent.startsWith('    ')) {
                editor.value = value.substring(0, lineStart) + value.substring(lineStart + 4);
                editor.selectionStart = editor.selectionEnd = start - 4;
            }
        } else {
            editor.value = value.substring(0, start) + '    ' + value.substring(end);
            editor.selectionStart = editor.selectionEnd = start + 4;
        }

        handleCodeChange();
    }
}

// ==================== MODAL FUNCTIONS ====================
function openNewProjectModal() {
    var modal = document.getElementById('newProjectModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('active');
        console.log('Modal opened');
        var nameInput = document.getElementById('newProjectName');
        if (nameInput) {
            nameInput.value = '';
            setTimeout(function () {
                nameInput.focus();
            }, 100);
        }
    } else {
        console.error('newProjectModal element not found!');
    }
}

function hideNewProjectModal() {
    var modal = document.getElementById('newProjectModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
    }
}

function openAddFileModal() {
    var modal = document.getElementById('addFileModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('active');
        var input = document.getElementById('newFileName');
        if (input) {
            input.value = '';
            setTimeout(function () {
                input.focus();
            }, 100);
        }
    }
}

function hideAddFileModal() {
    var modal = document.getElementById('addFileModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
    }
}

function openProjectRename() {
    var project = getProject(currentProjectId);
    if (!project) return;

    renameTarget = { type: 'project' };
    var title = document.getElementById('renameModalTitle');
    if (title) title.textContent = 'Rename Project';
    var input = document.getElementById('renameInput');
    if (input) input.value = project.name;
    showRenameModal();
}

function openFileRename(index) {
    var project = getProject(currentProjectId);
    if (!project || !project.files[index]) return;

    renameTarget = { type: 'file', index: index };
    var title = document.getElementById('renameModalTitle');
    if (title) title.textContent = 'Rename File';
    var input = document.getElementById('renameInput');
    if (input) input.value = project.files[index].name;
    showRenameModal();
}

function showRenameModal() {
    var modal = document.getElementById('renameModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('active');
        setTimeout(function () {
            var input = document.getElementById('renameInput');
            if (input) input.select();
        }, 100);
    }
}

function hideRenameModal() {
    var modal = document.getElementById('renameModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
    }
    renameTarget = null;
}

function doConfirmRename() {
    var input = document.getElementById('renameInput');
    var newName = input ? input.value.trim() : '';
    if (!newName || !renameTarget) {
        hideRenameModal();
        return;
    }

    var project = getProject(currentProjectId);
    if (!project) {
        hideRenameModal();
        return;
    }

    if (renameTarget.type === 'project') {
        project.name = newName;
        project.updatedAt = new Date().toISOString();
        var nameEl = document.getElementById('projectName');
        if (nameEl) nameEl.textContent = newName;
        renderProjectsList();
    } else if (renameTarget.type === 'file') {
        var index = renameTarget.index;
        var duplicate = project.files.some(function (f, i) {
            return i !== index && f.name.toLowerCase() === newName.toLowerCase();
        });
        if (duplicate) {
            alert('A file with this name already exists!');
            return;
        }
        project.files[index].name = newName;
        project.updatedAt = new Date().toISOString();
        renderFileTabs();
        updateCurrentFileName();
    }

    saveProjects();
    hideRenameModal();
}

// ==================== HELPER ====================
function getProject(id) {
    for (var i = 0; i < projects.length; i++) {
        if (projects[i].id === id) return projects[i];
    }
    return null;
}

// ==================== PROJECT FUNCTIONS ====================
function createProject() {
    var nameInput = document.getElementById('newProjectName');
    var typeInput = document.querySelector('input[name="projectType"]:checked');

    var name = nameInput ? nameInput.value.trim() : '';
    if (!name) name = 'Untitled Project';
    var type = typeInput ? typeInput.value : '2d';

    console.log('Creating project:', name, type);

    var project = {
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
    hideNewProjectModal();
}

function getDefaultFiles(type) {
    return [
        { name: 'index.html', content: getDefaultHTML(type) },
        { name: 'style.css', content: getDefaultCSS(type) },
        { name: 'script.js', content: getDefaultJS(type) }
    ];
}

function getDefaultHTML(type) {
    var titles = { '2d': '2D Game', 'app': 'Web App', 'webgl': 'WebGL 3D Game' };
    var title = titles[type] || 'Project';

    if (type === 'webgl') {
        return '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>' + title + '</title>\n    <link rel="stylesheet" href="style.css">\n</head>\n<body>\n    <canvas id="glCanvas"></canvas>\n    <script src="script.js"><\/script>\n</body>\n</html>';
    } else if (type === '2d') {
        return '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>' + title + '</title>\n    <link rel="stylesheet" href="style.css">\n</head>\n<body>\n    <canvas id="gameCanvas"></canvas>\n    <script src="script.js"><\/script>\n</body>\n</html>';
    } else {
        return '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>' + title + '</title>\n    <link rel="stylesheet" href="style.css">\n</head>\n<body>\n    <div id="app">\n        <h1>Welcome!</h1>\n        <p>Start building your web app.</p>\n    </div>\n    <script src="script.js"><\/script>\n</body>\n</html>';
    }
}

function getDefaultCSS(type) {
    var base = '* {\n    margin: 0;\n    padding: 0;\n    box-sizing: border-box;\n}\n\n';

    if (type === 'webgl') {
        return base + 'body {\n    overflow: hidden;\n    background: #000;\n}\n\n#glCanvas {\n    width: 100vw;\n    height: 100vh;\n    display: block;\n}';
    } else if (type === '2d') {
        return base + 'body {\n    display: flex;\n    justify-content: center;\n    align-items: center;\n    min-height: 100vh;\n    background: linear-gradient(135deg, #1a1a2e, #16162a);\n}\n\n#gameCanvas {\n    border: 3px solid #6366f1;\n    border-radius: 8px;\n    box-shadow: 0 0 30px rgba(99, 102, 241, 0.3);\n}';
    } else {
        return base + 'body {\n    font-family: system-ui, sans-serif;\n    background: linear-gradient(135deg, #0f0f1a, #1a1a2e);\n    min-height: 100vh;\n    color: #fff;\n}\n\n#app {\n    max-width: 900px;\n    margin: 0 auto;\n    padding: 60px 24px;\n    text-align: center;\n}\n\nh1 {\n    font-size: 3rem;\n    margin-bottom: 20px;\n    color: #6366f1;\n}\n\np {\n    font-size: 1.2rem;\n    color: #8888aa;\n}';
    }
}

function getDefaultJS(type) {
    if (type === 'webgl') {
        return '// WebGL 3D - Rotating Cube\nvar canvas = document.getElementById("glCanvas");\nvar gl = canvas.getContext("webgl");\n\nif (!gl) {\n    alert("WebGL not supported!");\n}\n\nfunction resize() {\n    canvas.width = window.innerWidth;\n    canvas.height = window.innerHeight;\n    gl.viewport(0, 0, canvas.width, canvas.height);\n}\nresize();\nwindow.addEventListener("resize", resize);\n\nvar vsSource = [\n    "attribute vec4 aPosition;",\n    "attribute vec4 aColor;",\n    "uniform mat4 uMatrix;",\n    "varying vec4 vColor;",\n    "void main() {",\n    "    gl_Position = uMatrix * aPosition;",\n    "    vColor = aColor;",\n    "}"\n].join("\\n");\n\nvar fsSource = [\n    "precision mediump float;",\n    "varying vec4 vColor;",\n    "void main() {",\n    "    gl_FragColor = vColor;",\n    "}"\n].join("\\n");\n\nfunction createShader(type, source) {\n    var shader = gl.createShader(type);\n    gl.shaderSource(shader, source);\n    gl.compileShader(shader);\n    return shader;\n}\n\nvar vs = createShader(gl.VERTEX_SHADER, vsSource);\nvar fs = createShader(gl.FRAGMENT_SHADER, fsSource);\nvar program = gl.createProgram();\ngl.attachShader(program, vs);\ngl.attachShader(program, fs);\ngl.linkProgram(program);\ngl.useProgram(program);\n\nvar positions = new Float32Array([\n    -1,-1,1, 1,-1,1, 1,1,1, -1,1,1,\n    -1,-1,-1, -1,1,-1, 1,1,-1, 1,-1,-1,\n    -1,1,-1, -1,1,1, 1,1,1, 1,1,-1,\n    -1,-1,-1, 1,-1,-1, 1,-1,1, -1,-1,1,\n    1,-1,-1, 1,1,-1, 1,1,1, 1,-1,1,\n    -1,-1,-1, -1,-1,1, -1,1,1, -1,1,-1\n]);\n\nvar colors = new Float32Array([\n    1,0,0,1, 1,0,0,1, 1,0,0,1, 1,0,0,1,\n    0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1,\n    0,0,1,1, 0,0,1,1, 0,0,1,1, 0,0,1,1,\n    1,1,0,1, 1,1,0,1, 1,1,0,1, 1,1,0,1,\n    1,0,1,1, 1,0,1,1, 1,0,1,1, 1,0,1,1,\n    0,1,1,1, 0,1,1,1, 0,1,1,1, 0,1,1,1\n]);\n\nvar indices = new Uint16Array([\n    0,1,2, 0,2,3, 4,5,6, 4,6,7,\n    8,9,10, 8,10,11, 12,13,14, 12,14,15,\n    16,17,18, 16,18,19, 20,21,22, 20,22,23\n]);\n\nvar posBuf = gl.createBuffer();\ngl.bindBuffer(gl.ARRAY_BUFFER, posBuf);\ngl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);\nvar aPos = gl.getAttribLocation(program, "aPosition");\ngl.enableVertexAttribArray(aPos);\ngl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);\n\nvar colBuf = gl.createBuffer();\ngl.bindBuffer(gl.ARRAY_BUFFER, colBuf);\ngl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);\nvar aCol = gl.getAttribLocation(program, "aColor");\ngl.enableVertexAttribArray(aCol);\ngl.vertexAttribPointer(aCol, 4, gl.FLOAT, false, 0, 0);\n\nvar idxBuf = gl.createBuffer();\ngl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);\ngl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);\n\nvar uMatrix = gl.getUniformLocation(program, "uMatrix");\ngl.enable(gl.DEPTH_TEST);\ngl.clearColor(0.05, 0.05, 0.1, 1);\n\nvar rotation = 0;\n\nfunction perspective(fov, aspect, near, far) {\n    var f = 1 / Math.tan(fov * Math.PI / 360);\n    var nf = 1 / (near - far);\n    return new Float32Array([\n        f/aspect,0,0,0, 0,f,0,0,\n        0,0,(far+near)*nf,-1,\n        0,0,2*far*near*nf,0\n    ]);\n}\n\nfunction render() {\n    rotation += 0.01;\n    var aspect = canvas.width / canvas.height;\n    var m = perspective(45, aspect, 0.1, 100);\n    m[14] += -6;\n    \n    var c = Math.cos(rotation), s = Math.sin(rotation);\n    var m0=m[0],m1=m[1],m2=m[2],m3=m[3];\n    m[0]=m0*c-m[8]*s; m[1]=m1*c-m[9]*s;\n    m[2]=m2*c-m[10]*s; m[3]=m3*c-m[11]*s;\n    m[8]=m0*s+m[8]*c; m[9]=m1*s+m[9]*c;\n    m[10]=m2*s+m[10]*c; m[11]=m3*s+m[11]*c;\n    \n    var c2 = Math.cos(rotation*0.7), s2 = Math.sin(rotation*0.7);\n    var m4=m[4],m5=m[5],m6=m[6],m7=m[7];\n    m[4]=m4*c2+m[8]*s2; m[5]=m5*c2+m[9]*s2;\n    m[6]=m6*c2+m[10]*s2; m[7]=m7*c2+m[11]*s2;\n    m[8]=m[8]*c2-m4*s2; m[9]=m[9]*c2-m5*s2;\n    m[10]=m[10]*c2-m6*s2; m[11]=m[11]*c2-m7*s2;\n    \n    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);\n    gl.uniformMatrix4fv(uMatrix, false, m);\n    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);\n    requestAnimationFrame(render);\n}\n\nrender();\nconsole.log("WebGL 3D Running!");';
    } else if (type === '2d') {
        return '// 2D Game - Player Movement\nvar canvas = document.getElementById("gameCanvas");\nvar ctx = canvas.getContext("2d");\n\ncanvas.width = 800;\ncanvas.height = 600;\n\nvar player = {\n    x: canvas.width / 2,\n    y: canvas.height / 2,\n    radius: 25,\n    speed: 5,\n    trail: []\n};\n\nvar keys = {};\n\nwindow.addEventListener("keydown", function(e) { keys[e.key.toLowerCase()] = true; });\nwindow.addEventListener("keyup", function(e) { keys[e.key.toLowerCase()] = false; });\n\nfunction update() {\n    var dx = 0, dy = 0;\n    if (keys["w"] || keys["arrowup"]) dy = -1;\n    if (keys["s"] || keys["arrowdown"]) dy = 1;\n    if (keys["a"] || keys["arrowleft"]) dx = -1;\n    if (keys["d"] || keys["arrowright"]) dx = 1;\n    \n    if (dx !== 0 || dy !== 0) {\n        var len = Math.sqrt(dx*dx + dy*dy);\n        player.x += (dx / len) * player.speed;\n        player.y += (dy / len) * player.speed;\n    }\n    \n    player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));\n    player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));\n    \n    player.trail.push({x: player.x, y: player.y});\n    if (player.trail.length > 20) player.trail.shift();\n}\n\nfunction render() {\n    ctx.fillStyle = "#0f0f1a";\n    ctx.fillRect(0, 0, canvas.width, canvas.height);\n    \n    // Grid\n    ctx.strokeStyle = "#1a1a2e";\n    for (var x = 0; x < canvas.width; x += 40) {\n        ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,canvas.height); ctx.stroke();\n    }\n    for (var y = 0; y < canvas.height; y += 40) {\n        ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(canvas.width,y); ctx.stroke();\n    }\n    \n    // Trail\n    for (var i = 0; i < player.trail.length; i++) {\n        var alpha = i / player.trail.length * 0.4;\n        ctx.fillStyle = "rgba(99, 102, 241, " + alpha + ")";\n        ctx.beginPath();\n        ctx.arc(player.trail[i].x, player.trail[i].y, player.radius * (i / player.trail.length), 0, Math.PI * 2);\n        ctx.fill();\n    }\n    \n    // Player\n    ctx.fillStyle = "#6366f1";\n    ctx.shadowColor = "#6366f1";\n    ctx.shadowBlur = 20;\n    ctx.beginPath();\n    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);\n    ctx.fill();\n    ctx.shadowBlur = 0;\n    \n    // Instructions\n    ctx.fillStyle = "#666";\n    ctx.font = "16px system-ui";\n    ctx.textAlign = "center";\n    ctx.fillText("Use WASD or Arrow keys to move", canvas.width / 2, 30);\n}\n\nfunction gameLoop() {\n    update();\n    render();\n    requestAnimationFrame(gameLoop);\n}\n\ngameLoop();\nconsole.log("2D Game Running!");';
    } else {
        return '// Web App\nconsole.log("Web App Started!");\n\nvar app = document.getElementById("app");\n\nvar button = document.createElement("button");\nbutton.textContent = "Click Me!";\nbutton.style.marginTop = "30px";\nbutton.style.padding = "16px 32px";\nbutton.style.fontSize = "1.1rem";\nbutton.style.fontWeight = "600";\nbutton.style.background = "linear-gradient(135deg, #6366f1, #a855f7)";\nbutton.style.color = "white";\nbutton.style.border = "none";\nbutton.style.borderRadius = "12px";\nbutton.style.cursor = "pointer";\n\nvar clickCount = 0;\n\nbutton.addEventListener("click", function() {\n    clickCount++;\n    button.textContent = "Clicked " + clickCount + " times!";\n});\n\napp.appendChild(button);';
    }
}

function renderProjectsList() {
    var list = document.getElementById('projectsList');
    if (!list) return;

    list.innerHTML = '';

    if (projects.length === 0) {
        list.innerHTML = '<div class="empty-projects"><div class="empty-projects-icon">📁</div><p>No projects yet.<br>Create your first project!</p></div>';
        return;
    }

    for (var i = 0; i < projects.length; i++) {
        (function (project) {
            var item = document.createElement('div');
            item.className = 'project-item' + (project.id === currentProjectId ? ' active' : '');

            var date = new Date(project.updatedAt || project.createdAt);
            var dateStr = date.toLocaleDateString();

            item.innerHTML =
                '<div class="project-item-name">' + escapeHtml(project.name) + '</div>' +
                '<div class="project-item-type">' + getTypeIcon(project.type) + ' ' + getTypeLabel(project.type) + '</div>' +
                '<div class="project-item-date">Last edited: ' + dateStr + '</div>';

            item.addEventListener('click', function () {
                selectProject(project.id);
            });

            list.appendChild(item);
        })(projects[i]);
    }
}

function getTypeIcon(type) {
    var icons = { '2d': '🎮', 'app': '📱', 'webgl': '🎲' };
    return icons[type] || '📄';
}

function getTypeLabel(type) {
    var labels = { '2d': '2D Game', 'app': 'Web App', 'webgl': 'WebGL 3D' };
    return labels[type] || type;
}

function selectProject(id) {
    currentProjectId = id;
    currentFileIndex = 0;

    var project = getProject(id);

    if (project) {
        var noMsg = document.getElementById('noProjectMessage');
        var editor = document.getElementById('projectEditor');
        if (noMsg) noMsg.style.display = 'none';
        if (editor) editor.style.display = 'flex';

        var nameEl = document.getElementById('projectName');
        if (nameEl) nameEl.textContent = project.name;

        var typeEl = document.getElementById('projectType');
        if (typeEl) {
            typeEl.textContent = getTypeIcon(project.type) + ' ' + getTypeLabel(project.type);
            typeEl.className = 'project-type-badge type-' + project.type;
        }

        renderFileTabs();
        loadFileContent();
    }

    renderProjectsList();
}

function deleteCurrentProject() {
    var project = getProject(currentProjectId);
    if (!project) return;

    if (confirm('Are you sure you want to delete "' + project.name + '"?\nThis cannot be undone.')) {
        projects = projects.filter(function (p) {
            return p.id !== currentProjectId;
        });
        saveProjects();
        currentProjectId = null;

        var noMsg = document.getElementById('noProjectMessage');
        var editor = document.getElementById('projectEditor');
        if (noMsg) noMsg.style.display = 'flex';
        if (editor) editor.style.display = 'none';

        renderProjectsList();
    }
}

// ==================== FILE FUNCTIONS ====================
function renderFileTabs() {
    var project = getProject(currentProjectId);
    var tabsEl = document.getElementById('fileTabs');
    if (!project || !tabsEl) return;

    tabsEl.innerHTML = '';

    for (var i = 0; i < project.files.length; i++) {
        (function (file, index) {
            var tab = document.createElement('div');
            tab.className = 'file-tab' + (index === currentFileIndex ? ' active' : '');

            var icon = getFileIcon(file.name);
            var deleteHtml = project.files.length > 1 ? '<button class="file-tab-btn delete" title="Delete">×</button>' : '';

            tab.innerHTML =
                '<span class="file-tab-icon">' + icon + '</span>' +
                '<span class="file-tab-name">' + escapeHtml(file.name) + '</span>' +
                '<div class="file-tab-actions">' +
                '<button class="file-tab-btn rename" title="Rename">✏️</button>' +
                deleteHtml +
                '</div>';

            tab.addEventListener('click', function (e) {
                if (!e.target.closest('.file-tab-btn')) {
                    currentFileIndex = index;
                    renderFileTabs();
                    loadFileContent();
                }
            });

            var renameBtn = tab.querySelector('.rename');
            if (renameBtn) {
                renameBtn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    openFileRename(index);
                });
            }

            var deleteBtn = tab.querySelector('.delete');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    deleteFile(index);
                });
            }

            tabsEl.appendChild(tab);
        })(project.files[i], i);
    }
}

function getFileIcon(filename) {
    var ext = filename.split('.').pop().toLowerCase();
    var icons = { 'html': '🌐', 'css': '🎨', 'js': '⚡', 'json': '📋', 'md': '📝', 'txt': '📄' };
    return icons[ext] || '📄';
}

function loadFileContent() {
    var project = getProject(currentProjectId);
    var editor = document.getElementById('codeEditor');
    if (!project || !project.files[currentFileIndex] || !editor) return;

    editor.value = project.files[currentFileIndex].content;
    updateCurrentFileName();
}

function updateCurrentFileName() {
    var project = getProject(currentProjectId);
    var el = document.getElementById('currentFileName');
    if (!project || !project.files[currentFileIndex] || !el) return;

    el.textContent = project.files[currentFileIndex].name;
}

function addFile() {
    var project = getProject(currentProjectId);
    if (!project) return;

    var input = document.getElementById('newFileName');
    var fileName = input ? input.value.trim() : '';
    if (!fileName) {
        alert('Please enter a file name');
        return;
    }

    var exists = project.files.some(function (f) {
        return f.name.toLowerCase() === fileName.toLowerCase();
    });
    if (exists) {
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
    hideAddFileModal();
}

function getDefaultFileContent(filename) {
    var ext = filename.split('.').pop().toLowerCase();
    if (ext === 'js') return '// JavaScript\n\n';
    if (ext === 'css') return '/* Styles */\n\n';
    if (ext === 'html') return '<!DOCTYPE html>\n<html>\n<head>\n    <title></title>\n</head>\n<body>\n    \n</body>\n</html>';
    if (ext === 'json') return '{\n    \n}';
    return '';
}

function deleteFile(index) {
    var project = getProject(currentProjectId);
    if (!project || project.files.length <= 1) return;

    var fileName = project.files[index].name;
    if (confirm('Delete "' + fileName + '"?')) {
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
    var project = getProject(currentProjectId);
    if (!project) return;

    // Find HTML file
    var htmlFile = null;
    for (var i = 0; i < project.files.length; i++) {
        if (project.files[i].name === 'index.html') {
            htmlFile = project.files[i];
            break;
        }
    }
    if (!htmlFile) {
        for (var j = 0; j < project.files.length; j++) {
            if (project.files[j].name.endsWith('.html')) {
                htmlFile = project.files[j];
                break;
            }
        }
    }

    if (!htmlFile) {
        alert('No HTML file found in project!');
        return;
    }

    var html = htmlFile.content;

    // Inline CSS files
    for (var c = 0; c < project.files.length; c++) {
        var cssFile = project.files[c];
        if (cssFile.name.endsWith('.css')) {
            var cssRegex = new RegExp('<link[^>]*href=["\']' + escapeRegex(cssFile.name) + '["\'][^>]*>', 'gi');
            html = html.replace(cssRegex, '<style>\n' + cssFile.content + '\n</style>');
        }
    }

    // Inline JS files
    for (var s = 0; s < project.files.length; s++) {
        var jsFile = project.files[s];
        if (jsFile.name.endsWith('.js')) {
            var jsRegex = new RegExp('<script[^>]*src=["\']' + escapeRegex(jsFile.name) + '["\'][^>]*><\\/script>', 'gi');
            html = html.replace(jsRegex, '<script>\n' + jsFile.content + '\n<\/script>');
        }
    }

    var blob = new Blob([html], { type: 'text/html' });
    var url = URL.createObjectURL(blob);

    if (project.type === 'webgl') {
        // Show in embedded test window
        var overlay = document.getElementById('webglOverlay');
        var frame = document.getElementById('webglFrame');
        if (overlay) overlay.style.display = 'flex';
        if (frame) frame.src = url;
    } else {
        // Open in new tab
        window.open(url, '_blank');
    }
}

function closeWebglWindow() {
    var overlay = document.getElementById('webglOverlay');
    var frame = document.getElementById('webglFrame');
    if (overlay) overlay.style.display = 'none';
    if (frame) frame.src = 'about:blank';
}

function refreshWebglWindow() {
    runProject();
}

// ==================== UTILITIES ====================
function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
