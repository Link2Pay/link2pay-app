// frontend/src/lib/brebQr.ts
//
// Extracts a Bre-B llave from a scanned QR payload.
//
// Bre-B QRs follow the EMVCo Merchant-Presented QR spec with Colombian
// extensions (ACH Colombia "CAMPOS QR CODE EMVCo"). The llave lives inside a
// merchant-account-information template (tags 26–51). The exact subtag is not
// publicly documented, so extraction is best-effort: the caller always shows
// the result in an editable input for the merchant to confirm before saving.

interface TlvField {
  id: string;
  value: string;
}

// EMV TLV stream: `id[2] len[2] value[len]`, ids and lengths are ASCII digits.
function parseTlv(payload: string): TlvField[] {
  const fields: TlvField[] = [];
  let i = 0;
  while (i + 4 <= payload.length) {
    const id = payload.slice(i, i + 2);
    const lenStr = payload.slice(i + 2, i + 4);
    if (!/^\d{2}$/.test(id) || !/^\d{2}$/.test(lenStr)) break;
    const len = Number(lenStr);
    const value = payload.slice(i + 4, i + 4 + len);
    if (value.length < len) break;
    fields.push({ id, value });
    i += 4 + len;
  }
  return fields;
}

export function extractLlave(decoded: string): string {
  const text = decoded.trim();

  // Not an EMVCo payload (tag 00 "01" payload-format-indicator) — treat the
  // QR content as the llave itself (plain-text QRs of a llave).
  if (!text.startsWith('000201')) return text;

  const templates = parseTlv(text).filter((f) => {
    const id = Number(f.id);
    return id >= 26 && id <= 51;
  });

  // Prefer the first non-GUI, non-empty subtag value across all templates
  // (subtag 00 is the Globally Unique Identifier — a domain, not the llave).
  for (const template of templates) {
    const candidate = parseTlv(template.value).find(
      (sub) => sub.id !== '00' && sub.value.trim().length > 0
    );
    if (candidate) return candidate.value.trim();
  }

  // No parseable subtags: fall back to the first template's raw value, and
  // failing that to the whole decoded text — the merchant edits before Save.
  if (templates.length > 0 && templates[0].value.trim()) return templates[0].value.trim();
  return text;
}
