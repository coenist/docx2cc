import { escapeXml } from "./utils.js";
import { state } from "./state.js";
import { getCourseRoot } from "./config.js";

export const els = {
  docxInput: document.getElementById("docxInput"),
  processBtn: document.getElementById("processBtn"),
  downloadBtn: document.getElementById("downloadBtn"),
  status: document.getElementById("status"),
  log: document.getElementById("log"),
  chapters: document.getElementById("chapters"),
  preview: document.getElementById("preview"),
  images: document.getElementById("images"),
  warningBox: document.getElementById("warningBox"),
};

let imageWarnings = {
  unsupported: [],
  converted: [],
};

export function setStatus(message) {
  if (els.status) {
    els.status.textContent = message || "";
  }
}

export function log(message) {
  console.log(message);

  if (!els.log) return;

  els.log.textContent += String(message) + "\n";
  els.log.scrollTop = els.log.scrollHeight;
}

export function clearLog() {
  if (!els.log) return;
  els.log.textContent = "";
}

export function addUnsupportedImageWarning(fileName, type, caption = "") {
  imageWarnings.unsupported.push({
    fileName,
    type,
    caption,
  });

  renderImageWarnings();
}

export function addConvertedImageWarning(
  originalName,
  convertedName,
  fromType,
  toType,
  caption = "",
) {
  imageWarnings.converted.push({
    originalName,
    convertedName,
    fromType,
    toType,
    caption,
  });

  renderImageWarnings();
}

export function resetWarnings() {
  imageWarnings = {
    unsupported: [],
    converted: [],
  };

  if (!els.warningBox) return;

  els.warningBox.hidden = true;
  els.warningBox.innerHTML = "";
}

function renderImageWarnings() {
  if (!els.warningBox) return;

  const parts = [];

  if (imageWarnings.unsupported.length > 0) {
    const count = imageWarnings.unsupported.length;

    const files = imageWarnings.unsupported
      .map((warning) => {
        const captionHtml = warning.caption
          ? `<br><em>${escapeXml(warning.caption)}</em>`
          : `<br><em>Geen bijschrift gevonden.</em>`;

        return `
          <li>
            <strong>${escapeXml(warning.fileName)}</strong>
            (${escapeXml(warning.type)})
            ${captionHtml}
          </li>
        `;
      })
      .join("");

    parts.push(`
      <section>
        <p>
          <strong>Waarschuwing:</strong> dit document bevat ${count}
          EMF/WMF-afbeelding(en). Deze bestanden worden wel toegevoegd aan de
          assets-folder, maar worden waarschijnlijk niet correct weergegeven in
          de browser of in Brightspace/D2L. Converteer deze afbeeldingen bij
          voorkeur vooraf naar PNG of SVG in Word/LibreOffice.
        </p>
        <ul>${files}</ul>
      </section>
    `);
  }

  if (imageWarnings.converted.length > 0) {
    const count = imageWarnings.converted.length;

    const files = imageWarnings.converted
      .map((warning) => {
        const captionHtml = warning.caption
          ? `<br><em>${escapeXml(warning.caption)}</em>`
          : `<br><em>Geen bijschrift gevonden.</em>`;

        return `
          <li>
            <strong>${escapeXml(warning.originalName)}</strong>
            (${escapeXml(warning.fromType)} → ${escapeXml(warning.toType)})
            → <code>${escapeXml(warning.convertedName)}</code>
            ${captionHtml}
          </li>
        `;
      })
      .join("");

    parts.push(`
      <section>
        <p>
          <strong>Info:</strong> dit document bevat ${count}
          TIF/TIFF-afbeelding(en). Deze afbeeldingen zijn automatisch omgezet
          naar PNG zodat ze correct zichtbaar zijn in Chrome en Brightspace/D2L.
        </p>
        <ul>${files}</ul>
      </section>
    `);
  }

  if (parts.length === 0) {
    els.warningBox.hidden = true;
    els.warningBox.innerHTML = "";
    return;
  }

  els.warningBox.hidden = false;
  els.warningBox.innerHTML = parts.join("");
}

