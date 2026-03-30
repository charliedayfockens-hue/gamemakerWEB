/* ============================================================
   GameMaker Web – Service Worker
   Serves project files at /preview/{projectId}/{filename}
   so the browser sees them as real same-origin pages.
============================================================ */
'use strict';

// project file cache: Map<id, Map<filename, content>>
const cache = new Map();

self.addEventListener('install',  () => self.skipWaiting());
self.addEventListener('activate', e  => e.waitUntil(self.clients.claim()));

// ── Message handler ───────────────────────────────────────────
self.addEventListener('message', e => {
  const d = e.data;
  if (!d) return;

  if (d.type === 'LOAD') {
    // Store project files indexed by name
    const files = new Map();
    (d.files || []).forEach(f => files.set(f.name, f.content));
    cache.set(d.id, files);
    if (e.ports[0]) e.ports[0].postMessage({ ok: true });
  } else if (d.type === 'CLEAR') {
    cache.delete(d.id);
  }
});

// ── Fetch handler ─────────────────────────────────────────────
const PREVIEW_RE = /\/preview\/([^/]+)\/(.+)$/;

function mimeFor(name) {
  const ext = name.split('.').pop().toLowerCase();
  return (
    { html: 'text/html; charset=utf-8', css: 'text/css',
      js:   'application/javascript',   json: 'application/json',
      txt:  'text/plain',               glsl: 'text/plain'        }[ext] || 'text/plain'
  );
}

self.addEventListener('fetch', e => {
  const m = new URL(e.request.url).pathname.match(PREVIEW_RE);
  if (!m) return; // let everything else pass through

  const [, id, filename] = m;
  const proj = cache.get(id);

  if (!proj) {
    e.respondWith(new Response(
      '<!doctype html><title>Not loaded</title><body style="font:14px monospace;padding:20px">' +
      '<b>Project not in SW cache.</b><br>Please click Run again from the editor.</body>',
      { status: 404, headers: { 'Content-Type': 'text/html' } }
    ));
    return;
  }

  const content = proj.get(filename);
  if (content == null) {
    e.respondWith(new Response(
      'File not found: ' + filename,
      { status: 404, headers: { 'Content-Type': 'text/plain' } }
    ));
    return;
  }

  e.respondWith(new Response(content, {
    status:  200,
    headers: { 'Content-Type': mimeFor(filename), 'Cache-Control': 'no-store' },
  }));
});
