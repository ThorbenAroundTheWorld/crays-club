import nodemailer from "nodemailer";

const DEFAULT_TO = "info@crays.org";
const MAX_BODY_BYTES = 256 * 1024;

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function clean(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function cleanLong(value) {
  return String(value || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function readStream(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    let body = "";

    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(Object.assign(new Error("Request body is too large."), { statusCode: 413 }));
        req.destroy();
        return;
      }
      body += chunk;
    });

    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

async function parseBody(req) {
  const contentType = String(req.headers["content-type"] || "");
  let raw = req.body;

  if (raw === undefined) {
    raw = await readStream(req);
  }

  if (raw && typeof raw === "object" && !Buffer.isBuffer(raw)) {
    return raw;
  }

  const text = Buffer.isBuffer(raw) ? raw.toString("utf8") : String(raw || "");
  if (!text.trim()) {
    return {};
  }

  if (contentType.includes("application/x-www-form-urlencoded")) {
    return Object.fromEntries(new URLSearchParams(text));
  }

  return JSON.parse(text);
}

function normalizeApplication(body, req) {
  const application = {
    firstName: clean(body.firstName),
    lastName: clean(body.lastName),
    email: clean(body.email).toLowerCase(),
    phone: clean(body.phone),
    targetCountry: clean(body.targetCountry || body.market || body.region),
    targetGroup: clean(body.targetGroup),
    propertyType: clean(body.propertyType || body.assetType),
    website: clean(body.website),
    message: cleanLong(body.message || body.projectNote),
    formLocation: clean(body.formLocation),
    sourceUrl: clean(body.sourceUrl),
    userAgent: clean(req.headers["user-agent"]),
    submittedAt: new Date().toISOString()
  };

  application.fullName = clean(`${application.firstName} ${application.lastName}`);
  application.privacyAccepted = body.privacyAccepted === true || body.privacyAccepted === "true" || body.privacyAccepted === "yes" || body.privacyAccepted === "on";
  application.honeypot = clean(body.companyWebsite || body.websiteConfirm || body.company || body.urlCheck);

  return application;
}

function validate(application) {
  const missing = [];

  if (!application.firstName) missing.push("firstName");
  if (!application.lastName) missing.push("lastName");
  if (!application.email || !isEmail(application.email)) missing.push("email");
  if (!application.targetCountry) missing.push("targetCountry");
  if (!application.targetGroup) missing.push("targetGroup");
  if (!application.propertyType) missing.push("propertyType");
  if (!application.message) missing.push("message");
  if (!application.privacyAccepted) missing.push("privacyAccepted");

  return missing;
}

function fieldRows(application) {
  return [
    ["Name", application.fullName],
    ["Email", application.email],
    ["Phone", application.phone || "-"],
    ["Target country / destination", application.targetCountry],
    ["Target group", application.targetGroup],
    ["Asset or concept", application.propertyType],
    ["Website", application.website || "-"],
    ["Form location", application.formLocation || "-"],
    ["Source URL", application.sourceUrl || "-"],
    ["Submitted at", application.submittedAt],
    ["User agent", application.userAgent || "-"]
  ];
}

function textEmail(application) {
  const lines = [
    "New Crays Club Brand as a Service application",
    "",
    ...fieldRows(application).flatMap(([label, value]) => [`${label}: ${value}`]),
    "",
    "Project note:",
    application.message
  ];

  return lines.join("\n");
}

function htmlEmail(application) {
  const rows = fieldRows(application)
    .map(([label, value]) => `
      <tr>
        <th style="text-align:left;padding:10px 12px;background:#071827;color:#ffffff;border-bottom:1px solid #d8e0ea;width:220px;">${escapeHtml(label)}</th>
        <td style="padding:10px 12px;border-bottom:1px solid #d8e0ea;color:#071827;">${escapeHtml(value)}</td>
      </tr>
    `)
    .join("");

  return `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#071827;background:#f5f7fb;padding:24px;">
      <div style="max-width:720px;margin:0 auto;background:#ffffff;border:1px solid #d8e0ea;border-radius:10px;overflow:hidden;">
        <div style="background:#06111d;color:#ffffff;padding:22px 24px;border-left:6px solid #ff1f57;">
          <p style="margin:0 0 8px;color:#ff1f57;font-weight:700;text-transform:uppercase;font-size:12px;letter-spacing:.06em;">Crays Club Brand as a Service</p>
          <h1 style="margin:0;font-size:24px;line-height:1.2;">New application from ${escapeHtml(application.fullName)}</h1>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:15px;">${rows}</table>
        <div style="padding:20px 24px;">
          <h2 style="margin:0 0 10px;font-size:18px;">Project note</h2>
          <p style="white-space:pre-line;margin:0;">${escapeHtml(application.message)}</p>
        </div>
      </div>
    </div>
  `;
}

function smtpConfig() {
  const host = process.env.SMTP_HOST || "smtp.office365.com";
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || "false").toLowerCase() === "true";
  const user = process.env.SMTP_USER || process.env.FRANCHISE_SMTP_USER || DEFAULT_TO;
  const pass = process.env.SMTP_PASS || process.env.FRANCHISE_SMTP_PASS;
  const to = process.env.FRANCHISE_APPLICATION_TO || DEFAULT_TO;
  const from = process.env.FRANCHISE_APPLICATION_FROM || `Crays Club <${user}>`;

  return { host, port, secure, user, pass, to, from };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method === "GET") {
    const config = smtpConfig();
    sendJson(res, 200, {
      ok: true,
      service: "crays-franchise-application",
      recipient: config.to,
      configured: Boolean(config.user && config.pass)
    });
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { ok: false, error: "Method not allowed" });
    return;
  }

  try {
    const body = await parseBody(req);
    const application = normalizeApplication(body, req);

    if (application.honeypot) {
      sendJson(res, 200, { ok: true, message: "Application received." });
      return;
    }

    const missing = validate(application);
    if (missing.length) {
      sendJson(res, 400, {
        ok: false,
        error: "Please complete the required fields.",
        fields: missing
      });
      return;
    }

    const config = smtpConfig();
    if (!config.user || !config.pass) {
      sendJson(res, 503, { ok: false, error: "Mail delivery is not configured yet." });
      return;
    }

    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      requireTLS: !config.secure,
      auth: {
        user: config.user,
        pass: config.pass
      },
      tls: {
        minVersion: "TLSv1.2"
      }
    });

    const market = application.targetCountry || "new market";
    const subject = `Crays Club Brand as a Service application - ${application.fullName} - ${market}`;

    await transporter.sendMail({
      from: config.from,
      to: config.to,
      replyTo: `${application.fullName} <${application.email}>`,
      subject,
      text: textEmail(application),
      html: htmlEmail(application)
    });

    sendJson(res, 200, {
      ok: true,
      message: `Application sent to ${config.to}.`
    });
  } catch (error) {
    sendJson(res, error.statusCode || 500, {
      ok: false,
      error: error.statusCode === 413 ? error.message : "Application could not be sent. Please try again or email info@crays.org directly."
    });
  }
}
