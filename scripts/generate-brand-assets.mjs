/*
 * Genera las versiones del logo, el favicon y la imagen Open Graph a partir del
 * logo original. Uso: node scripts/generate-brand-assets.mjs
 */
import { writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const SOURCE = 'src/assets/brand/valtec-logo-original.jpg';
const OUT = 'src/assets/brand/';

/** Recorte del logo original (1600×800): marca sin lema y marca completa con lema. */
const MARK = { left: 14, top: 101, width: 1572, height: 434 };
const FULL = { left: 14, top: 101, width: 1572, height: 518 };

/*
 * El morado del logo original (tono 285°, muy oscuro) no coincide con el del sitio
 * (#7C3AED, tono 262°). Se lleva al tono y saturación de la paleta, conservando el
 * degradado: la luminosidad original 0,16–0,47 pasa a 0,44–0,68.
 */
const BRAND = { hue: 262 / 360, sat: 0.83, from: [0.16, 0.47], to: [0.44, 0.68] };

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h / 6, s, l];
}

function hslToRgb(h, s, l) {
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const channel = (t) => {
    t = (t + 1) % 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [channel(h + 1 / 3), channel(h), channel(h - 1 / 3)].map((v) => Math.round(v * 255));
}

/** Lleva un píxel morado del logo al morado de la paleta del sitio. */
function toBrandPurple(r, g, b) {
  const [, , l] = rgbToHsl(r, g, b);
  const t = Math.max(0, Math.min(1, (l - BRAND.from[0]) / (BRAND.from[1] - BRAND.from[0])));
  return hslToRgb(BRAND.hue, BRAND.sat, BRAND.to[0] + t * (BRAND.to[1] - BRAND.to[0]));
}

/** Quita el fondo blanco. `dark` aclara el texto negro y el gris para fondos oscuros. */
async function cutout(area, { dark = false } = {}) {
  const { data, info } = await sharp(SOURCE).extract(area).raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.alloc(info.width * info.height * 4);
  for (let p = 0; p < info.width * info.height; p++) {
    let r = data[p * 3];
    let g = data[p * 3 + 1];
    let b = data[p * 3 + 2];
    const min = Math.min(r, g, b);
    const max = Math.max(r, g, b);
    const alpha = Math.max(0, Math.min(255, Math.round(((245 - min) / 45) * 255)));
    if (max - min >= 30) [r, g, b] = toBrandPurple(r, g, b);
    if (dark && max - min < 30) {
      // Negro → blanco; gris → gris claro, para que se lea sobre #1F2937.
      const v = max < 70 ? 255 : Math.min(255, Math.round(max * 1.65));
      r = g = b = v;
    } else if (dark) {
      // Morado: se mezcla un 15 % con blanco para ganar contraste sobre fondo oscuro.
      r = Math.round(r + (255 - r) * 0.15);
      g = Math.round(g + (255 - g) * 0.15);
      b = Math.round(b + (255 - b) * 0.15);
    }
    out.set([r, g, b, alpha], p * 4);
  }
  return sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } }).png();
}

await (await cutout(MARK)).toFile(`${OUT}logo.png`);
await (await cutout(FULL, { dark: true })).toFile(`${OUT}logo-dark.png`);

/* Favicon: tejado y ventana del logo, simplificados para verse a 16 px. */
const mark = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 40 40">
  <defs><linearGradient id="v" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8B5CF6"/><stop offset="1" stop-color="#6D28D9"/></linearGradient></defs>
  <rect width="40" height="40" rx="10" fill="url(#v)"/>
  <path d="M6 22 20 10.5 34 22" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <g fill="#E5E7EB"><rect x="15.5" y="19" width="4" height="4" rx=".8"/><rect x="20.5" y="19" width="4" height="4" rx=".8"/><rect x="15.5" y="24" width="4" height="4" rx=".8"/><rect x="20.5" y="24" width="4" height="4" rx=".8"/></g>
</svg>`;
await writeFile('public/favicon.svg', mark(40));
await sharp(Buffer.from(mark(32))).png().toFile('public/favicon-32.png');
await sharp(Buffer.from(mark(180))).flatten({ background: '#6D28D9' }).png().toFile('public/apple-touch-icon.png');

/* Imagen para redes sociales: foto, degradado y logo para fondo oscuro. */
const logoOg = await (await cutout(FULL, { dark: true })).resize({ width: 470 }).toBuffer();
const overlay = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs><linearGradient id="g" x1="0" x2="1"><stop offset=".44" stop-color="#1F2937"/><stop offset=".78" stop-color="#1F2937" stop-opacity="0"/></linearGradient></defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <g font-family="Segoe UI, Arial, sans-serif" font-weight="700" font-size="50" fill="#fff">
    <text x="64" y="330">Servicio técnico</text>
    <text x="64" y="392">especializado</text>
    <text x="64" y="454">para tu hogar</text>
  </g>
  <text x="64" y="522" font-family="Segoe UI, Arial, sans-serif" font-size="27" fill="#D1D5DB">Bogotá y alrededores</text>
</svg>`;
await sharp('src/assets/images/tecnico-lavadora.jpg')
  .resize(1200, 630, { fit: 'cover', position: 'right' })
  .composite([{ input: Buffer.from(overlay) }, { input: logoOg, left: 60, top: 70 }])
  .jpeg({ quality: 82, mozjpeg: true })
  .toFile('public/og-image.jpg');

console.log('Recursos de marca generados.');
