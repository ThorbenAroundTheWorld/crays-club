import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();

const webflowLinks = `    <link href="/assets/cdn.prod.website-files.com/63e5f31f1f89c34810a4fbcf/css/crays.webflow.shared.393344c62.css" rel="stylesheet" type="text/css" />
    <link href="/assets/crays-world-integration.css" rel="stylesheet" type="text/css" />`;

const groups = [
  {
    target: "about-us/index.html",
    version: "about-full-1",
    title: "Full Original About Content",
    intro:
      "All previous About Us source pages are preserved below in full, then wrapped into the current Crays Club page.",
    sources: [
      ["Original Team", "about-us/team/index.html"],
      ["Vision 2025", "about-us/vision/index.html"],
      ["Digital Nomads", "about-us/digital-nomads/index.html"],
      ["Remote Working", "about-us/remote-working/index.html"],
    ],
  },
  {
    target: "become-a-member/index.html",
    version: "member-full-1",
    title: "Full Original Membership Content",
    intro:
      "All original membership, living, sustainability, business and creator partner content is preserved below.",
    sources: [
      ["Subscription Living", "about-us/subscription-living/index.html"],
      ["Sustainable Living", "community-life/sustainable-living/index.html"],
      ["Business Clients", "work-with-us/business-clients/index.html"],
      ["Social Media", "work-with-us/socialmedia/index.html"],
    ],
  },
  {
    target: "community-life/index.html",
    version: "community-full-1",
    title: "Full Original Community Life Content",
    intro:
      "All previous Community Life source pages are preserved below: work, live, play and global citizen.",
    sources: [
      ["Work", "community-life/work/index.html"],
      ["Live", "community-life/live/index.html"],
      ["Play", "community-life/play/index.html"],
      ["Global Citizen", "community-life/global-citizen/index.html"],
    ],
  },
];

function withSlashes(file) {
  return file.split(path.sep).join("/");
}

function stripScripts(html) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "");
}

function extractPageContent(html, label, sourcePath) {
  const candidates = [
    /<main\b[^>]*>/i,
    /<header\b[^>]*class="[^"]*section_/i,
    /<section\b[^>]*class="[^"]*section_/i,
  ];
  let start = -1;
  for (const candidate of candidates) {
    const match = candidate.exec(html);
    if (match && match.index >= 0) {
      start = match.index;
      break;
    }
  }
  if (start < 0) {
    const bodyMatch = /<body\b[^>]*>/i.exec(html);
    start = bodyMatch ? bodyMatch.index + bodyMatch[0].length : 0;
  }

  const footerMatch = /<footer\b/i.exec(html.slice(start));
  const end = footerMatch ? start + footerMatch.index : html.length;
  const content = stripScripts(html.slice(start, end)).trim();

  return `<article class="member-legacy-source" id="full-${slugify(label)}">
  <div class="shell member-legacy-source-head">
    <p class="club-eyebrow">Original Source</p>
    <h2>${escapeHtml(label)}</h2>
    <p>Imported from <code>${escapeHtml(withSlashes(sourcePath))}</code>.</p>
  </div>
  <div class="member-legacy-webflow">
${content}
  </div>
</article>`;
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function replaceMarked(html, marker, replacement) {
  const pattern = new RegExp(`\\n?\\s*<!-- ${marker}:start -->[\\s\\S]*?<!-- ${marker}:end -->\\s*`, "i");
  if (pattern.test(html)) {
    return html.replace(pattern, `\n${replacement}\n`);
  }
  return html.replace(/\s*<\/main>/i, `\n${replacement}\n    </main>`);
}

function ensureHeadLinks(html) {
  if (!html.includes("crays.webflow.shared.393344c62.css")) {
    html = html.replace(
      /(\s*<link rel="stylesheet" href="\/assets\/crays-club\/styles\.css[^>]*>\s*)/i,
      `${webflowLinks}\n$1`,
    );
  }
  return html;
}

function bumpCraysCss(html, version) {
  return html.replace(
    /\/assets\/crays-club\/styles\.css\?v=[^"']+/,
    `/assets/crays-club/styles.css?v=${version}`,
  );
}

async function mergeGroup(group) {
  let html = await readFile(path.join(root, group.target), "utf8");
  html = ensureHeadLinks(html);
  html = bumpCraysCss(html, group.version);

  const blocks = [];
  for (const [label, relativePath] of group.sources) {
    const sourcePath = path.join(root, relativePath);
    const sourceHtml = await readFile(sourcePath, "utf8");
    blocks.push(extractPageContent(sourceHtml, label, relativePath));
  }

  const section = `      <!-- full-original-content:start -->
      <section class="member-section member-legacy" id="full-original-content" aria-label="${escapeHtml(group.title)}">
        <div class="shell member-section-head member-legacy-head">
          <p class="club-eyebrow">Full Source Content</p>
          <h2>${escapeHtml(group.title)}</h2>
          <p>${escapeHtml(group.intro)}</p>
        </div>
        <div class="member-legacy-index shell" aria-label="Original source page index">
${group.sources
  .map(([label]) => `          <a href="#full-${slugify(label)}">${escapeHtml(label)}</a>`)
  .join("\n")}
        </div>
${blocks.join("\n")}
      </section>
      <!-- full-original-content:end -->`;

  html = replaceMarked(html, "full-original-content", section);
  await writeFile(path.join(root, group.target), html, "utf8");
}

for (const group of groups) {
  await mergeGroup(group);
}

console.log("Merged full original content into consolidated nav pages.");
