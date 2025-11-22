// Script para generar iconos PWA de diferentes tamaños
// Ejecutar con: node scripts/generate-pwa-icons.js

const fs = require('fs');
const path = require('path');

// Tamaños de iconos necesarios para PWA
const iconSizes = [
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' }
];

console.log('Para generar iconos PWA de diferentes tamaños:');
console.log('1. Usa una herramienta como https://realfavicongenerator.net/');
console.log('2. O usa ImageMagick con el siguiente comando:');
console.log('');

iconSizes.forEach(icon => {
  console.log(`convert CrediNica-inicial.png -resize ${icon.size}x${icon.size} ${icon.name}`);
});

console.log('');
console.log('Luego coloca todos los archivos en la carpeta public/');