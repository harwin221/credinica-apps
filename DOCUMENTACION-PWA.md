# 📱 Documentación PWA - CrediNica

## 🎯 ¿Qué es el PWA de CrediNica?

CrediNica funciona como una **Progressive Web App (PWA)**, lo que significa que puede instalarse en dispositivos móviles y de escritorio como si fuera una aplicación nativa, pero sin necesidad de descargarla desde una tienda de aplicaciones.

## 🔧 Componentes del PWA

### 1. **Manifest (`public/manifest.json`)**

Define cómo se ve y comporta la app cuando se instala:

```json
{
  "name": "CrediNica - Sistema de Gestión de Créditos",
  "short_name": "CrediNica",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#1f2937",
  "background_color": "#1f2937",
  "icons": [...]
}
```

**Características configuradas:**
- ✅ Nombre completo y corto
- ✅ Icono de la app (`/CrediNica-inicial.png`)
- ✅ Modo standalone (se ve como app nativa)
- ✅ Colores de tema (gris oscuro `#1f2937`)
- ✅ Idioma español de Nicaragua (`es-NI`)
- ✅ Categorías: finanzas, negocios, productividad

### 2. **Service Worker (`public/sw.js`)**

Maneja el cache y funcionalidad offline:

#### **Estrategias de Cache:**

1. **Cache First** - Para assets estáticos:
   - `/` (página principal)
   - `/login`
   - `/dashboard`
   - `/manifest.json`
   - Imágenes

2. **Network First** - Para APIs:
   - `/api/me`
   - `/api/credits`
   - `/api/clients`
   - Otras rutas de API

3. **Cache Fallback** - Si no hay red:
   - Intenta red primero
   - Si falla, usa cache
   - Guarda respuestas exitosas en cache

#### **Versiones de Cache:**
```javascript
const STATIC_CACHE = 'credinica-static-v2';
const DYNAMIC_CACHE = 'credinica-dynamic-v2';
```

### 3. **Registro del Service Worker (`src/app/layout.tsx`)**

Se registra automáticamente al cargar la página:

```javascript
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => console.log('SW registered'))
      .catch(error => console.log('SW registration failed'));
  });
}
```

## 📦 Dependencia PWA

```json
"@ducanh2912/next-pwa": "^10.2.7"
```

**Nota:** Aunque está instalada, actualmente NO se está usando en `next.config.js`. El PWA funciona con el service worker manual en `public/sw.js`.

## 🚀 Cómo Funciona

### Instalación en Dispositivos:

#### **En Android (Chrome/Edge):**
1. Abre la app en el navegador
2. Aparece banner "Agregar a pantalla de inicio"
3. O menú → "Instalar aplicación"
4. La app se instala como aplicación nativa

#### **En iOS (Safari):**
1. Abre la app en Safari
2. Toca el botón "Compartir" (cuadro con flecha)
3. Selecciona "Agregar a pantalla de inicio"
4. La app aparece como icono en el home

#### **En Windows/Mac (Chrome/Edge):**
1. Abre la app en el navegador
2. Icono de instalación en la barra de direcciones
3. O menú → "Instalar CrediNica"
4. Se instala como aplicación de escritorio

### Funcionalidad Offline:

1. **Primera visita (online):**
   - Descarga y cachea assets estáticos
   - Registra el service worker

2. **Visitas posteriores (offline):**
   - Páginas cacheadas funcionan sin internet
   - APIs intentan red primero, luego cache
   - Datos recientes disponibles offline

3. **Sincronización:**
   - Al recuperar conexión, actualiza datos
   - Cache se actualiza automáticamente

## 📊 Estado Actual del PWA

### ✅ Funcionando:
- Manifest configurado correctamente
- Service worker registrado
- Cache de assets estáticos
- Cache de APIs con fallback
- Instalable en todos los dispositivos
- Modo standalone (sin barra del navegador)
- Iconos y colores configurados

### ⚠️ Limitaciones Actuales:
- No hay botón de instalación personalizado en la UI
- No hay indicador de estado offline/online
- No hay sincronización en background
- No hay notificaciones push
- Cache manual (no usa next-pwa automático)

### 🔄 Posibles Mejoras:

1. **Activar next-pwa en `next.config.js`:**
```javascript
const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

module.exports = withPWA(nextConfig);
```

2. **Agregar botón de instalación:**
```typescript
// Componente InstallPWA
const [deferredPrompt, setDeferredPrompt] = useState(null);

useEffect(() => {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    setDeferredPrompt(e);
  });
}, []);

const handleInstall = () => {
  deferredPrompt?.prompt();
};
```

3. **Indicador de estado de red:**
```typescript
const [isOnline, setIsOnline] = useState(true);

useEffect(() => {
  setIsOnline(navigator.onLine);
  window.addEventListener('online', () => setIsOnline(true));
  window.addEventListener('offline', () => setIsOnline(false));
}, []);
```

4. **Notificaciones Push:**
```typescript
// Solicitar permiso
Notification.requestPermission();

// Enviar notificación
new Notification('Pago recibido', {
  body: 'Cliente Juan Pérez - C$500',
  icon: '/CrediNica-inicial.png'
});
```

## 🧪 Cómo Probar el PWA

### En Desarrollo:
```bash
npm run build
npm start
```
Luego abre `http://localhost:3000` y prueba instalar.

### En Producción:
1. Despliega la app
2. Accede desde HTTPS (requerido para PWA)
3. Prueba instalación en diferentes dispositivos

### Verificar Service Worker:
1. Abre DevTools (F12)
2. Ve a "Application" → "Service Workers"
3. Verifica que `sw.js` esté registrado y activo
4. Revisa "Cache Storage" para ver archivos cacheados

## 📝 Archivos Clave

```
public/
├── manifest.json          # Configuración del PWA
├── sw.js                  # Service Worker (cache y offline)
├── CrediNica-inicial.png  # Icono de la app
└── CrediNica.png          # Icono alternativo

src/app/
└── layout.tsx             # Registra el service worker

package.json               # Incluye @ducanh2912/next-pwa
next.config.js             # Configuración de Next.js (sin PWA activo)
```

## 🔒 Requisitos para PWA

Para que funcione correctamente:

1. ✅ **HTTPS** - Requerido en producción
2. ✅ **Manifest válido** - Ya configurado
3. ✅ **Service Worker** - Ya registrado
4. ✅ **Iconos** - Mínimo 192x192 y 512x512
5. ✅ **start_url** - Configurado como `/`
6. ✅ **display: standalone** - Configurado

## 🎨 Personalización

### Cambiar Colores:
Edita `public/manifest.json`:
```json
{
  "theme_color": "#tu-color",
  "background_color": "#tu-color"
}
```

### Cambiar Icono:
1. Reemplaza `public/CrediNica-inicial.png`
2. Tamaños recomendados: 192x192, 512x512
3. Formato: PNG con fondo

### Cambiar Nombre:
Edita `public/manifest.json`:
```json
{
  "name": "Tu Nombre Completo",
  "short_name": "Nombre Corto"
}
```

## 🐛 Troubleshooting

### El PWA no se instala:
- Verifica que estés en HTTPS
- Revisa que manifest.json sea válido
- Confirma que service worker esté registrado

### Cache no funciona:
- Limpia cache del navegador
- Desregistra service worker
- Recarga la página

### Cambios no se reflejan:
- Incrementa versión del cache en `sw.js`
- Limpia cache del navegador
- Haz hard refresh (Ctrl+Shift+R)

---

**Última actualización:** Noviembre 2025
**Versión PWA:** 2.0
