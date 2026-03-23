// Broadcast Channel for cross-tab communication
const gameChannel = new BroadcastChannel('game_editor_channel');
let runningGameWindow = null;
let currentProjectId = null;

// Project management
const projects = JSON.parse(localStorage.getItem('projects')) || {};

// DOM Elements
const projectList = document.getElementById('projectList');
const projectTitle = document.getElementById('projectTitle');
const htmlEditor = document.getElementById('htmlEditor');
const cssEditor = document.getElementById('cssEditor');
const jsEditor = document.getElementById('jsEditor');
const runBtn = document.getElementById('runBtn');
const deleteProjectBtn = document.getElementById('deleteProjectBtn');
const newProjectBtn = document.getElementById('newProjectBtn');
const projectModal = document.getElementById('projectModal');
const projectNameInput = document.getElementById('projectNameInput');
const createProjectBtn = document.getElementById('createProjectBtn');
const cancelModalBtn = document.getElementById('cancelModalBtn');

// Tab switching
const tabButtons = document.querySelectorAll('.tab-btn');
const editors = document.querySelectorAll('.editor');

tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;
        
        // Update active tab
        tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Show corresponding editor
        editors.forEach(editor => {
            editor.classList.remove('active');
            if (editor.id === `${tabName}Editor`) {
                editor.classList.add('active');
            }
        });
    });
});

// Auto-save on input
[htmlEditor, cssEditor, jsEditor].forEach(editor => {
    editor.addEventListener('input', () => {
        if (currentProjectId) {
            saveCurrentProject();
        }
    });
});

// Modal handlers
newProjectBtn.addEventListener('click', () => {
    projectModal.classList.add('active');
    projectNameInput.value = '';
    projectNameInput.focus();
});

cancelModalBtn.addEventListener('click', () => {
    projectModal.classList.remove('active');
});

projectNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        createProject();
    }
});

createProjectBtn.addEventListener('click', createProject);

// Create new project
function createProject() {
    const projectName = projectNameInput.value.trim();
    
    if (!projectName) {
        alert('Please enter a project name');
        return;
    }
    
    const projectId = Date.now().toString();
    projects[projectId] = {
        id: projectId,
        name: projectName,
        html: '<!DOCTYPE html>\n<html>\n<head>\n    <title>My Game</title>\n</head>\n<body>\n    <canvas id="gameCanvas"></canvas>\n</body>\n</html>',
        css: 'body {\n    margin: 0;\n    overflow: hidden;\n}\n\n#gameCanvas {\n    display: block;\n}',
        js: '// Your game code here\nconst canvas = document.getElementById(\'gameCanvas\');\nconst gl = canvas.getContext(\'webgl\') || canvas.getContext(\'experimental-webgl\');\n\nif (!gl) {\n    alert(\'WebGL not supported\');\n}\n\ncanvas.width = window.innerWidth;\ncanvas.height = window.innerHeight;\n\n// Example: Clear to blue\ngl.clearColor(0.0, 0.5, 0.8, 1.0);\ngl.clear(gl.COLOR_BUFFER_BIT);'
    };
    
    saveProjects();
    renderProjectList();
    loadProject(projectId);
    projectModal.classList.remove('active');
}

// Save projects to localStorage
function saveProjects() {
    localStorage.setItem('projects', JSON.stringify(projects));
}

// Save current project
function saveCurrentProject() {
    if (currentProjectId && projects[currentProjectId]) {
        projects[currentProjectId].html = htmlEditor.value;
        projects[currentProjectId].css = cssEditor.value;
        projects[currentProjectId].js = jsEditor.value;
        saveProjects();
    }
}

// Render project list
function renderProjectList() {
    projectList.innerHTML = '';
    
    Object.values(projects).forEach(project => {
        const projectItem = document.createElement('div');
        projectItem.className = 'project-item';
        projectItem.textContent = project.name;
        
        if (project.id === currentProjectId) {
            projectItem.classList.add('active');
        }
        
        projectItem.addEventListener('click', () => {
            loadProject(project.id);
        });
        
        projectList.appendChild(projectItem);
    });
}

// Load project
function loadProject(projectId) {
    const project = projects[projectId];
    
    if (!project) return;
    
    currentProjectId = projectId;
    projectTitle.textContent = project.name;
    htmlEditor.value = project.html;
    cssEditor.value = project.css;
    jsEditor.value = project.js;
    
    runBtn.disabled = false;
    deleteProjectBtn.disabled = false;
    
    renderProjectList();
}

// Delete project
deleteProjectBtn.addEventListener('click', () => {
    if (!currentProjectId) return;
    
    const project = projects[currentProjectId];
    
    if (confirm(`Are you sure you want to delete "${project.name}"?`)) {
        delete projects[currentProjectId];
        saveProjects();
        
        currentProjectId = null;
        projectTitle.textContent = 'Select or Create a Project';
        htmlEditor.value = '';
        cssEditor.value = '';
        jsEditor.value = '';
        runBtn.disabled = true;
        deleteProjectBtn.disabled = true;
        
        renderProjectList();
    }
});

// Run game
runBtn.addEventListener('click', () => {
    if (!currentProjectId) return;
    
    saveCurrentProject();
    
    // Notify other tabs to close their game windows
    gameChannel.postMessage({ type: 'close_game' });
    
    // Close current game window if exists
    if (runningGameWindow && !runningGameWindow.closed) {
        runningGameWindow.close();
    }
    
    // Create game content
    const html = htmlEditor.value;
    const css = cssEditor.value;
    const js = jsEditor.value;
    
    const gameContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${projects[currentProjectId].name}</title>
            <style>${css}</style>
        </head>
        <body>
            ${html.replace(/<html[^>]*>|<\/html>|<head[^>]*>|<\/head>|<body[^>]*>|<\/body>/gi, '')}
            <script>${js}<\/script>
        </body>
        </html>
    `;
    
    // Open in new window
    runningGameWindow = window.open('', '_blank', 'width=800,height=600');
    
    if (runningGameWindow) {
        runningGameWindow.document.open();
        runningGameWindow.document.write(gameContent);
        runningGameWindow.document.close();
        
        // Listen for window close
        const checkClosed = setInterval(() => {
            if (runningGameWindow.closed) {
                clearInterval(checkClosed);
                runningGameWindow = null;
            }
        }, 1000);
    } else {
        alert('Please allow popups for this site to run your game');
    }
});

// Listen for messages from other tabs
gameChannel.addEventListener('message', (event) => {
    if (event.data.type === 'close_game') {
        if (runningGameWindow && !runningGameWindow.closed) {
            runningGameWindow.close();
            runningGameWindow = null;
        }
    }
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    saveCurrentProject();
    
    // Close game window when editor closes
    if (runningGameWindow && !runningGameWindow.closed) {
        runningGameWindow.close();
    }
});

// Initialize
renderProjectList();

// Load first project if exists
const projectIds = Object.keys(projects);
if (projectIds.length > 0) {
    loadProject(projectIds[0]);
}