# Link2Pay

Monorepo: `frontend/` (Vite + React + TS + Tailwind) y `backend/`.

## Diseño

La estética del producto es el Design System **"Moneytory"** (finance UI minimalista):

- **Qué** (referencia visual): `.agents/Design System.dc.html`.
- **Cómo aplicarlo aquí** (guía de migración): `.agents/Design-Migration.md`.

Lee ambos antes de crear o modificar UI. Principios:

- **Solo tokens.** Todo color pasa por tokens semánticos de `frontend/src/index.css`
  (Layer 1 `--ref-*` → Layer 2 semántica `:root` light / `.dark`) y
  `frontend/tailwind.config.js`. Prohibido hex, `bg-[#...]`, HSL inline o estilos
  inline de color. Si falta un token, añádelo a Layer 2 + config **antes** de usarlo.
  (Excepción: `frontend/src/components/Invoice/InvoicePDF.tsx` es `@react-pdf/renderer`
  y requiere literales; usa el hex de marca `#4F51B8`.)
- **Neutro por defecto, énfasis por inversión a tinta** (`--primary` = tinta), y
  **lavanda como único acento** (`--accent`; como texto usar `accent-ink`, nunca
  lavanda sobre blanco). Ante la duda → neutro.
- **Sin sombras en reposo** (solo overlays: toasts/modales/popovers, `shadow-overlay`),
  **sin gradientes**, **sin glow**. Tarjetas separan por contraste de superficie.
- Primitivas = clases `@apply` en `index.css` (`.btn-*`, `.card`, `.badge-*`, `.input`,
  `.pill-toggle`, `.tabs`). Restyléalas ahí; no crees hex en componentes.
- Tipografía: headings **Cabinet Grotesk**, cuerpo **Satoshi** (Fontshare), mono
  **JetBrains Mono** (direcciones/hashes/IDs). Cifras `tabular-nums`.
- Radios 8/12/16/full; espaciado en escala de 4px. Verifica **light y dark** y
  contraste AA antes de cerrar cualquier pantalla.
- i18n: todo texto vía `useI18n()`; mayúsculas de labels con CSS `uppercase`.
