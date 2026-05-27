import nodemailer from "nodemailer";

const DEFAULT_TO = "info@crays.org";
const MAX_BODY_BYTES = 256 * 1024;
const PROVIDERS = {
  RESEND: "resend",
  GRAPH: "microsoft-graph",
  SMTP: "smtp"
};

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

function envValue(name) {
  const value = String(process.env[name] || "").trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1).trim();
  }

  return value;
}

function firstEnv(names) {
  for (const name of names) {
    const value = envValue(name);
    if (value) return value;
  }

  return "";
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

function emailAddressFrom(value) {
  const text = clean(value);
  const bracketMatch = text.match(/<([^<>\s@]+@[^<>\s@]+\.[^<>\s@]+)>/);
  if (bracketMatch) return bracketMatch[1].toLowerCase();

  const emailMatch = text.match(/[^\s<>,;]+@[^\s<>,;]+\.[^\s<>,;]+/);
  return emailMatch ? emailMatch[0].toLowerCase() : "";
}

function parseRecipients(value) {
  return String(value || DEFAULT_TO)
    .split(/[;,]/)
    .map((item) => emailAddressFrom(item) || clean(item))
    .filter(Boolean);
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

function normalizeProvider(value) {
  const provider = clean(value).toLowerCase();
  if (provider === "graph" || provider === "msgraph" || provider === "microsoft") return PROVIDERS.GRAPH;
  if (provider === PROVIDERS.RESEND || provider === PROVIDERS.GRAPH || provider === PROVIDERS.SMTP) return provider;
  return "";
}

function smtpConfig(to, fallbackFrom) {
  const user = firstEnv(["SMTP_USER", "FRANCHISE_SMTP_USER"]) || DEFAULT_TO;

  return {
    provider: PROVIDERS.SMTP,
    host: firstEnv(["SMTP_HOST"]) || "smtp.office365.com",
    port: Number(firstEnv(["SMTP_PORT"]) || 587),
    secure: firstEnv(["SMTP_SECURE"]).toLowerCase() === "true",
    authMethod: firstEnv(["SMTP_AUTH_METHOD"]) || "LOGIN",
    user,
    pass: firstEnv(["SMTP_PASS", "FRANCHISE_SMTP_PASS"]),
    to,
    recipients: parseRecipients(to),
    from: fallbackFrom || `Crays Club <${user}>`
  };
}

function mailConfig() {
  const to = firstEnv(["FRANCHISE_APPLICATION_TO"]) || DEFAULT_TO;
  const fallbackFrom = firstEnv(["FRANCHISE_APPLICATION_FROM"]);
  const graphFrom = firstEnv([
    "MS_GRAPH_FROM",
    "MICROSOFT_GRAPH_FROM",
    "GRAPH_FROM",
    "FRANCHISE_GRAPH_FROM",
    "SMTP_USER",
    "FRANCHISE_SMTP_USER"
  ]);

  const config = {
    providerPreference: normalizeProvider(firstEnv(["FRANCHISE_MAIL_PROVIDER", "MAIL_PROVIDER"])),
    to,
    providers: {
      [PROVIDERS.RESEND]: {
        provider: PROVIDERS.RESEND,
        apiKey: firstEnv(["RESEND_API_KEY", "FRANCHISE_RESEND_API_KEY"]),
        to,
        recipients: parseRecipients(to),
        from: firstEnv(["RESEND_FROM", "FRANCHISE_RESEND_FROM"]) || fallbackFrom || `Crays Club <${DEFAULT_TO}>`
      },
      [PROVIDERS.GRAPH]: {
        provider: PROVIDERS.GRAPH,
        tenantId: firstEnv(["MS_GRAPH_TENANT_ID", "MICROSOFT_GRAPH_TENANT_ID", "GRAPH_TENANT_ID"]),
        clientId: firstEnv(["MS_GRAPH_CLIENT_ID", "MICROSOFT_GRAPH_CLIENT_ID", "GRAPH_CLIENT_ID"]),
        clientSecret: firstEnv(["MS_GRAPH_CLIENT_SECRET", "MICROSOFT_GRAPH_CLIENT_SECRET", "GRAPH_CLIENT_SECRET"]),
        mailbox: firstEnv(["MS_GRAPH_MAILBOX", "MICROSOFT_GRAPH_MAILBOX", "GRAPH_MAILBOX"]) || emailAddressFrom(graphFrom) || DEFAULT_TO,
        to,
        recipients: parseRecipients(to)
      }
    }
  };

  config.providers[PROVIDERS.SMTP] = smtpConfig(to, fallbackFrom);
  return config;
}

function isProviderConfigured(providerConfig) {
  if (!providerConfig) return false;
  if (providerConfig.provider === PROVIDERS.RESEND) return Boolean(providerConfig.apiKey && providerConfig.from && providerConfig.recipients.length);
  if (providerConfig.provider === PROVIDERS.GRAPH) {
    return Boolean(
      providerConfig.tenantId &&
      providerConfig.clientId &&
      providerConfig.clientSecret &&
      providerConfig.mailbox &&
      providerConfig.recipients.length
    );
  }
  if (providerConfig.provider === PROVIDERS.SMTP) return Boolean(providerConfig.user && providerConfig.pass && providerConfig.recipients.length);
  return false;
}

function providerStatus(config) {
  return Object.fromEntries(
    Object.entries(config.providers).map(([provider, providerConfig]) => [provider, isProviderConfigured(providerConfig)])
  );
}

function orderedProviders(config) {
  if (config.providerPreference) {
    return [config.providers[config.providerPreference]].filter(Boolean);
  }

  return [config.providers[PROVIDERS.RESEND], config.providers[PROVIDERS.GRAPH], config.providers[PROVIDERS.SMTP]];
}

function activeProvider(config) {
  return orderedProviders(config).find(isProviderConfigured) || null;
}

function createSubject(application) {
  const market = application.targetCountry || "new market";
  return `Crays Club Brand as a Service application - ${application.fullName} - ${market}`;
}

async function responseText(response) {
  const text = await response.text().catch(() => "");
  return text.replace(/\s+/g, " ").trim().slice(0, 800);
}

function deliveryError(message, statusCode = 502) {
  return Object.assign(new Error(message), { statusCode });
}

async function sendWithResend(config, application, subject) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: config.from,
      to: config.recipients,
      reply_to: `${application.fullName} <${application.email}>`,
      subject,
      text: textEmail(application),
      html: htmlEmail(application)
    })
  });

  if (!response.ok) {
    throw deliveryError(`Resend API returned ${response.status}: ${await responseText(response)}`);
  }

  const payload = await response.json().catch(() => ({}));
  return { provider: PROVIDERS.RESEND, id: payload.id || null };
}

