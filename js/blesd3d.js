// Cara de Blesd flotante y giratoria en 360° (Three.js)
// Arrastra con mouse o dedo para girarla en cualquier dirección.
(function () {
  const host = document.getElementById('blesd3d');
  const fallbackImg = document.getElementById('blesdImg');
  if (!host || typeof THREE === 'undefined') return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch (e) {
    return; // sin WebGL: se queda la imagen estática
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement;
  canvas.className = 'blesd-canvas';
  canvas.setAttribute('aria-label', 'Cara de Blesd. Arrastra para girarla');
  host.appendChild(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50);
  camera.position.z = 5;

  const SIZE = 2.3;       // tamaño de la cara en la escena
  const DEPTH = 0.16;     // grosor
  const LAYERS = 18;      // capas para dar volumen
  const group = new THREE.Group();
  scene.add(group);
  // Arranca ligeramente girada para que se note que es 3D
  group.rotation.set(-0.12, 0.45, 0);

  function resize() {
    const w = host.clientWidth || 320;
    renderer.setSize(w, w, false);
    camera.aspect = 1;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  new THREE.TextureLoader().load(
    fallbackImg ? fallbackImg.getAttribute('src') : 'assets/images/blesd-face.png',
    (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      const geo = new THREE.PlaneGeometry(SIZE, SIZE);

      for (let i = 0; i < LAYERS; i++) {
        const t = i / (LAYERS - 1);            // 0 = atrás, 1 = frente
        const z = (t - 0.5) * DEPTH;
        const isFront = i === LAYERS - 1;
        const isBack = i === 0;
        // Capas intermedias oscuras = canto con grosor
        const color = isFront || isBack ? 0xffffff : new THREE.Color(0x0a3550).lerp(new THREE.Color(0x00a6c8), t * 0.6);
        const mat = new THREE.MeshBasicMaterial({
          map: tex, color, alphaTest: 0.5, side: THREE.FrontSide,
        });
        const m = new THREE.Mesh(geo, mat);
        m.position.z = z;
        if (isBack) m.rotation.y = Math.PI; // la parte de atrás también muestra la cara bien orientada
        group.add(m);
      }
      if (fallbackImg) fallbackImg.style.display = 'none';
      host.classList.add('ready');
    }
  );

  // ---------- Interacción (giro libre 360°) ----------
  let dragging = false, lastX = 0, lastY = 0, lastT = 0, idleSince = 0;
  let vx = 0, vy = 0;                       // velocidad angular (rad/s)
  const IDLE_SPIN = reduceMotion ? 0 : 0.5; // giro lento cuando nadie la toca
  const qd = new THREE.Quaternion();
  const axis = new THREE.Vector3();

  function rotateBy(dx, dy) {
    axis.set(dy, dx, 0);
    const len = axis.length();
    if (!len) return;
    axis.normalize();
    qd.setFromAxisAngle(axis, len);
    group.quaternion.premultiply(qd);
  }

  canvas.addEventListener('pointerdown', (e) => {
    dragging = true;
    lastX = e.clientX; lastY = e.clientY; lastT = performance.now();
    vx = vy = 0;
    canvas.setPointerCapture(e.pointerId);
    host.classList.add('dragging');
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const now = performance.now();
    const dt = Math.max((now - lastT) / 1000, 0.001);
    const k = 0.012; // sensibilidad
    const dx = (e.clientX - lastX) * k;
    const dy = (e.clientY - lastY) * k;
    rotateBy(dx, dy);
    // velocidad suavizada para la inercia al soltar
    vx = vx * 0.6 + (dx / dt) * 0.4;
    vy = vy * 0.6 + (dy / dt) * 0.4;
    lastX = e.clientX; lastY = e.clientY; lastT = now;
  });
  function endDrag(e) {
    if (!dragging) return;
    dragging = false;
    idleSince = performance.now();
    host.classList.remove('dragging');
    try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
  }
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  // ---------- Loop ----------
  let visible = true, prev = performance.now();
  new IntersectionObserver((en) => { visible = en[0].isIntersecting; }).observe(host);

  function tick(now) {
    requestAnimationFrame(tick);
    if (!visible) { prev = now; return; }
    const dt = Math.min((now - prev) / 1000, 0.05);
    prev = now;

    if (!dragging) {
      // inercia: la velocidad se amortigua hacia el giro lento de reposo
      const calm = (now - idleSince) > 1500;
      const targetY = calm ? IDLE_SPIN : 0;
      const damp = 1 - Math.exp(-dt * 2.2);
      vx += (0 - vx) * damp;
      vy += (0 - vy) * damp;
      rotateBy(vx * dt, vy * dt);
      if (targetY) rotateBy(targetY * dt, 0);
    }

    // flotación suave arriba/abajo
    if (!reduceMotion) {
      const s = now / 1000;
      group.position.y = Math.sin(s * 1.4) * 0.09;
      group.position.x = Math.sin(s * 0.9) * 0.03;
    }
    renderer.render(scene, camera);
  }
  requestAnimationFrame(tick);
})();
