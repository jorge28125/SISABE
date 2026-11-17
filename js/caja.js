// =========================================
// SISABE — Caja rápida (registrar ventas desde el panel admin)
// Toca los productos, revisa el total, elige cómo pagó el cliente y cobra.
// Al cobrar: resta el stock y suma la venta a Contabilidad.
// =========================================
const $ = (id) => document.getElementById(id);
const getApp = () => window.app;
const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let ticket = [];        // [{ id, qty, precio }]
let categoria = 'todos';
let metodo = 'Efectivo';

const money = (n) => getApp().fmtMoneda(n);
const prod = (id) => getApp().productos.find((p) => p.id === id);
const total = () => ticket.reduce((a, l) => a + l.qty * l.precio, 0);

function renderGrid() {
  const term = $('cajaBuscar').value.trim().toLowerCase();
  const list = getApp().productos.filter((p) =>
    (categoria === 'todos' || p.categoria === categoria) && p.nombre.toLowerCase().includes(term));
  $('cajaGrid').innerHTML = list.map((p) => {
    const enTicket = (ticket.find((l) => l.id === p.id) || {}).qty || 0;
    const libre = p.stock - enTicket;
    return `<button class="caja-tile ${libre <= 0 ? 'agotado' : ''}" data-id="${p.id}" ${libre <= 0 ? 'disabled' : ''}>
      <span class="caja-emoji">${esc(p.emoji || '🛍️')}</span>
      <span class="caja-nombre">${esc(p.nombre)}</span>
      <span class="caja-precio">${money(p.precio)}${p.unidad === 'ml' ? '/ml' : ''}</span>
      <span class="caja-stock ${p.stock <= p.stockMinimo ? 'bajo' : ''}">${libre <= 0 ? 'Sin stock' : 'Quedan ' + libre + (p.unidad === 'ml' ? ' ml' : '')}</span>
      ${enTicket ? `<span class="caja-badge">${enTicket}</span>` : ''}
    </button>`;
  }).join('') || '<p class="caja-vacio">No hay productos con ese filtro.</p>';
}

function renderTicket() {
  $('cajaLineas').innerHTML = ticket.length ? ticket.map((l, i) => {
    const p = prod(l.id);
    return `<div class="caja-linea">
      <div class="caja-linea-top"><strong>${esc(p.nombre)}</strong><button class="caja-x" data-act="del" data-i="${i}" aria-label="Quitar">✕</button></div>
      <div class="caja-linea-bot">
        <div class="caja-qty">
          <button data-act="menos" data-i="${i}">−</button><input type="number" min="1" max="${p.stock}" value="${l.qty}" data-act="qty" data-i="${i}" class="caja-qty-input" />${p.unidad === 'ml' ? ' ml' : ''}<button data-act="mas" data-i="${i}" ${l.qty >= p.stock ? 'disabled' : ''}>+</button>
        </div>
        <label class="caja-precio-edit">$ <input type="number" min="0" step="1" value="${l.precio}" data-act="precio" data-i="${i}" placeholder="0" /></label>
        <span class="caja-subtotal">${money(l.qty * l.precio)}${p.unidad === 'ml' ? ' (' + l.qty + ' ml)' : ''}</span>
      </div>
    </div>`;
  }).join('') : '<p class="caja-vacio">Toca un producto para agregarlo.</p>';
  $('cajaTotal').textContent = money(total());
  $('cajaIrTotal').textContent = money(total());
  $('cajaIr').hidden = !ticket.length;
  renderCambio();
}

function renderCambio() {
  $('cajaEfectivo').hidden = metodo !== 'Efectivo';
  const rec = parseFloat($('cajaRecibido').value);
  const cambio = isNaN(rec) ? 0 : rec - total();
  $('cajaCambio').textContent = isNaN(rec) ? '—' : (cambio >= 0 ? money(cambio) : 'Falta ' + money(-cambio));
}

function renderUltima() {
  const v = getApp().contabilidad.ventas.slice(-1)[0];
  $('cajaUltima').textContent = v ? `Última: ${money(v.total)} · ${v.metodo} · ${v.fecha}` : 'Aún no hay ventas.';
  $('cajaDeshacer').hidden = !v;
}

function render() { renderGrid(); renderTicket(); renderUltima(); }

function add(id) {
  const p = prod(id); if (!p) return;
  const step = p.unidad === 'ml' ? 1 : 1;
  const l = ticket.find((x) => x.id === id);
  if (l) { if (l.qty + step <= p.stock) l.qty += step; }
  else if (p.stock > 0) ticket.push({ id, qty: Math.min(step, p.stock), precio: p.precio });
  renderGrid(); renderTicket();
}

