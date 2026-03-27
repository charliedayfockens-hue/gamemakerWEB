/* ============================================================
   GameMaker Web – app.js
   Complete editor logic: projects, files, CodeMirror, run, etc.
============================================================ */
'use strict';

// ── Storage ──────────────────────────────────────────────────
const STORAGE_KEY = 'gmw_projects_v1';

function loadProjects() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch { return []; }
}
function saveProjects() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.projects));
}

// ── State ─────────────────────────────────────────────────────
const state = {
  projects: loadProjects(),
  activeProjectId: null,
  activeFileId: null,
};

// ── Default file templates ────────────────────────────────────
const TEMPLATES = {
  '2d': [
    {
      name: 'index.html',
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>2D Game</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <canvas id="canvas"></canvas>
  <script src="game.js"><\/script>
</body>
</html>`,
    },
    {
      name: 'styles.css',
      content: `* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  background: #0a0a18;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  overflow: hidden;
}
#canvas {
  display: block;
  border: 2px solid #4d8ef0;
  background: #000;
}`,
    },
    {
      name: 'game.js',
      content: `const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

canvas.width  = 800;
canvas.height = 500;

// ── Player ────────────────────────────────────────────────────
const player = {
  x: 384, y: 234,
  w: 32,  h: 32,
  speed: 4,
  color: '#4d8ef0',
};

// ── Input ─────────────────────────────────────────────────────
const keys = {};
window.addEventListener('keydown', e => { keys[e.key] = true;  e.preventDefault(); });
window.addEventListener('keyup',   e => { keys[e.key] = false; });

// ── Update ────────────────────────────────────────────────────
function update() {
  if (keys['ArrowLeft']  || keys['a']) player.x -= player.speed;
  if (keys['ArrowRight'] || keys['d']) player.x += player.speed;
  if (keys['ArrowUp']    || keys['w']) player.y -= player.speed;
  if (keys['ArrowDown']  || keys['s']) player.y += player.speed;

  player.x = Math.max(0, Math.min(canvas.width  - player.w, player.x));
  player.y = Math.max(0, Math.min(canvas.height - player.h, player.y));
}

// ── Draw ──────────────────────────────────────────────────────
function draw() {
  // Background
  ctx.fillStyle = '#080814';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Grid
  ctx.strokeStyle = '#1a1a30';
  ctx.lineWidth = 1;
  for (let x = 0; x < canvas.width;  x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
  for (let y = 0; y < canvas.height; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }

  // Player glow
  ctx.shadowColor = player.color;
  ctx.shadowBlur  = 14;
  ctx.fillStyle   = player.color;
  ctx.fillRect(player.x, player.y, player.w, player.h);
  ctx.shadowBlur = 0;

  // HUD
  ctx.fillStyle = 'rgba(255,255,255,.6)';
  ctx.font = '12px monospace';
  ctx.fillText('WASD / Arrows to move', 8, 18);
}

// ── Loop ──────────────────────────────────────────────────────
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}
loop();`,
    },
  ],

  'app': [
    {
      name: 'index.html',
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Web App</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <div class="app">
    <header>
      <h1>My Web App</h1>
      <p>Start building something awesome.</p>
    </header>
    <main>
      <button id="mainBtn">Click Me</button>
      <div id="output"></div>
    </main>
  </div>
  <script src="app.js"><\/script>
</body>
</html>`,
    },
    {
      name: 'styles.css',
      content: `* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: system-ui, sans-serif;
  background: #f5f7fa;
  color: #222;
  min-height: 100vh;
}
.app { max-width: 720px; margin: 0 auto; padding: 24px 16px; }
header {
  background: linear-gradient(135deg, #4d8ef0, #7b5cec);
  color: #fff;
  padding: 28px 24px;
  border-radius: 10px;
  margin-bottom: 20px;
}
header h1 { font-size: 24px; margin-bottom: 4px; }
header p  { opacity: .8; font-size: 14px; }
main {
  background: #fff;
  border-radius: 10px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0,0,0,.08);
}
button {
  background: #4d8ef0;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 10px 22px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background .15s;
}
button:hover { background: #2d6bc8; }
#output { margin-top: 16px; font-size: 14px; color: #555; }`,
    },
    {
      name: 'app.js',
      content: `let count = 0;
const btn    = document.getElementById('mainBtn');
const output = document.getElementById('output');

btn.addEventListener('click', () => {
  count++;
  output.textContent = 'Button clicked ' + count + ' time' + (count === 1 ? '' : 's') + '!';
});`,
    },
  ],

  'webgl': [
    {
      name: 'index.html',
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>WebGL 3D</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <canvas id="canvas"></canvas>
  <script src="webgl.js"><\/script>
</body>
</html>`,
    },
    {
      name: 'styles.css',
      content: `* { margin: 0; padding: 0; }
body { background: #000; overflow: hidden; }
#canvas { display: block; width: 100vw; height: 100vh; }`,
    },
    {
      name: 'webgl.js',
      content: `// Defer until the page is fully laid out so canvas dimensions are correct
window.addEventListener('load', function () {

const canvas = document.getElementById('canvas');
canvas.width  = canvas.clientWidth  || innerWidth  || 800;
canvas.height = canvas.clientHeight || innerHeight || 600;

const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
if (!gl) {
  document.body.innerHTML = '<p style="color:#fff;padding:20px;font-family:monospace">WebGL not supported in this browser.</p>';
  return;
}

// ── Shaders ───────────────────────────────────────────────────
const VERT = \`
  attribute vec3 aPos;
  attribute vec4 aCol;
  uniform   mat4 uModel;
  varying lowp vec4 vCol;
  void main() {
    gl_Position = uModel * vec4(aPos, 1.0);
    vCol = aCol;
  }
\`;
const FRAG = \`
  varying lowp vec4 vCol;
  void main() { gl_FragColor = vCol; }
\`;

function mkShader(type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
    throw new Error(gl.getShaderInfoLog(s));
  return s;
}

const prog = gl.createProgram();
gl.attachShader(prog, mkShader(gl.VERTEX_SHADER,   VERT));
gl.attachShader(prog, mkShader(gl.FRAGMENT_SHADER, FRAG));
gl.linkProgram(prog);
gl.useProgram(prog);

// ── Geometry – colorful spinning cube (6 faces, 2 tris each) ──
// prettier-ignore
const VERTS = new Float32Array([
  // Front  – red
  -.5,-.5, .5,  1,.2,.2,1,  .5,-.5, .5,  1,.2,.2,1,  .5, .5, .5,  1,.2,.2,1,
  -.5,-.5, .5,  1,.2,.2,1,  .5, .5, .5,  1,.2,.2,1, -.5, .5, .5,  1,.2,.2,1,
  // Back   – cyan
  -.5,-.5,-.5,  .2,.9,.9,1,  .5, .5,-.5,  .2,.9,.9,1,  .5,-.5,-.5,  .2,.9,.9,1,
  -.5,-.5,-.5,  .2,.9,.9,1, -.5, .5,-.5,  .2,.9,.9,1,  .5, .5,-.5,  .2,.9,.9,1,
  // Top    – green
  -.5, .5,-.5,  .2,.9,.3,1,  .5, .5,-.5,  .2,.9,.3,1,  .5, .5, .5,  .2,.9,.3,1,
  -.5, .5,-.5,  .2,.9,.3,1,  .5, .5, .5,  .2,.9,.3,1, -.5, .5, .5,  .2,.9,.3,1,
  // Bottom – yellow
  -.5,-.5,-.5,  1,.9,.1,1,  .5,-.5, .5,  1,.9,.1,1,  .5,-.5,-.5,  1,.9,.1,1,
  -.5,-.5,-.5,  1,.9,.1,1, -.5,-.5, .5,  1,.9,.1,1,  .5,-.5, .5,  1,.9,.1,1,
  // Right  – blue
   .5,-.5,-.5,  .2,.4,1,1,   .5, .5,-.5,  .2,.4,1,1,   .5, .5, .5,  .2,.4,1,1,
   .5,-.5,-.5,  .2,.4,1,1,   .5, .5, .5,  .2,.4,1,1,   .5,-.5, .5,  .2,.4,1,1,
  // Left   – magenta
  -.5,-.5,-.5,  .9,.2,.9,1, -.5, .5, .5,  .9,.2,.9,1, -.5, .5,-.5,  .9,.2,.9,1,
  -.5,-.5,-.5,  .9,.2,.9,1, -.5,-.5, .5,  .9,.2,.9,1, -.5, .5, .5,  .9,.2,.9,1,
]);

const buf = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buf);
gl.bufferData(gl.ARRAY_BUFFER, VERTS, gl.STATIC_DRAW);

const stride = 28; // 7 floats × 4 bytes
const aPos = gl.getAttribLocation(prog, 'aPos');
gl.enableVertexAttribArray(aPos);
gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, stride, 0);

const aCol = gl.getAttribLocation(prog, 'aCol');
gl.enableVertexAttribArray(aCol);
gl.vertexAttribPointer(aCol, 4, gl.FLOAT, false, stride, 12);

const uModel = gl.getUniformLocation(prog, 'uModel');

// ── Math helpers ──────────────────────────────────────────────
function mat4Mul(a, b) {
  const out = new Float32Array(16);
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++)
      for (let k = 0; k < 4; k++)
        out[r + c * 4] += a[r + k * 4] * b[k + c * 4];
  return out;
}

function rotX(t) {
  const c = Math.cos(t), s = Math.sin(t);
  return new Float32Array([1,0,0,0, 0,c,s,0, 0,-s,c,0, 0,0,0,1]);
}
function rotY(t) {
  const c = Math.cos(t), s = Math.sin(t);
  return new Float32Array([c,0,-s,0, 0,1,0,0, s,0,c,0, 0,0,0,1]);
}
function perspective(fov, asp, near, far) {
  const f = 1 / Math.tan(fov / 2);
  const d = near - far;
  return new Float32Array([
    f/asp, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (far+near)/d, -1,
    0, 0, (2*far*near)/d, 0,
  ]);
}
function translate(x, y, z) {
  return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, x,y,z,1]);
}

const proj = perspective(Math.PI / 4, canvas.width / canvas.height, 0.1, 100);
let t = 0;

// ── Render loop ───────────────────────────────────────────────
function render() {
  t += 0.012;
  gl.enable(gl.DEPTH_TEST);
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.04, 0.04, 0.1, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const model = mat4Mul(mat4Mul(translate(0, 0, -2.5), rotY(t)), rotX(t * 0.6));
  const mvp   = mat4Mul(proj, model);
  gl.uniformMatrix4fv(uModel, false, mvp);
  gl.drawArrays(gl.TRIANGLES, 0, 36);
  requestAnimationFrame(render);
}
render();

}); // end window load`,
    },
  ],
};

