import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const languages = new Set(["en", "de", "es", "ca", "fr", "pt", "it"]);
const skipTopLevel = new Set(["assets", "api", "qa-screens", "verification", "__query", "extracted-pdf-text", ".vercel", ".codex-logs", ...languages]);
const seoAssetDir = path.join(root, "assets", "crays-seo");
const ignoredImage = /(?:logo|mark|favicon|icon|footer-icons|flag|badge|avatar|placeholder|webclip|forbes|sifted|techcrunch|_bp\.png)/i;
const ignoredTag = /(?:logo2_logo|crays-unified-brand|crays-home-brand|crays-footer|footer|brand|icon|avatar|badge)/i;

function toPosix(value) {
  return value.replace(/\\/g, "/");
}

function walk(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (dir === root && skipTopLevel.has(entry.name)) continue;
      files.push(...walk(full));
    } else if (entry.name === "index.html") {
      files.push(full);
    }
  }
  return files;
}

function routeFromFile(file) {
  const relative = toPosix(path.relative(root, file));
  if (relative === "index.html") return "/";
  return `/${relative.replace(/\/index\.html$/, "")}`;
}

function cleanText(value) {
  return String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "and")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value, fallback = "crays") {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 104)
    .replace(/-+$/g, "") || fallback;
}

function htmlEscape(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getAttr(tag, name) {
  const match = tag.match(new RegExp(`\\s${name}=(["'])([\\s\\S]*?)\\1`, "i"));
  return match ? match[2] : "";
}

function setAttr(tag, name, value) {
  const attr = `${name}="${htmlEscape(value)}"`;
  const pattern = new RegExp(`\\s${name}=(["'])[\\s\\S]*?\\1`, "i");
  if (pattern.test(tag)) return tag.replace(pattern, ` ${attr}`);
  return tag.replace(/\s*\/?>$/, (end) => ` ${attr}${end}`);
}

function removeAttr(tag, name) {
  return tag.replace(new RegExp(`\\s${name}=(["'])[\\s\\S]*?\\1`, "gi"), "");
}

function imageDimensions(buffer) {
  if (buffer.length < 24) return null;
  if (buffer[0] === 0x89 && buffer.toString("ascii", 1, 4) === "PNG") {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }
  if (buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") {
    const type = buffer.toString("ascii", 12, 16);
    if (type === "VP8X" && buffer.length >= 30) return { width: 1 + buffer.readUIntLE(24, 3), height: 1 + buffer.readUIntLE(27, 3) };
    if (type === "VP8 " && buffer.length >= 30) return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
    if (type === "VP8L" && buffer.length >= 25) {
      const b0 = buffer[21];
      const b1 = buffer[22];
      const b2 = buffer[23];
      const b3 = buffer[24];
      return { width: 1 + (((b1 & 0x3f) << 8) | b0), height: 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6)) };
    }
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset < buffer.length) {
      if (buffer[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      const marker = buffer[offset + 1];
      const size = buffer.readUInt16BE(offset + 2);
      if ((marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc5 && marker <= 0xc7) || (marker >= 0xc9 && marker <= 0xcb) || (marker >= 0xcd && marker <= 0xcf)) {
        return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
      }
      offset += 2 + size;
    }
  }
  return null;
}

function targetName(route, tag, index, url) {
  const routePart = route === "/" ? "home" : slugify(route.replace(/^\//, ""), "page");
  const alt = getAttr(tag, "alt");
  const ext = path.extname(new URL(url).pathname).toLowerCase() || ".jpg";
  return `${slugify(`${routePart} ${alt || "crays-clubs-image"}`, routePart)}-${String(index + 1).padStart(2, "0")}${ext}`;
}

async function download(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed ${response.status} for ${url}`);
  return Buffer.from(await response.arrayBuffer());
}

function shouldLocalize(url, tag) {
  return /^https:\/\/www\.crays\.org\/assets\/.+\.(?:jpe?g|png|webp)(?:[?#].*)?$/i.test(url) && !ignoredImage.test(url) && !ignoredTag.test(tag);
}

fs.mkdirSync(seoAssetDir, { recursive: true });
let changedFiles = 0;
let downloaded = 0;

for (const file of walk(root)) {
  const route = routeFromFile(file);
  const original = fs.readFileSync(file, "utf8");
  let index = 0;
  let firstVisual = true;
  const next = await replaceAsync(original, /<img\b[^>]*?\bsrc=(["'])(https:\/\/www\.crays\.org\/assets\/[^"']+\.(?:jpe?g|png|webp)(?:\?[^"']*)?)\1[^>]*>/gi, async (tag, quote, src) => {
    if (!shouldLocalize(src, tag)) return tag;
    const buffer = await download(src);
    const fileName = targetName(route, tag, index++, src);
    const target = path.join(seoAssetDir, fileName);
    if (!fs.existsSync(target) || !fs.readFileSync(target).equals(buffer)) {
      fs.writeFileSync(target, buffer);
      downloaded += 1;
    }
    const dimensions = imageDimensions(buffer);
    let nextTag = setAttr(tag, "src", `/assets/crays-seo/${fileName}`);
    if (dimensions?.width && dimensions?.height) {
      nextTag = setAttr(nextTag, "width", String(dimensions.width));
      nextTag = setAttr(nextTag, "height", String(dimensions.height));
    }
    nextTag = setAttr(nextTag, "decoding", "async");
    if (firstVisual) {
      nextTag = removeAttr(nextTag, "loading");
      nextTag = setAttr(nextTag, "loading", "eager");
      nextTag = setAttr(nextTag, "fetchpriority", "high");
      firstVisual = false;
    } else {
      nextTag = removeAttr(nextTag, "fetchpriority");
      nextTag = setAttr(nextTag, "loading", "lazy");
    }
    return nextTag;
  });
  if (next !== original) {
    fs.writeFileSync(file, next);
    changedFiles += 1;
  }
}

console.log(JSON.stringify({ changedFiles, downloaded }, null, 2));

async function replaceAsync(string, regex, callback) {
  const matches = [];
  string.replace(regex, (...args) => {
    matches.push(args);
    return args[0];
  });
  const replacements = await Promise.all(matches.map((args) => callback(...args)));
  let index = 0;
  return string.replace(regex, () => replacements[index++]);
}
