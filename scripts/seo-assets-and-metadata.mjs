import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const baseUrl = "https://www.craysclub.com";
const languages = ["en", "de", "es", "ca", "fr", "pt", "it"];
const today = "2026-05-06";
const assetsOnly = process.argv.includes("--assets-only");

const skipTopLevel = new Set([
  "assets",
  "api",
  "qa-screens",
  "verification",
  "__query",
  "extracted-pdf-text",
  ".vercel",
  ".codex-logs",
]);

const utilityRoutes = new Set([
  "/account",
  "/booking-request",
  "/booking-requests",
  "/cart",
  "/checkout",
  "/login",
  "/shopping-cart",
  "/sign-in",
  "/watch-list",
  "/watchlist",
  "/wish-list",
  "/wishlist",
]);

const ignoredImage = /(?:logo|mark|favicon|icon|footer-icons|flag|badge|avatar|placeholder|webclip|forbes|sifted|techcrunch|_bp\.png)/i;
const ignoredTag = /(?:logo2_logo|crays-unified-brand|crays-home-brand|crays-footer|footer|brand|icon|avatar|badge)/i;
const imageExt = /\.(?:jpe?g|png|webp)(?:[?#].*)?$/i;
const seoAssetDir = path.join(root, "assets", "crays-seo");

function toPosix(value) {
  return value.replace(/\\/g, "/");
}

function htmlEscape(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function xmlEscape(value) {
  return htmlEscape(value).replace(/'/g, "&apos;");
}

function decodeEntities(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&mdash;/g, "-")
    .replace(/&ndash;/g, "-")
    .replace(/&copy;/g, "(c)")
    .replace(/&trade;/g, "TM")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'");
}

function stripTags(value) {
  return decodeEntities(String(value || "").replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " "));
}

function normalizeSpace(value) {
  return stripTags(value).replace(/\s+/g, " ").trim();
}

function truncate(value, max = 158) {
  const text = normalizeSpace(value);
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), 82)).trim()}.`;
}

function slugify(value, fallback = "crays") {
  const slug = normalizeSpace(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96)
    .replace(/-+$/g, "");
  return slug || fallback;
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

function sourceFiles() {
  return walk(root).filter((file) => {
    const first = toPosix(path.relative(root, file)).split("/")[0];
    return !languages.includes(first);
  });
}

function allHtmlFiles() {
  return walk(root);
}

function routeFromFile(file) {
  const relative = toPosix(path.relative(root, file));
  if (relative === "index.html") return "/";
  return `/${relative.replace(/\/index\.html$/, "")}`;
}

function splitLanguage(route) {
  const parts = route.split("/").filter(Boolean);
  const lang = languages.includes(parts[0]) ? parts.shift() : null;
  const routeNoLang = parts.length ? `/${parts.join("/")}` : "/";
  return { lang, routeNoLang };
}

function languageRoute(lang, routeNoLang) {
  return routeNoLang === "/" ? `/${lang}` : `/${lang}${routeNoLang}`;
}

function canonicalFor(route) {
  const { lang, routeNoLang } = splitLanguage(route);
  return `${baseUrl}${lang ? route : languageRoute("en", routeNoLang)}`;
}

function localImagePath(url) {
  const clean = String(url || "").replace(/&amp;/g, "&").replace(/[?#].*$/, "");
  if (!clean.startsWith("/")) return null;
  let decoded = clean;
  try {
    decoded = decodeURIComponent(clean);
  } catch {
    decoded = clean;
  }
  const full = path.join(root, decoded.replace(/^\/+/, ""));
  return fs.existsSync(full) ? full : null;
}

function isVisualImage(url, tag = "") {
  const clean = String(url || "").replace(/[?#].*$/, "");
  return imageExt.test(clean) && !ignoredImage.test(clean) && !ignoredTag.test(tag);
}

function getAttr(tag, name) {
  const match = tag.match(new RegExp(`\\s${name}=(["'])([\\s\\S]*?)\\1`, "i"));
  return match ? match[2] : "";
}

function setAttr(tag, name, value) {
  const escaped = htmlEscape(value);
  const attr = `${name}="${escaped}"`;
  const pattern = new RegExp(`\\s${name}=(["'])[\\s\\S]*?\\1`, "i");
  if (pattern.test(tag)) return tag.replace(pattern, ` ${attr}`);
  return tag.replace(/\s*\/?>$/, (end) => ` ${attr}${end}`);
}

function removeAttr(tag, name) {
  return tag.replace(new RegExp(`\\s${name}=(["'])[\\s\\S]*?\\1`, "gi"), "");
}

function imageDimensions(file) {
  const buffer = fs.readFileSync(file);
  if (buffer.length < 24) return null;

  if (buffer[0] === 0x89 && buffer.toString("ascii", 1, 4) === "PNG") {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }

  if (buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") {
    const type = buffer.toString("ascii", 12, 16);
    if (type === "VP8X" && buffer.length >= 30) {
      const width = 1 + buffer.readUIntLE(24, 3);
      const height = 1 + buffer.readUIntLE(27, 3);
      return { width, height };
    }
    if (type === "VP8 " && buffer.length >= 30) {
      return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
    }
    if (type === "VP8L" && buffer.length >= 25) {
      const b0 = buffer[21];
      const b1 = buffer[22];
      const b2 = buffer[23];
      const b3 = buffer[24];
      return {
        width: 1 + (((b1 & 0x3f) << 8) | b0),
        height: 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6)),
      };
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

function seoImageName(route, tag, index, sourceUrl) {
  const { routeNoLang } = splitLanguage(route);
  const routePart = routeNoLang === "/" ? "home" : slugify(routeNoLang.replace(/^\//, ""), "page");
  const alt = getAttr(tag, "alt");
  const className = getAttr(tag, "class");
  const semantic = slugify(`${routePart} ${alt || className || "crays-clubs-lifestyle"}`, routePart).slice(0, 108);
  const ext = path.extname(sourceUrl.replace(/[?#].*$/, "")).toLowerCase() || ".jpg";
  return `${semantic}-${String(index + 1).padStart(2, "0")}${ext}`;
}

function copySeoAsset(sourceUrl, route, tag, index) {
  const local = localImagePath(sourceUrl);
  if (!local) return sourceUrl;
  if (sourceUrl.startsWith("/assets/crays-seo/")) return sourceUrl.replace(/[?#].*$/, "");
  fs.mkdirSync(seoAssetDir, { recursive: true });
  const fileName = seoImageName(route, tag, index, sourceUrl);
  const target = path.join(seoAssetDir, fileName);
  if (!fs.existsSync(target) || !fs.readFileSync(target).equals(fs.readFileSync(local))) {
    fs.copyFileSync(local, target);
  }
  return `/assets/crays-seo/${fileName}`;
}

function enhanceImages(html, route, rewriteAssets) {
  let visualIndex = 0;
  let firstVisual = true;
  const imgTag = /<img\b[^>]*?\bsrc=(["'])([^"']+\.(?:jpe?g|png|webp)(?:\?[^"']*)?)\1[^>]*>/gi;
  return html.replace(imgTag, (tag, quote, src) => {
    if (!isVisualImage(src, tag)) return tag;

    let nextSrc = src.replace(/&amp;/g, "&").replace(/[?#].*$/, "");
    if (rewriteAssets) nextSrc = copySeoAsset(nextSrc, route, tag, visualIndex);
    visualIndex += 1;

    let next = tag;
    next = removeAttr(next, "srcset");
    next = removeAttr(next, "sizes");
    next = setAttr(next, "src", nextSrc);

    const local = localImagePath(nextSrc);
    const dimensions = local ? imageDimensions(local) : null;
    if (dimensions?.width && dimensions?.height) {
      next = setAttr(next, "width", String(dimensions.width));
      next = setAttr(next, "height", String(dimensions.height));
    }

    const alt = getAttr(next, "alt");
    if (!alt) {
      const { routeNoLang } = splitLanguage(route);
      next = setAttr(next, "alt", routeNoLang === "/" ? "Crays Clubs lifestyle and hospitality experience" : `Crays Clubs ${routeNoLang.replace(/\//g, " ")} visual`);
    }

    next = setAttr(next, "decoding", "async");
    if (firstVisual) {
      next = removeAttr(next, "loading");
      next = setAttr(next, "loading", "eager");
      next = setAttr(next, "fetchpriority", "high");
      firstVisual = false;
    } else {
      next = removeAttr(next, "fetchpriority");
      next = setAttr(next, "loading", "lazy");
    }
    return next;
  });
}

function extractTitle(html) {
  return normalizeSpace(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || "Crays Clubs");
}

function extractDescription(html) {
  const meta = html.match(/<meta\s+name=["']description["']\s+content=["']([\s\S]*?)["']\s*\/?>/i);
  if (meta) return truncate(meta[1], 158);
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || "";
  const p = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i)?.[1] || "";
  return truncate(`${h1}. ${p}`, 158);
}

function firstVisualImage(html) {
  const imgTag = /<img\b[^>]*?\bsrc=(["'])([^"']+\.(?:jpe?g|png|webp)(?:\?[^"']*)?)\1[^>]*>/gi;
  let match;
  while ((match = imgTag.exec(html))) {
    const tag = match[0];
    const src = match[2].replace(/&amp;/g, "&").replace(/[?#].*$/, "");
    if (!isVisualImage(src, tag)) continue;
    const local = localImagePath(src);
    const dimensions = local ? imageDimensions(local) : null;
    return {
      url: src.startsWith("http") ? src : `${baseUrl}${src}`,
      alt: getAttr(tag, "alt") || "Crays Clubs lifestyle and hospitality experience",
      width: dimensions?.width,
      height: dimensions?.height,
    };
  }
  return {
    url: `${baseUrl}/assets/crays-club/crays-fund-home-logo.webp`,
    alt: "Crays Clubs",
    width: 348,
    height: 94,
  };
}

function breadcrumb(route, title) {
  const { lang, routeNoLang } = splitLanguage(route);
  const activeLang = lang || "en";
  const crumbs = [{ name: "Crays Clubs", item: `${baseUrl}/${activeLang}` }];
  if (routeNoLang !== "/") {
    const parts = routeNoLang.split("/").filter(Boolean);
    let current = "";
    parts.forEach((part, index) => {
      current += `/${part}`;
      crumbs.push({
        name: index === parts.length - 1 ? title.replace(/\s+\|\s+Crays Clubs$/i, "") : part.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()),
        item: `${baseUrl}${languageRoute(activeLang, current)}`,
      });
    });
  }
  return crumbs;
}

function pageType(routeNoLang) {
  if (routeNoLang === "/contact") return "ContactPage";
  if (routeNoLang === "/search" || routeNoLang === "/stays" || routeNoLang.startsWith("/villas")) return "CollectionPage";
  if (routeNoLang.startsWith("/legal")) return "WebPage";
  return "WebPage";
}

function jsonLd(route, title, description, image) {
  const { lang, routeNoLang } = splitLanguage(route);
  const activeLang = lang || "en";
  const canonical = canonicalFor(route);
  const crumbs = breadcrumb(route, title);
  const graph = [
    {
      "@type": "Organization",
      "@id": `${baseUrl}/#organization`,
      name: "Crays Clubs",
      alternateName: "Crays",
      url: `${baseUrl}/en`,
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/assets/crays-club/crays-fund-home-logo.webp`,
        width: 348,
        height: 94,
      },
      sameAs: [
        "https://www.linkedin.com/company/crays/",
        "https://github.com/CraysCircle",
        "https://x.com/CraysCircle",
        "https://www.instagram.com/crays_circle/",
        "https://www.youtube.com/@CraysCircle",
      ],
      contactPoint: {
        "@type": "ContactPoint",
        email: "team@craysclub.com",
        contactType: "customer support",
        availableLanguage: ["English", "German", "Spanish", "Catalan", "French", "Portuguese", "Italian"],
      },
    },
    {
      "@type": "WebSite",
      "@id": `${baseUrl}/#website`,
      name: "Crays Clubs",
      url: `${baseUrl}/en`,
      publisher: { "@id": `${baseUrl}/#organization` },
      inLanguage: activeLang,
      potentialAction: {
        "@type": "SearchAction",
        target: `${baseUrl}/${activeLang}/search?destination={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": pageType(routeNoLang),
      "@id": `${canonical}#webpage`,
      url: canonical,
      name: title,
      headline: title.replace(/\s+\|\s+Crays Clubs$/i, ""),
      description,
      inLanguage: activeLang,
      isPartOf: { "@id": `${baseUrl}/#website` },
      publisher: { "@id": `${baseUrl}/#organization` },
      dateModified: today,
      primaryImageOfPage: { "@id": `${canonical}#primaryimage` },
      breadcrumb: { "@id": `${canonical}#breadcrumb` },
    },
    {
      "@type": "ImageObject",
      "@id": `${canonical}#primaryimage`,
      url: image.url,
      contentUrl: image.url,
      caption: normalizeSpace(image.alt),
      ...(image.width ? { width: image.width } : {}),
      ...(image.height ? { height: image.height } : {}),
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${canonical}#breadcrumb`,
      itemListElement: crumbs.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: item.item,
      })),
    },
  ];
  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph });
}

function stripManagedSeo(html) {
  return html
    .replace(/\n?\s*<meta\s+name=["']robots["'][^>]*>\s*/gi, "\n")
    .replace(/\n?\s*<meta\s+name=["']author["'][^>]*>\s*/gi, "\n")
    .replace(/\n?\s*<meta\s+name=["']publisher["'][^>]*>\s*/gi, "\n")
    .replace(/\n?\s*<meta\s+name=["']language["'][^>]*>\s*/gi, "\n")
    .replace(/\n?\s*<meta\s+name=["']format-detection["'][^>]*>\s*/gi, "\n")
    .replace(/\n?\s*<meta\s+property=["']og:url["'][^>]*>\s*/gi, "\n")
    .replace(/\n?\s*<meta\s+property=["']og:image(?::(?:secure_url|type|width|height|alt))?["'][^>]*>\s*/gi, "\n")
    .replace(/\n?\s*<meta\s+name=["']twitter:[^"']+["'][^>]*>\s*/gi, "\n")
    .replace(/\n?\s*<link\s+rel=["']canonical["'][^>]*>\s*/gi, "\n")
    .replace(/\n?\s*<link\s+rel=["']alternate["']\s+hreflang=["'][^"']+["'][^>]*>\s*/gi, "\n")
    .replace(/\n?\s*<link\s+rel=["']preload["'][^>]*data-crays-seo-preload[^>]*>\s*/gi, "\n")
    .replace(/\n?\s*<script\s+type=["']application\/ld\+json["']\s+data-crays-seo-json>[\s\S]*?<\/script>\s*/gi, "\n");
}

function ensureOgImage(html, image) {
  const tag = `    <meta property="og:image" content="${htmlEscape(image.url)}" />`;
  if (/<meta\s+property=["']og:image["'][^>]*>/i.test(html)) {
    return html.replace(/<meta\s+property=["']og:image["'][^>]*>/i, tag.trim());
  }
  return html.replace(/<\/head>/i, `${tag}\n  </head>`);
}

function routeIsIndexable(routeNoLang) {
  if (utilityRoutes.has(routeNoLang)) return false;
  if (routeNoLang.startsWith("/api") || routeNoLang.startsWith("/__query")) return false;
  if (routeNoLang !== "/" && redirectSourceRoutes().has(routeNoLang)) return false;
  return true;
}

let redirectCache;
function redirectSourceRoutes() {
  if (redirectCache) return redirectCache;
  redirectCache = new Set();
  const vercelFile = path.join(root, "vercel.json");
  if (!fs.existsSync(vercelFile)) return redirectCache;
  const config = JSON.parse(fs.readFileSync(vercelFile, "utf8"));
  for (const redirect of config.redirects || []) {
    let source = redirect.source || "";
    source = source.replace(/^\/:lang\(en\|de\|es\|ca\|fr\|pt\|it\)/, "");
    if (!source) source = "/";
    if (!source.includes(":") && !source.includes("(")) redirectCache.add(source.replace(/\/$/, "") || "/");
  }
  return redirectCache;
}

function seoBlock(route, title, description, image) {
  const { lang, routeNoLang } = splitLanguage(route);
  const activeLang = lang || "en";
  const canonical = canonicalFor(route);
  const robots = routeIsIndexable(routeNoLang) ? "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" : "noindex,follow";
  const alternates = languages.map((language) => `    <link rel="alternate" hreflang="${language}" href="${baseUrl}${languageRoute(language, routeNoLang)}" />`).join("\n");
  const imageType = image.url.toLowerCase().endsWith(".webp") ? "image/webp" : image.url.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
  return [
    `    <link rel="canonical" href="${htmlEscape(canonical)}" />`,
    alternates,
    `    <link rel="alternate" hreflang="x-default" href="${baseUrl}${languageRoute("en", routeNoLang)}" />`,
    `    <meta name="robots" content="${robots}" />`,
    `    <meta name="author" content="Crays Clubs" />`,
    `    <meta name="publisher" content="Crays Clubs" />`,
    `    <meta name="format-detection" content="telephone=no" />`,
    `    <meta property="og:url" content="${htmlEscape(canonical)}" />`,
    `    <meta property="og:image:secure_url" content="${htmlEscape(image.url)}" />`,
    `    <meta property="og:image:type" content="${imageType}" />`,
    image.width ? `    <meta property="og:image:width" content="${image.width}" />` : "",
    image.height ? `    <meta property="og:image:height" content="${image.height}" />` : "",
    `    <meta property="og:image:alt" content="${htmlEscape(image.alt)}" />`,
    `    <meta name="twitter:card" content="summary_large_image" />`,
    `    <meta name="twitter:title" content="${htmlEscape(title)}" />`,
    `    <meta name="twitter:description" content="${htmlEscape(description)}" />`,
    `    <meta name="twitter:image" content="${htmlEscape(image.url)}" />`,
    `    <meta name="twitter:image:alt" content="${htmlEscape(image.alt)}" />`,
    `    <link rel="preload" as="image" href="${htmlEscape(image.url.replace(baseUrl, ""))}" fetchpriority="high" data-crays-seo-preload />`,
    `    <script type="application/ld+json" data-crays-seo-json>${jsonLd(route, title, description, image)}</script>`,
    `    <meta name="language" content="${activeLang}" />`,
  ].filter(Boolean).join("\n");
}

function enhanceMetadata(html, route) {
  let next = stripManagedSeo(html);
  const title = extractTitle(next);
  const description = extractDescription(next);
  const image = firstVisualImage(next);

  if (!/<meta\s+name=["']description["']/i.test(next)) {
    next = next.replace(/<\/title>/i, `</title>\n    <meta name="description" content="${htmlEscape(description)}" />`);
  }

  next = ensureOgImage(next, image);
  const block = seoBlock(route, title, description, image);
  return next.replace(/<\/head>/i, `${block}\n  </head>`);
}

function processAssets() {
  const files = sourceFiles();
  let changed = 0;
  for (const file of files) {
    const route = routeFromFile(file);
    const original = fs.readFileSync(file, "utf8");
    const next = enhanceImages(original, route, true);
    if (next !== original) {
      fs.writeFileSync(file, next);
      changed += 1;
    }
  }
  return { files: files.length, changed };
}

function processMetadata() {
  const files = allHtmlFiles();
  let changed = 0;
  for (const file of files) {
    const route = routeFromFile(file);
    const original = fs.readFileSync(file, "utf8");
    const withImages = enhanceImages(original, route, false);
    const next = enhanceMetadata(withImages, route);
    if (next !== original) {
      fs.writeFileSync(file, next);
      changed += 1;
    }
  }
  return { files: files.length, changed };
}

function sitemapRoutes() {
  const routes = [];
  for (const file of sourceFiles()) {
    const route = routeFromFile(file);
    const { routeNoLang } = splitLanguage(route);
    if (!routeIsIndexable(routeNoLang)) continue;
    const html = fs.readFileSync(file, "utf8");
    routes.push({
      routeNoLang,
      file,
      lastmod: fs.statSync(file).mtime.toISOString().slice(0, 10),
      image: firstVisualImage(html),
    });
  }
  return routes.sort((a, b) => a.routeNoLang.localeCompare(b.routeNoLang));
}

function priorityFor(routeNoLang) {
  if (routeNoLang === "/") return "1.0";
  if (["/search", "/become-a-member", "/contact"].includes(routeNoLang)) return "0.9";
  if (["/about-us", "/community-life", "/hospitality", "/lifestyle", "/team", "/clubs"].includes(routeNoLang)) return "0.85";
  if (routeNoLang.startsWith("/legal")) return "0.35";
  return "0.65";
}

function writeSitemap() {
  const urls = [];
  for (const entry of sitemapRoutes()) {
    for (const lang of languages) {
      const loc = `${baseUrl}${languageRoute(lang, entry.routeNoLang)}`;
      const alternates = languages.map((language) => `    <xhtml:link rel="alternate" hreflang="${language}" href="${baseUrl}${languageRoute(language, entry.routeNoLang)}" />`).join("\n");
      const image = entry.image?.url ? [
        "    <image:image>",
        `      <image:loc>${xmlEscape(entry.image.url)}</image:loc>`,
        `      <image:caption>${xmlEscape(entry.image.alt)}</image:caption>`,
        "    </image:image>",
      ].join("\n") : "";
      urls.push([
        "  <url>",
        `    <loc>${xmlEscape(loc)}</loc>`,
        `    <lastmod>${entry.lastmod || today}</lastmod>`,
        `    <priority>${priorityFor(entry.routeNoLang)}</priority>`,
        alternates,
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}${languageRoute("en", entry.routeNoLang)}" />`,
        image,
        "  </url>",
      ].filter(Boolean).join("\n"));
    }
  }
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '        xmlns:xhtml="http://www.w3.org/1999/xhtml"',
    '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
    urls.join("\n"),
    "</urlset>",
    "",
  ].join("\n");
  fs.writeFileSync(path.join(root, "sitemap.xml"), xml);
  return { routes: sitemapRoutes().length, urls: urls.length };
}

function writeRobots() {
  const robots = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /api/",
    "Disallow: /__query/",
    "Disallow: /verification/",
    "Disallow: /qa-screens/",
    "",
    `Sitemap: ${baseUrl}/sitemap.xml`,
    "",
  ].join("\n");
  fs.writeFileSync(path.join(root, "robots.txt"), robots);
}

const assetSummary = assetsOnly ? processAssets() : null;
const metadataSummary = assetsOnly ? null : processMetadata();
const sitemapSummary = assetsOnly ? null : writeSitemap();
if (!assetsOnly) writeRobots();

console.log(JSON.stringify({
  mode: assetsOnly ? "assets-only" : "metadata",
  assetSummary,
  metadataSummary,
  sitemapSummary,
  seoAssetCount: fs.existsSync(seoAssetDir) ? fs.readdirSync(seoAssetDir).length : 0,
}, null, 2));