// ── Helpers ───────────────────────────────────────────────────
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function getProject(id) {
  return state.projects.find(p => p.id === id) || null;
}

function getFile(project, fileId) {
  return project ? project.files.find(f => f.id === fileId) : null;
}

function modeForName(name) {
  const ext = name.split('.').pop().toLowerCase();
  if (ext === 'js')   return { name: 'javascript' };
  if (ext === 'css')  return 'css';
  if (ext === 'html') return 'htmlmixed';
  if (ext === 'json') return { name: 'javascript', json: true };
  return 'text/plain';
}

function extClass(name) {
  const ext = name.split('.').pop().toLowerCase();
  if (ext === 'js')   return 'ext-js';
  if (ext === 'css')  return 'ext-css';
  if (ext === 'html') return 'ext-html';
  return '';
}

// ── CodeMirror ────────────────────────────────────────────────
let cm = null;
let saveTimer = null;
let pendingCmChange = false;

function initCM() {
  const host = document.getElementById('cmHost');
  host.innerHTML = '';
  cm = CodeMirror(host, {
    theme:              'monokai',
    lineNumbers:        true,
    matchBrackets:      true,
    autoCloseBrackets:  true,
    indentUnit:         2,
    tabSize:            2,
    indentWithTabs:     false,
    lineWrapping:       false,
    extraKeys: {
      Tab: cm => cm.execCommand('insertSoftTab'),
    },
  });

  cm.on('change', () => {
    const proj = getProject(state.activeProjectId);
    const file = getFile(proj, state.activeFileId);
    if (!file) return;
    file.content = cm.getValue();
    setSaveStatus('unsaved');
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      saveProjects();
      setSaveStatus('saved');
    }, 600);
  });
}

