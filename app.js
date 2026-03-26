/* ===========================================================
   GameForge Editor — app.js
   =========================================================== */

// ---- Storage helpers ----
const STORAGE = 'gameforge_projects';
const load  = () => { try { return JSON.parse(localStorage.getItem(STORAGE)) || []; } catch { return []; } };
const save  = (p) => localStorage.setItem(STORAGE, JSON.stringify(p));
const uid   = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
const $     = (id) => document.getElementById(id);
const html  = (s) => { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; };

// ---- State ----
let projects       = load();
let currentProjId  = null;
let currentFile    = null;
let openTabs       = [];
let ctxTarget      = null;
let renameCallback = null;
let saveTimer      = null;

// ---- File icons ----
function ficon(name) {
    const ext = name.split('.').pop().toLowerCase();
    return { html:'🟧', htm:'🟧', css:'🟦', js:'🟨', json:'🟩', md:'📝',
             glsl:'🔮', vert:'🔮', frag:'🔮', svg:'🖼️', png:'🖼️', jpg:'🖼️', txt:'📄' }[ext] || '📄';
}

// ---- Templates ----
function templates(type) {
    const f = {};
    if (type === '2d') {
        f['index.html'] = `<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>2D Game</title>\n    <link rel=\"stylesheet\" href=\"style.css\">\n</head>\n<body>\n    <canvas id=\"c\" width=\"800\" height=\"600\"></canvas>\n    <script src=\"game.js\"><\/script>\n</body>\n</html>`;
        f['style.css'] = `* { margin:0; padding:0; box-sizing:border-box; }\nbody {\n    display:flex; justify-content:center; align-items:center;\n    min-height:100vh; background:#1a1a2e;\n}\ncanvas {\n    border:2px solid #e94560;\n    border-radius:4px;\n    box-shadow:0 0 30px rgba(233,69,96,.3);\n}`;
        f['game.js'] = `const c = document.getElementById('c');\nconst ctx = c.getContext('2d');\n\nconst player = { x:375, y:540, w:50, h:50, speed:5, color:'#e94560' };\nconst keys = {};\nonkeydown = e => keys[e.key] = true;\nonkeyup   = e => keys[e.key] = false;\n\nfunction loop() {\n    if (keys['ArrowLeft']||keys['a'])  player.x -= player.speed;\n    if (keys['ArrowRight']||keys['d']) player.x += player.speed;\n    if (keys['ArrowUp']||keys['w'])    player.y -= player.speed;\n    if (keys['ArrowDown']||keys['s'])  player.y += player.speed;\n    player.x = Math.max(0, Math.min(c.width-player.w, player.x));\n    player.y = Math.max(0, Math.min(c.height-player.h, player.y));\n\n    ctx.fillStyle = '#0f3460';\n    ctx.fillRect(0,0,c.width,c.height);\n    ctx.fillStyle = player.color;\n    ctx.shadowColor = player.color;\n    ctx.shadowBlur = 20;\n    ctx.fillRect(player.x, player.y, player.w, player.h);\n    ctx.shadowBlur = 0;\n    ctx.fillStyle = 'rgba(255,255,255,.4)';\n    ctx.font = '14px sans-serif';\n    ctx.fillText('WASD / Arrow keys to move', 10, 24);\n    requestAnimationFrame(loop);\n}\nloop();`;
    } else if (type === 'app') {
        f['index.html'] = `<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>Web App</title>\n    <link rel=\"stylesheet\" href=\"style.css\">\n</head>\n<body>\n    <div class=\"app\">\n        <h1>My Web App</h1>\n        <p>Built with GameForge Editor</p>\n        <button id=\"btn\">Click Me</button>\n        <p id=\"out\"></p>\n    </div>\n    <script src=\"app.js\"><\/script>\n</body>\n</html>`;
        f['style.css'] = `* { margin:0; padding:0; box-sizing:border-box; }\nbody {\n    font-family:system-ui,sans-serif;\n    background:linear-gradient(135deg,#0c0c1d,#1a1a3e);\n    min-height:100vh; display:flex;\n    justify-content:center; align-items:center; color:#e0e0e0;\n}\n.app {\n    text-align:center;\n    background:rgba(255,255,255,.05);\n    border:1px solid rgba(255,255,255,.1);\n    border-radius:16px; padding:40px;\n}\nh1 { font-size:2em; margin-bottom:8px; }\nbutton {\n    margin-top:20px; padding:12px 28px;\n    background:linear-gradient(135deg,#667eea,#764ba2);\n    color:#fff; border:none; border-radius:8px;\n    font-size:16px; cursor:pointer;\n}\nbutton:hover { transform:translateY(-2px); box-shadow:0 4px 20px rgba(102,126,234,.4); }\n#out { margin-top:16px; font-family:monospace; min-height:20px; }`;
        f['app.js'] = `let n = 0;\ndocument.getElementById('btn').onclick = () => {\n    n++;\n    document.getElementById('out').textContent = 'Clicked ' + n + ' times!';\n};`;
    } else {
        f['index.html'] = `<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>WebGL 3D</title>\n    <link rel=\"stylesheet\" href=\"style.css\">\n</head>\n<body>\n    <canvas id=\"gl\"></canvas>\n    <script src=\"main.js\"><\/script>\n</body>\n</html>`;
        f['style.css'] = `* { margin:0; padding:0; box-sizing:border-box; }\nbody { overflow:hidden; background:#000; }\ncanvas { display:block; width:100vw; height:100vh; }`;
        f['main.js'] = `const canvas = document.getElementById('gl');\ncanvas.width = innerWidth; canvas.height = innerHeight;\nconst gl = canvas.getContext('webgl');\nif(!gl) throw 'No WebGL';\n\nconst vs = \`attribute vec4 p; attribute vec4 c; uniform mat4 mv; uniform mat4 pr;\nvarying lowp vec4 vc; void main(){ gl_Position=pr*mv*p; vc=c; }\`;\nconst fs = \`varying lowp vec4 vc; void main(){ gl_FragColor=vc; }\`;\n\nfunction mkS(t,s){ const sh=gl.createShader(t); gl.shaderSource(sh,s); gl.compileShader(sh); return sh; }\nconst pg=gl.createProgram();\ngl.attachShader(pg,mkS(gl.VERTEX_SHADER,vs));\ngl.attachShader(pg,mkS(gl.FRAGMENT_SHADER,fs));\ngl.linkProgram(pg);\n\nconst aP=gl.getAttribLocation(pg,'p'), aC=gl.getAttribLocation(pg,'c');\nconst uMV=gl.getUniformLocation(pg,'mv'), uPR=gl.getUniformLocation(pg,'pr');\n\nconst pos=[-1,-1,1,1,-1,1,1,1,1,-1,1,1,-1,-1,-1,-1,1,-1,1,1,-1,1,-1,-1,\n  -1,1,-1,-1,1,1,1,1,1,1,1,-1,-1,-1,-1,1,-1,-1,1,-1,1,-1,-1,1,\n  1,-1,-1,1,1,-1,1,1,1,1,-1,1,-1,-1,-1,-1,-1,1,-1,1,1,-1,1,-1];\nconst fc=[[1,.3,.3,1],[.3,1,.3,1],[.3,.3,1,1],[1,1,.3,1],[1,.3,1,1],[.3,1,1,1]];\nlet col=[]; fc.forEach(c=>{for(let i=0;i<4;i++) col=col.concat(c);});\nconst idx=[0,1,2,0,2,3,4,5,6,4,6,7,8,9,10,8,10,11,12,13,14,12,14,15,16,17,18,16,18,19,20,21,22,20,22,23];\n\nconst pb=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,pb); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(pos),gl.STATIC_DRAW);\nconst cb=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,cb); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(col),gl.STATIC_DRAW);\nconst ib=gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(idx),gl.STATIC_DRAW);\n\nfunction persp(f,a,n,r){ const t=1/Math.tan(f/2),d=1/(n-r); return[t/a,0,0,0,0,t,0,0,0,0,(r+n)*d,-1,0,0,2*r*n*d,0]; }\nfunction mul(a,b){ const r=Array(16).fill(0); for(let i=0;i<4;i++) for(let j=0;j<4;j++) for(let k=0;k<4;k++) r[j*4+i]+=a[k*4+i]*b[j*4+k]; return r; }\nfunction rotY(m,a){ const c=Math.cos(a),s=Math.sin(a); return mul(m,[c,0,s,0,0,1,0,0,-s,0,c,0,0,0,0,1]); }\nfunction rotX(m,a){ const c=Math.cos(a),s=Math.sin(a); return mul(m,[1,0,0,0,0,c,-s,0,0,s,c,0,0,0,0,1]); }\nfunction tl(m,x,y,z){ return mul(m,[1,0,0,0,0,1,0,0,0,0,1,0,x,y,z,1]); }\nconst I=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];\n\nlet rot=0;\nfunction draw(){\n    rot+=.01;\n    canvas.width=innerWidth; canvas.height=innerHeight;\n    gl.viewport(0,0,canvas.width,canvas.height);\n    gl.clearColor(.04,.04,.09,1); gl.clearDepth(1); gl.enable(gl.DEPTH_TEST);\n    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);\n    const pr=persp(.785,canvas.width/canvas.height,.1,100);\n    let mv=tl([...I],0,0,-6); mv=rotY(mv,rot); mv=rotX(mv,rot*.7);\n    gl.bindBuffer(gl.ARRAY_BUFFER,pb); gl.vertexAttribPointer(aP,3,gl.FLOAT,false,0,0); gl.enableVertexAttribArray(aP);\n    gl.bindBuffer(gl.ARRAY_BUFFER,cb); gl.vertexAttribPointer(aC,4,gl.FLOAT,false,0,0); gl.enableVertexAttribArray(aC);\n    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib); gl.useProgram(pg);\n    gl.uniformMatrix4fv(uPR,false,pr); gl.uniformMatrix4fv(uMV,false,mv);\n    gl.drawElements(gl.TRIANGLES,36,gl.UNSIGNED_SHORT,0);\n    requestAnimationFrame(draw);\n}\ndraw();\nonresize=()=>{ canvas.width=innerWidth; canvas.height=innerHeight; };`;
    }
    return f;
}

