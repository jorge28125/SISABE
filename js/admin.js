// =========================================
// SISABE — Acceso al panel de administración (usuario + contraseña)
// Se abre con  tusitio.com/#admin  o con el enlace "Admin" del pie de página.
//
// La primera vez que se abre en un navegador, pide CREAR el usuario y la
// contraseña. Después, para entrar hay que escribir los dos.
//
// IMPORTANTE: la verificación ocurre en el navegador (no hay servidor), y los
// usuarios, el stock y las ventas se guardan solo en este dispositivo.
// Frena a curiosos, pero no es seguridad de nivel bancario.
// =========================================

const $ = (id) => document.getElementById(id);
const getApp = () => window.app;
const panel = $('adminPanel');
const login = $('adminLogin');
const form = $('adminForm');
const err = $('adminError');
const USERS_KEY = 'sisabe_admin_users';
const SESSION_KEY = 'sisabe_admin';
const ITER = 150000;
let currentTab = 'caja';

// ---------- Utilidades ----------
const norm = (u) => u.trim().toLowerCase();
const toHex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

async function derive(pass, salt) {
  if (!(window.crypto && crypto.subtle)) throw new Error('no-crypto');
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(pass), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(salt), iterations: ITER }, key, 256);
  return toHex(bits);
}

async function makeUser(user, pass) {
  const salt = toHex(crypto.getRandomValues(new Uint8Array(16)));
  return { user: norm(user), salt, hash: await derive(pass, salt) };
}

function getUsers() { try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; } catch (_) { return []; } }
function saveUsers(list) { localStorage.setItem(USERS_KEY, JSON.stringify(list)); }
const getSession = () => { try { return sessionStorage.getItem(SESSION_KEY); } catch (_) { return null; } };
const setSession = (u) => { try { u ? sessionStorage.setItem(SESSION_KEY, u) : sessionStorage.removeItem(SESSION_KEY); } catch (_) {} };

// ---------- Pestañas / abrir y cerrar ----------
function showTab(name) {
  currentTab = name;
  document.querySelectorAll('.admin-tab').forEach((b) => b.classList.toggle('active', b.dataset.tab === name));
  document.querySelectorAll('.admin-body [data-view]').forEach((v) => { v.hidden = v.dataset.view !== name; });
  if (name === 'caja' && window.caja) caja.render();
  if (name === 'contabilidad' && window.app) getApp().renderContabilidad();
  if (name === 'cuenta') renderCuenta();
  panel.scrollTop = 0;
}

function clearHash() {
  if (location.hash === '#admin') history.replaceState(null, '', location.pathname + location.search);
}

function openPanel() {
  login.hidden = true;
  panel.hidden = false;
  document.body.style.overflow = 'hidden';
  if (window.app && getApp().els && getApp().els.stockSearch) { getApp().renderStock(); getApp().renderContabilidad(); getApp().renderStats(); }
  showTab(currentTab);
}

function openLogin() {
  const setup = getUsers().length === 0;
  panel.hidden = true;
  login.hidden = false;
  document.body.style.overflow = 'hidden';
  $('adminTitle').textContent = setup ? 'Crea tu acceso' : 'Acceso administrador';
  $('adminHelp').textContent = setup ? 'Primera vez en este dispositivo: elige un usuario y una contraseña (mínimo 6 caracteres).' : '';
  $('adminPass2').hidden = !setup;
  $('adminPass2').required = setup;
  $('adminPass').autocomplete = setup ? 'new-password' : 'current-password';
  $('adminSubmit').textContent = setup ? 'Crear acceso y entrar' : 'Entrar';
  $('adminUser').value = ''; $('adminPass').value = ''; $('adminPass2').value = '';
  err.textContent = '';
  setTimeout(() => $('adminUser').focus(), 50);
}

function closeAll() {
  panel.hidden = true;
  login.hidden = true;
  document.body.style.overflow = '';
  clearHash();
}

function route() {
  if (location.hash !== '#admin') return;
  const s = getSession();
  (s && getUsers().some((u) => u.user === s)) ? openPanel() : openLogin();
}