function setSaveStatus(type) {
  const el = document.getElementById('sbSave');
  if (!el) return;
  el.className = 'sb-save ' + type;
  const labels = { saved: 'All changes saved', unsaved: 'Unsaved changes…', saving: 'Saving…' };
  el.textContent = labels[type] || '';
}

// ── Render: project list ──────────────────────────────────────
function renderProjectList() {
  const list = document.getElementById('projectList');
  list.innerHTML = '';

  if (state.projects.length === 0) {
    const li = document.createElement('li');
    li.className = 'project-item';
    li.style.cssText = 'color:var(--text-dim);cursor:default;pointer-events:none;font-size:12px;';
    li.textContent = 'No projects yet';
    list.appendChild(li);
    return;
  }

  state.projects.forEach(proj => {
    const li = document.createElement('li');
    li.className = 'project-item' + (proj.id === state.activeProjectId ? ' active' : '');
    li.dataset.id = proj.id;

    const dot = document.createElement('span');
    dot.className = 'project-item-dot dot-' + proj.type;

    const name = document.createElement('span');
    name.className = 'project-item-name';
    name.textContent = proj.name;

    li.appendChild(dot);
    li.appendChild(name);
    list.appendChild(li);

    li.addEventListener('click', () => openProject(proj.id));
    li.addEventListener('contextmenu', e => {
      e.preventDefault();
      showCtxMenu(e.clientX, e.clientY, 'project', proj.id);
    });
  });
}

