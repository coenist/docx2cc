import { COURSE_ROOT } from "./config.js";
import { state } from "./state.js";
import { log } from "./ui.js";
import { parseXml, serializeXml, getAttrAnyNs } from "./utils.js";

function xmlChildren(node) {
  return Array.from(node.childNodes).filter((n) => n.nodeType === Node.ELEMENT_NODE);
}

function firstChild(node, localName) {
  return xmlChildren(node).find((n) => n.localName === localName) || null;
}

function children(node, localName) {
  return xmlChildren(node).filter((n) => n.localName === localName);
}

function getVal(node) {
  return getAttrAnyNs(node, "val");
}

function ommlText(node) {
  let out = "";

  for (const child of xmlChildren(node)) {
    out += child.localName === "t" ? child.textContent : ommlText(child);
  }

  return out;
}

function escapeTexText(text) {
  return String(text)
    .replace(/\\/g, "\\backslash ")
    .replace(/([#$%&_{}])/g, "\\$1");
}

function normalizeOmmlSymbol(text) {
  const map = {
    "−": "-",
    "×": "\\times ",
    "·": "\\cdot ",
    "÷": "\\div ",
    "≤": "\\le ",
    "≥": "\\ge ",
    "≠": "\\ne ",
    "≈": "\\approx ",
    "∞": "\\infty ",
    "π": "\\pi ",
    "α": "\\alpha ",
    "β": "\\beta ",
    "γ": "\\gamma ",
    "δ": "\\delta ",
    "Δ": "\\Delta ",
    "ε": "\\epsilon ",
    "θ": "\\theta ",
    "λ": "\\lambda ",
    "μ": "\\mu ",
    "ρ": "\\rho ",
    "σ": "\\sigma ",
    "φ": "\\varphi ",
    "ϕ": "\\phi ",
    "ω": "\\omega ",
    "Ω": "\\Omega "
  };

  return Array.from(text).map((ch) => map[ch] || escapeTexText(ch)).join("");
}

function ommlArg(node, name) {
  const arg = firstChild(node, name);
  return arg ? ommlToTex(arg) : "";
}

function ommlToTex(node) {
  if (!node) return "";

  switch (node.localName) {
    case "oMathPara":
      return children(node, "oMath").map(ommlToTex).join(" ");

    case "oMath":
      return xmlChildren(node).map(ommlToTex).join("");

    case "r":
      return normalizeOmmlSymbol(ommlText(node));

    case "t":
      return normalizeOmmlSymbol(node.textContent);

    case "f":
      return `\\frac{${ommlArg(node, "num")}}{${ommlArg(node, "den")}}`;

    case "sSup":
      return `{${ommlArg(node, "e")}}^{${ommlArg(node, "sup")}}`;

    case "sSub":
      return `{${ommlArg(node, "e")}}_{${ommlArg(node, "sub")}}`;

    case "sSubSup":
      return `{${ommlArg(node, "e")}}_{${ommlArg(node, "sub")}}^{${ommlArg(node, "sup")}}`;

    case "rad": {
      const deg = ommlArg(node, "deg");
      const expr = ommlArg(node, "e");
      return deg ? `\\sqrt[${deg}]{${expr}}` : `\\sqrt{${expr}}`;
    }

    case "bar":
      return `\\overline{${ommlArg(node, "e")}}`;

    case "acc": {
      const expr = ommlArg(node, "e");
      const accPr = firstChild(node, "accPr");
      const chr = accPr ? getVal(firstChild(accPr, "chr")) : "";

      if (chr === "̂" || chr === "^") return `\\hat{${expr}}`;
      if (chr === "̃" || chr === "~") return `\\tilde{${expr}}`;
      if (chr === "̅") return `\\bar{${expr}}`;
      if (chr === "→") return `\\vec{${expr}}`;

      return `\\hat{${expr}}`;
    }

    case "d": {
      const dPr = firstChild(node, "dPr");
      let left = "(";
      let right = ")";

      if (dPr) {
        left = getVal(firstChild(dPr, "begChr")) || left;
        right = getVal(firstChild(dPr, "endChr")) || right;
      }

      return `\\left${left}${ommlArg(node, "e")}\\right${right}`;
    }

    case "nary": {
      const naryPr = firstChild(node, "naryPr");
      const chr = naryPr ? getVal(firstChild(naryPr, "chr")) : "";
      const opMap = {
        "∑": "\\sum",
        "∫": "\\int",
        "∏": "\\prod",
        "∐": "\\coprod",
        "⋂": "\\bigcap",
        "⋃": "\\bigcup"
      };

      const op = opMap[chr] || "\\sum";
      const sub = ommlArg(node, "sub");
      const sup = ommlArg(node, "sup");
      const expr = ommlArg(node, "e");

      return `${op}${sub ? `_{${sub}}` : ""}${sup ? `^{${sup}}` : ""} ${expr}`;
    }

    case "limLow":
      return `\\underset{${ommlArg(node, "lim")}}{${ommlArg(node, "e")}}`;

    case "limUpp":
      return `\\overset{${ommlArg(node, "lim")}}{${ommlArg(node, "e")}}`;

    case "func": {
      const fname = ommlArg(node, "fName").trim();
      const expr = ommlArg(node, "e");
      const known = {
        sin: "\\sin",
        cos: "\\cos",
        tan: "\\tan",
        log: "\\log",
        ln: "\\ln",
        exp: "\\exp",
        min: "\\min",
        max: "\\max"
      };

      return `${known[fname] || fname}{${expr}}`;
    }

    case "m": {
      const rows = children(node, "mr");
      const texRows = rows.map((row) => children(row, "e").map(ommlToTex).join(" & "));
      return `\\begin{matrix}${texRows.join(" \\\\ ")}\\end{matrix}`;
    }

    case "eqArr": {
      const rows = children(node, "e").map(ommlToTex);
      return `\\begin{aligned}${rows.join(" \\\\ ")}\\end{aligned}`;
    }

    case "groupChr":
      return `\\overbrace{${ommlArg(node, "e")}}`;

    case "box":
    case "borderBox":
      return ommlArg(node, "e");

    case "e":
    case "num":
    case "den":
    case "sup":
    case "sub":
    case "deg":
    case "lim":
    case "fName":
    case "mr":
      return xmlChildren(node).map(ommlToTex).join("");

    default:
      return xmlChildren(node).map(ommlToTex).join("") ||
        normalizeOmmlSymbol(node.textContent || "");
  }
}

export async function texToSvgAsset(tex, display = false) {
  await MathJax.startup.promise;

  const node = MathJax.tex2svg(tex, { display });
  const svg = node.querySelector("svg");

  if (!svg) {
    throw new Error("MathJax kon geen SVG maken uit TeX.");
  }

  svg.removeAttribute("style");
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");

  const svgText = serializeXml(svg);
  const name = `math_${crypto.randomUUID()}.svg`;
  const zipPath = `${COURSE_ROOT}/assets/${name}`;
  const htmlSrc = `assets/${name}`;

  state.assetFiles.set(zipPath, new Blob([svgText], { type: "image/svg+xml" }));
  log(`Added math asset: ${zipPath}`);

  return { htmlSrc, svgText };
}

function replaceNodeWithWordPlaceholder(xmlDoc, node, placeholder) {
  const wNs = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
  const parent = node.parentNode;

  if (!parent) return;

  const textNode = xmlDoc.createElementNS(wNs, "w:t");
  textNode.setAttributeNS("http://www.w3.org/XML/1998/namespace", "xml:space", "preserve");
  textNode.textContent = placeholder;

  if (parent.localName === "r") {
    parent.replaceChild(textNode, node);
    return;
  }

  const run = xmlDoc.createElementNS(wNs, "w:r");
  run.appendChild(textNode);
  parent.replaceChild(run, node);
}

export async function preprocessOmmlInDocx(arrayBuffer) {
  const zip = await JSZip.loadAsync(arrayBuffer);
  const documentFile = zip.file("word/document.xml");

  if (!documentFile) {
    throw new Error("word/document.xml niet gevonden in DOCX.");
  }

  const xmlDoc = parseXml(await documentFile.async("text"));

  if (xmlDoc.querySelector("parsererror")) {
    throw new Error("word/document.xml kon niet gelezen worden.");
  }

  const allMathNodes = Array.from(xmlDoc.getElementsByTagName("*"))
    .filter((el) => el.localName === "oMath" || el.localName === "oMathPara");

  const mathNodes = allMathNodes.filter((el) => {
    if (el.localName === "oMathPara") return true;

    let parent = el.parentElement;
    while (parent) {
      if (parent.localName === "oMathPara" || parent.localName === "oMath") {
        return false;
      }
      parent = parent.parentElement;
    }

    return true;
  });

  const mathMap = new Map();
  log(`OMML formulas found: ${mathNodes.length}`);

  for (const mathNode of mathNodes) {
    const placeholder = `[[[OMML_MATH_${crypto.randomUUID()}]]]`;

    try {
      const tex = ommlToTex(mathNode).trim();
      if (!tex) throw new Error("OMML-to-TeX produced empty output.");

      const display = mathNode.localName === "oMathPara";
      const asset = await texToSvgAsset(tex, display);

      mathMap.set(placeholder, { src: asset.htmlSrc, display, tex });
      replaceNodeWithWordPlaceholder(xmlDoc, mathNode, placeholder);
      log(`Converted OMML formula to SVG: ${tex.slice(0, 80)}`);
    } catch (error) {
      console.warn("OMML formula not converted:", error);
      log(`OMML formula not converted: ${error.message}`);

      const fallbackText = ommlText(mathNode).trim() || "[formule]";
      replaceNodeWithWordPlaceholder(xmlDoc, mathNode, fallbackText);
    }
  }

  zip.file("word/document.xml", serializeXml(xmlDoc));

  return {
    arrayBuffer: await zip.generateAsync({ type: "arraybuffer" }),
    mathMap
  };
}

export function replaceOmmlPlaceholdersWithImages(container, mathMap, chapterAssets) {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  const textNodes = [];

  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node.nodeValue.includes("[[[OMML_MATH_")) {
      textNodes.push(node);
    }
  }

  for (const textNode of textNodes) {
    const text = textNode.nodeValue;
    const fragment = document.createDocumentFragment();
    const regex = /\[\[\[OMML_MATH_[^\]]+\]\]\]/g;

    let last = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      fragment.appendChild(document.createTextNode(text.slice(last, match.index)));

      const data = mathMap.get(match[0]);

      if (data) {
        const img = document.createElement("img");
        img.src = data.src;
        img.alt = data.tex || "formula";
        img.className = data.display ? "display-math" : "inline-math";

        if (data.display) {
          const wrapper = document.createElement("div");
          wrapper.className = "math-display";
          wrapper.appendChild(img);
          fragment.appendChild(wrapper);
        } else {
          fragment.appendChild(img);
        }

        chapterAssets.push(data.src);
      } else {
        fragment.appendChild(document.createTextNode(match[0]));
      }

      last = regex.lastIndex;
    }

    fragment.appendChild(document.createTextNode(text.slice(last)));
    textNode.parentNode.replaceChild(fragment, textNode);
  }
}