// ---------- Login / primer registro ----------
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  err.textContent = '';
  const user = norm($('adminUser').value), pass = $('adminPass').value;
  try {
    const users = getUsers();
    if (users.length === 0) {                       // primera vez: crear acceso
      if (!user) return (err.textContent = 'Escribe un usuario');
      if (pass.length < 6) return (err.textContent = 'La contraseña debe tener al menos 6 caracteres');
      if (pass !== $('adminPass2').value) return (err.textContent = 'Las contraseñas no coinciden');
      saveUsers([await makeUser(user, pass)]);
      setSession(user); openPanel(); return;
    }
    const u = users.find((x) => x.user === user);
    if (u && (await derive(pass, u.salt)) === u.hash) { setSession(user); openPanel(); return; }
    await new Promise((r) => setTimeout(r, 800));    // frena intentos rápidos
    err.textContent = 'Usuario o contraseña incorrectos';
    $('adminPass').select();
  } catch (_) {
    err.textContent = 'Abre el sitio con https:// para poder entrar';
  }
});

// ---------- Pestaña Cuenta ----------
function msg(t, ok = true) {
  const m = $('cuentaMsg'); m.textContent = t; m.style.color = ok ? 'var(--verde)' : 'var(--rojo)';
}

function renderCuenta() {
  const me = getSession();
  $('cuentaLista').innerHTML = getUsers().map((u) =>
    `<li><span>👤 ${u.user.replace(/[<>&"']/g, '')}${u.user === me ? ' <em>(tú)</em>' : ''}</span>${
      u.user === me ? '' : `<button class="caja-link" data-del="${u.user.replace(/[<>&"']/g, '')}">Eliminar</button>`}</li>`).join('');
}

$('cuentaLista').addEventListener('click', (e) => {
  const u = e.target.dataset.del; if (!u) return;
  if (!confirm(`¿Eliminar el usuario "${u}"?`)) return;
  saveUsers(getUsers().filter((x) => x.user !== u));
  renderCuenta(); msg('Usuario eliminado');
});

$('cuentaAgregar').addEventListener('submit', async (e) => {
  e.preventDefault();
  const user = norm($('cuentaNuevoUser').value), pass = $('cuentaNuevoPass').value;
  if (!user) return msg('Escribe un usuario', false);
  if (pass.length < 6) return msg('La contraseña debe tener al menos 6 caracteres', false);
  const users = getUsers();
  if (users.some((x) => x.user === user)) return msg('Ese usuario ya existe', false);
  try { users.push(await makeUser(user, pass)); saveUsers(users); } catch (_) { return msg('Abre el sitio con https://', false); }
  e.target.reset(); renderCuenta(); msg(`Usuario "${user}" agregado`);
});

$('cuentaCambiar').addEventListener('submit', async (e) => {
  e.preventDefault();
  const p1 = $('cuentaPass1').value, p2 = $('cuentaPass2').value, me = getSession();
  if (p1.length < 6) return msg('La contraseña debe tener al menos 6 caracteres', false);
  if (p1 !== p2) return msg('Las contraseñas no coinciden', false);
  try {
    const nuevo = await makeUser(me, p1);
    saveUsers(getUsers().map((x) => (x.user === me ? nuevo : x)));
  } catch (_) { return msg('Abre el sitio con https://', false); }
  e.target.reset(); msg('Contraseña actualizada');
});

// ---------- Botones generales ----------
$('adminCancel').addEventListener('click', closeAll);
$('adminClose').addEventListener('click', closeAll);
$('adminLogout').addEventListener('click', () => { setSession(null); closeAll(); });
document.querySelectorAll('.admin-tab').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.tab)));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && (!panel.hidden || !login.hidden)) closeAll(); });
window.addEventListener('hashchange', route);
// Esperar a que la tienda (app.js) termine de iniciar antes de abrir el panel
function waitForApp() {
  if (window.app) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', route);
    else route();
  } else {
    setTimeout(waitForApp, 50);
  }
}
waitForApp();