// ── Render: project editor ────────────────────────────────────
function renderEditor() {
  const proj = getProject(state.activeProjectId);

  document.getElementById('emptyState').style.display    = proj ? 'none'  : '';
  document.getElementById('projectEditor').style.display = proj ? 'flex'  : 'none';

  if (!proj) return;

  // Toolbar
  document.getElementById('projectNameLabel').textContent = proj.name;
  const badge = document.getElementById('typeBadge');
  badge.textContent = proj.type === '2d' ? '2D Game' : proj.type === 'app' ? 'Web App' : 'WebGL 3D';
  badge.className = 'type-badge badge-' + proj.type;

  // File tabs
  renderTabs(proj);

  // Editor pane
  renderEditorPane(proj);
}

function renderTabs(proj) {
  const bar = document.getElementById('fileTabs');
  bar.innerHTML = '';

  proj.files.forEach(file => {
    const tab = document.createElement('div');
    tab.className = 'file-tab' + (file.id === state.activeFileId ? ' active' : '');
    tab.dataset.id = file.id;

    const label = document.createElement('span');
    label.className = 'file-tab-name ' + extClass(file.name);
    label.textContent = file.name;

    const close = document.createElement('span');
    close.className = 'file-tab-close';
    close.innerHTML = '&times;';
    close.title = 'Close / delete file';
    close.addEventListener('click', e => {
      e.stopPropagation();
      confirmDeleteFile(proj.id, file.id);
    });

    tab.appendChild(label);
    tab.appendChild(close);
    bar.appendChild(tab);

    tab.addEventListener('click', () => switchFile(file.id));
    tab.addEventListener('contextmenu', e => {
      e.preventDefault();
      showCtxMenu(e.clientX, e.clientY, 'file', file.id);
    });
  });
}

