/**
 * Full-page background for the marketing/landing surface.
 *
 * Renders a single continuous backdrop behind all content:
 *   1. a light base gradient,
 *   2. soft colored shapes (teal / navy blobs, pre-blurred + slow drift), and
 *   3. a frosted glass veil that distorts the shapes.
 *
 * Fixed + aria-hidden + pointer-events-none, so it stays in place on scroll and
 * never interferes with content semantics or interaction. Motion is disabled via
 * `prefers-reduced-motion` (see `.l2p-blob` in index.css).
 */
export default function PageBackground() {
  return (
    <div className="l2p-bg" aria-hidden="true">
      <span className="l2p-blob l2p-blob--teal" />
      <span className="l2p-blob l2p-blob--navy" />
      <span className="l2p-blob l2p-blob--teal-2" />
      <span className="l2p-blob l2p-blob--mist" />
      <div className="l2p-veil" />
    </div>
  );
}
