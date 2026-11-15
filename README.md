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
    │   ├── blesd.jpg         # ← AQUÍ pones la foto del cantante Blesd
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