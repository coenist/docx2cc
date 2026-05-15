export function uid(prefix = "i") {
  return prefix + crypto.randomUUID();
}

export function slugify(text) {
  return (
    String(text || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\p{L}\p{N}\s-]/gu, "")
      .replace(/[\s-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "hoofdstuk"
  );
}

export function imsHref(path) {
  return String(path)
    .replaceAll("\\", "/")
    .replace(/^[\\/]+/, "")
    .replace(/\/+/g, "/");
}

export function escapeXml(text) {
  return String(text ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function safeScriptHtml(html) {
  return String(html).replace(/<\/script/gi, "<" + "/script");
}

export function base64ToBlob(base64, contentType = "application/octet-stream") {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);

  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new Blob([bytes], { type: contentType });
}

export function parseXml(text) {
  return new DOMParser().parseFromString(text, "application/xml");
}

export function serializeXml(node) {
  return new XMLSerializer().serializeToString(node);
}

export function getAttrAnyNs(el, attrLocalName) {
  if (!el) return "";

  for (const attr of Array.from(el.attributes || [])) {
    if (attr.localName === attrLocalName) {
      return attr.value;
    }
  }

  return "";
}