function renderEditorPane(proj) {
  const file = getFile(proj, state.activeFileId);
  const host       = document.getElementById('cmHost');
  const noFileMsg  = document.getElementById('noFileMsg');
  const sbFile     = document.getElementById('sbFile');

  if (!file) {
    host.style.display    = 'none';
    noFileMsg.style.display = '';
    sbFile.textContent    = '';
    return;
  }

  noFileMsg.style.display = 'none';
  host.style.display      = '';
  sbFile.textContent      = file.name;

  if (!cm) initCM();

  cm.setOption('mode', modeForName(file.name));
  // Avoid triggering the change handler when loading
  cm.off('change', cm._changeHandler);
  cm.setValue(file.content || '');
  cm.on('change', cm._changeHandler || (() => {}));
  cm.clearHistory();
  cm.refresh();
  setSaveStatus('saved');
}

// ── Open project ──────────────────────────────────────────────
function openProject(id) {
  state.activeProjectId = id;
  const proj = getProject(id);
  // Default to first file
  state.activeFileId = proj && proj.files.length > 0 ? proj.files[0].id : null;
  renderProjectList();
  renderEditor();
  if (cm) { cm.refresh(); }
}

// ── Switch file ───────────────────────────────────────────────
function switchFile(fileId) {
  // Save current file first (flush)
  const proj = getProject(state.activeProjectId);
  const cur  = getFile(proj, state.activeFileId);
  if (cm && cur) {
    cur.content = cm.getValue();
    saveProjects();
  }

  state.activeFileId = fileId;
  renderTabs(proj);
  renderEditorPane(proj);
}

// ── Create project ────────────────────────────────────────────
function createProject(name, type) {
  const files = TEMPLATES[type].map(t => ({ id: uid(), name: t.name, content: t.content }));
  const proj  = { id: uid(), name, type, files };
  state.projects.push(proj);
  saveProjects();
  openProject(proj.id);
  renderProjectList();
}

// ── Rename project ────────────────────────────────────────────
function renameProject(id, newName) {
  const proj = getProject(id);
  if (!proj || !newName.trim()) return;
  proj.name = newName.trim();
  saveProjects();
  renderProjectList();
  if (state.activeProjectId === id) renderEditor();
}

// ── Delete project ────────────────────────────────────────────
function deleteProject(id) {
  state.projects = state.projects.filter(p => p.id !== id);
  if (state.activeProjectId === id) {
    state.activeProjectId = null;
    state.activeFileId    = null;
    if (cm) { cm.setValue(''); }
  }
  saveProjects();
  renderProjectList();
  renderEditor();
}

// ── Add file ──────────────────────────────────────────────────
function addFile(name) {
  const proj = getProject(state.activeProjectId);
  if (!proj || !name.trim()) return;
  const file = { id: uid(), name: name.trim(), content: '' };
  proj.files.push(file);
  saveProjects();
  state.activeFileId = file.id;
  renderEditor();
}

// ── Rename file ───────────────────────────────────────────────
function renameFile(projId, fileId, newName) {
  const proj = getProject(projId);
  const file = getFile(proj, fileId);
  if (!file || !newName.trim()) return;
  file.name = newName.trim();
  saveProjects();
  renderTabs(proj);
  document.getElementById('sbFile').textContent = file.name;
  if (cm) cm.setOption('mode', modeForName(file.name));
}

// ── Delete file ───────────────────────────────────────────────
function deleteFile(projId, fileId) {
  const proj = getProject(projId);
  if (!proj) return;
  proj.files = proj.files.filter(f => f.id !== fileId);
  if (state.activeFileId === fileId) {
    state.activeFileId = proj.files.length > 0 ? proj.files[0].id : null;
  }
  saveProjects();
  renderTabs(proj);
  renderEditorPane(proj);
}

