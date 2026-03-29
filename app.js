/* ============================================================
   MORE COOL SCIENCE GAMES — APP.JS
   To add a game: edit games.json only. No JS changes needed.

   Supported games.json fields per entry:
     id          - unique string
     title       - display name
     category    - used in filter nav
     description - shown in modal
     tags        - array of strings
     url         - iframe src
     thumbnail   - emoji
     allow       - (optional) iframe allow attribute
     scrolling   - (optional) "yes" | "no", default "no"
     frameborder - (optional) "0" | "1", default "0"
   ============================================================ */

let allGames = [];
let filteredGames = [];
let activeCategory = 'All';

const gameGrid      = document.getElementById('gameGrid');
const searchInput   = document.getElementById('searchInput');
const searchClear   = document.getElementById('searchClear');
const resultCount   = document.getElementById('resultCount');
const categoryNav   = document.getElementById('categoryNav');
const emptyState    = document.getElementById('emptyState');
const modalOverlay  = document.getElementById('modalOverlay');
const modalClose    = document.getElementById('modalClose');
const modalEmoji    = document.getElementById('modalEmoji');
const modalTitle    = document.getElementById('modalTitle');
const modalCategory = document.getElementById('modalCategory');
const modalDesc     = document.getElementById('modalDesc');
const modalTags     = document.getElementById('modalTags');
const btnFullscreen = document.getElementById('btnFullscreen');
const btnOpen       = document.getElementById('btnOpen');

// ============================================================
// INIT — ./ ensures correct path on GitHub Pages subdirectories
// ============================================================
async function init() {
  try {
    const res = await fetch('./games.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    allGames = await res.json();
    buildCategoryNav();
    applyFilters();
  } catch (err) {
    console.error('Failed to load games.json:', err);
    gameGrid.innerHTML = '<p style="color:#f87171;padding:32px;font-family:sans-serif;">Error loading games.json — ' + err.message + '</p>';
  }
}

// ============================================================
// CATEGORY NAV
// ============================================================
function buildCategoryNav() {
  const categories = ['All', ...new Set(allGames.map(g => g.category))].sort((a, b) =>
    a === 'All' ? -1 : b === 'All' ? 1 : a.localeCompare(b)
  );

  categoryNav.innerHTML = categories.map(cat => `
    <button class="cat-btn${cat === activeCategory ? ' active' : ''}" data-cat="${cat}">${cat}</button>
  `).join('');

  categoryNav.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeCategory = btn.dataset.cat;
      categoryNav.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyFilters();
    });
  });
}

// ============================================================
// FILTER + RENDER
// ============================================================
function applyFilters() {
  const query = searchInput.value.trim().toLowerCase();

  filteredGames = allGames.filter(game => {
    const matchCat = activeCategory === 'All' || game.category === activeCategory;
    const matchSearch = !query ||
      game.title.toLowerCase().includes(query) ||
      game.description.toLowerCase().includes(query) ||
      game.tags.some(t => t.toLowerCase().includes(query)) ||
      game.category.toLowerCase().includes(query);
    return matchCat && matchSearch;
  });

  renderGrid();
  updateResultCount();
}

function renderGrid() {
  if (filteredGames.length === 0) {
    gameGrid.style.display = 'none';
    emptyState.style.display = 'block';
    return;
  }

  gameGrid.style.display = 'grid';
  emptyState.style.display = 'none';

  gameGrid.innerHTML = filteredGames.map((game, i) => `
    <div class="game-card" data-id="${game.id}" style="animation-delay:${i * 40}ms">
      <div class="card-thumb">
        <span>${game.thumbnail}</span>
      </div>
      <div class="card-body">
        <span class="card-category">${game.category}</span>
        <h3 class="card-title">${game.title}</h3>
        <p class="card-desc">${game.description}</p>
        <div class="card-tags">
          ${game.tags.map(t => `<span class="tag">${t}</span>`).join('')}
        </div>
        <button class="card-play">▶ Play</button>
      </div>
    </div>
  `).join('');

  gameGrid.querySelectorAll('.game-card').forEach(card => {
    card.addEventListener('click', () => {
      const game = allGames.find(g => g.id === card.dataset.id);
      if (game) openModal(game);
    });
  });
}

function updateResultCount() {
  const total = allGames.length;
  const shown = filteredGames.length;
  resultCount.textContent = shown === total
    ? `${total} game${total !== 1 ? 's' : ''}`
    : `${shown} of ${total} games`;
}

// ============================================================
// SEARCH
// ============================================================
searchInput.addEventListener('input', () => {
  searchClear.classList.toggle('visible', searchInput.value.length > 0);
  applyFilters();
});

searchClear.addEventListener('click', () => {
  searchInput.value = '';
  searchClear.classList.remove('visible');
  searchInput.focus();
  applyFilters();
});

// ============================================================
// MODAL — all iframe attributes driven by games.json
// ============================================================
function buildIframe(game) {
  const iframe = document.createElement('iframe');
  iframe.src         = game.url;
  iframe.frameBorder = game.frameborder ?? '0';
  iframe.scrolling   = game.scrolling   ?? 'no';
  if (game.allow) iframe.allow = game.allow;
  iframe.style.cssText = 'display:block;border:none;width:100%;height:520px;';
  return iframe;
}

function openModal(game) {
  modalEmoji.textContent    = game.thumbnail;
  modalTitle.textContent    = game.title;
  modalCategory.textContent = game.category;
  modalDesc.textContent     = game.description;
  modalTags.innerHTML       = game.tags.map(t => `<span class="tag">${t}</span>`).join('');
  btnOpen.href              = game.url;

  const wrap = document.getElementById('iframeWrap');
  wrap.innerHTML = '';
  wrap.appendChild(buildIframe(game));

  modalOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modalOverlay.classList.remove('open');
  document.body.style.overflow = '';
  setTimeout(() => {
    const wrap = document.getElementById('iframeWrap');
    if (wrap) wrap.innerHTML = '';
  }, 280);
}

modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// ============================================================
// FULLSCREEN
// ============================================================
btnFullscreen.addEventListener('click', () => {
  const iframe = document.getElementById('iframeWrap')?.querySelector('iframe');
  if (!iframe) return;
  const fn = iframe.requestFullscreen || iframe.webkitRequestFullscreen || iframe.mozRequestFullScreen;
  if (fn) fn.call(iframe);
});

// ============================================================
// BOOT
// ============================================================
init();
