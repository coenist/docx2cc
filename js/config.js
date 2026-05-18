export const DEFAULT_COURSE_ROOT = "course-root";
export const DEFAULT_CONTENT_FOLDER_TITLE = "orion-unit";

function cleanPathSegment(value) {
  return String(value || "")
    .trim()
    .replaceAll("\\", "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\/+/g, "-")
    .replace(/[<>:"|?*]+/g, "-")
    .replace(/\s+/g, "-")
    || "";
}

function readInputValue(id) {
  const input = document.getElementById(id);

  if (!input) {
    return "";
  }

  return String(input.value || "").trim();
}

export function getCourseRoot() {
  const value = cleanPathSegment(readInputValue("COURSE_ROOT"));
  return value || DEFAULT_COURSE_ROOT;
}

export function getContentFolderTitle() {
  const value = readInputValue("CONTENT_FOLDER_TITLE");
  return value || DEFAULT_CONTENT_FOLDER_TITLE;
}

export const ENABLE_OMML_CONVERSION = true;

export const EXPORT_CSS = [
  'body {',
  '  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;',
  '  line-height: 1.55;',
  '  max-width: 980px;',
  '  margin: 2rem auto;',
  '  padding: 0 1.5rem;',
  '}',
  'h1, h2, h3 { line-height: 1.25; }',
  'img { max-width: 100%; height: auto; }',
  '.inline-math { height: 1.15em; vertical-align: -0.25em; }',
  '.math-display { text-align: center; margin: 1rem 0; }',
  '.display-math { max-width: 100%; height: auto; }',
  'table.docx-table { border-collapse: collapse; width: 100%; margin: 1.25rem 0; table-layout: auto; }',
  'table.docx-table td, table.docx-table th { border: 1px solid #999; padding: 0.45rem 0.65rem; vertical-align: top; }',
  'table.docx-table tr.table-header-row > td, table.docx-table tr.table-header-row > th { font-weight: 700; border-bottom: 3px solid #555; }',
  'table.docx-table tr.even-data-row > td, table.docx-table tr.even-data-row > th { background: #f2f2f2; }',
  'table.single-row-table { border-collapse: collapse; width: 100%; margin: 1.25rem 0; }',
  'table.single-row-table td, table.single-row-table th { border: none; padding: 0.25rem 0; vertical-align: top; }',
  'td p, th p { margin: 0.25rem 0; }',
  'td > p:first-child, th > p:first-child { margin-top: 0; }',
  'td > p:last-child, th > p:last-child { margin-bottom: 0; }',
  'table img { max-width: 100%; height: auto; }'
].join("\n");