// ── Run project ───────────────────────────────────────────────
function buildHTML(proj) {
  // Find the main HTML file
  const htmlFile = proj.files.find(f => f.name.endsWith('.html')) || proj.files[0];
  if (!htmlFile) return null;

  // Save any pending CM changes
  const activeFile = getFile(proj, state.activeFileId);
  if (cm && activeFile) activeFile.content = cm.getValue();

  let html = htmlFile.content;

  // Inline CSS
  proj.files.filter(f => f.name.endsWith('.css')).forEach(css => {
    const re = new RegExp(
      `<link[^>]+href=["']${css.name.replace('.', '\\.')}["'][^>]*>`,
      'gi'
    );
    html = html.replace(re, `<style>\n${css.content}\n</style>`);
  });

  // Inline JS
  proj.files.filter(f => f.name.endsWith('.js')).forEach(js => {
    const re = new RegExp(
      `<script[^>]+src=["']${js.name.replace('.', '\\.')}["'][^>]*><\\/script>`,
      'gi'
    );
    html = html.replace(re, `<script>\n${js.content}\n<\/script>`);
  });

  return html;
}

function runProject() {
  const proj = getProject(state.activeProjectId);
  if (!proj) return;

  const html = buildHTML(proj);
  if (!html) {
    alert('No HTML file found in this project.');
    return;
  }

  const blob = new Blob([html], { type: 'text/html' });
  const url  = URL.createObjectURL(blob);

  if (proj.type === 'webgl') {
    openWebGLWindow(url, proj.name);
  } else {
    window.open(url, '_blank');
  }
}

// ── WebGL floating window ─────────────────────────────────────
let wglCurrentURL = null;

function openWebGLWindow(url, title) {
  if (wglCurrentURL) URL.revokeObjectURL(wglCurrentURL);
  wglCurrentURL = url;

  const win   = document.getElementById('wglWindow');
  const frame = document.getElementById('wglFrame');
  const t     = document.getElementById('wglBarTitle');

  t.textContent  = title + ' – WebGL Test';
  frame.src      = url;
  win.style.display = 'flex';

  // Center window
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const ww = Math.min(800, vw - 32);
  const wh = Math.min(560, vh - 32);
  win.style.width  = ww + 'px';
  win.style.height = wh + 'px';
  win.style.left   = Math.round((vw - ww) / 2) + 'px';
  win.style.top    = Math.round((vh - wh) / 2) + 'px';
}

function closeWebGLWindow() {
  const win   = document.getElementById('wglWindow');
  const frame = document.getElementById('wglFrame');
  win.style.display = 'none';
  frame.src = 'about:blank';
  if (wglCurrentURL) { URL.revokeObjectURL(wglCurrentURL); wglCurrentURL = null; }
}

function refreshWebGLWindow() {
  const proj = getProject(state.activeProjectId);
  if (!proj) return;
  const html = buildHTML(proj);
  if (!html) return;
  if (wglCurrentURL) URL.revokeObjectURL(wglCurrentURL);
  const blob = new Blob([html], { type: 'text/html' });
  wglCurrentURL = URL.createObjectURL(blob);
  document.getElementById('wglFrame').src = wglCurrentURL;
}

// drag
(function setupDrag() {
  let dragging = false, ox = 0, oy = 0;
  const bar = document.getElementById('wglBar');
  const win = document.getElementById('wglWindow');

  bar.addEventListener('mousedown', e => {
    if (e.target.closest('.wgl-win-controls')) return;
    dragging = true;
    ox = e.clientX - win.offsetLeft;
    oy = e.clientY - win.offsetTop;
    e.preventDefault();
  });
  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    win.style.left = (e.clientX - ox) + 'px';
    win.style.top  = (e.clientY - oy) + 'px';
  });
  document.addEventListener('mouseup', () => { dragging = false; });
})();

