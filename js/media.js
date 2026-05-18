import { getCourseRoot } from "./config.js";
import { state } from "./state.js";
import { base64ToBlob, getAttrAnyNs, parseXml } from "./utils.js";
import {
  addUnsupportedImageWarning,
  addConvertedImageWarning,
  log,
} from "./ui.js";

function paragraphTextFromXml(paragraph) {
  if (!paragraph) return "";

  const texts = Array.from(paragraph.getElementsByTagName("*"))
    .filter((el) => el.localName === "t")
    .map((el) => el.textContent);

  return texts.join("").trim();
}

function paragraphStyleFromXml(paragraph) {
  const pStyle = Array.from(paragraph.getElementsByTagName("*")).find(
    (el) => el.localName === "pStyle",
  );

  return pStyle ? getAttrAnyNs(pStyle, "val").toLowerCase() : "";
}

function paragraphContainsEmbedRid(paragraph) {
  const blips = Array.from(paragraph.getElementsByTagName("*")).filter(
    (el) => el.localName === "blip",
  );

  const rids = [];

  for (const blip of blips) {
    const rid = getAttrAnyNs(blip, "embed") || getAttrAnyNs(blip, "link");
    if (rid) rids.push(rid);
  }

  return rids;
}

function looksLikeCaption(text, style = "") {
  const normalized = text.trim().toLowerCase();

  if (!normalized) return false;

  if (style.includes("caption") || style.includes("bijschrift")) {
    return true;
  }

  return (
    normalized.startsWith("figuur ") ||
    normalized.startsWith("fig. ") ||
    normalized.startsWith("figure ") ||
    normalized.startsWith("afbeelding ") ||
    normalized.startsWith("illustratie ")
  );
}

export async function extractMediaCaptionsFromDocx(arrayBuffer) {
  const zip = await JSZip.loadAsync(arrayBuffer);

  const documentFile = zip.file("word/document.xml");
  const relsFile = zip.file("word/_rels/document.xml.rels");
  const captions = new Map();

  if (!documentFile || !relsFile) {
    return captions;
  }

  const documentXml = parseXml(await documentFile.async("text"));
  const relsXml = parseXml(await relsFile.async("text"));

  const relMap = new Map();

  const relationships = Array.from(relsXml.getElementsByTagName("*")).filter(
    (el) => el.localName === "Relationship",
  );

  for (const rel of relationships) {
    const id = rel.getAttribute("Id");
    const target = rel.getAttribute("Target");

    if (id && target && target.startsWith("media/")) {
      relMap.set(id, "word/" + target);
    }
  }

  const body = Array.from(documentXml.getElementsByTagName("*")).find(
    (el) => el.localName === "body",
  );

  if (!body) {
    return captions;
  }

  const paragraphs = Array.from(body.childNodes).filter(
    (n) => n.nodeType === Node.ELEMENT_NODE && n.localName === "p",
  );

  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i];
    const rids = paragraphContainsEmbedRid(paragraph);

    if (rids.length === 0) continue;

    for (const rid of rids) {
      const mediaPath = relMap.get(rid);
      if (!mediaPath) continue;

      const prev = paragraphs[i - 1] || null;
      const next = paragraphs[i + 1] || null;
      const next2 = paragraphs[i + 2] || null;
      const candidates = [next, prev, next2];

      let caption = "";

      for (const candidate of candidates) {
        if (!candidate) continue;

        const text = paragraphTextFromXml(candidate);
        const style = paragraphStyleFromXml(candidate);

        if (looksLikeCaption(text, style)) {
          caption = text;
          break;
        }
      }

      if (!caption) {
        caption =
          [prev, next, next2].map(paragraphTextFromXml).filter(Boolean)[0] ||
          "";
      }

      captions.set(mediaPath, caption);
    }
  }

  return captions;
}

function imageContentTypeFromExtension(ext) {
  switch (ext) {
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "gif":
      return "image/gif";
    case "svg":
      return "image/svg+xml";
    case "webp":
      return "image/webp";
    case "tif":
    case "tiff":
      return "image/tiff";
    case "emf":
      return "image/x-emf";
    case "wmf":
      return "image/wmf";
    default:
      return "application/octet-stream";
  }
}

function extensionFromContentType(contentType) {
  if (!contentType) return "png";

  if (contentType.includes("jpeg")) return "jpg";
  if (contentType.includes("png")) return "png";
  if (contentType.includes("gif")) return "gif";
  if (contentType.includes("svg")) return "svg";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("tiff")) return "tif";
  if (contentType.includes("emf")) return "emf";
  if (contentType.includes("wmf")) return "wmf";

  return "png";
}