async function getGraphToken(config) {
  const params = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials"
  });

  const response = await fetch(`https://login.microsoftonline.com/${encodeURIComponent(config.tenantId)}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params
  });

  if (!response.ok) {
    throw deliveryError(`Microsoft Graph token request returned ${response.status}: ${await responseText(response)}`);
  }

  const payload = await response.json();
  if (!payload.access_token) {
    throw deliveryError("Microsoft Graph token response did not include an access token.");
  }

  return payload.access_token;
}

async function sendWithGraph(config, application, subject) {
  const token = await getGraphToken(config);
  const response = await fetch(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(config.mailbox)}/sendMail`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: {
        subject,
        body: {
          contentType: "HTML",
          content: htmlEmail(application)
        },
        toRecipients: config.recipients.map((address) => ({
          emailAddress: { address }
        })),
        replyTo: [
          {
            emailAddress: {
              address: application.email,
              name: application.fullName
            }
          }
        ]
      },
      saveToSentItems: true
    })
  });

  if (!response.ok) {
    throw deliveryError(`Microsoft Graph sendMail returned ${response.status}: ${await responseText(response)}`);
  }

  return { provider: PROVIDERS.GRAPH, id: null };
}

async function sendWithSmtp(config, application, subject) {
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    requireTLS: !config.secure,
    auth: {
      user: config.user,
      pass: config.pass
    },
    authMethod: config.authMethod,
    tls: {
      minVersion: "TLSv1.2"
    }
  });

  const result = await transporter.sendMail({
    from: config.from,
    to: config.recipients,
    replyTo: `${application.fullName} <${application.email}>`,
    subject,
    text: textEmail(application),
    html: htmlEmail(application)
  });

  return { provider: PROVIDERS.SMTP, id: result.messageId || null };
}

async function sendApplicationMail(config, application) {
  const subject = createSubject(application);
  const candidates = orderedProviders(config);
  const errors = [];

  for (const candidate of candidates) {
    if (!isProviderConfigured(candidate)) {
      errors.push(`${candidate.provider} is not fully configured`);
      continue;
    }

    try {
      if (candidate.provider === PROVIDERS.RESEND) return await sendWithResend(candidate, application, subject);
      if (candidate.provider === PROVIDERS.GRAPH) return await sendWithGraph(candidate, application, subject);
      if (candidate.provider === PROVIDERS.SMTP) return await sendWithSmtp(candidate, application, subject);
    } catch (error) {
      errors.push(`${candidate.provider}: ${error.message}`);
      console.error(`[franchise-application] ${candidate.provider} delivery failed:`, error.message);

      if (config.providerPreference) {
        break;
      }
    }
  }

  const statusCode = errors.every((message) => message.includes("not fully configured")) ? 503 : 502;
  throw deliveryError(`Mail delivery failed. ${errors.join("; ")}`, statusCode);
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
    const config = mailConfig();
    const provider = activeProvider(config);
    sendJson(res, 200, {
      ok: true,
      service: "crays-franchise-application",
      recipient: config.to,
      provider: provider ? provider.provider : null,
      configured: Boolean(provider),
      providers: providerStatus(config)
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

    const config = mailConfig();
    if (!activeProvider(config)) {
      sendJson(res, 503, { ok: false, error: "Mail delivery is not configured yet." });
      return;
    }

    const delivery = await sendApplicationMail(config, application);

    sendJson(res, 200, {
      ok: true,
      message: `Application sent to ${config.to}.`,
      provider: delivery.provider
    });
  } catch (error) {
    console.error("[franchise-application] request failed:", error.message);
    sendJson(res, error.statusCode || 500, {
      ok: false,
      error: error.statusCode === 413 ? error.message : "Application could not be sent. Please try again or email info@crays.org directly."
    });
  }
}