function cobrar() {
  if (!ticket.length) return alert('Agrega al menos un producto');
  for (const l of ticket) {
    const p = prod(l.id);
    if (!p || p.stock < l.qty) return alert(`Stock insuficiente de ${p ? p.nombre : 'un producto'}`);
    if (!(l.precio >= 0)) return alert('Hay un precio inválido');
  }
  const t = total();
  let cambio = null;
  if (metodo === 'Efectivo') {
    const rec = parseFloat($('cajaRecibido').value);
    if (!isNaN(rec)) {
      if (rec < t) return alert('El dinero recibido es menor al total');
      cambio = rec - t;
    }
  }
  const items = ticket.map((l) => {
    const p = prod(l.id); p.stock -= l.qty;
    return { id: p.id, nombre: p.nombre, qty: l.qty, precio: l.precio };
  });
  getApp().contabilidad.ingresos += t;
  getApp().contabilidad.ventas.push({ fecha: new Date().toLocaleString('es-MX'), items, total: t, metodo });
  getApp().saveStock();
  getApp().saveContabilidad();
  getApp().renderStock();
  getApp().renderProductos('todos');
  ticket = [];
  $('cajaRecibido').value = '';
  render();
  getApp().showToast(cambio !== null ? `Venta ${money(t)} · Cambio ${money(cambio)}` : `Venta registrada: ${money(t)}`);
}

function deshacer() {
  const v = getApp().contabilidad.ventas.slice(-1)[0];
  if (!v) return;
  if (!confirm(`¿Deshacer la última venta de ${money(v.total)}?\nSe devuelve el stock y se resta de Contabilidad.`)) return;
  v.items.forEach((i) => {
    const p = i.id != null ? prod(i.id) : getApp().productos.find((x) => x.nombre === i.nombre);
    if (p) p.stock += i.qty;
  });
  getApp().contabilidad.ingresos -= v.total;
  getApp().contabilidad.ventas.pop();
  getApp().saveStock();
  getApp().saveContabilidad();
  getApp().renderStock();
  getApp().renderProductos('todos');
  render();
  getApp().showToast('Venta deshecha');
}

// ---------- Eventos ----------
$('cajaGrid').addEventListener('click', (e) => {
  const t = e.target.closest('.caja-tile'); if (t) add(parseInt(t.dataset.id));
});
$('cajaBuscar').addEventListener('input', renderGrid);
$('cajaCats').addEventListener('click', (e) => {
  const b = e.target.closest('.caja-cat'); if (!b) return;
  categoria = b.dataset.cat;
  document.querySelectorAll('.caja-cat').forEach((x) => x.classList.toggle('active', x === b));
  renderGrid();
});
$('cajaMetodos').addEventListener('click', (e) => {
  const b = e.target.closest('.caja-metodo'); if (!b) return;
  metodo = b.dataset.metodo;
  document.querySelectorAll('.caja-metodo').forEach((x) => x.classList.toggle('active', x === b));
  renderCambio();
});
$('cajaLineas').addEventListener('click', (e) => {
  const b = e.target.closest('[data-act]'); if (!b || b.tagName === 'INPUT') return;
  const i = parseInt(b.dataset.i), l = ticket[i]; if (!l) return;
  if (b.dataset.act === 'mas') { const p = prod(l.id); const step = p.unidad === 'ml' ? 1 : 1; if (l.qty + step <= p.stock) l.qty += step; }
  else if (b.dataset.act === 'menos') { const p = prod(l.id); const step = p.unidad === 'ml' ? 1 : 1; l.qty -= step; if (l.qty < 1) ticket.splice(i, 1); }
  else if (b.dataset.act === 'del') ticket.splice(i, 1);
  renderGrid(); renderTicket();
});
$('cajaLineas').addEventListener('change', (e) => {
  if (e.target.dataset.act === 'precio') {
    const l = ticket[parseInt(e.target.dataset.i)];
    const v = parseInt(e.target.value);
    if (l && !isNaN(v) && v >= 0) l.precio = v;
    renderTicket();
    return;
  }
  if (e.target.dataset.act === 'qty') {
    const i = parseInt(e.target.dataset.i);
    const l = ticket[i];
    if (!l) return;
    const p = prod(l.id);
    let v = parseInt(e.target.value);
    if (isNaN(v) || v < 1) v = 1;
    if (v > p.stock) v = p.stock;
    l.qty = v;
    renderGrid();
    renderTicket();
  }
});
$('cajaRecibido').addEventListener('input', renderCambio);
$('cajaCobrar').addEventListener('click', cobrar);
$('cajaVaciar').addEventListener('click', () => { ticket = []; $('cajaRecibido').value = ''; render(); });
$('cajaDeshacer').addEventListener('click', deshacer);
$('cajaIr').addEventListener('click', () => $('cajaTicket').scrollIntoView({ behavior: 'smooth', block: 'start' }));

window.caja = { render };
