import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const languageDirs = new Set(["en", "de", "es", "ca", "fr", "pt", "it"]);
const skipTopLevel = new Set([
  "assets",
  "api",
  "qa-screens",
  "verification",
  "__query",
  "extracted-pdf-text",
  ".vercel",
  ".codex-logs",
  ...languageDirs,
]);

const ignoredUrl = /(?:logo|mark|favicon|icon|footer-icons|flag|badge|avatar|placeholder|webclip|forbes|sifted|techcrunch|_bp\.png)/i;
const ignoredTag = /(?:logo2_logo|crays-unified-brand|crays-home-brand|crays-footer|footer|brand|icon|avatar|badge)/i;
const imageExt = /\.(?:jpe?g|png|webp)(?:[?#].*)?$/i;

function walk(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (dir === root && skipTopLevel.has(entry.name)) continue;
      files.push(...walk(full));
    } else if (entry.name === "index.html" && !entry.name.startsWith("sources-")) {
      files.push(full);
    }
  }
  return files;
}

function routeFor(file) {
  const relative = path.relative(root, file).replace(/\\/g, "/");
  if (relative === "index.html") return "/";
  return `/${relative.replace(/\/index\.html$/, "")}`;
}

function normalizeUrl(url) {
  return String(url || "")
    .replace(/&amp;/g, "&")
    .replace(/\?.*$/, "")
    .trim();
}

function shouldIgnore(url, tag) {
  const normalized = normalizeUrl(url);
  return !imageExt.test(normalized) || ignoredUrl.test(normalized) || ignoredTag.test(tag);
}

