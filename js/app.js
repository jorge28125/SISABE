/* =========================================
   SISABE — Aplicación principal
   ========================================= */
import { PRODUCTOS } from './products.js';

const app = {
  productos: JSON.parse(JSON.stringify(PRODUCTOS)),
  carrito: JSON.parse(localStorage.getItem('sisabe_carrito')) || [],
  contabilidad: JSON.parse(localStorage.getItem('sisabe_contabilidad')) || {
    ingresos: 0,
    gastos: 0,
    ventas: [],
    cierres: [],
  },
  usuario: JSON.parse(localStorage.getItem('sisabe_usuario')) || null,
  els: {},

  init() {
    this.cacheDOM();
    this.updateAuthUI();
    this.renderStats();
    this.renderProductos('todos');
    this.renderStock();
    this.renderContabilidad();
    this.renderCarrito();
    this.bindEvents();
    this.initThreeJS();
    this.initAudio();
  },

  cacheDOM() {
    this.els = {
      productsGrid: document.getElementById('productsGrid'),
      emptyState: document.getElementById('emptyState'),
      stockBody: document.getElementById('stockBody'),
      stockSearch: document.getElementById('stockSearch'),
      stockFilter: document.getElementById('stockFilter'),
      filtroBtns: document.querySelectorAll('.filter-btn'),
      ventaProducto: document.getElementById('ventaProducto'),
      btnRegistrarVenta: document.getElementById('btnRegistrarVenta'),
      btnRegistrarGasto: document.getElementById('btnRegistrarGasto'),
      historialBody: document.getElementById('historialBody'),
      cierresBody: document.getElementById('cierresBody'),
      cartItems: document.getElementById('cartItems'),
      cartCount: document.getElementById('cartCount'),
      cartSubtotal: document.getElementById('cartSubtotal'),
      cartTotal: document.getElementById('cartTotal'),
      btnCheckout: document.getElementById('btnCheckout'),
      btnCloseCart: document.getElementById('btnCloseCart'),
      cartSidebar: document.getElementById('cartSidebar'),
      cartOverlay: document.getElementById('cartOverlay'),
      productModal: document.getElementById('productModal'),
      btnCloseModal: document.getElementById('btnCloseModal'),
      btnAddModal: document.getElementById('btnAddModal'),
      modalQty: document.getElementById('modalQty'),
      modalQtyLabel: document.getElementById('modalQtyLabel'),
      navbar: document.getElementById('navbar'),
      authBtn: document.getElementById('authBtn'),
      authModal: document.getElementById('authModal'),
      btnCloseAuth: document.getElementById('btnCloseAuth'),
      btnCerrarCaja: document.getElementById('btnCerrarCaja'),
      statProducts: document.getElementById('statProducts'),
      statStock: document.getElementById('statStock'),
      statSales: document.getElementById('statSales'),
      summaryTotal: document.getElementById('summaryTotal'),
      summaryUnits: document.getElementById('summaryUnits'),
      summaryLow: document.getElementById('summaryLow'),
      summaryValue: document.getElementById('summaryValue'),
      kpiIngresos: document.getElementById('kpiIngresos'),
      kpiGastos: document.getElementById('kpiGastos'),
      kpiUtilidad: document.getElementById('kpiUtilidad'),
      kpiTransacciones: document.getElementById('kpiTransacciones'),
    };
  },

  bindEvents() {
    this.els.filtroBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.els.filtroBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.renderProductos(btn.dataset.category);
      });
    });
    this.els.stockSearch.addEventListener('input', () => this.renderStock());
    this.els.stockFilter.addEventListener('change', () => this.renderStock());
    window.addEventListener('scroll', () => {
      if (window.scrollY > 60) this.els.navbar.classList.add('scrolled');
      else this.els.navbar.classList.remove('scrolled');
    });
    this.els.btnRegistrarVenta.addEventListener('click', () => this.registrarVenta());
    this.els.btnRegistrarGasto.addEventListener('click', () => this.registrarGasto());
    this.els.btnCloseCart.addEventListener('click', () => this.closeCart());
    this.els.btnCheckout.addEventListener('click', () => this.checkout());
    this.els.btnCloseModal.addEventListener('click', () => this.closeModal());
    this.els.btnAddModal.addEventListener('click', () => this.addFromModal());
    this.els.btnCloseAuth.addEventListener('click', () => this.closeAuth());
    this.els.btnCerrarCaja.addEventListener('click', () => this.cerrarCaja());
    this.els.productModal.addEventListener('click', (e) => { if (e.target === this.els.productModal) this.closeModal(); });
    this.els.authModal.addEventListener('click', (e) => { if (e.target === this.els.authModal) this.closeAuth(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { this.closeModal(); this.closeCart(); this.closeAuth(); } });

    // Auto-calcular diferencia en cierre de caja
    const cierreInicial = document.getElementById('cierreInicial');
    const cierreFinal = document.getElementById('cierreFinal');
    const cierreVentas = document.getElementById('cierreVentas');
    const cierreDiferencia = document.getElementById('cierreDiferencia');

    const calcularDiferencia = () => {
      const inicial = parseFloat(cierreInicial.value) || 0;
      const final = parseFloat(cierreFinal.value) || 0;
      const ventas = parseFloat(cierreVentas.value) || 0;
      const diferencia = final - (inicial + ventas);
      cierreDiferencia.value = diferencia.toFixed(2);
      cierreDiferencia.style.color = diferencia >= 0 ? 'var(--verde)' : 'var(--rojo)';
    };

    cierreInicial.addEventListener('input', calcularDiferencia);
    cierreFinal.addEventListener('input', calcularDiferencia);
  },

  // ---------- Auth ----------
  updateAuthUI() {
    if (this.usuario) {
      this.els.authBtn.textContent = `👤 ${this.usuario.nombre}`;
      this.els.authBtn.onclick = () => this.logout();
    } else {
      this.els.authBtn.textContent = '👤 Iniciar Sesión';
      this.els.authBtn.onclick = () => this.toggleAuth();
    }
    this.checkProtectedSections();
  },

  toggleAuth() {
    if (this.usuario) { this.logout(); return; }
    this.els.authModal.classList.add('active');
  },
  closeAuth() { this.els.authModal.classList.remove('active'); },
  switchAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-panel').forEach(p => p.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById('auth-' + tab).classList.add('active');
  },

  login() {
    const user = document.getElementById('loginUser').value.trim();
    const pass = document.getElementById('loginPass').value.trim();
    if (!user || !pass) return alert('Ingresa usuario y contraseña');
    if (user === 'admin' && pass === '123456') {
      this.usuario = { nombre: 'Administrador', email: 'admin@sisabe.com', role: 'admin' };
      localStorage.setItem('sisabe_usuario', JSON.stringify(this.usuario));
      this.updateAuthUI();
      this.closeAuth();
      this.showToast('Sesión iniciada como Administrador');
    } else if (user && pass) {
      this.usuario = { nombre: user, email: user, role: 'cliente' };
      localStorage.setItem('sisabe_usuario', JSON.stringify(this.usuario));
      this.updateAuthUI();
      this.closeAuth();
      this.showToast('Sesión iniciada como Cliente');
    } else {
      alert('Credenciales inválidas. Prueba: admin / 123456');
    }
  },

  register() {
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const pass = document.getElementById('regPass').value.trim();
    if (!name || !email || !pass) return alert('Completa todos los campos');
    if (pass.length < 6) return alert('La contraseña debe tener al menos 6 caracteres');
    this.usuario = { nombre: name, email, role: 'cliente' };
    localStorage.setItem('sisabe_usuario', JSON.stringify(this.usuario));
    this.updateAuthUI();
    this.closeAuth();
    this.showToast('Cuenta creada exitosamente');
  },

  logout() {
    this.usuario = null;
    localStorage.removeItem('sisabe_usuario');
    this.updateAuthUI();
    this.showToast('Sesión cerrada');
  },

  checkProtectedSections() {
    const contSection = document.getElementById('contabilidad');
    if (!contSection) return;
    const existing = contSection.querySelector('.protected-overlay');
    if (existing) existing.remove();

    if (!this.usuario || this.usuario.role !== 'admin') {
      const overlay = document.createElement('div');
      overlay.className = 'protected-overlay';
      overlay.innerHTML = `
        <h2>🔒 Acceso Restringido</h2>
        <p>Esta sección es solo para administradores.</p>
        <button class="btn btn-primary" onclick="app.toggleAuth()">Iniciar Sesión como Admin</button>
      `;
      contSection.style.position = 'relative';
      contSection.appendChild(overlay);
    }
  },

  // ---------- Utilidades ----------
  fmtMoneda(n) { return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n); },
  fmtMl(n) { return n + ' ml'; },

  esEsencia(p) { return p.categoria === 'esencias' || p.unidad === 'ml'; },

  saveCarrito() { localStorage.setItem('sisabe_carrito', JSON.stringify(this.carrito)); this.renderCarrito(); },
  saveContabilidad() { localStorage.setItem('sisabe_contabilidad', JSON.stringify(this.contabilidad)); this.renderContabilidad(); this.renderStats(); },

  // ---------- Catálogo ----------
  renderProductos(categoria) {
    const grid = this.els.productsGrid; const empty = this.els.emptyState; grid.innerHTML = '';
    let filtrados = categoria === 'todos' ? this.productos : this.productos.filter(p => p.categoria === categoria);
    if (filtrados.length === 0) { empty.style.display = 'block'; return; }
    empty.style.display = 'none';
    filtrados.forEach(p => {
      const esEsencia = this.esEsencia(p);
      const stockClass = p.stock === 0 ? 'agotado' : p.stock <= p.stockMinimo ? 'bajo' : '';
      const stockTexto = esEsencia ? `${p.stock} ml` : (p.stock === 0 ? 'AGOTADO' : `Stock: ${p.stock}`);
      const precioTexto = esEsencia ? this.fmtMoneda(p.precio) + '/ml' : this.fmtMoneda(p.precio);
      const card = document.createElement('div'); card.className = 'product-card';
      card.innerHTML = `
        ${p.destacado ? '<span class="product-badge">DESTACADO</span>' : ''}
        <div class="product-image" style="cursor:pointer;" onclick="app.abrirModal(${p.id})">
          ${p.imagen ? `<img src="${p.imagen}" alt="${p.nombre}" loading="lazy">` : `<span class="product-image-placeholder">${p.emoji}</span>`}
        </div>
        <h3>${p.nombre}</h3><p>${p.descripcion}</p>
        <div class="product-meta">
          <span class="product-price">${precioTexto}</span>
          <span class="product-stock ${stockClass}">${stockTexto}</span>
        </div>
        <button class="btn-add-card" onclick="app.agregarCarrito(${p.id}, ${esEsencia ? 10 : 1})">${esEsencia ? 'Agregar ml' : 'Agregar al carrito'}</button>
      `; grid.appendChild(card);
    });
  },

  abrirModal(id) {
    const p = this.productos.find(x => x.id === id); if (!p) return;
    const esEsencia = this.esEsencia(p);
    const stockClass = p.stock === 0 ? 'agotado' : p.stock <= p.stockMinimo ? 'bajo' : '';
    document.getElementById('modalImage').innerHTML = p.imagen ? `<img src="${p.imagen}" alt="${p.nombre}">` : `<span class="product-image-placeholder" style="font-size:4rem;">${p.emoji}</span>`;
    document.getElementById('modalTitle').textContent = p.nombre;
    document.getElementById('modalCategory').textContent = p.categoria.toUpperCase();
    document.getElementById('modalDescription').textContent = p.descripcion;
    document.getElementById('modalPrice').textContent = esEsencia ? this.fmtMoneda(p.precio) + ' por ml' : this.fmtMoneda(p.precio);
    const elStock = document.getElementById('modalStock'); elStock.textContent = esEsencia ? `Stock: ${p.stock} ml` : `Stock: ${p.stock}`; elStock.className = 'modal-stock ' + stockClass;
    const qtyLabel = document.getElementById('modalQtyLabel');
    const qtyInput = document.getElementById('modalQty');
    if (esEsencia) {
      qtyLabel.textContent = 'Cantidad (ml)';
      qtyInput.value = 10;
      qtyInput.min = 1;
      qtyInput.max = p.stock;
      qtyInput.step = 1;
    } else {
      qtyLabel.textContent = 'Cantidad';
      qtyInput.value = 1;
      qtyInput.min = 1;
      qtyInput.max = Math.max(1, p.stock);
      qtyInput.step = 1;
    }
    this.els.productModal.classList.add('active'); this.els.btnAddModal.dataset.id = id;
  },
  closeModal() { this.els.productModal.classList.remove('active'); },
  addFromModal() { const id = parseInt(this.els.btnAddModal.dataset.id); const qty = parseInt(document.getElementById('modalQty').value) || 1; this.agregarCarrito(id, qty); this.closeModal(); },

  // ---------- Carrito ----------
  agregarCarrito(id, qty = 1) {
    const p = this.productos.find(x => x.id === id); if (!p) return;
    const esEsencia = this.esEsencia(p);
    if (p.stock <= 0) { alert('Producto agotado'); return; }
    if (qty > p.stock) { alert(esEsencia ? `Solo hay ${p.stock} ml disponibles` : `Solo hay ${p.stock} unidades disponibles`); qty = p.stock; }
    const existente = this.carrito.find(i => i.id === id);
    if (existente) { if (existente.qty + qty > p.stock) { alert(esEsencia ? `Máximo: ${p.stock} ml` : `Máximo: ${p.stock}`); return; } existente.qty += qty; }
    else this.carrito.push({ id, nombre: p.nombre, precio: p.precio, qty, emoji: p.emoji, esEsencia });
    this.saveCarrito(); this.abrirCarrito(); this.showToast(`${p.nombre} agregado al carrito`);
  },
  abrirCarrito() { this.els.cartSidebar.classList.add('open'); this.els.cartOverlay.classList.add('active'); },
  closeCart() { this.els.cartSidebar.classList.remove('open'); this.els.cartOverlay.classList.remove('active'); },

  renderCarrito() {
    const cont = this.els.cartItems; cont.innerHTML = ''; let subtotal = 0; let totalItems = 0;
    if (this.carrito.length === 0) { cont.innerHTML = '<p style="color:var(--gris); text-align:center; padding:2rem;">Tu carrito está vacío</p>'; }
    else {
      this.carrito.forEach((item, idx) => {
        subtotal += item.precio * item.qty; totalItems += item.qty;
        const p = this.productos.find(x => x.id === item.id); const stock = p ? p.stock : 0; const puedeMas = stock > item.qty;
        const qtyTexto = item.esEsencia ? `${item.qty} ml` : item.qty;
        cont.innerHTML += `<div class="cart-item"><div class="cart-item-img">${item.emoji}</div><div class="cart-item-info"><h4>${item.nombre}</h4><p class="cart-item-price">${this.fmtMoneda(item.precio)}${item.esEsencia ? '/ml' : ' c/u'}</p><div class="cart-item-qty"><button onclick="app.cambiarQty(${idx}, -1)">−</button><span>${qtyTexto}</span><button onclick="app.cambiarQty(${idx}, 1)" ${!puedeMas ? 'disabled' : ''}>+</button></div></div><div class="cart-item-remove" onclick="app.eliminarItem(${idx})" title="Eliminar">✕</div></div>`;
      });
    }
    this.els.cartCount.textContent = totalItems; this.els.cartSubtotal.textContent = this.fmtMoneda(subtotal); this.els.cartTotal.textContent = this.fmtMoneda(subtotal);
  },
  cambiarQty(idx, delta) {
    const item = this.carrito[idx]; const p = this.productos.find(x => x.id === item.id); const step = item.esEsencia ? 1 : 1; const nuevo = item.qty + delta * step;
    if (nuevo < 1) { this.eliminarItem(idx); return; }
    if (p && nuevo > p.stock) { alert(item.esEsencia ? `Solo hay ${p.stock} ml` : `Solo hay ${p.stock}`); return; }
    item.qty = nuevo; this.saveCarrito();
  },
  eliminarItem(idx) { this.carrito.splice(idx, 1); this.saveCarrito(); },

  checkout() {
    if (this.carrito.length === 0) return alert('Carrito vacío');
    let total = 0;
    const itemsVenta = [];
    for (const item of this.carrito) {
      const p = this.productos.find(x => x.id === item.id);
      if (!p || p.stock < item.qty) { alert(`Stock insuficiente: ${item.nombre}`); return; }
      p.stock -= item.qty;
      total += item.precio * item.qty;
      itemsVenta.push({ nombre: p.nombre, qty: item.qty, precio: item.precio, esEsencia: item.esEsencia });
    }
    this.contabilidad.ingresos += total;
    this.contabilidad.ventas.push({
      fecha: new Date().toLocaleString('es-MX'),
      items: itemsVenta,
      total,
      metodo: 'Efectivo',
    });
    this.saveContabilidad();
    this.carrito = [];
    this.saveCarrito();
    this.closeCart();
    this.renderProductos('todos');
    this.renderStock();
    alert(`¡Compra exitosa! Total: ${this.fmtMoneda(total)}`);
  },

  showToast(msg) { let toast = document.getElementById('sisabe-toast'); if (!toast) { toast = document.createElement('div'); toast.id = 'sisabe-toast'; Object.assign(toast.style, { position: 'fixed', bottom: '80px', right: '1.5rem', background: 'var(--azul)', color: 'var(--negro)', padding: '0.85rem 1.5rem', borderRadius: '10px', fontWeight: '700', zIndex: '4000', boxShadow: 'var(--sombra-azul)', transform: 'translateY(20px)', opacity: '0', transition: 'all 0.3s ease' }); document.body.appendChild(toast); } toast.textContent = msg; toast.style.transform = 'translateY(0)'; toast.style.opacity = '1'; setTimeout(() => { toast.style.transform = 'translateY(20px)'; toast.style.opacity = '0'; }, 2500); },

  // ---------- Stock ----------
  renderStock() {
    const term = this.els.stockSearch.value.toLowerCase(); const filtro = this.els.stockFilter.value;
    let lista = this.productos.filter(p => p.nombre.toLowerCase().includes(term));
    if (filtro === 'bajo') lista = lista.filter(p => p.stock > 0 && p.stock < p.stockMinimo);
    else if (filtro === 'disponible') lista = lista.filter(p => p.stock > 0);
    else if (filtro === 'agotado') lista = lista.filter(p => p.stock === 0);
    const tbody = this.els.stockBody; tbody.innerHTML = ''; let totalU = 0, bajo = 0, valor = 0;
    lista.forEach(p => {
      const esEsencia = this.esEsencia(p);
      const st = p.stock === 0 ? 'agotado' : p.stock < p.stockMinimo ? 'bajo' : 'ok';
      const estadoTexto = p.stock === 0 ? 'AGOTADO' : p.stock < p.stockMinimo ? 'BAJO' : 'OK';
      const stockTexto = esEsencia ? `${p.stock} ml` : p.stock;
      totalU += p.stock; if (p.stock > 0 && p.stock < p.stockMinimo) bajo++; valor += p.stock * p.precio;
      const tr = document.createElement('tr');
      tr.innerHTML = `<td><strong>${p.nombre}</strong></td><td>${p.categoria}</td><td><strong>${stockTexto}</strong></td><td>${esEsencia ? p.stockMinimo + ' ml' : p.stockMinimo}</td><td><span class="stock-badge stock-${st}">${estadoTexto}</span></td><td>${p.stock > 0 ? `<button class="btn-stock btn-restock" onclick="app.restock(${p.id})">+ Reabastecer</button>` : '—'}</td>`;
      tbody.appendChild(tr);
    });
    this.els.summaryTotal.textContent = lista.length; this.els.summaryUnits.textContent = totalU; this.els.summaryLow.textContent = bajo; this.els.summaryValue.textContent = this.fmtMoneda(valor);
  },
  restock(id) {
    const p = this.productos.find(x => x.id === id); if (!p) return;
    const esEsencia = this.esEsencia(p);
    const nueva = prompt(`Stock actual de ${p.nombre}: ${esEsencia ? p.stock + ' ml' : p.stock}\nNueva cantidad${esEsencia ? ' (ml)' : ''}:`, p.stock);
    if (nueva === null) return;
    const num = parseInt(nueva);
    if (isNaN(num) || num < 0) { alert('Cantidad inválida'); return; }
    p.stock = num; this.renderStock(); this.renderProductos('todos'); this.renderStats();
  },

  // ---------- Contabilidad ----------
  renderContabilidad() {
    const { ingresos, gastos, ventas, cierres } = this.contabilidad; const utilidad = ingresos - gastos;
    this.els.kpiIngresos.textContent = this.fmtMoneda(ingresos); this.els.kpiGastos.textContent = this.fmtMoneda(gastos); this.els.kpiUtilidad.textContent = this.fmtMoneda(utilidad); this.els.kpiTransacciones.textContent = ventas.length;

    // Actualizar campo de ventas en cierre de caja
    const cierreVentas = document.getElementById('cierreVentas');
    if (cierreVentas) {
      const hoy = new Date().toLocaleDateString('es-MX');
      const ventasHoy = ventas.filter(v => v.fecha.startsWith(hoy));
      const totalHoy = ventasHoy.reduce((a, v) => a + v.total, 0);
      cierreVentas.value = totalHoy.toFixed(2);
    }

    const hbody = this.els.historialBody; hbody.innerHTML = ''; [...ventas].reverse().slice(0, 10).forEach(v => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${v.fecha}</td><td>${v.items.length} productos</td><td>${v.items.reduce((a,i)=>a+i.qty,0)}</td><td><strong>${this.fmtMoneda(v.total)}</strong></td><td>${v.metodo}</td>`;
      hbody.appendChild(tr);
    });

    // Historial de cierres de caja
    const cierresBody = this.els.cierresBody;
    if (cierresBody) {
      cierresBody.innerHTML = '';
      [...cierres].reverse().slice(0, 10).forEach(c => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${c.fecha}</td><td>${this.fmtMoneda(c.inicial)}</td><td>${this.fmtMoneda(c.final)}</td><td>${this.fmtMoneda(c.ventas)}</td><td style="color:${c.diferencia >= 0 ? 'var(--verde)' : 'var(--rojo)'}"><strong>${this.fmtMoneda(c.diferencia)}</strong></td>`;
        cierresBody.appendChild(tr);
      });
    }

    this.els.ventaProducto.innerHTML = this.productos.filter(p => p.stock > 0).map(p => {
      const esEsencia = this.esEsencia(p);
      const stockTexto = esEsencia ? `${p.stock} ml` : `Stock: ${p.stock}`;
      return `<option value="${p.id}">${p.nombre} (${stockTexto})</option>`;
    }).join('');
  },
  renderStats() { this.els.statProducts.textContent = this.productos.length; this.els.statStock.textContent = this.productos.reduce((a,p)=>a+p.stock,0); this.els.statSales.textContent = this.fmtMoneda(this.contabilidad.ventas.reduce((a,v)=>a+v.total,0)); },

  registrarVenta() {
    if (!this.usuario) return alert('Debes iniciar sesión para registrar ventas');
    const id = parseInt(this.els.ventaProducto.value); const qty = parseInt(document.getElementById('ventaCantidad').value) || 1; const precio = parseFloat(document.getElementById('ventaPrecio').value) || 0; const metodo = document.getElementById('ventaMetodo').value;
    const p = this.productos.find(x => x.id === id); if (!p) return alert('Selecciona un producto'); if (qty > p.stock) return alert(this.esEsencia(p) ? `Solo hay ${p.stock} ml` : `Solo hay ${p.stock} unidades`); if (!precio || precio <= 0) return alert('Precio inválido');
    p.stock -= qty; const total = precio * qty; this.contabilidad.ingresos += total; this.contabilidad.ventas.push({ fecha: new Date().toLocaleString('es-MX'), items: [{ nombre: p.nombre, qty, precio, esEsencia: this.esEsencia(p) }], total, metodo });
    this.saveContabilidad(); this.renderStock(); this.renderProductos('todos'); document.getElementById('ventaCantidad').value = 1; document.getElementById('ventaPrecio').value = ''; alert(`Venta registrada: ${this.fmtMoneda(total)}`);
  },
  registrarGasto() {
    if (!this.usuario) return alert('Debes iniciar sesión para registrar gastos');
    const concepto = document.getElementById('gastoConcepto').value.trim(); const monto = parseFloat(document.getElementById('gastoMonto').value) || 0; if (!concepto) return alert('Ingresa concepto'); if (!monto || monto <= 0) return alert('Monto inválido'); this.contabilidad.gastos += monto; this.saveContabilidad(); document.getElementById('gastoConcepto').value = ''; document.getElementById('gastoMonto').value = ''; alert(`Gasto registrado: ${this.fmtMoneda(monto)}`);
  },

  cerrarCaja() {
    if (!this.usuario) return alert('Debes iniciar sesión para cerrar caja');
    const inicial = parseFloat(document.getElementById('cierreInicial').value) || 0;
    const final = parseFloat(document.getElementById('cierreFinal').value) || 0;
    const ventas = parseFloat(document.getElementById('cierreVentas').value) || 0;
    const diferencia = final - (inicial + ventas);

    const cierre = {
      fecha: new Date().toLocaleString('es-MX'),
      inicial,
      final,
      ventas,
      diferencia,
    };

    this.contabilidad.cierres.push(cierre);
    this.saveContabilidad();

    // Limpiar campos
    document.getElementById('cierreInicial').value = '';
    document.getElementById('cierreFinal').value = '';
    document.getElementById('cierreVentas').value = '';
    document.getElementById('cierreDiferencia').value = '';

    alert(`Cierre de caja registrado.\nDiferencia: ${this.fmtMoneda(diferencia)}\n${diferencia >= 0 ? '✅ Sobrante' : '⚠️ Faltante'}`);
  },

  // ---------- Three.js fondo 3D ----------
  initThreeJS() {
    const container = document.getElementById('canvas-container'); if (!container) return;
    const scene = new THREE.Scene(); scene.fog = new THREE.FogExp2(0x05070a, 0.15);
    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100); camera.position.set(0, 1, 6);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); renderer.setSize(window.innerWidth, window.innerHeight); renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.4); scene.add(ambient);
    const p1 = new THREE.PointLight(0x00f3ff, 2.5, 15); p1.position.set(4, 3, 4); scene.add(p1);
    const p2 = new THREE.PointLight(0xff00ff, 2, 15); p2.position.set(-4, -2, 4); scene.add(p2);

    const pcCount = 180; const pg = new THREE.BufferGeometry(); const pp = new Float32Array(pcCount * 3); const pc = new Float32Array(pcCount * 3); const ps = new Float32Array(pcCount);
    for (let i = 0; i < pcCount; i++) { pp[i*3] = (Math.random()-0.5)*18; pp[i*3+1] = (Math.random()-0.5)*14; pp[i*3+2] = (Math.random()-0.5)*12; pc[i*3] = 0; pc[i*3+1] = 1; pc[i*3+2] = 1; ps[i] = Math.random()*0.015 + 0.005; }
    pg.setAttribute('position', new THREE.BufferAttribute(pp, 3)); pg.setAttribute('color', new THREE.BufferAttribute(pc, 3));
    const pm = new THREE.PointsMaterial({ size: 0.07, vertexColors: true, transparent: true, opacity: 0.75 }); const particles = new THREE.Points(pg, pm); scene.add(particles);

    const anillos = []; for (let i = 0; i < 6; i++) { const ring = new THREE.RingGeometry(1 + i*0.7, 1.3 + i*0.7, 90); const mat = new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? 0x00f3ff : 0xff00ff, side: THREE.DoubleSide, transparent: true, opacity: 0.1 }); const mesh = new THREE.Mesh(ring, mat); mesh.rotation.x = Math.random()*Math.PI; mesh.rotation.y = Math.random()*Math.PI; scene.add(mesh); anillos.push({ mesh, rx: (Math.random()-0.5)*0.012, ry: (Math.random()-0.5)*0.012 }); }

    const cubos = []; const catData = [ {emoji:'💨', c:0x00f3ff, x:-4}, {emoji:'🧪', c:0x008cff, x:-1.5}, {emoji:'🍋', c:0xff00ff, x:1.5}, {emoji:'🧊', c:0x00f3ff, x:4} ];
    catData.forEach((d, i) => { const cv = new THREE.TextureLoader().load('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><text x="50%" y="50%" font-size="160" text-anchor="middle" dominant-baseline="central" fill="rgba(255,255,255,0.9)">' + d.emoji + '</text></svg>'); const cm = new THREE.SpriteMaterial({ map: cv, color: d.c, transparent: true, opacity: 0.9 }); const sprite = new THREE.Sprite(cm); sprite.position.set(d.x, (i%2===0?2:-2), 0); sprite.scale.set(1.6, 1.6, 1); scene.add(sprite); cubos.push({ obj: sprite, y: (i%2===0?2:-2), dy: (Math.random()*0.015+0.008) }); });

    let time = 0; const animate = () => { requestAnimationFrame(animate); time += 0.012;
      particles.rotation.y = time * 0.06; particles.rotation.x = Math.sin(time*0.2)*0.12;
      const pos = particles.geometry.attributes.position.array; for (let i = 1; i < pos.length; i += 3) { pos[i] += ps[(i/3)|0]; if (pos[i] > 7) pos[i] = -7; } particles.geometry.attributes.position.needsUpdate = true;
      anillos.forEach(a => { a.mesh.rotation.x += a.rx; a.mesh.rotation.y += a.ry; a.mesh.material.opacity = 0.06 + Math.sin(time + a.mesh.position.x)*0.05; });
      cubos.forEach(c => { c.obj.position.y = c.y + Math.sin(time + c.obj.position.x)*0.4; c.obj.material.opacity = 0.7 + Math.sin(time*2)*0.2; c.obj.scale.setScalar(1.4 + Math.sin(time*3)*0.15); });
      camera.position.x = Math.sin(time*0.12)*1.2; camera.position.y = Math.cos(time*0.1)*1; camera.lookAt(0,0,0);
      renderer.render(scene, camera); };
    animate();
    window.addEventListener('resize', () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); });
  },

  initAudio() { const btn = document.getElementById('audioBtn'); const audio = document.getElementById('ambientAudio'); let playing = false; btn.addEventListener('click', () => { if (!playing) { audio.play().catch(()=>{}); btn.textContent = '🔇'; playing = true; } else { audio.pause(); btn.textContent = '🔊'; playing = false; } }); },

  scrollToHome() { window.scrollTo({ top: 0, behavior: 'smooth' }); },
  scrollToCatalogo() { document.getElementById('catalogo').scrollIntoView({ behavior: 'smooth' }); },
  scrollToStock() { document.getElementById('stock').scrollIntoView({ behavior: 'smooth' }); },
};

window.app = app; document.addEventListener('DOMContentLoaded', () => app.init());