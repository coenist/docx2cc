import { state, resetState } from "./state.js";
import {
  els,
  clearLog,
  log,
  openChapter,
  renderChapterList,
  resetWarnings,
  setStatus,
} from "./ui.js";
import { processDocx } from "./docx-processor.js";
import { createZip } from "./ims-package.js";

els.processBtn.addEventListener("click", async () => {
  const file = els.docxInput.files[0];

  if (!file) {
    alert("Kies eerst een DOCX-bestand.");
    return;
  }

  try {
    clearLog();
    resetWarnings();
    resetState();

    setStatus("DOCX wordt verwerkt...");
    els.downloadBtn.disabled = true;
    els.chapters.innerHTML = "";
    els.preview.innerHTML = "";
    els.images.innerHTML = "";

    state.currentFileName =
      file.name.replace(/\.docx$/i, "") + "_common_cartridge.zip";
    state.chapters = await processDocx(file);

    state.selectedChapterIndexes = new Set(
      state.chapters.map((_, index) => index),
    );

    renderChapterList();

    if (state.chapters.length > 0) {
      openChapter(0);
    }

    els.downloadBtn.disabled = false;
    setStatus(
      `${state.chapters.length} hoofdstukken gevonden. Controleer de preview, selecteer de hoofdstukken en download daarna de ZIP.`,
    );
  } catch (error) {
    console.error(error);
    log(`ERROR: ${error.stack || error.message}`);
    setStatus("Fout: " + error.message);
  }
});

els.downloadBtn.addEventListener("click", async () => {
  try {
    await createZip();
  } catch (error) {
    console.error(error);
    log(`ZIP ERROR: ${error.stack || error.message}`);
    setStatus("Fout bij ZIP maken: " + error.message);
  }
});
