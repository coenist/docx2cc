export const state = {
  chapters: [],
  selectedChapterIndexes: new Set(),
  assetFiles: new Map(),
  allDocxMedia: new Map(),
  mediaCaptions: new Map(),
  previewObjectUrls: [],
  currentFileName: "common-cartridge.zip",
};

export function resetState() {
  for (const url of state.previewObjectUrls) {
    URL.revokeObjectURL(url);
  }

  state.chapters = [];
  state.selectedChapterIndexes = new Set();
  state.assetFiles = new Map();
  state.allDocxMedia = new Map();
  state.mediaCaptions = new Map();
  state.previewObjectUrls = [];
  state.currentFileName = "common-cartridge.zip";
}

export function revokePreviewUrls() {
  for (const url of state.previewObjectUrls) {
    URL.revokeObjectURL(url);
  }
  state.previewObjectUrls = [];
}
