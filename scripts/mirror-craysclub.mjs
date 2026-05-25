import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const assetDir = path.join(rootDir, "assets");
const origin = "https://www.craysclub.com";

const pages = [
  { url: `${origin}/`, output: "index.html" },
  { url: `${origin}/legal/imprint`, output: path.join("legal", "imprint", "index.html") },
  {
    url: `${origin}/legal/privacy-policy`,
    output: path.join("legal", "privacy-policy", "index.html"),
  },
];

const localAssetHosts = new Set([
  "ajax.googleapis.com",
  "cdn.prod.website-files.com",
  "d3e54v103j8qbb.cloudfront.net",
  "embed.typeform.com",
  "www.googletagmanager.com",
]);

const downloadedAssets = new Map();

function isSkippableUrl(value) {
  const trimmed = value.trim();
  return (
    trimmed === "" ||
    trimmed.startsWith("#") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("mailto:") ||
    trimmed.startsWith("tel:") ||
    trimmed.startsWith("javascript:")
  );
}

function decodePathSegment(segment) {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

function sanitizePathSegment(segment) {
  return decodePathSegment(segment).replace(/[<>:"\\|?*\u0000-\u001f]/g, "_");
}

function inferExtension(contentType) {
  const type = contentType.split(";")[0].trim().toLowerCase();
  if (type.includes("javascript")) return ".js";
  if (type === "text/css") return ".css";
  if (type === "text/html") return ".html";
  if (type === "image/svg+xml") return ".svg";
  if (type === "image/jpeg") return ".jpg";
  if (type === "image/png") return ".png";
  if (type === "image/webp") return ".webp";
  if (type === "image/gif") return ".gif";
  if (type === "font/woff2") return ".woff2";
  if (type === "font/woff") return ".woff";
  return "";
}

function getAssetPaths(assetUrl, contentType = "") {
  const url = new URL(assetUrl);
  const rawSegments = url.pathname.split("/").filter(Boolean);
  const segments = [url.hostname, ...rawSegments.map(sanitizePathSegment)];
  let filename = segments.pop() || "index";
  let extension = path.extname(filename);

  if (!extension) {
    extension = inferExtension(contentType);
    filename += extension;
  }

  if (url.search) {
    const hash = createHash("sha1").update(url.search).digest("hex").slice(0, 8);
    const stem = filename.slice(0, filename.length - extension.length) || filename;
    filename = extension ? `${stem}__q_${hash}${extension}` : `${filename}__q_${hash}`;
  }

  const fileSegments = ["assets", ...segments, filename];
  const filePath = path.join(rootDir, ...fileSegments);
  const publicUrl = `/${fileSegments.map(encodeURIComponent).join("/")}`;

  return { filePath, publicUrl };
}

async function replaceAsync(input, regex, callback) {
  const parts = [];
  let cursor = 0;

  for (const match of input.matchAll(regex)) {
    parts.push(input.slice(cursor, match.index));
    parts.push(await callback(match));
    cursor = match.index + match[0].length;
  }

  parts.push(input.slice(cursor));
  return parts.join("");
}

async function localizeUrl(rawValue, baseUrl) {
  if (isSkippableUrl(rawValue)) return rawValue;

  let assetUrl;
  try {
    assetUrl = new URL(rawValue, baseUrl);
  } catch {
    return rawValue;
  }

  if (!["http:", "https:"].includes(assetUrl.protocol)) return rawValue;
  if (!localAssetHosts.has(assetUrl.hostname)) return rawValue;
  if (assetUrl.pathname === "/") return rawValue;

  return downloadAsset(assetUrl.href);
}

async function processSrcset(srcset, baseUrl) {
  const entries = srcset.split(",").map((entry) => entry.trim()).filter(Boolean);
  const rewritten = [];

  for (const entry of entries) {
    const [urlPart, ...descriptorParts] = entry.split(/\s+/);
    const localUrl = await localizeUrl(urlPart, baseUrl);
    rewritten.push([localUrl, ...descriptorParts].join(" "));
  }

  return rewritten.join(", ");
}

async function processCss(css, baseUrl) {
  return replaceAsync(css, /url\(\s*(['"]?)(.*?)\1\s*\)/g, async (match) => {
    const [, quote, value] = match;
    const localValue = await localizeUrl(value, baseUrl);
    return `url(${quote}${localValue}${quote})`;
  });
}

async function processHtml(html, baseUrl) {
  let output = html.replace(
    /<link\s+href=(["'])https:\/\/cdn\.prod\.website-files\.com\1\s+rel=(["'])preconnect\2[^>]*\/?>/g,
    "",
  );

  output = await replaceAsync(
    output,
    /\b(src|href|poster)=("([^"]*)"|'([^']*)')/g,
    async (match) => {
      const attribute = match[1];
      const quoted = match[2];
      const value = match[3] ?? match[4] ?? "";
      const quote = quoted.startsWith("'") ? "'" : '"';
      const localValue = await localizeUrl(value, baseUrl);
      return `${attribute}=${quote}${localValue}${quote}`;
    },
  );

  output = await replaceAsync(
    output,
    /\bsrcset=("([^"]*)"|'([^']*)')/g,
    async (match) => {
      const quoted = match[1];
      const value = match[2] ?? match[3] ?? "";
      const quote = quoted.startsWith("'") ? "'" : '"';
      const localValue = await processSrcset(value, baseUrl);
      return `srcset=${quote}${localValue}${quote}`;
    },
  );

  output = await replaceAsync(
    output,
    /\bstyle=("([^"]*)"|'([^']*)')/g,
    async (match) => {
      const quoted = match[1];
      const value = match[2] ?? match[3] ?? "";
      const quote = quoted.startsWith("'") ? "'" : '"';
      const localValue = await processCss(value, baseUrl);
      return `style=${quote}${localValue}${quote}`;
    },
  );

  return output;
}

async function downloadAsset(assetUrl) {
  if (downloadedAssets.has(assetUrl)) return downloadedAssets.get(assetUrl);

  const response = await fetch(assetUrl, {
    headers: {
      "user-agent": "Mozilla/5.0 (compatible; CraysClubMirror/1.0)",
    },
  });

  if (!response.ok) {
    console.warn(`skip ${assetUrl}: ${response.status} ${response.statusText}`);
    downloadedAssets.set(assetUrl, assetUrl);
    return assetUrl;
  }

  const contentType = response.headers.get("content-type") || "";
  const { filePath, publicUrl } = getAssetPaths(assetUrl, contentType);
  downloadedAssets.set(assetUrl, publicUrl);

  await mkdir(path.dirname(filePath), { recursive: true });

  if (contentType.includes("text/css") || filePath.endsWith(".css")) {
    const css = await response.text();
    await writeFile(filePath, await processCss(css, assetUrl), "utf8");
  } else {
    const bytes = Buffer.from(await response.arrayBuffer());
    await writeFile(filePath, bytes);
  }

  console.log(`asset ${publicUrl}`);
  return publicUrl;
}

async function mirrorPage(page) {
  const response = await fetch(page.url, {
    headers: {
      "user-agent": "Mozilla/5.0 (compatible; CraysClubMirror/1.0)",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${page.url}: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const rewritten = await processHtml(html, page.url);
  const outputPath = path.join(rootDir, page.output);

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, rewritten, "utf8");
  console.log(`page ${page.output}`);
}

async function main() {
  await mkdir(assetDir, { recursive: true });

  for (const page of pages) {
    await mirrorPage(page);
  }

  const readmePath = path.join(rootDir, "README.md");
  try {
    await readFile(readmePath, "utf8");
  } catch {
    await writeFile(readmePath, "# Crays Club static Vercel export\n", "utf8");
  }

  console.log(`done: ${pages.length} pages, ${downloadedAssets.size} assets`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
