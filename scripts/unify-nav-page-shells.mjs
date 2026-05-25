import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const source = await readFile(path.join(root, "about-us/index.html"), "utf8");
const header = source.match(/<header class="crays-unified-header[\s\S]*?<\/header>/i)?.[0];
const footer = source.match(/<footer class="crays-unified-footer[\s\S]*?<\/footer>/i)?.[0];

if (!header || !footer) {
  throw new Error("Could not find unified header/footer source.");
}

const pages = ["team/index.html", "lifestyle/index.html", "hospitality/index.html"];

function ensureHeadLinks(html) {
  if (!html.includes("/assets/crays-unified-nav.css")) {
    html = html.replace(
      /<\/head>/i,
      `  <link rel="stylesheet" href="/assets/crays-unified-nav.css?v=nav-fit-1" />\n</head>`,
    );
  }
  if (!html.includes("/assets/crays-club/styles.css")) {
    html = html.replace(
      /<\/head>/i,
      `  <link rel="stylesheet" href="/assets/crays-club/styles.css?v=nav-shell-1" />\n</head>`,
    );
  }
  return html;
}

function ensureBodyClass(html) {
  return html.replace(/<body\b([^>]*)class="([^"]*)"/i, (match, before, classes) => {
    if (classes.includes("craysclub-nav-page")) return match;
    return `<body${before}class="${classes} craysclub-nav-page"`;
  });
}

function removeExistingUnified(html) {
  return html
    .replace(/<header class="crays-unified-header[\s\S]*?<\/header>\s*/gi, "")
    .replace(/<footer class="crays-unified-footer[\s\S]*?<\/footer>\s*/gi, "");
}

function insertHeader(html) {
  return html.replace(/(<body\b[^>]*>)/i, `$1\n${header}\n`);
}

function insertFooter(html) {
  const asideIndex = html.search(/<aside class="crays-live-text-preserve"/i);
  if (asideIndex >= 0) {
    return `${html.slice(0, asideIndex)}${footer}\n${html.slice(asideIndex)}`;
  }
  return html.replace(/<\/body>/i, `${footer}\n</body>`);
}

for (const page of pages) {
  const file = path.join(root, page);
  let html = await readFile(file, "utf8");
  html = removeExistingUnified(html);
  html = ensureHeadLinks(html);
  html = ensureBodyClass(html);
  html = insertHeader(html);
  html = insertFooter(html);
  await writeFile(file, html, "utf8");
}

console.log("Unified header and footer on nav pages:", pages.join(", "));
