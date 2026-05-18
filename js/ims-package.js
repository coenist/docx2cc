import { getContentFolderTitle, getCourseRoot } from "./config.js";
import { state } from "./state.js";
import { escapeXml, imsHref, uid } from "./utils.js";
import { log } from "./ui.js";

function createManifest(chapters) {
  const schemaLocation =
    "http://ltsc.ieee.org/xsd/imsccv1p3/LOM/resource " +
    "http://www.imsglobal.org/profile/cc/ccv1p3/LOM/ccv1p3_lomresource_v1p0.xsd " +
    "http://www.imsglobal.org/xsd/imsccv1p3/imscp_v1p1 " +
    "http://www.imsglobal.org/profile/cc/ccv1p3/ccv1p3_imscp_v1p2_v1p0.xsd " +
    "http://ltsc.ieee.org/xsd/imsccv1p3/LOM/manifest " +
    "http://www.imsglobal.org/profile/cc/ccv1p3/LOM/ccv1p3_lommanifest_v1p0.xsd";

  let items = "";
  let resources = "";

  chapters.forEach((chapter) => {
    const resId = uid() + "_R";
    const itemId = uid();

    items += `
        <item identifier="${itemId}" identifierref="${resId}">
          <title>${escapeXml(chapter.title)}</title>
        </item>`;

    let files = `
      <file href="${imsHref(`${getCourseRoot()}/${chapter.filename}`)}"/>`;

    for (const asset of chapter.assets) {
      files += `
      <file href="${imsHref(`${getCourseRoot()}/${asset}`)}"/>`;
    }

    resources += `
    <resource identifier="${resId}" type="webcontent">
${files}
    </resource>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest
  identifier="${uid()}"
  xmlns="http://www.imsglobal.org/xsd/imsccv1p3/imscp_v1p1"
  xmlns:lomr="http://ltsc.ieee.org/xsd/imsccv1p3/LOM/resource"
  xmlns:lomm="http://ltsc.ieee.org/xsd/imsccv1p3/LOM/manifest"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="${schemaLocation}">
  <metadata>
    <schema>IMS Common Cartridge</schema>
    <schemaversion>1.3.0</schemaversion>
  </metadata>
  <organizations>
    <organization identifier="${uid()}" structure="rooted-hierarchy">
      <item identifier="${uid()}">
        <item identifier="${uid()}">
          <title>${escapeXml(getContentFolderTitle())}</title>
${items}
        </item>
      </item>
      <metadata>
        <lomm:lom/>
      </metadata>
    </organization>
  </organizations>
  <resources>
${resources}
  </resources>
</manifest>`;
}

function getSelectedChapters() {
  return state.chapters.filter((_, index) =>
    state.selectedChapterIndexes.has(index),
  );
}

function getAssetsForChapters(chapters) {
  const assets = new Set();

  for (const chapter of chapters) {
    for (const asset of chapter.assets || []) {
      if (asset.startsWith("assets/")) {
        assets.add(`${getCourseRoot()}/${asset}`);
      }
    }
  }

  return assets;
}

export async function createZip() {
  const selectedChapters = getSelectedChapters();

  if (selectedChapters.length === 0) {
    throw new Error("Selecteer minstens één hoofdstuk om te exporteren.");
  }

  const selectedAssets = getAssetsForChapters(selectedChapters);

  const zip = new JSZip();

  zip.file("imsmanifest.xml", createManifest(selectedChapters));

  for (const chapter of selectedChapters) {
    zip.file(`${getCourseRoot()}/${chapter.filename}`, chapter.html);
  }

  log(`Writing selected assets to ZIP: ${selectedAssets.size}`);

  for (const assetPath of selectedAssets) {
    const blob = state.assetFiles.get(assetPath);

    if (!blob) {
      log(`WARNING: geselecteerde asset ontbreekt: ${assetPath}`);
      continue;
    }

    zip.file(assetPath, blob);
    log(`ZIP asset: ${assetPath}`);
  }

  const content = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
  });

  saveAs(content, state.currentFileName);
}