// =============================================
// WebGL Game Editor - LocalStorage Version
// No login required!
// =============================================

const gameChannel = new BroadcastChannel('webgl_game_editor_channel');
let runningGameWindow = null;
let currentProject = null;
let currentFile = null;
let projects = {};
let saveTimeout = null;

// DOM Elements
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
const exportAllBtn = document.getElementById('exportAllBtn');
const importBtn = document.getElementById('importBtn');
const clearAllBtn = document.getElementById('clearAllBtn');

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
            { name: 'main', type: 'js', content: `// WebGL Setup\nconst canvas = document.getElementById('glCanvas');\nconst gl = canvas.getContext('webgl');\n\nif (!gl) {\n    alert('WebGL not supported!');\n}\n\ncanvas.width = window.innerWidth;\ncanvas.height = window.innerHeight;\ngl.viewport(0, 0, canvas.width, canvas.height);\n\ngl.clearColor(0.1, 0.2, 0.3, 1.0);\ngl.clear(gl.COLOR_BUFFER_BIT);\n\nconsole.log('WebGL ready!');` }
        ]
    },
    canvas: {
        files: [
            { name: 'index', type: 'html', content: '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Canvas Game</title>\n</head>\n<body>\n    <canvas id="gameCanvas"></canvas>\n</body>\n</html>' },
            { name: 'style', type: 'css', content: '* {\n    margin: 0;\n    padding: 0;\n}\n\nbody {\n    overflow: hidden;\n    background: #1a1a2e;\n}\n\n#gameCanvas {\n    display: block;\n}' },
            { name: 'game', type: 'js', content: `const canvas = document.getElementById('gameCanvas');\nconst ctx = canvas.getContext('2d');\n\ncanvas.width = window.innerWidth;\ncanvas.height = window.innerHeight;\n\nconst player = {\n    x: canvas.width / 2,\n    y: canvas.height / 2,\n    size: 30,\n    speed: 5,\n    color: '#00ff88'\n};\n\nconst keys = {};\ndocument.addEventListener('keydown', e => keys[e.key] = true);\ndocument.addEventListener('keyup', e => keys[e.key] = false);\n\nfunction update() {\n    if (keys['ArrowUp'] || keys['w']) player.y -= player.speed;\n    if (keys['ArrowDown'] || keys['s']) player.y += player.speed;\n    if (keys['ArrowLeft'] || keys['a']) player.x -= player.speed;\n    if (keys['ArrowRight'] || keys['d']) player.x += player.speed;\n}\n\nfunction draw() {\n    ctx.fillStyle = '#1a1a2e';\n    ctx.fillRect(0, 0, canvas.width, canvas.height);\n    \n    ctx.beginPath();\n    ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);\n    ctx.fillStyle = player.color;\n    ctx.fill();\n    \n    ctx.fillStyle = '#fff';\n    ctx.font = '18px Arial';\n    ctx.fillText('Use WASD or Arrow Keys', 20, 30);\n}\n\nfunction gameLoop() {\n    update();\n    draw();\n    requestAnimationFrame(gameLoop);\n}\n\ngameLoop();` }
        ]
    }
};

// =============================================
// LOCALSTORAGE MANAGEMENT
// =============================================

function loadProjects() {
    try {
        const saved = localStorage.getItem('gameEditorProjects');
        projects = saved ? JSON.parse(saved) : {};
        renderProjectList();
        renderArchivedList();
        console.log(`✅ Loaded ${Object.keys(projects).length} projects from localStorage`);
    } catch (error) {
        console.error('Error loading projects:', error);
        projects = {};
    }
}

function saveProjects() {
    try {
        localStorage.setItem('gameEditorProjects', JSON.stringify(projects));
    } catch (error) {
        console.error('Error saving projects:', error);
        if (error.name === 'QuotaExceededError') {
            showToast('Storage full! Export and delete old projects.', 'error');
        }
    }
}

function saveCurrentFile() {
    if (currentProject && currentFile !== null && currentProject.files[currentFile]) {
        currentProject.files[currentFile].content = codeEditor.value;
        projects[currentProject.id] = currentProject;
        saveProjects();
    }
}

// =============================================
// PROJECT MANAGEMENT
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

window.restoreProject = function(projectId) {
    const project = projects[projectId];
    if (!project) return;
    
    project.archived = false;
    saveProjects();
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
    
    saveCurrentFile();
    currentFile = index;
    codeEditor.value = currentProject.files[index].content;
    codeEditor.disabled = false;
    renderFileTabs();
}