export async function extractAllDocxMedia(arrayBuffer) {
  const zip = await JSZip.loadAsync(arrayBuffer);
  const media = new Map();

  const mediaFiles = Object.keys(zip.files).filter(
    (name) => name.startsWith("word/media/") && !zip.files[name].dir,
  );

  log(`DOCX media files found: ${mediaFiles.length}`);

  for (const internalPath of mediaFiles) {
    const file = zip.file(internalPath);
    if (!file) continue;

    const blob = await file.async("blob");
    const originalName = internalPath.split("/").pop();

    const ext = originalName.includes(".")
      ? originalName.split(".").pop().toLowerCase()
      : "bin";

    const caption = state.mediaCaptions?.get(internalPath) || "";

    if (ext === "emf" || ext === "wmf") {
      addUnsupportedImageWarning(originalName, ext.toUpperCase(), caption);
      log(
        `WARNING: ${originalName} is ${ext.toUpperCase()} and may not display correctly. Caption: ${caption || "none"}`,
      );
    }

    const contentType = imageContentTypeFromExtension(ext);

    const typedBlob = blob.type
      ? blob
      : new Blob([blob], { type: contentType });

    const isTiff = ext === "tif" || ext === "tiff";

    let outputExt = ext;
    let outputContentType = contentType;
    let outputBlob = typedBlob;

    if (isTiff) {
      try {
        outputBlob = await convertTiffBlobToPngBlob(typedBlob);
        outputExt = "png";
        outputContentType = "image/png";

        const baseName = originalName.replace(/\.[^.]+$/, "");
        const convertedName = `media_${baseName}.png`;

        addConvertedImageWarning(
          originalName,
          convertedName,
          ext.toUpperCase(),
          "PNG",
          caption,
        );

        log(`Converted TIFF to PNG: ${originalName} -> ${convertedName}`);
      } catch (error) {
        log(
          `WARNING: TIFF kon niet naar PNG worden omgezet: ${originalName} (${error.message})`,
        );
      }
    }

    const baseName = originalName.replace(/\.[^.]+$/, "");

    const assetName =
      isTiff && outputExt === "png"
        ? `media_${baseName}.png`
        : `media_${originalName}`;

    const zipPath = `${getCourseRoot()}/assets/${assetName}`;
    const htmlSrc = `assets/${assetName}`;

    media.set(internalPath, {
      originalName,
      zipPath,
      htmlSrc,
      blob: outputBlob,
      ext: outputExt,
      contentType: outputContentType,
      caption,
    });

    if (!state.assetFiles.has(zipPath)) {
      state.assetFiles.set(zipPath, outputBlob);
      log(
        `Added fallback media asset: ${zipPath} (${outputBlob.size} bytes, ${outputContentType})`,
      );
    }
  }

  return media;
}

export async function convertMammothImage(image) {
  const base64 = await image.read("base64");
  const contentType = image.contentType || "image/png";
  const ext = extensionFromContentType(contentType);

  let blob = base64ToBlob(base64, contentType);

  let finalExt = ext;
  let finalContentType = contentType;

  if (ext === "tif" || ext === "tiff" || contentType === "image/tiff") {
    try {
      blob = await convertTiffBlobToPngBlob(blob);
      finalExt = "png";
      finalContentType = "image/png";
      log("Converted Mammoth TIFF image to PNG");
    } catch (error) {
      log(
        `WARNING: Mammoth TIFF image kon niet naar PNG worden omgezet (${error.message})`,
      );
    }
  }

  const name = `image_${crypto.randomUUID()}.${finalExt}`;
  const zipPath = `${getCourseRoot()}/assets/${name}`;
  const htmlSrc = `assets/${name}`;

  state.assetFiles.set(zipPath, blob);
  log(
    `Added image asset: ${zipPath} (${blob.size} bytes, ${finalContentType})`,
  );

  return { src: htmlSrc };
}

export async function convertTiffBlobToPngBlob(tiffBlob) {
  if (!window.UTIF) {
    throw new Error("UTIF.js is niet geladen.");
  }

  const buffer = await tiffBlob.arrayBuffer();
  const ifds = UTIF.decode(buffer);

  if (!ifds || ifds.length === 0) {
    throw new Error("Geen TIFF image directory gevonden.");
  }

  const firstPage = ifds[0];

  UTIF.decodeImage(buffer, firstPage);

  const rgba = UTIF.toRGBA8(firstPage);
  const width = firstPage.width;
  const height = firstPage.height;

  if (!width || !height) {
    throw new Error("TIFF heeft geen geldige breedte/hoogte.");
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  const imageData = new ImageData(new Uint8ClampedArray(rgba), width, height);

  ctx.putImageData(imageData, 0, 0);

  return await new Promise((resolve, reject) => {
    canvas.toBlob((pngBlob) => {
      if (!pngBlob) {
        reject(new Error("Canvas kon geen PNG Blob maken."));
        return;
      }

      resolve(pngBlob);
    }, "image/png");
  });
}