export async function replaceInlineTexWithSvg(container, chapterAssets) {
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        if (!node.nodeValue.includes("$")) return NodeFilter.FILTER_REJECT;

        const parent = node.parentElement;
        if (parent && ["SCRIPT", "STYLE", "CODE", "PRE"].includes(parent.tagName)) {
          return NodeFilter.FILTER_REJECT;
        }

        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  const textNodes = [];
  while (walker.nextNode()) {
    textNodes.push(walker.currentNode);
  }

  for (const textNode of textNodes) {
    const text = textNode.nodeValue;
    const regex = /(?<!\$)\$(?!\$)(.+?)(?<!\$)\$(?!\$)/gs;

    if (!regex.test(text)) continue;
    regex.lastIndex = 0;

    const fragment = document.createDocumentFragment();
    let last = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      fragment.appendChild(document.createTextNode(text.slice(last, match.index)));

      const tex = match[1].trim();

      try {
        const asset = await texToSvgAsset(tex, false);
        const img = document.createElement("img");
        img.src = asset.htmlSrc;
        img.alt = tex;
        img.className = "inline-math";
        chapterAssets.push(asset.htmlSrc);
        fragment.appendChild(img);
      } catch (error) {
        console.warn("TeX inline math not converted:", tex, error);
        log(`TeX formula not converted: ${tex}`);
        fragment.appendChild(document.createTextNode(match[0]));
      }

      last = regex.lastIndex;
    }

    fragment.appendChild(document.createTextNode(text.slice(last)));
    textNode.parentNode.replaceChild(fragment, textNode);
  }
}
