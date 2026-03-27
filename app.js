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
html, body { width: 100%; height: 100%; overflow: hidden; background: #000; }
#canvas { display: block; width: 100%; height: 100%; }`,
    },
    {
      name: 'webgl.js',
      content: `// Robust WebGL init – works in iframes, blob URLs, and new tabs
(function init() {
  var canvas = document.getElementById('canvas');
  if (!canvas) { setTimeout(init, 16); return; }

  // Force correct buffer size (CSS may report 0 inside iframes initially)
  function resize() {
    var w = canvas.clientWidth  || window.innerWidth  || 800;
    var h = canvas.clientHeight || window.innerHeight || 600;
    if (w < 1) w = window.innerWidth || 800;
    if (h < 1) h = window.innerHeight || 600;
    canvas.width  = w;
    canvas.height = h;
    return { w: w, h: h };
  }
  resize();

  var gl = canvas.getContext('webgl', { alpha: false, antialias: true })
        || canvas.getContext('experimental-webgl');
  if (!gl) {
    document.body.innerHTML = '<p style="color:#fff;padding:20px;font-family:monospace">WebGL not supported.</p>';
    return;
  }

  // ── Shaders ───────────────────────────────────────────────────
  var VERT = [
    'attribute vec3 aPos;',
    'attribute vec4 aCol;',
    'uniform   mat4 uMVP;',
    'varying lowp vec4 vCol;',
    'void main() {',
    '  gl_Position = uMVP * vec4(aPos, 1.0);',
    '  vCol = aCol;',
    '}'
  ].join('\\n');

  var FRAG = [
    'varying lowp vec4 vCol;',
    'void main() { gl_FragColor = vCol; }'
  ].join('\\n');

  function mkShader(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error('Shader error:', gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }

  var vs = mkShader(gl.VERTEX_SHADER, VERT);
  var fs = mkShader(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return;

  var prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(prog));
    return;
  }
  gl.useProgram(prog);

  // ── Geometry – colorful spinning cube ──────────────────────────
  var V = new Float32Array([
    // Front – red
    -.5,-.5, .5,  1,.2,.2,1,  .5,-.5, .5,  1,.2,.2,1,  .5, .5, .5,  1,.2,.2,1,
    -.5,-.5, .5,  1,.2,.2,1,  .5, .5, .5,  1,.2,.2,1, -.5, .5, .5,  1,.2,.2,1,
    // Back – cyan
    -.5,-.5,-.5,  .2,.9,.9,1,  .5, .5,-.5,  .2,.9,.9,1,  .5,-.5,-.5,  .2,.9,.9,1,
    -.5,-.5,-.5,  .2,.9,.9,1, -.5, .5,-.5,  .2,.9,.9,1,  .5, .5,-.5,  .2,.9,.9,1,
    // Top – green
    -.5, .5,-.5,  .2,.9,.3,1,  .5, .5,-.5,  .2,.9,.3,1,  .5, .5, .5,  .2,.9,.3,1,
    -.5, .5,-.5,  .2,.9,.3,1,  .5, .5, .5,  .2,.9,.3,1, -.5, .5, .5,  .2,.9,.3,1,
    // Bottom – yellow
    -.5,-.5,-.5,  1,.9,.1,1,  .5,-.5, .5,  1,.9,.1,1,  .5,-.5,-.5,  1,.9,.1,1,
    -.5,-.5,-.5,  1,.9,.1,1, -.5,-.5, .5,  1,.9,.1,1,  .5,-.5, .5,  1,.9,.1,1,
    // Right – blue
     .5,-.5,-.5,  .2,.4,1,1,   .5, .5,-.5,  .2,.4,1,1,   .5, .5, .5,  .2,.4,1,1,
     .5,-.5,-.5,  .2,.4,1,1,   .5, .5, .5,  .2,.4,1,1,   .5,-.5, .5,  .2,.4,1,1,
    // Left – magenta
    -.5,-.5,-.5,  .9,.2,.9,1, -.5, .5, .5,  .9,.2,.9,1, -.5, .5,-.5,  .9,.2,.9,1,
    -.5,-.5,-.5,  .9,.2,.9,1, -.5,-.5, .5,  .9,.2,.9,1, -.5, .5, .5,  .9,.2,.9,1,
  ]);

  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, V, gl.STATIC_DRAW);

  var stride = 28;
  var aPos = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, stride, 0);

  var aCol = gl.getAttribLocation(prog, 'aCol');
  gl.enableVertexAttribArray(aCol);
  gl.vertexAttribPointer(aCol, 4, gl.FLOAT, false, stride, 12);

  var uMVP = gl.getUniformLocation(prog, 'uMVP');

  // ── Math helpers ──────────────────────────────────────────────
  function mul(a, b) {
    var o = new Float32Array(16);
    for (var r = 0; r < 4; r++)
      for (var c = 0; c < 4; c++)
        for (var k = 0; k < 4; k++)
          o[r + c * 4] += a[r + k * 4] * b[k + c * 4];
    return o;
  }
  function rotX(t) {
    var c = Math.cos(t), s = Math.sin(t);
    return new Float32Array([1,0,0,0, 0,c,s,0, 0,-s,c,0, 0,0,0,1]);
  }
  function rotY(t) {
    var c = Math.cos(t), s = Math.sin(t);
    return new Float32Array([c,0,-s,0, 0,1,0,0, s,0,c,0, 0,0,0,1]);
  }
  function perspective(fov, asp, near, far) {
    var f = 1 / Math.tan(fov / 2);
    var d = near - far;
    if (asp < 0.001) asp = 1; // prevent NaN
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

  var t = 0;

  // Rebuild projection on resize
  window.addEventListener('resize', function() { resize(); });

  // ── Render loop ───────────────────────────────────────────────
  function render() {
    t += 0.012;
    // Recompute projection every frame to handle resize and avoid stale NaN
    var asp = canvas.width / canvas.height;
    var proj = perspective(Math.PI / 4, asp, 0.1, 100);

    gl.enable(gl.DEPTH_TEST);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.04, 0.04, 0.1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var model = mul(mul(translate(0, 0, -2.5), rotY(t)), rotX(t * 0.6));
    var mvp   = mul(proj, model);
    gl.uniformMatrix4fv(uMVP, false, mvp);
    gl.drawArrays(gl.TRIANGLES, 0, 36);
    requestAnimationFrame(render);
  }
  render();
})();`,
    },
  ],

  'particles': [
    {
      name: 'index.html',
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Particle System</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <canvas id="canvas"></canvas>
  <script src="particles.js"><\/script>
</body>
</html>`,
    },
    {
      name: 'styles.css',
      content: `* { margin: 0; padding: 0; }
html, body { width: 100%; height: 100%; overflow: hidden; background: #000; }
#canvas { display: block; width: 100%; height: 100%; cursor: crosshair; }`,
    },
    {
      name: 'particles.js',
      content: `const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

function resize() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

// ── Particle pool ────────────────────────────────────────────
const MAX = 800;
const particles = [];
let mouse = { x: canvas.width / 2, y: canvas.height / 2 };

function spawn(x, y, count) {
  for (let i = 0; i < count && particles.length < MAX; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 3;
    const hue   = (Date.now() / 20 + Math.random() * 60) % 360;
    particles.push({
      x: x, y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      decay: 0.005 + Math.random() * 0.015,
      size: 2 + Math.random() * 4,
      hue: hue,
    });
  }
}

canvas.addEventListener('mousemove', e => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});
canvas.addEventListener('click', e => spawn(e.clientX, e.clientY, 50));

// ── Loop ─────────────────────────────────────────────────────
function loop() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Auto-emit from mouse
  spawn(mouse.x, mouse.y, 3);

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x    += p.vx;
    p.y    += p.vy;
    p.vy   += 0.02; // gravity
    p.life -= p.decay;

    if (p.life <= 0) { particles.splice(i, 1); continue; }

    ctx.globalAlpha = p.life;
    ctx.fillStyle = 'hsl(' + p.hue + ', 100%, 60%)';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // HUD
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '13px monospace';
  ctx.fillText('Move mouse to emit | Click to burst | Particles: ' + particles.length, 12, 24);

  requestAnimationFrame(loop);
}
loop();`,
    },
  ],

  'platformer': [
    {
      name: 'index.html',
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Platformer</title>
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
body { background: #1a1a2e; display: flex; align-items: center; justify-content: center; height: 100vh; overflow: hidden; }
#canvas { display: block; border: 2px solid #4d8ef0; background: #0f0f23; image-rendering: pixelated; }`,
    },
    {
      name: 'game.js',
      content: `const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
canvas.width = 800; canvas.height = 400;

// ── Level ────────────────────────────────────────────────────
const TILE = 32;
const COLS = 25, ROWS = 12;
// 1 = solid, 2 = coin, 0 = air
const level = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,1],
  [1,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,1,1,1,1,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,1],
  [1,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

let coins = 0, totalCoins = 0;
for (let r = 0; r < ROWS; r++)
  for (let c = 0; c < COLS; c++)
    if (level[r][c] === 2) totalCoins++;

// ── Player ───────────────────────────────────────────────────
const P = { x: 64, y: 288, w: 24, h: 28, vx: 0, vy: 0, onGround: false, color: '#4d8ef0' };
const GRAV = 0.5, JUMP = -9, SPD = 4, FRIC = 0.8;

// ── Input ────────────────────────────────────────────────────
const keys = {};
addEventListener('keydown', e => { keys[e.key] = true; e.preventDefault(); });
addEventListener('keyup', e => { keys[e.key] = false; });

function tileAt(px, py) {
  var c = Math.floor(px / TILE), r = Math.floor(py / TILE);
  if (c < 0 || c >= COLS || r < 0 || r >= ROWS) return 1;
  return level[r][c];
}

function update() {
  // Horizontal
  if (keys['ArrowLeft'] || keys['a']) P.vx = -SPD;
  else if (keys['ArrowRight'] || keys['d']) P.vx = SPD;
  else P.vx *= FRIC;

  // Jump
  if ((keys['ArrowUp'] || keys['w'] || keys[' ']) && P.onGround) {
    P.vy = JUMP;
    P.onGround = false;
  }
  P.vy += GRAV;

  // Move X
  P.x += P.vx;
  if (tileAt(P.x, P.y) === 1 || tileAt(P.x, P.y + P.h - 1) === 1 ||
      tileAt(P.x + P.w - 1, P.y) === 1 || tileAt(P.x + P.w - 1, P.y + P.h - 1) === 1) {
    P.x -= P.vx; P.vx = 0;
  }

  // Move Y
  P.y += P.vy;
  P.onGround = false;
  if (tileAt(P.x, P.y) === 1 || tileAt(P.x, P.y + P.h - 1) === 1 ||
      tileAt(P.x + P.w - 1, P.y) === 1 || tileAt(P.x + P.w - 1, P.y + P.h - 1) === 1) {
    if (P.vy > 0) P.onGround = true;
    P.y -= P.vy; P.vy = 0;
  }

  // Coins
  var cr = Math.floor((P.y + P.h / 2) / TILE);
  var cc = Math.floor((P.x + P.w / 2) / TILE);
  if (cr >= 0 && cr < ROWS && cc >= 0 && cc < COLS && level[cr][cc] === 2) {
    level[cr][cc] = 0;
    coins++;
  }
}

function draw() {
  ctx.fillStyle = '#0f0f23';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Tiles
  for (var r = 0; r < ROWS; r++) {
    for (var c = 0; c < COLS; c++) {
      var t = level[r][c];
      if (t === 1) {
        ctx.fillStyle = '#2a2a4a';
        ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
        ctx.strokeStyle = '#3a3a6a';
        ctx.strokeRect(c * TILE, r * TILE, TILE, TILE);
      } else if (t === 2) {
        ctx.fillStyle = '#f0db4f';
        ctx.beginPath();
        ctx.arc(c * TILE + TILE / 2, r * TILE + TILE / 2, 8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Player
  ctx.shadowColor = P.color; ctx.shadowBlur = 12;
  ctx.fillStyle = P.color;
  ctx.fillRect(P.x, P.y, P.w, P.h);
  ctx.shadowBlur = 0;

  // Eyes
  ctx.fillStyle = '#fff';
  ctx.fillRect(P.x + 6, P.y + 6, 5, 6);
  ctx.fillRect(P.x + 14, P.y + 6, 5, 6);
  ctx.fillStyle = '#111';
  ctx.fillRect(P.x + 8, P.y + 8, 3, 4);
  ctx.fillRect(P.x + 16, P.y + 8, 3, 4);

  // HUD
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 16px monospace';
  ctx.fillText('Coins: ' + coins + ' / ' + totalCoins, 12, 28);
  if (coins === totalCoins) {
    ctx.fillStyle = '#3dba6f';
    ctx.font = 'bold 28px monospace';
    ctx.fillText('YOU WIN!', canvas.width / 2 - 70, canvas.height / 2);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '11px monospace';
  ctx.fillText('WASD / Arrows + Space to jump', 12, canvas.height - 10);
}

function loop() { update(); draw(); requestAnimationFrame(loop); }
loop();`,
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
    // Auto-refresh preview if enabled
    if (typeof triggerAutoRefresh === 'function') triggerAutoRefresh();
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
  const typeLabels = { '2d': '2D Game', 'app': 'Web App', 'webgl': 'WebGL 3D', 'particles': 'Particles', 'platformer': 'Platformer' };
  badge.textContent = typeLabels[proj.type] || proj.type;
  var badgeClass = proj.type;
  badge.className = 'type-badge badge-' + badgeClass;

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

function injectConsoleCapture(html) {
  const script = `<script>
(function(){
  var _log = console.log, _err = console.error, _warn = console.warn;
  function send(type, args) {
    try {
      parent.postMessage({ __gmw_console: true, type: type, data: Array.from(args).map(function(a) {
        if (a === null) return 'null';
        if (a === undefined) return 'undefined';
        if (typeof a === 'object') try { return JSON.stringify(a, null, 2); } catch(e) { return String(a); }
        return String(a);
      })}, '*');
    } catch(e) {}
  }
  console.log   = function() { send('log',   arguments); _log.apply(console, arguments); };
  console.error = function() { send('error', arguments); _err.apply(console, arguments); };
  console.warn  = function() { send('warn',  arguments); _warn.apply(console, arguments); };
  window.addEventListener('error', function(e) { send('error', [e.message + ' (line ' + e.lineno + ')']); });
})();
<\/script>`;
  return html.replace('<head>', '<head>' + script);
}

function runProject(openInTab) {
  const proj = getProject(state.activeProjectId);
  if (!proj) return;

  const html = buildHTML(proj);
  if (!html) {
    alert('No HTML file found in this project.');
    return;
  }

  const finalHTML = injectConsoleCapture(html);
  const blob = new Blob([finalHTML], { type: 'text/html' });
  const url  = URL.createObjectURL(blob);

  if (openInTab) {
    window.open(url, '_blank');
  } else if (proj.type === 'webgl' || proj.type === 'particles') {
    openWebGLWindow(url, proj.name);
  } else {
    window.open(url, '_blank');
  }
}

function downloadProject() {
  const proj = getProject(state.activeProjectId);
  if (!proj) return;
  const html = buildHTML(proj);
  if (!html) return;
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = (proj.name || 'project').replace(/[^a-zA-Z0-9_-]/g, '_') + '.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function duplicateProject(id) {
  const orig = getProject(id);
  if (!orig) return;
  const files = orig.files.map(f => ({ id: uid(), name: f.name, content: f.content }));
  const proj = { id: uid(), name: orig.name + ' (copy)', type: orig.type, files };
  state.projects.push(proj);
  saveProjects();
  openProject(proj.id);
  renderProjectList();
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

function popOutWebGLWindow() {
  if (wglCurrentURL) window.open(wglCurrentURL, '_blank');
}

function fullscreenWebGLWindow() {
  const frame = document.getElementById('wglFrame');
  if (frame.requestFullscreen) frame.requestFullscreen();
  else if (frame.webkitRequestFullscreen) frame.webkitRequestFullscreen();
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

// ── Console panel ─────────────────────────────────────────────
let consoleOpen = false;

function toggleConsole() {
  const panel = document.getElementById('consolePanel');
  consoleOpen = !consoleOpen;
  panel.style.display = consoleOpen ? 'flex' : 'none';
  const btn = document.getElementById('btnConsole');
  if (btn) btn.classList.toggle('active', consoleOpen);
  if (cm) setTimeout(() => cm.refresh(), 20);
}

function clearConsole() {
  const log = document.getElementById('consoleLog');
  if (log) log.innerHTML = '';
}

function appendConsole(type, data) {
  const log = document.getElementById('consoleLog');
  if (!log) return;
  const line = document.createElement('div');
  line.className = 'console-line console-' + type;
  line.textContent = data.join(' ');
  log.appendChild(line);
  log.scrollTop = log.scrollHeight;
}

// Listen for console messages from iframe
window.addEventListener('message', e => {
  if (e.data && e.data.__gmw_console) {
    appendConsole(e.data.type, e.data.data);
  }
});

// ── Auto-refresh ──────────────────────────────────────────────
let autoRefreshEnabled = false;
let autoRefreshTimer = null;

function toggleAutoRefresh() {
  autoRefreshEnabled = !autoRefreshEnabled;
  const btn = document.getElementById('btnAutoRefresh');
  if (btn) btn.classList.toggle('active', autoRefreshEnabled);
}

function triggerAutoRefresh() {
  if (!autoRefreshEnabled) return;
  clearTimeout(autoRefreshTimer);
  autoRefreshTimer = setTimeout(() => {
    const wglWin = document.getElementById('wglWindow');
    if (wglWin && wglWin.style.display !== 'none') {
      refreshWebGLWindow();
    }
  }, 1000);
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
  document.getElementById('btnRun').addEventListener('click', () => runProject(false));
  document.getElementById('btnRunTab').addEventListener('click', () => runProject(true));
  document.getElementById('btnDownload').addEventListener('click', downloadProject);

  // Console
  document.getElementById('btnConsole').addEventListener('click', toggleConsole);
  document.getElementById('btnConsoleClear').addEventListener('click', clearConsole);
  document.getElementById('btnConsoleClose').addEventListener('click', () => {
    consoleOpen = true; // will be toggled to false
    toggleConsole();
  });

  // Auto-refresh
  document.getElementById('btnAutoRefresh').addEventListener('click', toggleAutoRefresh);

  // WebGL window controls
  document.getElementById('wglClose').addEventListener('click', closeWebGLWindow);
  document.getElementById('wglRefresh').addEventListener('click', refreshWebGLWindow);
  document.getElementById('wglPopOut').addEventListener('click', popOutWebGLWindow);
  document.getElementById('wglFullscreen').addEventListener('click', fullscreenWebGLWindow);

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
      if (action === 'duplicate') duplicateProject(id);
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

  // Keyboard shortcuts
  document.addEventListener('keydown', e => {
    // ESC closes topmost modal / context menu
    if (e.key === 'Escape') {
      const open = document.querySelector('.modal-overlay[style*="flex"]');
      if (open) { closeModal(open.id); return; }
      if (document.getElementById('ctxMenu').classList.contains('open')) { hideCtxMenu(); return; }
      if (document.getElementById('wglWindow').style.display !== 'none') closeWebGLWindow();
      return;
    }

    // Ctrl/Cmd shortcuts
    const mod = e.ctrlKey || e.metaKey;
    if (!mod) return;

    if (e.key === 's') {
      e.preventDefault();
      // Force save
      const proj = getProject(state.activeProjectId);
      const file = getFile(proj, state.activeFileId);
      if (cm && file) { file.content = cm.getValue(); saveProjects(); setSaveStatus('saved'); }
    }
    if (e.shiftKey && (e.key === 'R' || e.key === 'r')) {
      e.preventDefault();
      runProject(false);
    }
    if (e.shiftKey && (e.key === 'T' || e.key === 't')) {
      e.preventDefault();
      runProject(true);
    }
    if (e.key === 'j' || e.key === 'J') {
      e.preventDefault();
      toggleConsole();
    }
    if (e.shiftKey && (e.key === 'N' || e.key === 'n')) {
      e.preventDefault();
      document.getElementById('btnNewProject').click();
    }
  });
});
