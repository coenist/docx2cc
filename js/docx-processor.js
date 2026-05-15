import { ENABLE_OMML_CONVERSION } from "./config.js";
import { state } from "./state.js";
import { setStatus, log } from "./ui.js";
import { slugify } from "./utils.js";
import { extractAllDocxMedia, extractMediaCaptionsFromDocx, convertMammothImage } from "./media.js";
import { preprocessOmmlInDocx, replaceInlineTexWithSvg, replaceOmmlPlaceholdersWithImages } from "./math.js";
import { collectImages, detectChaptersFromHtml, htmlPage, styleTables } from "./html-helpers.js";

const STYLE_MAP = [
  "p[style-name='Heading 1'] => h1:fresh",
  "p[style-name='Kop 1'] => h1:fresh",
  "p[style-name='Titel 1'] => h1:fresh",
  "p[style-name='Heading 2'] => h2:fresh",
  "p[style-name='Kop 2'] => h2:fresh",
  "p[style-name='Heading 3'] => h3:fresh",
  "p[style-name='Kop 3'] => h3:fresh",
  "table => table.docx-table:fresh",
  "b => strong",
  "i => em"
];

async function convertDocxToHtml(arrayBuffer) {
  return mammoth.convertToHtml(
    { arrayBuffer },
    {
      styleMap: STYLE_MAP,
      convertImage: mammoth.images.imgElement(convertMammothImage)
    }
  );
}

async function preprocessDocument(fileArrayBuffer) {
  state.mediaCaptions = await extractMediaCaptionsFromDocx(fileArrayBuffer);
  state.allDocxMedia = await extractAllDocxMedia(fileArrayBuffer);

  const preprocessed = {
    arrayBuffer: fileArrayBuffer,
    mathMap: new Map()
  };

  if (!ENABLE_OMML_CONVERSION) {
    return preprocessed;
  }

  try {
    setStatus("Word-formules worden voorbereid...");
    return await preprocessOmmlInDocx(fileArrayBuffer);
  } catch (error) {
    console.warn("OMML preprocessing skipped:", error);
    log(`OMML preprocessing skipped: ${error.message}`);
    setStatus("Word-formules konden niet vooraf verwerkt worden; DOCX wordt verder omgezet.");
    return preprocessed;
  }
}

function logMammothMessages(messages) {
  for (const message of messages || []) {
    log(`Mammoth: ${message.type || "message"} - ${message.message}`);
  }
}

async function buildChapter(rawChapter, index, mathMap) {
  const container = document.createElement("div");

  for (const node of rawChapter.nodes) {
    container.appendChild(node.cloneNode(true));
  }

  const chapterAssets = [];

  if (ENABLE_OMML_CONVERSION) {
    replaceOmmlPlaceholdersWithImages(container, mathMap, chapterAssets);
  }

  await replaceInlineTexWithSvg(container, chapterAssets);
  styleTables(container);
  collectImages(container, chapterAssets);

  const bodyHtml = container.innerHTML;
  const filename = `${String(index + 1).padStart(2, "0")}-${slugify(rawChapter.title)}.html`;

  log(`Chapter ${index + 1}: ${rawChapter.title} - ${chapterAssets.length} assets referenced`);

  return {
    title: rawChapter.title,
    filename,
    bodyHtml,
    html: htmlPage(rawChapter.title, bodyHtml),
    assets: Array.from(new Set(chapterAssets))
  };
}

export async function processDocx(file) {
  const originalArrayBuffer = await file.arrayBuffer();

  setStatus("DOCX wordt voorbereid...");
  const preprocessed = await preprocessDocument(originalArrayBuffer);

  setStatus("DOCX wordt naar HTML omgezet...");
  const result = await convertDocxToHtml(preprocessed.arrayBuffer);

  logMammothMessages(result.messages);

  const tableCount = (result.value.match(/<table/g) || []).length;
  if (tableCount > 0) {
    log(`Tables found: ${tableCount}. Complex Word table formatting may not be preserved exactly.`);
  }

  log(`HTML length from Mammoth: ${result.value.length}`);
  log(`Assets after Mammoth: ${state.assetFiles.size}`);

  const rawChapters = detectChaptersFromHtml(result.value);
  const output = [];

  for (let i = 0; i < rawChapters.length; i++) {
    output.push(await buildChapter(rawChapters[i], i, preprocessed.mathMap));
  }

  log(`Final assetFiles: ${Array.from(state.assetFiles.keys()).join(", ") || "(none)"}`);

  return output;
}
