import { EXPORT_CSS } from "./config.js";
import { escapeXml, safeScriptHtml } from "./utils.js";

export function htmlPage(title, body) {
  return [
    "<!doctype html>",
    '<html lang="nl">',
    "<head>",
    '<meta charset="utf-8">',
    `<title>${escapeXml(title)}</title>`,
    "<style>",
    EXPORT_CSS,
    "<" + "/style>",
    "<" + "/head>",
    "<body>",
    safeScriptHtml(body),
    "<" + "/body>",
    "<" + "/html>"
  ].join("\n");
}

export function detectChaptersFromHtml(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div id="root">${html}</div>`, "text/html");
  const root = doc.getElementById("root");

  const output = [];
  let currentTitle = "Inleiding";
  let currentNodes = [];

  for (const node of Array.from(root.childNodes)) {
    if (node.nodeType === Node.ELEMENT_NODE && node.tagName.toLowerCase() === "h1") {
      if (currentNodes.length > 0) {
        output.push({ title: currentTitle, nodes: currentNodes });
      }

      currentTitle = node.textContent.trim() || "Hoofdstuk";
      currentNodes = [node.cloneNode(true)];
    } else {
      currentNodes.push(node.cloneNode(true));
    }
  }

  if (currentNodes.length > 0) {
    output.push({ title: currentTitle, nodes: currentNodes });
  }

  return output;
}

export function collectImages(container, chapterAssets) {
  for (const img of Array.from(container.querySelectorAll("img"))) {
    const src = img.getAttribute("src");
    if (src && src.startsWith("assets/")) {
      chapterAssets.push(src);
    }
  }
}

export function styleTables(container) {
  const tables = Array.from(container.querySelectorAll("table"));

  for (const table of tables) {
    const rows = Array.from(
      table.querySelectorAll(":scope > tbody > tr, :scope > tr")
    );

    if (rows.length === 0) continue;

    table.classList.remove("docx-table", "single-row-table");

    if (rows.length === 1) {
      table.classList.add("single-row-table");

      for (const row of rows) {
        row.classList.remove("table-header-row", "even-data-row");

        for (const cell of Array.from(row.children)) {
          cell.style.border = "none";
        }
      }

      continue;
    }

    table.classList.add("docx-table");

    rows.forEach((row, index) => {
      row.classList.remove("table-header-row", "even-data-row");

      if (index === 0) {
        row.classList.add("table-header-row");

        for (const cell of Array.from(row.children)) {
          cell.style.fontWeight = "700";
        }
      } else if (index % 2 === 0) {
        row.classList.add("even-data-row");
      }
    });
  }
}
