/* =========================================
   SISABE — Aplicación principal
   ========================================= */
import { PRODUCTOS } from './products.js';

const app = {
  // Estado
  productos: JSON.parse(JSON.stringify(PRODUCTOS)),
  carrito: JSON.parse(localStorage.getItem('sisabe_carrito')) || [],
  contabilidad: JSON.parse(localStorage.getItem('sisabe_contabilidad')) || {
    ingresos: 0,
    gastos: 0,
    ventas: [],
  },

  els: {},

  init() {
    this.cacheDOM();
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
      navbar: document.getElementById('navbar'),
      themeToggle: document.getElementById('themeToggle'),
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

  // ---------- Eventos ----------
  bindEvents() {
    // Filtros categoría
    this.els.filtroBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.els.filtroBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.renderProductos(btn.dataset.category);
      });
    });

    // Stock search/filter
    this.els.stockSearch.addEventListener('input', () => this.renderStock());
    this.els.stockFilter.addEventListener('change', () => this.renderStock());

    // Navbar scroll
    window.addEventListener('scroll', () => {
      if (window.scrollY > 60) this.els.navbar.classList.add('scrolled');
      else this.els.navbar.classList.remove('scrolled');
    });

    // Registro venta
    this.els.btnRegistrarVenta.addEventListener('click', () => this.registrarVenta());
    // Registro gasto
    this.els.btnRegistrarGasto.addEventListener('click', () => this.registrarGasto());

    // Carrito
    this.els.btnCloseCart.addEventListener('click', () => this.closeCart());
    this.els.btnCheckout.addEventListener('click', () => this.checkout());

    // Modal producto
    this.els.btnCloseModal.addEventListener('click', () => this.closeModal());
    this.els.btnAddModal.addEventListener('click', () => this.addFromModal());

    // Cerrar modal/clic fuera
    this.els.productModal.addEventListener('click', (e) => {
      if (e.target === this.els.productModal) this.closeModal();
    });

    // Tecla ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { this.closeModal(); this.closeCart(); }
    });
  },

  // ---------- Utilidades ----------
  fmtMoneda(n) {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);
  },

  saveCarrito() {
    localStorage.setItem('sisabe_carrito', JSON.stringify(this.carrito));
    this.renderCarrito();
  },

  saveContabilidad() {
    localStorage.setItem('sisabe_contabilidad', JSON.stringify(this.contabilidad));
    this.renderContabilidad();
    this.renderStats();
  },

  // ---------- Catálogo ----------
  renderProductos(categoria) {
    const grid = this.els.productsGrid;
    const empty = this.els.emptyState;
    grid.innerHTML = '';

    let filtrados = this.productos;
    if (categoria !== 'todos') {
      filtrados = this.productos.filter(p => p.categoria === categoria);
    }

    if (filtrados.length === 0) {
      empty.style.display = 'block';
      return;
    }
    empty.style.display = 'none';

    filtrados.forEach(p => {
      const stockClass = p.stock === 0 ? 'agotado' : p.stock <= p.stockMinimo ? 'bajo' : '';
      const card = document.createElement('div');
      card.className = 'product-card';
      card.innerHTML = `
        ${p.destacado ? '<span class="product-badge">DESTACADO</span>' : ''}
        <div class="product-image" style="cursor:pointer;" onclick="app.abrirModal(${p.id})">
          ${p.imagen ? `<img src="${p.imagen}" alt="${p.nombre}" loading="lazy">` : `<span class="product-image-placeholder">${p.emoji}</span>`}
        </div>
        <h3>${p.nombre}</h3>
        <p>${p.descripcion}</p>
        <div class="product-meta">
          <span class="product-price">${this.fmtMoneda(p.precio)}</span>
          <span class="product-stock ${stockClass}">
            ${p.stock === 0 ? 'AGOTADO' : `Stock: ${p.stock}`}
          </span>
        </div>
        <button class="btn-add-card" onclick="app.agregarCarrito(${p.id}, 1)">Agregar al carrito</button>
      `;
      grid.appendChild(card);
    });
  },

  abrirModal(id) {
    const p = this.productos.find(x => x.id === id);
    if (!p) return;

    const stockClass = p.stock === 0 ? 'agotado' : p.stock <= p.stockMinimo ? 'bajo' : '';

    document.getElementById('modalImage').innerHTML = p.imagen
      ? `<img src="${p.imagen}" alt="${p.nombre}">`
      : `<span class="product-image-placeholder" style="font-size:4rem;">${p.emoji}</span>`;
    document.getElementById('modalTitle').textContent = p.nombre;
    document.getElementById('modalCategory').textContent = p.categoria.toUpperCase();
    document.getElementById('modalDescription').textContent = p.descripcion;
    document.getElementById('modalPrice').textContent = this.fmtMoneda(p.precio);
    const elStock = document.getElementById('modalStock');
    elStock.textContent = `Stock: ${p.stock}`;
    elStock.className = 'modal-stock ' + stockClass;

    document.getElementById('modalQty').value = 1;
    document.getElementById('modalQty').max = Math.max(1, p.stock);

    this.els.productModal.classList.add('active');
    this.els.btnAddModal.dataset.id = id;
  },

  closeModal() {
    this.els.productModal.classList.remove('active');
  },

  addFromModal() {
    const id = parseInt(this.els.btnAddModal.dataset.id);
    const qty = parseInt(document.getElementById('modalQty').value) || 1;
    this.agregarCarrito(id, qty);
    this.closeModal();
  },

  // ---------- Carrito ----------
  agregarCarrito(id, qty = 1) {
    const p = this.productos.find(x => x.id === id);
    if (!p) return;
    if (p.stock <= 0) {
      alert('Producto agotado');
      return;
    }
    if (qty > p.stock) {
      alert(`Solo hay ${p.stock} unidades disponibles`);
      qty = p.stock;
    }

    const existente = this.carrito.find(i => i.id === id);
    if (existente) {
      const nuevoTotal = existente.qty + qty;
      if (nuevoTotal > p.stock) {
        alert(`Máximo disponible: ${p.stock}`);
        return;
      }
      existente.qty = nuevoTotal;
    } else {
      this.carrito.push({ id, nombre: p.nombre, precio: p.precio, qty, emoji: p.emoji });
    }

    this.saveCarrito();
    this.abrirCarrito();
    this.showToast(`${p.nombre} agregado al carrito`);
  },

  abrirCarrito() {
    this.els.cartSidebar.classList.add('open');
    this.els.cartOverlay.classList.add('active');
  },

  closeCart() {
    this.els.cartSidebar.classList.remove('open');
    this.els.cartOverlay.classList.remove('active');
  },

  renderCarrito() {
    const cont = this.els.cartItems;
    cont.innerHTML = '';
    let subtotal = 0;
    let totalItems = 0;

    if (this.carrito.length === 0) {
      cont.innerHTML = '<p style="color:var(--gris); text-align:center; padding:2rem;">Tu carrito está vacío</p>';
    } else {
      this.carrito.forEach((item, idx) => {
        subtotal += item.precio * item.qty;
        totalItems += item.qty;
        const p = this.productos.find(x => x.id === item.id);
        const stock = p ? p.stock : 0;
        const puedeMas = stock > item.qty;
        cont.innerHTML += `
          <div class="cart-item">
            <div class="cart-item-img">${item.emoji}</div>
            <div class="cart-item-info">
              <h4>${item.nombre}</h4>
              <p class="cart-item-price">${this.fmtMoneda(item.precio)} c/u</p>
              <div class="cart-item-qty">
                <button onclick="app.cambiarQty(${idx}, -1)">−</button>
                <span>${item.qty}</span>
                <button onclick="app.cambiarQty(${idx}, 1)" ${!puedeMas ? 'disabled' : ''}>+</button>
              </div>
            </div>
            <div class="cart-item-remove" onclick="app.eliminarItem(${idx})" title="Eliminar">✕</div>
          </div>
        `;
      });
    }

    this.els.cartCount.textContent = totalItems;
    this.els.cartSubtotal.textContent = this.fmtMoneda(subtotal);
    this.els.cartTotal.textContent = this.fmtMoneda(subtotal);
  },

  cambiarQty(idx, delta) {
    const item = this.carrito[idx];
    const p = this.productos.find(x => x.id === item.id);
    const nuevo = item.qty + delta;
    if (nuevo < 1) {
      this.eliminarItem(idx);
      return;
    }
    if (p && nuevo > p.stock) {
      alert(`Solo hay ${p.stock} unidades`);
      return;
    }
    item.qty = nuevo;
    this.saveCarrito();
  },

  eliminarItem(idx) {
    this.carrito.splice(idx, 1);
    this.saveCarrito();
  },

  checkout() {
    if (this.carrito.length === 0) return alert('Carrito vacío');
    let total = 0;
    const itemsVenta = [];
    for (const item of this.carrito) {
      const p = this.productos.find(x => x.id === item.id);
      if (!p || p.stock < item.qty) {
        alert(`Stock insuficiente para ${item.nombre}`);
        return;
      }
      p.stock -= item.qty;
      total += item.precio * item.qty;
      itemsVenta.push({ nombre: p.nombre, qty: item.qty, precio: item.precio });
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

  showToast(msg) {
    let toast = document.getElementById('sisabe-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'sisabe-toast';
      Object.assign(toast.style, {
        position: 'fixed', bottom: '80px', right: '1.5rem',
        background: 'var(--azul)', color: 'var(--negro)', padding: '0.85rem 1.5rem',
        borderRadius: '10px', fontWeight: '700', zIndex: '4000',
        boxShadow: 'var(--sombra-azul)', transform: 'translateY(20px)', opacity: '0',
        transition: 'all 0.3s ease',
      });
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.transform = 'translateY(0)';
    toast.style.opacity = '1';
    setTimeout(() => {
      toast.style.transform = 'translateY(20px)';
      toast.style.opacity = '0';
    }, 2500);
  },

  // ---------- Stock ----------
  renderStock() {
    const term = this.els.stockSearch.value.toLowerCase();
    const filtro = this.els.stockFilter.value;

    let lista = this.productos.filter(p => p.nombre.toLowerCase().includes(term));

    if (filtro === 'bajo') lista = lista.filter(p => p.stock > 0 && p.stock < p.stockMinimo);
    else if (filtro === 'disponible') lista = lista.filter(p => p.stock > 0);
    else if (filtro === 'agotado') lista = lista.filter(p => p.stock === 0);

    const tbody = this.els.stockBody;
    tbody.innerHTML = '';

    let totalU = 0, bajo = 0, valor = 0;

    lista.forEach(p => {
      const st = p.stock === 0 ? 'agotado' : p.stock < p.stockMinimo ? 'bajo' : 'ok';
      const estadoTexto = p.stock === 0 ? 'AGOTADO' : p.stock < p.stockMinimo ? 'BAJO' : 'OK';
      totalU += p.stock;
      if (p.stock > 0 && p.stock < p.stockMinimo) bajo++;
      valor += p.stock * p.precio;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${p.nombre}</strong></td>
        <td>${p.categoria}</td>
        <td><strong>${p.stock}</strong></td>
        <td>${p.stockMinimo}</td>
        <td><span class="stock-badge stock-${st}">${estadoTexto}</span></td>
        <td>
          ${p.stock > 0 ? `<button class="btn-stock btn-restock" onclick="app.restock(${p.id})">+ Reabastecer</button>` : '—'}
        </td>
      `;
      tbody.appendChild(tr);
    });

    this.els.summaryTotal.textContent = lista.length;
    this.els.summaryUnits.textContent = totalU;
    this.els.summaryLow.textContent = bajo;
    this.els.summaryValue.textContent = this.fmtMoneda(valor);
  },

  restock(id) {
    const p = this.productos.find(x => x.id === id);
    if (!p) return;
    const nueva = prompt(`Stock actual de ${p.nombre}: ${p.stock}\nNueva cantidad:`, p.stock);
    if (nueva === null) return;
    const num = parseInt(nueva);
    if (isNaN(num) || num < 0) { alert('Cantidad inválida'); return; }
    p.stock = num;
    this.renderStock();
    this.renderProductos('todos');
    this.renderStats();
  },

  // ---------- Contabilidad ----------
  renderContabilidad() {
    const { ingresos, gastos, ventas } = this.contabilidad;
    const utilidad = ingresos - gastos;
    const margen = ingresos > 0 ? ((utilidad / ingresos) * 100).toFixed(1) : 0;

    this.els.kpiIngresos.textContent = this.fmtMoneda(ingresos);
    this.els.kpiGastos.textContent = this.fmtMoneda(gastos);
    this.els.kpiUtilidad.textContent = this.fmtMoneda(utilidad);
    this.els.kpiTransacciones.textContent = ventas.length;

    const hoy = new Date().toLocaleDateString('es-MX');
    const ventasHoy = ventas.filter(v => v.fecha.startsWith(hoy));
    const totalHoy = ventasHoy.reduce((a, v) => a + v.total, 0);

    const hbody = this.els.historialBody;
    hbody.innerHTML = '';
    const recientes = [...ventas].reverse().slice(0, 10);
    recientes.forEach(v => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${v.fecha}</td>
        <td>${v.items.length} productos</td>
        <td>${v.items.reduce((a,i)=>a+i.qty,0)}</td>
        <td><strong>${this.fmtMoneda(v.total)}</strong></td>
        <td>${v.metodo}</td>
      `;
      hbody.appendChild(tr);
    });

    this.els.ventaProducto.innerHTML = this.productos
      .filter(p => p.stock > 0)
      .map(p => `<option value="${p.id}">${p.nombre} (Stock: ${p.stock})</option>`).join('');
  },

  renderStats() {
    const totalProd = this.productos.length;
    const totalUnits = this.productos.reduce((a,p)=>a+p.stock,0);
    const ventasTotales = this.contabilidad.ventas.reduce((a,v)=>a+v.total,0);

    this.els.statProducts.textContent = totalProd;
    this.els.statStock.textContent = totalUnits;
    this.els.statSales.textContent = this.fmtMoneda(ventasTotales);
  },

  registrarVenta() {
    const id = parseInt(this.els.ventaProducto.value);
    const qty = parseInt(document.getElementById('ventaCantidad').value) || 1;
    const precio = parseFloat(document.getElementById('ventaPrecio').value) || 0;
    const metodo = document.getElementById('ventaMetodo').value;

    const p = this.productos.find(x => x.id === id);
    if (!p) return alert('Selecciona un producto');
    if (qty > p.stock) return alert(`Solo hay ${p.stock} unidades`);
    if (!precio || precio <= 0) return alert('Ingresa un precio válido');

    p.stock -= qty;
    const total = precio * qty;

    this.contabilidad.ingresos += total;
    this.contabilidad.ventas.push({
      fecha: new Date().toLocaleString('es-MX'),
      items: [{ nombre: p.nombre, qty, precio }],
      total,
      metodo,
    });

    this.saveContabilidad();
    this.renderStock();
    this.renderProductos('todos');

    document.getElementById('ventaCantidad').value = 1;
    document.getElementById('ventaPrecio').value = '';
    alert(`Venta registrada: ${this.fmtMoneda(total)}`);
  },

  registrarGasto() {
    const concepto = document.getElementById('gastoConcepto').value.trim();
    const monto = parseFloat(document.getElementById('gastoMonto').value) || 0;
    const categoria = document.getElementById('gastoCategoria').value;

    if (!concepto) return alert('Ingresa un concepto');
    if (!monto || monto <= 0) return alert('Monto inválido');

    this.contabilidad.gastos += monto;
    this.saveContabilidad();

    document.getElementById('gastoConcepto').value = '';
    document.getElementById('gastoMonto').value = '';
    alert(`Gasto registrado: ${this.fmtMoneda(monto)}`);
  },

  // ---------- Three.js fondo 3D ----------
  initThreeJS() {
    const container = document.getElementById('canvas-container');
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 6;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Luces
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambient);
    const point1 = new THREE.PointLight(0x00f3ff, 2, 12);
    point1.position.set(3, 3, 4);
    scene.add(point1);
    const point2 = new THREE.PointLight(0xff00ff, 1.5, 12);
    point2.position.set(-3, -2, 4);
    scene.add(point2);

    // Partículas flotantes tipo estrellas cibernéticas
    const particleCount = 140;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(particleCount * 3);
    const col = new Float32Array(particleCount * 3);
    const speed = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      pos[i*3] = (Math.random()-0.5)*14;
      pos[i*3+1] = (Math.random()-0.5)*14;
      pos[i*3+2] = (Math.random()-0.5)*10;
      col[i*3] = 0;
      col[i*3+1] = 1;
      col[i*3+2] = 1;
      speed[i] = (Math.random() * 0.02) + 0.005;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const mat = new THREE.PointsMaterial({ size: 0.07, vertexColors: true, transparent: true, opacity: 0.7 });
    const particles = new THREE.Points(geo, mat);
    scene.add(particles);

    // Anillos rotatorios decorativos
    const anillos = [];
    for (let i = 0; i < 5; i++) {
      const ring = new THREE.RingGeometry(1 + i*0.8, 1.3 + i*0.8, 80);
      const ringMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0x00f3ff : 0xff00ff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.12,
      });
      const mesh = new THREE.Mesh(ring, ringMat);
      mesh.rotation.x = Math.random() * Math.PI;
      mesh.rotation.y = Math.random() * Math.PI;
      scene.add(mesh);
      anillos.push({ mesh, rx: (Math.random()-0.5)*0.015, ry: (Math.random()-0.5)*0.015 });
    }

    let time = 0;
    const animate = () => {
      requestAnimationFrame(animate);
      time += 0.01;

      particles.rotation.y = time * 0.08;
      particles.rotation.x = Math.sin(time * 0.2) * 0.15;
      // mover partículas hacia arriba en bucle
      const positions = particles.geometry.attributes.position.array;
      for (let i = 1; i < positions.length; i += 3) {
        positions[i] += speed[(i/3)|0];
        if (positions[i] > 7) positions[i] = -7;
      }
      particles.geometry.attributes.position.needsUpdate = true;

      anillos.forEach(a => {
        a.mesh.rotation.x += a.rx;
        a.mesh.rotation.y += a.ry;
        a.mesh.material.opacity = 0.08 + Math.sin(time) * 0.06;
      });

      camera.position.x = Math.sin(time * 0.15) * 0.8;
      camera.position.y = Math.cos(time * 0.12) * 0.8;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };
    animate();

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  },

  initAudio() {
    const btn = document.getElementById('audioBtn');
    const audio = document.getElementById('ambientAudio');
    let playing = false;
    btn.addEventListener('click', () => {
      if (!playing) {
        audio.play().catch(() => {});
        btn.textContent = '🔇';
        playing = true;
      } else {
        audio.pause();
        btn.textContent = '🔊';
        playing = false;
      }
    });
  },

  // ---------- Navegación ----------
  scrollToHome() { window.scrollTo({ top: 0, behavior: 'smooth' }); },
  scrollToCatalogo() { document.getElementById('catalogo').scrollIntoView({ behavior: 'smooth' }); },
  scrollToStock() { document.getElementById('stock').scrollIntoView({ behavior: 'smooth' }); },
};

// Iniciar
window.app = app;
document.addEventListener('DOMContentLoaded', () => app.init());