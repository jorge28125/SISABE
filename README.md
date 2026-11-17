# SISABE — Tienda Virtual (Vapers, Granizados, Micheladas y Cervezas)

Tienda virtual con **tema negro + azul eléctrico**, **efectos 3D** (Three.js), **catálogo didáctico**, **stock siempre visible** y **contabilidad integrada**.

## Estructura del proyecto

```
sisabe/
├── index.html                # Página principal
├── css/
│   └── style.css             # Estilos (negro/azul, 3D, glassmorphism, animaciones)
├── js/
│   ├── products.js           # Datos del catálogo (16 productos)
│   └── app.js                # Lógica: carrito, stock, contabilidad, Three.js
└── assets/
    ├── images/
    │   ├── blesd-face.png     # ← Cara de Blesd (PNG transparente, se muestra en 3D)
    │   └── README.txt
    └── audio/
        └── README.txt        # ← ambient.mp3 opcional (música de fondo)
```

## Cómo usarlo

1. Abre la carpeta `sisabe` en tu computadora.
2. Haz doble clic en `index.html` para ver la tienda en tu navegador.
3. No necesita servidor ni base de datos: todo se guarda en el navegador (`localStorage`).

## Funcionalidades incluidas

- **Inicio (Hero)**: Fondo 3D animado con Three.js, partículas y anillos rotativos. Cara de Blesd con efecto flotante. Estadísticas en tiempo real (productos, stock, ventas).
- **Catálogo didáctico**: 4 categorías (Vapers, Granizados, Micheladas, Cervezas) con filtros, descripción, precio y stock visible en cada tarjeta.
- **Stock siempre visible**: Tabla de inventario con buscador, filtro por estado (bajo/disponible/agotado), resumen de unidades y valor estimado. Botón para reabastecer productos.
- **Contabilidad**: Registrar ventas y gastos, ver ingresos/gastos/utilidad, historial de transacciones y margen de ganancia.
- **Carrito lateral**: Agregar productos, modificar cantidades, eliminar, finalizar compra (descuenta stock y registra venta automáticamente).
- **Persistencia**: Carrito y contabilidad se guardan en el navegador al recargar la página.

## Personalización

### Foto de Blesd
Reemplaza `assets/images/blesd.jpg` con una foto real del cantante. Se muestra en el inicio con efecto de brillo y flotación.

### Imágenes de productos
En `js/products.js` cada producto tiene la propiedad `imagen: null`. Sube fotos a `assets/images/productos/` y pon la ruta, por ejemplo:
```js
imagen: 'assets/images/productos/vaper-menta.jpg',
```

### Colores
Edita `css/style.css` en la sección `:root` para cambiar el azul (`--azul`) u otros tonos.

### Moneda
En `js/app.js`, función `fmtMoneda`, cambia `currency: 'MXN'` por tu moneda local (ej. `'USD'`, `'COP'`, `'ARS'`).

## Créditos

Negocio: **SISABE** — Vapers • Granizados • Micheladas • Cervezas  
Artista invitado: **BLESD**

¡Hecho para ser el mejor de todos! ⚡
## Panel de administración
- Entra en `tusitio.com/#admin` (o con el enlace "Admin" del pie de página).
- **La primera vez en un dispositivo** pide crear tu usuario y contraseña. Después hay que escribir los dos para entrar.
- Pestañas: **Caja** (registrar ventas), **Stock**, **Contabilidad**, **Resumen** y **Cuenta** (agregar usuarios, cambiar contraseña).
- **Caja:** toca los productos que vendiste, elige cómo pagó el cliente (Efectivo, Nequi, Daviplata, Transferencia, Tarjeta) y pulsa **Cobrar**. Resta el stock y suma la venta a Contabilidad. Hay botón para **deshacer la última venta**.
- Los usuarios, el stock y las ventas se guardan **solo en el dispositivo y navegador donde se usan**; no se comparten entre dispositivos. Usa siempre el mismo para llevar las cuentas.
- **Olvidé la contraseña:** abre el sitio, pulsa F12 → Console y ejecuta `localStorage.removeItem('sisabe_admin_users')`. Borra solo los usuarios (no las ventas) y al entrar a `#admin` te deja crear uno nuevo.
- **Precios de los productos:** se cambian en `js/products.js` (los que hay son de ejemplo). En la Caja también puedes ajustar el precio de una venta puntual.
- Los clientes piden por WhatsApp (botón en cada producto); ya no hay carrito.
