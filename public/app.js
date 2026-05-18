/* ─── Shared utilities für alle Seiten ─────────────────────────────────── */

const API = '/api';

function getUser() {
  try { return JSON.parse(localStorage.getItem('ts_user')); } catch { return null; }
}

function requireAuth(requiredRole) {
  const user = getUser();
  if (!user) { location.href = 'index.html'; return null; }
  if (requiredRole && user.role !== requiredRole) {
    location.href = user.role === 'admin' ? 'admin.html' : 'client.html';
    return null;
  }
  return user;
}

function logout() {
  localStorage.removeItem('ts_user');
  location.href = 'index.html';
}

async function api(path, opts = {}) {
  const user = getUser();
  const headers = {
    'Content-Type': 'application/json',
    ...(user ? { 'X-User-ID': String(user.id) } : {}),
    ...(opts.headers || {}),
  };
  const res = await fetch(API + path, { ...opts, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

/* Status-Farben ──────────────────────────────────────────────────────────── */
const STATUS_STYLES = {
  'Konzept':                 { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' },
  'Entwicklung':             { bg: '#dbeafe', color: '#1d4ed8', border: '#93c5fd' },
  'Testen':                  { bg: '#fef3c7', color: '#92400e', border: '#fcd34d' },
  'Optimieren':              { bg: '#ffedd5', color: '#c2410c', border: '#fdba74' },
  'Bereit zu Abnahme':       { bg: '#f3e8ff', color: '#7c3aed', border: '#c4b5fd' },
  'Abgenommen durch Kunden': { bg: '#dcfce7', color: '#15803d', border: '#86efac' },
};

function statusBadge(status) {
  const s = STATUS_STYLES[status] || STATUS_STYLES['Konzept'];
  return `<span class="status-badge" style="background:${s.bg};color:${s.color};border-color:${s.border}">${esc(status)}</span>`;
}

/* Hilfsfunktionen ────────────────────────────────────────────────────────── */
function fmtDate(dt) {
  if (!dt) return '';
  const d = new Date(dt.endsWith('Z') ? dt : dt + 'Z');
  return d.toLocaleString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function avatar(name) {
  return (name || '?').split(' ').slice(0, 2).map(w => w[0] || '').join('').toUpperCase();
}

/* Deterministic colour index 0-5 based on username hash */
function avatarIdx(name) {
  let h = 0;
  for (let i = 0; i < (name || '').length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return h % 6;
}

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* Confirm Dialog ─────────────────────────────────────────────────────────── */
function showConfirm(title, message = '', confirmLabel = 'Bestätigen', danger = false) {
  return new Promise(resolve => {
    document.getElementById('__confirm')?.remove();
    const overlay = document.createElement('div');
    overlay.id = '__confirm';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-card" style="max-width:380px">
        <div class="modal-title">${esc(title)}</div>
        ${message ? `<div class="modal-subtitle">${esc(message)}</div>` : ''}
        <div class="modal-footer">
          <button class="btn-cancel" id="__conf-no">Abbrechen</button>
          <button class="btn-confirm${danger ? ' btn-confirm-danger' : ''}" id="__conf-yes">${esc(confirmLabel)}</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('open'));
    const close = r => {
      overlay.classList.remove('open');
      setTimeout(() => overlay.remove(), 200);
      resolve(r);
    };
    overlay.addEventListener('click', e => { if (e.target === overlay) close(false); });
    document.getElementById('__conf-no').addEventListener('click',  () => close(false));
    document.getElementById('__conf-yes').addEventListener('click', () => close(true));
  });
}

/* Toast ──────────────────────────────────────────────────────────────────── */
function showToast(msg, type = 'success') {
  const container = document.getElementById('toast');
  if (!container) return;
  const el = document.createElement('div');
  el.className = `toast-item ${type}`;
  el.textContent = msg;
  container.appendChild(el);
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('show')));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
  }, 3200);
}

/* SVG-Icons ──────────────────────────────────────────────────────────────── */
const ICON = {
  chat:   `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  trash:  `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`,
  chevron:`<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>`,
  screen: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>`,
  user:   `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  edit:   `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
  plus:   `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
};