// ---- Toast ----
function toast(msg, type='info') {
    const t = document.createElement('div');
    t.className = 'toast toast-' + type;
    t.textContent = msg;
    $('toastContainer').appendChild(t);
    setTimeout(() => { t.style.opacity='0'; t.style.transition='.3s'; setTimeout(()=>t.remove(),300); }, 2800);
}

// ---- Auto-save ----
function autoSave() { clearTimeout(saveTimer); saveTimer = setTimeout(() => save(projects), 250); }
function proj() { return projects.find(p => p.id === currentProjId); }

// ---- Escape regex ----
function escRx(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// ======================== DASHBOARD ========================
function renderDash(filter='') {
    const list = projects
        .filter(p => p.name.toLowerCase().includes(filter.toLowerCase()))
        .sort((a,b) => (b.updatedAt||0) - (a.updatedAt||0));

    const grid = $('projectGrid');
    grid.innerHTML = '';
    $('emptyState').style.display = list.length ? 'none' : 'flex';

    list.forEach(p => {
        const n = Object.keys(p.files).length;
        const d = p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : '—';
        const tl = p.type==='2d'?'2D Game':p.type==='app'?'Web App':'WebGL 3D';
        const bc = 'badge-'+p.type;

        const card = document.createElement('div');
        card.className = 'project-card';
        card.dataset.id = p.id;
        card.innerHTML = `
            <div class="pc-top">
                <span class="pc-name">${html(p.name)}</span>
                <span class="badge ${bc}">${tl}</span>
            </div>
            <div class="pc-meta">
                <span>📁 ${n} file${n!==1?'s':''}</span>
                <span>📅 ${d}</span>
            </div>
            <div class="pc-actions">
                <button class="btn pc-ren" data-id="${p.id}">✏️ Rename</button>
                <button class="btn pc-del" data-id="${p.id}">🗑️</button>
            </div>`;
        card.addEventListener('click', e => {
            if (e.target.closest('.pc-ren') || e.target.closest('.pc-del')) return;
            openProject(p.id);
        });
        grid.appendChild(card);
    });

    grid.querySelectorAll('.pc-ren').forEach(b => b.addEventListener('click', e => {
        e.stopPropagation();
        const p = projects.find(x => x.id === b.dataset.id);
        if (p) showRename('Rename Project','Project Name',p.name, v => {
            if(v.trim()){ p.name=v.trim(); p.updatedAt=Date.now(); save(projects); renderDash($('searchProjects').value); toast('Renamed','success'); }
        });
    }));
    grid.querySelectorAll('.pc-del').forEach(b => b.addEventListener('click', e => {
        e.stopPropagation();
        if(confirm('Delete this project permanently?')){
            projects=projects.filter(x=>x.id!==b.dataset.id); save(projects); renderDash($('searchProjects').value); toast('Deleted','error');
        }
    }));
}

// ======================== PROJECT MODAL ========================
let selectedType = '2d';

function openNewModal() {
    $('newProjectModal').classList.add('active');
    $('projectName').value = '';
    $('projectName').focus();
    selectedType = '2d';
    document.querySelectorAll('.type-option').forEach(c => c.classList.toggle('selected', c.dataset.type==='2d'));
}
function closeNewModal() { $('newProjectModal').classList.remove('active'); }

function createProject() {
    const name = $('projectName').value.trim() || 'Untitled Project';
    const p = { id:uid(), name, type:selectedType, files:templates(selectedType), createdAt:Date.now(), updatedAt:Date.now() };
    projects.push(p);
    save(projects);
    closeNewModal();
    renderDash();
    toast(`"${name}" created`,'success');
    openProject(p.id);
}

// ======================== EDITOR ========================
function openProject(id) {
    currentProjId = id;
    const p = proj();
    if (!p) return;
    openTabs = [];
    currentFile = null;

    $('dashboard').classList.remove('active');
    $('editor').classList.add('active');

    $('editorProjectName').textContent = p.name;
    const badge = $('projectTypeBadge');
    badge.textContent = p.type==='2d'?'2D':p.type==='app'?'APP':'WEBGL';
    badge.className = 'badge badge-'+p.type;

    renderFiles();
    const first = Object.keys(p.files)[0];
    if (first) openFile(first);
    else { $('codeEditor').value=''; updateLines(); }
}

function goBack() {
    saveCurrent();
    save(projects);
    $('editor').classList.remove('active');
    $('dashboard').classList.add('active');
    currentProjId = null; currentFile = null; openTabs = [];
    closeWGL();
    renderDash($('searchProjects').value);
}

function renderFiles() {
    const p = proj(); if(!p) return;
    const fl = $('fileList');
    fl.innerHTML = '';
    Object.keys(p.files).forEach(name => {
        const item = document.createElement('div');
        item.className = 'file-item' + (name===currentFile?' active':'');
        item.dataset.file = name;
        item.innerHTML = `
            <span class="file-icon">${ficon(name)}</span>
            <span class="file-name">${html(name)}</span>
            <div class="file-btns">
                <button class="file-btn f-ren" title="Rename">✏️</button>
                <button class="file-btn fb-del f-del" title="Delete">🗑️</button>
            </div>`;
        item.addEventListener('click', e => { if(!e.target.closest('.file-btn')) openFile(name); });
        item.addEventListener('contextmenu', e => { e.preventDefault(); showCtx(e.clientX, e.clientY, name); });
        fl.appendChild(item);
    });

    fl.querySelectorAll('.f-ren').forEach(b => b.addEventListener('click', e => {
        e.stopPropagation(); renFile(b.closest('.file-item').dataset.file);
    }));
    fl.querySelectorAll('.f-del').forEach(b => b.addEventListener('click', e => {
        e.stopPropagation(); delFile(b.closest('.file-item').dataset.file);
    }));
}

function openFile(name) {
    const p = proj(); if(!p || !(name in p.files)) return;
    saveCurrent();
    currentFile = name;
    if (!openTabs.includes(name)) openTabs.push(name);
    $('codeEditor').value = p.files[name];
    updateLines();
    renderTabs();
    renderFiles();
    $('codeEditor').focus();
}

function saveCurrent() {
    if (!currentFile) return;
    const p = proj(); if(!p || !(currentFile in p.files)) return;
    p.files[currentFile] = $('codeEditor').value;
    p.updatedAt = Date.now();
    autoSave();
}

function renderTabs() {
    const p = proj(); if(!p) return;
    openTabs = openTabs.filter(f => f in p.files);
    const bar = $('codeTabs');
    bar.innerHTML = '';
    openTabs.forEach(name => {
        const t = document.createElement('div');
        t.className = 'tab' + (name===currentFile?' active':'');
        t.innerHTML = `<span>${ficon(name)}</span><span>${html(name)}</span><button class="tab-close" data-f="${name}">×</button>`;
        t.addEventListener('click', e => { if(!e.target.closest('.tab-close')) openFile(name); });
        bar.appendChild(t);
    });
    bar.querySelectorAll('.tab-close').forEach(b => b.addEventListener('click', e => {
        e.stopPropagation(); closeTab(b.dataset.f);
    }));
}

function closeTab(name) {
    const i = openTabs.indexOf(name); if(i===-1) return;
    openTabs.splice(i,1);
    if (name===currentFile) {
        if (openTabs.length) openFile(openTabs[Math.min(i,openTabs.length-1)]);
        else { currentFile=null; $('codeEditor').value=''; updateLines(); }
    }
    renderTabs(); renderFiles();
}

function updateLines() {
    const n = $('codeEditor').value.split('\n').length;
    let s = '';
    for (let i=1; i<=n; i++) s += i+'\n';
    $('lineNumbers').textContent = s;
}

// ---- File ops ----
function addFile() { $('addFileModal').classList.add('active'); $('newFileName').value=''; $('newFileName').focus(); }

function confirmAdd() {
    const p = proj(); if(!p) return;
    let name = $('newFileName').value.trim();
    if(!name){ toast('Enter a file name','error'); return; }
    if(!name.includes('.')) name += '.js';
    if(name in p.files){ toast('File already exists','error'); return; }
    p.files[name] = '';
    p.updatedAt = Date.now();
    save(projects);
    $('addFileModal').classList.remove('active');
    renderFiles();
    openFile(name);
    toast(`"${name}" added`,'success');
}

function renFile(old) {
    const p = proj(); if(!p) return;
    showRename('Rename File','File Name',old, nw => {
        nw=nw.trim(); if(!nw||nw===old) return;
        if(nw in p.files){ toast('Name taken','error'); return; }
        p.files[nw]=p.files[old]; delete p.files[old];
        p.updatedAt=Date.now(); save(projects);
        const ti=openTabs.indexOf(old); if(ti!==-1) openTabs[ti]=nw;
        if(currentFile===old) currentFile=nw;
        renderFiles(); renderTabs(); toast('Renamed','success');
    });
}

function delFile(name) {
    const p = proj(); if(!p) return;
    if(Object.keys(p.files).length<=1){ toast("Can't delete last file",'error'); return; }
    if(!confirm(`Delete "${name}"?`)) return;
    delete p.files[name]; p.updatedAt=Date.now(); save(projects);
    closeTab(name); renderFiles(); renderTabs();
    if(currentFile===name||!currentFile){ const f=Object.keys(p.files)[0]; if(f) openFile(f); }
    toast('Deleted','info');
}

function dupFile(name) {
    const p = proj(); if(!p) return;
    const ext = name.includes('.') ? '.'+name.split('.').pop() : '';
    const base = name.includes('.') ? name.substring(0,name.lastIndexOf('.')) : name;
    let nw = base+'_copy'+ext, c=1;
    while(nw in p.files){ c++; nw=base+'_copy'+c+ext; }
    p.files[nw]=p.files[name]; p.updatedAt=Date.now(); save(projects);
    renderFiles(); openFile(nw); toast('Duplicated','success');
}

// ---- Rename modal ----
function showRename(title, label, val, cb) {
    $('renameModalTitle').textContent = title;
    $('renameLabel').textContent = label;
    $('renameInput').value = val;
    renameCallback = cb;
    $('renameModal').classList.add('active');
    $('renameInput').focus();
    $('renameInput').select();
}
function doRename() {
    if(renameCallback) renameCallback($('renameInput').value);
    $('renameModal').classList.remove('active');
    renameCallback = null;
}

// ---- Context menu ----
function showCtx(x, y, name) {
    ctxTarget = name;
    const m = $('contextMenu');
    m.style.left = x+'px'; m.style.top = y+'px';
    m.classList.add('active');
    requestAnimationFrame(() => {
        const r = m.getBoundingClientRect();
        if(r.right > innerWidth)  m.style.left = (x-r.width)+'px';
        if(r.bottom > innerHeight) m.style.top = (y-r.height)+'px';
    });
}
function hideCtx() { $('contextMenu').classList.remove('active'); ctxTarget=null; }

// ======================== RUN ========================
function runProject() {
    const p = proj(); if(!p) return;
    saveCurrent(); save(projects);
    if(p.type==='webgl') runWGL(p); else runTab(p);
}

function buildHTML(p) {
    let h = '';
    const htmlFiles = Object.keys(p.files).filter(f => f.endsWith('.html')||f.endsWith('.htm'));
    if(htmlFiles.includes('index.html')) h = p.files['index.html'];
    else if(htmlFiles.length) h = p.files[htmlFiles[0]];
    else h = '<!DOCTYPE html><html><head></head><body></body></html>';

    Object.keys(p.files).filter(f=>f.endsWith('.css')).forEach(cf => {
        const rx = new RegExp(`<link[^>]*href=["']${escRx(cf)}["'][^>]*/?>`, 'gi');
        if(rx.test(h)) h = h.replace(rx, `<style>\n${p.files[cf]}\n</style>`);
        else h = h.replace('</head>', `<style>\n${p.files[cf]}\n</style>\n</head>`);
    });

    Object.keys(p.files).filter(f=>f.endsWith('.js')).forEach(jf => {
        const rx = new RegExp(`<script[^>]*src=["']${escRx(jf)}["'][^>]*>[\\s\\S]*?<\\/script>`, 'gi');
        if(rx.test(h)) h = h.replace(rx, `<script>\n${p.files[jf]}\n<\/script>`);
        else h = h.replace('</body>', `<script>\n${p.files[jf]}\n<\/script>\n</body>`);
    });
    return h;
}

function runTab(p) {
    const blob = new Blob([buildHTML(p)], {type:'text/html'});
    const url = URL.createObjectURL(blob);
    window.open(url,'_blank');
    setTimeout(()=>URL.revokeObjectURL(url),10000);
    toast('Opened in new tab','success');
}

function runWGL(p) {
    const blob = new Blob([buildHTML(p)], {type:'text/html'});
    const url = URL.createObjectURL(blob);
    $('webglFrame').src = url;
    $('webglPreview').classList.add('active');
    toast('WebGL preview opened','success');
    setTimeout(()=>URL.revokeObjectURL(url),10000);
}
function closeWGL() {
    $('webglPreview').classList.remove('active');
    $('webglFrame').src = 'about:blank';
}

// ======================== DRAG / RESIZE WGL ========================
let dragging=false, resizing=false, dx=0, dy=0;
$('webglTitlebar').addEventListener('mousedown', e => {
    if(e.target.closest('button')) return;
    dragging=true;
    const r=$('webglPreview').getBoundingClientRect();
    dx=e.clientX-r.left; dy=e.clientY-r.top;
    e.preventDefault();
});
$('webglResizeHandle').addEventListener('mousedown', e => { resizing=true; e.preventDefault(); e.stopPropagation(); });
document.addEventListener('mousemove', e => {
    const w=$('webglPreview');
    if(dragging){ w.style.left=(e.clientX-dx)+'px'; w.style.top=(e.clientY-dy)+'px'; w.style.right='auto'; }
    if(resizing){ const r=w.getBoundingClientRect(); w.style.width=Math.max(320,e.clientX-r.left)+'px'; w.style.height=Math.max(200,e.clientY-r.top)+'px'; }
});
document.addEventListener('mouseup', ()=>{ dragging=false; resizing=false; });

// ======================== CODE EDITOR KEYS ========================
$('codeEditor').addEventListener('keydown', e => {
    const ta = $('codeEditor');

    // Tab
    if(e.key==='Tab'){
        e.preventDefault();
        const s=ta.selectionStart, end=ta.selectionEnd;
        ta.value = ta.value.substring(0,s)+'    '+ta.value.substring(end);
        ta.selectionStart = ta.selectionEnd = s+4;
        updateLines(); saveCurrent();
    }

    // Enter auto-indent
    if(e.key==='Enter'){
        e.preventDefault();
        const s=ta.selectionStart;
        const before=ta.value.substring(0,s);
        const line=before.split('\n').pop();
        const indent=line.match(/^\s*/)[0];
        const last=before.trim().slice(-1);
        let extra='';
        if(last==='{'||last==='('||last==='[') extra='    ';
        const ins='\n'+indent+extra;
        ta.value=ta.value.substring(0,s)+ins+ta.value.substring(ta.selectionEnd);
        ta.selectionStart=ta.selectionEnd=s+ins.length;
        updateLines(); saveCurrent();
    }

    // Ctrl+S
    if((e.ctrlKey||e.metaKey)&&e.key==='s'){
        e.preventDefault(); saveCurrent(); save(projects); toast('Saved','success');
    }
});

$('codeEditor').addEventListener('input', () => { updateLines(); saveCurrent(); });
$('codeEditor').addEventListener('scroll', () => { $('lineNumbers').scrollTop = $('codeEditor').scrollTop; });

// ======================== EVENT WIRING ========================
// Dashboard
$('newProjectBtn').addEventListener('click', openNewModal);
$('searchProjects').addEventListener('input', () => renderDash($('searchProjects').value));

// New project modal
$('closeModal').addEventListener('click', closeNewModal);
$('cancelProject').addEventListener('click', closeNewModal);
$('createProject').addEventListener('click', createProject);
$('projectName').addEventListener('keydown', e => { if(e.key==='Enter') createProject(); });
document.querySelectorAll('.type-option').forEach(c => c.addEventListener('click', () => {
    document.querySelectorAll('.type-option').forEach(x => x.classList.remove('selected'));
    c.classList.add('selected');
    selectedType = c.dataset.type;
}));

// Editor
$('backToDash').addEventListener('click', goBack);
$('editorProjectName').addEventListener('click', () => {
    const p=proj(); if(!p) return;
    showRename('Rename Project','Project Name',p.name, v=>{
        if(v.trim()){ p.name=v.trim(); p.updatedAt=Date.now(); save(projects); $('editorProjectName').textContent=p.name; toast('Renamed','success'); }
    });
});
$('runProject').addEventListener('click', runProject);
$('deleteProject').addEventListener('click', () => {
    if(confirm('Delete this entire project?')){
        projects=projects.filter(p=>p.id!==currentProjId); save(projects); toast('Deleted','error'); goBack();
    }
});
$('addFileBtn').addEventListener('click', addFile);

// Add file modal
$('closeAddFileModal').addEventListener('click', ()=>$('addFileModal').classList.remove('active'));
$('cancelAddFile').addEventListener('click', ()=>$('addFileModal').classList.remove('active'));
$('confirmAddFile').addEventListener('click', confirmAdd);
$('newFileName').addEventListener('keydown', e=>{ if(e.key==='Enter') confirmAdd(); });

// Rename modal
$('closeRenameModal').addEventListener('click', ()=>$('renameModal').classList.remove('active'));
$('cancelRename').addEventListener('click', ()=>$('renameModal').classList.remove('active'));
$('confirmRename').addEventListener('click', doRename);
$('renameInput').addEventListener('keydown', e=>{ if(e.key==='Enter') doRename(); });

// WebGL preview
$('webglClose').addEventListener('click', closeWGL);
$('webglReload').addEventListener('click', ()=>{ saveCurrent(); save(projects); const p=proj(); if(p) runWGL(p); });

// Context menu
document.addEventListener('click', hideCtx);
document.querySelectorAll('.ctx-item').forEach(item => item.addEventListener('click', ()=>{
    if(!ctxTarget) return;
    const a=item.dataset.action;
    if(a==='rename') renFile(ctxTarget);
    else if(a==='duplicate') dupFile(ctxTarget);
    else if(a==='delete') delFile(ctxTarget);
    hideCtx();
}));

// Close modals on overlay click
[$('newProjectModal'),$('renameModal'),$('addFileModal')].forEach(m => {
    m.addEventListener('click', e=>{ if(e.target===m) m.classList.remove('active'); });
});

// ESC
document.addEventListener('keydown', e=>{
    if(e.key==='Escape'){
        $('newProjectModal').classList.remove('active');
        $('renameModal').classList.remove('active');
        $('addFileModal').classList.remove('active');
        hideCtx();
    }
});

// Save on unload
window.addEventListener('beforeunload', ()=>{ saveCurrent(); save(projects); });

// ======================== INIT ========================
renderDash();