// resize
(function setupResize() {
  let resizing = false, ox = 0, oy = 0, ow = 0, oh = 0;
  const handle = document.getElementById('wglResize');
  const win    = document.getElementById('wglWindow');

  handle.addEventListener('mousedown', e => {
    resizing = true;
    ox = e.clientX; oy = e.clientY;
    ow = win.offsetWidth; oh = win.offsetHeight;
    e.preventDefault();
    e.stopPropagation();
  });
  document.addEventListener('mousemove', e => {
    if (!resizing) return;
    win.style.width  = Math.max(320, ow + (e.clientX - ox)) + 'px';
    win.style.height = Math.max(240, oh + (e.clientY - oy)) + 'px';
  });
  document.addEventListener('mouseup', () => { resizing = false; });
})();

// ── Context menu ──────────────────────────────────────────────
let ctxTarget = null; // { type: 'project'|'file', id }

function showCtxMenu(x, y, type, id) {
  ctxTarget = { type, id };
  const menu = document.getElementById('ctxMenu');
  menu.style.left = x + 'px';
  menu.style.top  = y + 'px';
  menu.classList.add('open');
}

function hideCtxMenu() {
  document.getElementById('ctxMenu').classList.remove('open');
  ctxTarget = null;
}

// ── Modal helpers ─────────────────────────────────────────────
function openModal(id) {
  document.getElementById(id).style.display = 'flex';
}
function closeModal(id) {
  document.getElementById(id).style.display = 'none';
}

// Pending rename / delete targets
let renameTarget = null; // { type: 'project'|'file', projId, fileId }
let deleteTarget = null;

function openRenameModal(type, projId, fileId) {
  renameTarget = { type, projId, fileId };
  const heading = document.getElementById('renameHeading');
  const input   = document.getElementById('inputRename');

  if (type === 'project') {
    const proj = getProject(projId);
    heading.textContent = 'Rename Project';
    input.value = proj ? proj.name : '';
  } else {
    const proj = getProject(projId);
    const file = getFile(proj, fileId);
    heading.textContent = 'Rename File';
    input.value = file ? file.name : '';
  }

  openModal('modalRename');
  setTimeout(() => { input.select(); input.focus(); }, 60);
}

function confirmDeleteFile(projId, fileId) {
  const proj = getProject(projId);
  const file = getFile(proj, fileId);
  if (!file) return;
  deleteTarget = { type: 'file', projId, fileId };
  document.getElementById('deleteMsg').textContent =
    `Delete file "${file.name}"? This cannot be undone.`;
  openModal('modalDelete');
}

function confirmDeleteProject(projId) {
  const proj = getProject(projId);
  if (!proj) return;
  deleteTarget = { type: 'project', projId };
  document.getElementById('deleteMsg').textContent =
    `Delete project "${proj.name}" and all its files? This cannot be undone.`;
  openModal('modalDelete');
}

