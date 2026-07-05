/**
 * Genera la imagen Open Graph (preview social) de Link2Pay.
 *
 *   node scripts/generate-og.mjs   (o: npm run generate:og)
 *
 * Rasteriza un SVG de diseño (1200×630) a `public/og-image.png` usando las
 * fuentes de marca (Cabinet Grotesk / Satoshi) descargadas en scripts/assets/.
 * Es un paso MANUAL: el PNG resultante se commitea; no corre en el build de
 * producción (así el deploy no depende de resvg ni de las fuentes).
 */
import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const r = (p) => resolve(__dirname, p);

const BRAND = '#293E70';
const W = 1200;
const H = 630;

// Símbolo Link2Pay (paths de src/assets/icons/link2pay-logo.svg, viewBox 448×429).
const SYMBOL_PATHS = `
  <path d="M358.087 122.163C358.087 118.381 352.386 110.816 352.386 110.816L280.174 8.68876C280.174 8.68876 273.84 0.493842 280.808 0.500008C315.935 0.531092 335.629 0.556972 370.756 0.500008C374.557 0.493844 376.457 4.27611 376.457 4.27611L440.434 97.5782C440.434 97.5782 446.769 105.956 446.769 122.163C446.769 138.37 440.434 146.748 440.434 146.748L325.148 310.646L320.081 316.95C320.081 316.95 318.181 319.465 315.013 319.471C281.371 319.536 262.509 319.471 228.866 319.471C220.361 319.471 225.067 313.792 225.067 313.792L226.332 311.907L351.753 134.14C351.753 134.14 358.087 125.945 358.087 122.163Z"/>
  <path d="M204.988 122.338C204.988 118.551 199.306 110.975 199.306 110.975L127.325 8.70056C127.325 8.70056 121.011 0.493833 127.956 0.500008C162.971 0.531137 182.602 0.557054 217.616 0.500008C221.405 0.493835 223.299 4.28155 223.299 4.28155L291.268 110.975C291.268 110.975 295.768 117.677 295.768 122.338C295.768 127 291.768 134.5 291.768 134.5L172.155 311.093L167.104 317.406L144.768 348.99C144.768 348.99 137.768 358.473 144.768 358.473C169.105 358.48 254.362 358.5 311.768 358.5C321.768 358.5 324.268 364 324.268 364L343.768 389.5L365.768 419C365.768 419 372.268 428 365.768 428H140.767H13.2675C-4.73299 428 1.56879 411.504 1.56879 411.504L5.46358 405.822L72.3943 314.243L73.6552 312.355L198.674 134.333C198.674 134.333 204.988 126.126 204.988 122.338Z"/>
`;

// Símbolo centrado en la parte superior.
const SYM_H = 168;
const symScale = SYM_H / 429;
const symW = 448 * symScale;
const symX = (W - symW) / 2;
const symY = 92;

const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="${BRAND}"/>
  <g transform="translate(${symX} ${symY}) scale(${symScale})" fill="#FFFFFF">${SYMBOL_PATHS}</g>
  <text x="${W / 2}" y="420" text-anchor="middle" font-family="Cabinet Grotesk" font-weight="800" font-size="104" fill="#FFFFFF">Link2Pay</text>
  <text x="${W / 2}" y="478" text-anchor="middle" font-family="Satoshi" font-weight="500" font-size="34" fill="#FFFFFF" fill-opacity="0.88">Instant Stellar Payment Links</text>
  <text x="${W / 2}" y="528" text-anchor="middle" font-family="Satoshi" font-weight="500" font-size="26" fill="#FFFFFF" fill-opacity="0.62">Accept XLM · USDC · EURC · Settle in ~5s</text>
</svg>`;

const resvg = new Resvg(svg, {
  fitTo: { mode: 'width', value: W },
  background: BRAND,
  font: {
    loadSystemFonts: false,
    fontFiles: [r('assets/CabinetGrotesk-Extrabold.ttf'), r('assets/Satoshi-Medium.ttf')],
    defaultFontFamily: 'Satoshi',
  },
});

const png = resvg.render().asPng();
const outPath = r('../public/og-image.png');
writeFileSync(outPath, png);
console.log(`✓ og-image.png escrito (${(png.length / 1024).toFixed(1)} KB) en public/`);
// Sanity: confirmar que las fuentes existen.
[r('assets/CabinetGrotesk-Extrabold.ttf'), r('assets/Satoshi-Medium.ttf')].forEach((f) => readFileSync(f));