function addFile(name, type) {
    if (!currentProject) return false;
    if (!currentProject.files) currentProject.files = [];
    
    if (currentProject.files.some(f => f.name === name && f.type === type)) {
        showToast('File already exists', 'error');
        return false;
    }
    
    const defaults = {
        html: '<!DOCTYPE html>\n<html>\n<head>\n    <title></title>\n</head>\n<body>\n    \n</body>\n</html>',
        css: '/* Styles */\n',
        js: '// JavaScript\n'
    };
    
    currentProject.files.push({ name, type, content: defaults[type] || '' });
    saveProjects();
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
    saveProjects();
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
    saveProjects();
    
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
        saveTimeout = setTimeout(() => saveProjects(), 500);
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

runProjectBtn.addEventListener('click', () => {
    if (!currentProject?.files) return;
    
    saveCurrentFile();
    
    gameChannel.postMessage({ type: 'close_game' });
    if (runningGameWindow && !runningGameWindow.closed) {
        runningGameWindow.close();
    }
    
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
});

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
    
    saveCurrentFile();
    
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
// EXPORT / IMPORT ALL PROJECTS
// =============================================

exportAllBtn.addEventListener('click', () => {
    saveCurrentFile();
    
    const dataStr = JSON.stringify(projects, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `game-editor-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('All projects exported!', 'success');
});

importBtn.addEventListener('click', () => {
    document.getElementById('importFileInput').click();
});

document.getElementById('importFileInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const importedProjects = JSON.parse(event.target.result);
            
            if (confirm('Import projects? This will merge with existing projects.')) {
                projects = { ...projects, ...importedProjects };
                saveProjects();
                renderProjectList();
                renderArchivedList();
                showToast('Projects imported!', 'success');
            }
        } catch (error) {
            showToast('Invalid file format', 'error');
        }
    };
    reader.readAsText(file);
    e.target.value = '';
});

// =============================================
// CLEAR ALL DATA
// =============================================

clearAllBtn.addEventListener('click', () => {
    if (confirm('Delete ALL projects? This cannot be undone!\n\nTip: Export your projects first.')) {
        if (confirm('Are you REALLY sure? All your work will be lost!')) {
            localStorage.removeItem('gameEditorProjects');
            projects = {};
            currentProject = null;
            currentFile = null;
            renderProjectList();
            renderArchivedList();
            showNoProjectSelected();
            showToast('All data cleared', 'info');
        }
    }
});

// =============================================
// ARCHIVE & DELETE
// =============================================

archiveProjectBtn.addEventListener('click', () => {
    if (!currentProject) return;
    
    currentProject.archived = true;
    saveProjects();
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
        delete projects[currentProject.id];
        saveProjects();
        currentProject = null;
        currentFile = null;
        showNoProjectSelected();
        renderProjectList();
        renderArchivedList();
        showToast('Project deleted', 'success');
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
        saveProjects();
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

newProjectBtn.addEventListener('click', () => {
    document.getElementById('newProjectName').value = '';
    document.querySelector('input[name="template"][value="blank"]').checked = true;
    newProjectModal.classList.add('active');
    document.getElementById('newProjectName').focus();
});

document.getElementById('createProjectBtn').addEventListener('click', () => {
    const name = document.getElementById('newProjectName').value.trim();
    const template = document.querySelector('input[name="template"]:checked').value;
    
    if (!name) {
        showToast('Enter project name', 'error');
        return;
    }
    
    const projectId = Date.now().toString();
    projects[projectId] = {
        id: projectId,
        name,
        files: JSON.parse(JSON.stringify(templates[template].files)),
        archived: false,
        created: new Date().toISOString()
    };
    
    saveProjects();
    closeAllModals();
    renderProjectList();
    selectProject(projectId);
    showToast('Project created!', 'success');
});

addFileBtn.addEventListener('click', () => {
    document.getElementById('newFileName').value = '';
    document.getElementById('newFileType').value = 'js';
    newFileModal.classList.add('active');
    document.getElementById('newFileName').focus();
});

document.getElementById('createFileBtn').addEventListener('click', () => {
    const name = document.getElementById('newFileName').value.trim();
    const type = document.getElementById('newFileType').value;
    
    if (!name || !/^[a-zA-Z0-9_-]+$/.test(name)) {
        showToast('Invalid file name', 'error');
        return;
    }
    
    if (addFile(name, type)) closeAllModals();
});

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

document.getElementById('confirmRenameFileBtn').addEventListener('click', () => {
    const newName = document.getElementById('renameFileName').value.trim();
    
    if (!newName || !/^[a-zA-Z0-9_-]+$/.test(newName)) {
        showToast('Invalid name', 'error');
        return;
    }
    
    if (renameFile(contextMenuFileIndex, newName)) closeAllModals();
});

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

window.addEventListener('beforeunload', () => {
    saveCurrentFile();
    if (runningGameWindow && !runningGameWindow.closed) {
        runningGameWindow.close();
    }
});

// =============================================
// INITIALIZE
// =============================================

loadProjects();
console.log('✅ Game Editor ready! (LocalStorage mode)');