function priority(route) {
  if (route === "/") return 0;
  if (/^\/(?:about-us|become-a-member|community-life|contact|hospitality|lifestyle|search|stays|team|villas|account|legal)(?:\/)?$/.test(route)) return 1;
  if (/^\/villas\//.test(route)) return 2;
  if (/^\/(?:booking-request|booking-requests|cart|checkout|shopping-cart|watch-list|watchlist|wish-list|wishlist|sign-in|login)$/.test(route)) return 2;
  if (/^\/(?:events|jobs|press-room|work-with-us)\//.test(route)) return 5;
  return 4;
}

const categoryIndexes = {
  property: [1, 18, 27, 32, 41, 51, 57, 88, 94, 105, 127, 129, 193, 198, 201, 204, 255, 259, 267, 279],
  work: [0, 2, 5, 12, 13, 17, 37, 40, 49, 55, 60, 62, 66, 70, 72, 73, 79, 82, 83, 103, 104, 109, 119, 121, 128, 136, 146, 150, 164, 187, 192, 203, 219, 229, 240, 273, 287],
  community: [4, 8, 9, 10, 20, 23, 24, 36, 39, 48, 53, 56, 69, 74, 80, 81, 95, 96, 98, 99, 100, 106, 108, 111, 112, 115, 116, 117, 140, 143, 155, 157, 163, 168, 169, 172, 174, 195, 196, 202, 208, 209, 210, 220, 228, 230, 234, 246, 251, 260, 265, 277, 282],
  event: [3, 4, 25, 36, 56, 68, 89, 108, 111, 115, 116, 118, 130, 133, 153, 155, 157, 185, 189, 208, 209, 230, 246, 258, 263, 269],
  travel: [0, 5, 12, 15, 19, 20, 31, 33, 37, 38, 40, 42, 54, 58, 60, 65, 67, 76, 77, 79, 85, 87, 90, 91, 93, 94, 97, 102, 103, 104, 105, 110, 120, 122, 123, 126, 132, 167, 175, 176, 181, 182, 183, 184, 190, 205, 207, 214, 217, 218, 222, 224, 235, 236, 237, 238, 242, 243, 244, 248, 249, 256, 272, 283, 284, 286],
};

const stockDir = path.join(root, "assets", "crays-stock");
const availableStock = new Set(
  fs.existsSync(stockDir)
    ? fs.readdirSync(stockDir).filter((name) => /^crays-stock-\d+\.jpg$/i.test(name)).map((name) => `/assets/crays-stock/${name}`)
    : [],
);
const allStock = [...availableStock].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
const pools = Object.fromEntries(
  Object.entries(categoryIndexes).map(([category, indexes]) => [
    category,
    indexes.map((index) => `/assets/crays-stock/crays-stock-${String(index).padStart(3, "0")}.jpg`).filter((asset) => availableStock.has(asset)),
  ]),
);

function categoryFor(context) {
  const text = context.toLowerCase();
  if (/(villa|villas|finca|estate|real estate|property|investor|owner|pool|terrace|mallorca|formentor|marbella)/.test(text)) return "property";
  if (/(event|events|party|night|club|festival|play|music|culture|coachella|techno)/.test(text)) return "event";
  if (/(work|career|job|engineer|business|founder|team|office|remote|nomad|cowork|co-working)/.test(text)) return "work";
  if (/(travel|world|airport|global|stays|beach|sea|yacht|destination|city)/.test(text)) return "travel";
  return "community";
}

const usedReplacement = new Set();

function pickReplacement(context) {
  const category = categoryFor(context);
  for (const candidate of [...(pools[category] || []), ...allStock]) {
    if (!usedReplacement.has(candidate)) {
      usedReplacement.add(candidate);
      return candidate;
    }
  }
  throw new Error("Not enough unique stock images in assets/crays-stock.");
}

function replacementAlt(context) {
  const category = categoryFor(context);
  if (category === "property") return "Crays real estate and hospitality setting";
  if (category === "event") return "Crays lifestyle event and community moment";
  if (category === "work") return "Crays work, travel and founder lifestyle moment";
  if (category === "travel") return "Crays travel and destination lifestyle moment";
  return "Crays lifestyle and community moment";
}

const imgTag = /<img\b[^>]*?\bsrc=(["'])([^"']+\.(?:jpe?g|png|webp)(?:\?[^"']*)?)\1[^>]*>/gi;
const files = walk(root).sort((a, b) => routeFor(a).localeCompare(routeFor(b)));
const occurrences = [];

for (const file of files) {
  const html = fs.readFileSync(file, "utf8");
  const route = routeFor(file);
  let ordinal = 0;
  html.replace(imgTag, (tag, quote, src) => {
    const id = `${path.relative(root, file).replace(/\\/g, "/")}#${ordinal++}`;
    const normalized = normalizeUrl(src);
    if (!shouldIgnore(normalized, tag)) {
      occurrences.push({ id, file, route, src: normalized, tag });
    }
    return tag;
  });
}

const bySrc = new Map();
for (const occurrence of occurrences) {
  if (!bySrc.has(occurrence.src)) bySrc.set(occurrence.src, []);
  bySrc.get(occurrence.src).push(occurrence);
}

const keep = new Set();
for (const group of bySrc.values()) {
  const winner = [...group].sort((a, b) => priority(a.route) - priority(b.route) || a.route.localeCompare(b.route))[0];
  keep.add(winner.id);
}

const replacementsById = new Map();
for (const group of bySrc.values()) {
  if (group.length <= 1) continue;
  for (const occurrence of group) {
    if (keep.has(occurrence.id)) continue;
    const replacement = pickReplacement(`${occurrence.route} ${occurrence.tag}`);
    replacementsById.set(occurrence.id, {
      from: occurrence.src,
      to: replacement,
      alt: replacementAlt(`${occurrence.route} ${occurrence.tag}`),
      route: occurrence.route,
    });
  }
}

const changedFiles = new Set();

for (const file of files) {
  const relative = path.relative(root, file).replace(/\\/g, "/");
  let ordinal = 0;
  const original = fs.readFileSync(file, "utf8");
  const next = original.replace(imgTag, (tag, quote, src) => {
    const id = `${relative}#${ordinal++}`;
    const replacement = replacementsById.get(id);
    if (!replacement) return tag;
    let nextTag = tag
      .replace(/\s+srcset=(["'])[\s\S]*?\1/gi, "")
      .replace(/\s+sizes=(["'])[\s\S]*?\1/gi, "")
      .replace(/\bsrc=(["'])[^"']+\1/i, `src="${replacement.to}"`);
    if (/\salt=(["'])[\s\S]*?\1/i.test(nextTag)) {
      nextTag = nextTag.replace(/\salt=(["'])[\s\S]*?\1/i, ` alt="${replacement.alt}"`);
    } else {
      nextTag = nextTag.replace(/\s*\/?>$/, ` alt="${replacement.alt}"$&`);
    }
    return nextTag;
  });
  if (next !== original) {
    fs.writeFileSync(file, next);
    changedFiles.add(relative);
  }
}

const summary = {
  scannedFiles: files.length,
  visualImages: occurrences.length,
  duplicateSources: [...bySrc.values()].filter((group) => group.length > 1).length,
  replacements: replacementsById.size,
  changedFiles: [...changedFiles].sort(),
};

fs.writeFileSync(path.join(root, "qa-screens", "image-dedupe-summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