// ── Wire up all event listeners ───────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initCM();
  renderProjectList();
  renderEditor();

  // Sidebar new project
  document.getElementById('btnNewProject').addEventListener('click', () => {
    document.getElementById('inputProjectName').value = '';
    document.querySelector('input[name="ptype"][value="2d"]').checked = true;
    openModal('modalNewProject');
    setTimeout(() => document.getElementById('inputProjectName').focus(), 60);
  });

  // Empty state new project
  document.getElementById('btnEmptyNew').addEventListener('click', () => {
    document.getElementById('btnNewProject').click();
  });

  // Create project confirm
  document.getElementById('btnCreateProject').addEventListener('click', () => {
    const name = document.getElementById('inputProjectName').value.trim();
    const type = document.querySelector('input[name="ptype"]:checked').value;
    if (!name) { document.getElementById('inputProjectName').focus(); return; }
    closeModal('modalNewProject');
    createProject(name, type);
  });

  document.getElementById('inputProjectName').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('btnCreateProject').click();
  });

  // Project name label click → rename
  document.getElementById('projectNameLabel').addEventListener('click', () => {
    if (!state.activeProjectId) return;
    openRenameModal('project', state.activeProjectId, null);
  });

  // Add file
  document.getElementById('btnAddFile').addEventListener('click', () => {
    document.getElementById('inputFileName').value = '';
    openModal('modalAddFile');
    setTimeout(() => document.getElementById('inputFileName').focus(), 60);
  });

  document.getElementById('btnConfirmAddFile').addEventListener('click', () => {
    const name = document.getElementById('inputFileName').value.trim();
    if (!name) { document.getElementById('inputFileName').focus(); return; }
    closeModal('modalAddFile');
    addFile(name);
  });

  document.getElementById('inputFileName').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('btnConfirmAddFile').click();
  });

  // Quick-add buttons
  document.querySelectorAll('.quick-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const templates = { js: 'script.js', css: 'style.css', html: 'page.html', json: 'data.json' };
      document.getElementById('inputFileName').value = templates[btn.dataset.template] || '';
      document.getElementById('inputFileName').focus();
    });
  });

  // Rename confirm
  document.getElementById('btnConfirmRename').addEventListener('click', () => {
    if (!renameTarget) return;
    const val = document.getElementById('inputRename').value.trim();
    if (!val) { document.getElementById('inputRename').focus(); return; }
    closeModal('modalRename');
    if (renameTarget.type === 'project') {
      renameProject(renameTarget.projId, val);
    } else {
      renameFile(renameTarget.projId, renameTarget.fileId, val);
    }
    renameTarget = null;
  });

  document.getElementById('inputRename').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('btnConfirmRename').click();
  });

  // Delete project button (toolbar)
  document.getElementById('btnDeleteProject').addEventListener('click', () => {
    if (!state.activeProjectId) return;
    confirmDeleteProject(state.activeProjectId);
  });

  // Delete confirm
  document.getElementById('btnConfirmDelete').addEventListener('click', () => {
    if (!deleteTarget) return;
    closeModal('modalDelete');
    if (deleteTarget.type === 'project') {
      deleteProject(deleteTarget.projId);
    } else {
      deleteFile(deleteTarget.projId, deleteTarget.fileId);
    }
    deleteTarget = null;
  });

  // Run
  document.getElementById('btnRun').addEventListener('click', runProject);

  // WebGL window controls
  document.getElementById('wglClose').addEventListener('click', closeWebGLWindow);
  document.getElementById('wglRefresh').addEventListener('click', refreshWebGLWindow);

  // Context menu actions
  document.getElementById('ctxMenu').addEventListener('click', e => {
    const item = e.target.closest('.ctx-item');
    if (!item || !ctxTarget) return;
    const action = item.dataset.action;
    const { type, id } = ctxTarget;
    hideCtxMenu();

    if (type === 'project') {
      if (action === 'rename') openRenameModal('project', id, null);
      if (action === 'delete') confirmDeleteProject(id);
    } else if (type === 'file') {
      const proj = getProject(state.activeProjectId);
      if (action === 'rename') openRenameModal('file', state.activeProjectId, id);
      if (action === 'delete') confirmDeleteFile(state.activeProjectId, id);
    }
  });

  // Hide context menu on outside click
  document.addEventListener('click', e => {
    if (!e.target.closest('#ctxMenu')) hideCtxMenu();
  });

  // Modal close buttons ([data-close])
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.close));
  });

  // Close modal on overlay click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });

  // ESC closes topmost modal / context menu
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      const open = document.querySelector('.modal-overlay[style*="flex"]');
      if (open) { closeModal(open.id); return; }
      if (document.getElementById('ctxMenu').classList.contains('open')) { hideCtxMenu(); return; }
      if (document.getElementById('wglWindow').style.display !== 'none') closeWebGLWindow();
    }
  });
});