function assetSrcToBlobUrl(src) {
  if (!src || !src.startsWith("assets/")) {
    return src;
  }

  const zipPath = `${getCourseRoot()}/${src}`;
  const blob = state.assetFiles.get(zipPath);

  if (!blob) {
    console.warn("Missing blob for asset:", zipPath);
    return src;
  }

  const url = URL.createObjectURL(blob);
  state.previewObjectUrls.push(url);

  return url;
}

function rewriteAssetsForPreview(html) {
  for (const url of state.previewObjectUrls) {
    URL.revokeObjectURL(url);
  }

  state.previewObjectUrls = [];

  const div = document.createElement("div");
  div.innerHTML = html;

  for (const img of div.querySelectorAll("img")) {
    const src = img.getAttribute("src");

    if (src && src.startsWith("assets/")) {
      img.src = assetSrcToBlobUrl(src);
    }
  }

  return div.innerHTML;
}

export function renderChapterList(chapters = state.chapters) {
  if (!els.chapters) return;

  if (!Array.isArray(chapters)) {
    console.error("renderChapterList verwacht een array, kreeg:", chapters);
    els.chapters.innerHTML = "<p>Geen geldige hoofdstukken gevonden.</p>";
    return;
  }

  if (
    !(state.selectedChapterIndexes instanceof Set) ||
    state.selectedChapterIndexes.size === 0
  ) {
    state.selectedChapterIndexes = new Set(chapters.map((_, index) => index));
  }

  els.chapters.innerHTML = "";

  const controls = document.createElement("div");
  controls.className = "chapter-controls";

  const selectAllBtn = document.createElement("button");
  selectAllBtn.type = "button";
  selectAllBtn.textContent = "Alles selecteren";
  selectAllBtn.addEventListener("click", () => {
    state.selectedChapterIndexes = new Set(chapters.map((_, index) => index));
    renderChapterList(chapters);
  });

  const deselectAllBtn = document.createElement("button");
  deselectAllBtn.type = "button";
  deselectAllBtn.textContent = "Alles deselecteren";
  deselectAllBtn.addEventListener("click", () => {
    state.selectedChapterIndexes = new Set();
    renderChapterList(chapters);
  });

  controls.appendChild(selectAllBtn);
  controls.appendChild(deselectAllBtn);
  els.chapters.appendChild(controls);

  chapters.forEach((chapter, index) => {
    const row = document.createElement("div");
    row.className = "chapter-row";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = state.selectedChapterIndexes.has(index);
    checkbox.id = `chapter-check-${index}`;

    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        state.selectedChapterIndexes.add(index);
      } else {
        state.selectedChapterIndexes.delete(index);
      }
    });

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chapter";
    btn.textContent = `${index + 1}. ${chapter.title}`;
    btn.addEventListener("click", () => openChapter(index));

    row.appendChild(checkbox);
    row.appendChild(btn);

    els.chapters.appendChild(row);
  });
}

export function openChapter(index) {
  const chapter = state.chapters[index];

  if (!chapter) return;

  document.querySelectorAll(".chapter").forEach((button, i) => {
    button.classList.toggle("active", i === index);
  });

  if (els.preview) {
    els.preview.innerHTML = rewriteAssetsForPreview(chapter.bodyHtml);
  }

  if (!els.images) return;

  els.images.innerHTML = "";

  const imageAssets = chapter.assets.filter((asset) => {
    return asset.startsWith("assets/") && !asset.includes("math_");
  });

  if (imageAssets.length === 0) {
    els.images.textContent = "Geen afbeeldingen gevonden.";
    return;
  }

  for (const asset of imageAssets) {
    const zipPath = `${getCourseRoot()}/${asset}`;
    const blob = state.assetFiles.get(zipPath);

    if (!blob) {
      console.warn("Preview missing image blob:", zipPath);
      continue;
    }

    const img = document.createElement("img");
    const url = URL.createObjectURL(blob);

    state.previewObjectUrls.push(url);

    img.src = url;
    img.title = asset.split("/").pop();

    els.images.appendChild(img);
  }
}
