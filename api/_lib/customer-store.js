import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { appendFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CUSTOMER_HASH = "craysclub:customers";
const CUSTOMER_EVENTS = "craysclub:customer-events";
const SESSION_COOKIE = "crays_customer";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

function clean(value, maxLength = 500) {
  return String(value == null ? "" : value).trim().slice(0, maxLength);
}

function cleanEmail(value) {
  return clean(value, 320).toLowerCase();
}

function idFromEmail(email) {
  return "cus_" + createHash("sha256").update(email).digest("hex").slice(0, 18);
}

function safeList(value, maxItems = 100) {
  return Array.isArray(value) ? value.slice(0, maxItems).filter(Boolean) : [];
}

function safeCart(value) {
  return safeList(value, 50).map((item) => ({
    id: clean(item.id, 120),
    slug: clean(item.slug, 120),
    dateFrom: clean(item.dateFrom, 32),
    dateTo: clean(item.dateTo, 32),
    nights: Number(item.nights || 0),
    guests: Number(item.guests || 0),
    total: Number(item.total || 0),
    source: clean(item.source, 40)
  }));
}

export function normalizeCustomer(input = {}, type = "customer.upsert", context = {}) {
  const email = cleanEmail(input.email);
  if (!email || !email.includes("@")) {
    const error = new Error("A valid email address is required.");
    error.statusCode = 400;
    throw error;
  }

  const firstName = clean(input.firstName, 120);
  const lastName = clean(input.lastName, 120);
  const name = clean(input.name || [firstName, lastName].filter(Boolean).join(" "), 180);
  const id = clean(input.id, 120) || idFromEmail(email);
  const now = new Date().toISOString();

  return {
    id,
    type: clean(type, 80),
    provider: clean(input.provider || "email", 40),
    email,
    firstName,
    lastName,
    name,
    phone: clean(input.phone, 80),
    intent: clean(input.intent || "villa-booking", 80),
    source: clean(input.source || "craysclub-account", 120),
    page: clean(input.page || context.path || "", 220),
    wishList: safeList(input.wishList),
    cart: safeCart(input.cart),
    checkoutReference: clean(input.checkoutReference, 80),
    checkout: input.checkout && typeof input.checkout === "object" ? input.checkout : null,
    context: {
      path: clean(context.path, 220),
      referrer: clean(context.referrer, 500),
      userAgent: clean(context.userAgent, 500),
      ipCountry: clean(context.ipCountry, 80)
    },
    consentAt: clean(input.consentAt || now, 80),
    createdAt: clean(input.createdAt || now, 80),
    updatedAt: now
  };
}

function backendUrl() {
  const direct = process.env.CRAYS_CUSTOMERS_API_URL;
  if (direct) return direct;
  const base = process.env.CRAYS_BACKEND_URL;
  if (!base) return "";
  return base.replace(/\/$/, "") + "/api/customers";
}

async function saveToBackend(record) {
  const url = backendUrl();
  if (!url) return null;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.CRAYS_CUSTOMERS_API_TOKEN
        ? { Authorization: "Bearer " + process.env.CRAYS_CUSTOMERS_API_TOKEN }
        : {})
    },
    body: JSON.stringify({ customer: record })
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error("Backend customer API failed with " + response.status + ": " + text.slice(0, 180));
  }
  return { persistence: "backend-api", response: text ? safeJson(text) : null };
}

function kvConfig() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

async function kvCommand(command) {
  const config = kvConfig();
  if (!config) return null;
  const response = await fetch(config.url, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + config.token,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(command)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.error) {
    throw new Error("KV database write failed: " + (data.error || response.status));
  }
  return data;
}

async function saveToKv(record) {
  if (!kvConfig()) return null;
  const json = JSON.stringify(record);
  await kvCommand(["HSET", CUSTOMER_HASH, record.id, json]);
  await kvCommand(["LPUSH", CUSTOMER_EVENTS, json]);
  return { persistence: "vercel-kv" };
}

async function saveToLocalTmp(record) {
  if (process.env.NODE_ENV === "production") return null;
  const file = join(tmpdir(), "craysclub-customers.jsonl");
  await appendFile(file, JSON.stringify(record) + "\n", "utf8");
  return { persistence: "local-tmp-jsonl", file };
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch (error) {
    return null;
  }
}

export async function saveCustomerRecord(record) {
  const backend = await saveToBackend(record);
  if (backend) return backend;

  const kv = await saveToKv(record);
  if (kv) return kv;

  const local = await saveToLocalTmp(record);
  if (local) return local;

  const error = new Error("No persistent customer backend is configured. Set CRAYS_CUSTOMERS_API_URL or KV_REST_API_URL/KV_REST_API_TOKEN.");
  error.statusCode = 503;
  throw error;
}

function sessionSecret() {
  return process.env.CRAYS_SESSION_SECRET ||
    process.env.CRAYS_CUSTOMERS_API_TOKEN ||
    process.env.GOOGLE_CLIENT_SECRET ||
    process.env.LINKEDIN_CLIENT_SECRET ||
    (process.env.NODE_ENV === "production" ? "" : "crays-local-dev-session");
}

function signSession(payload) {
  const secret = sessionSecret();
  if (!secret) return "";
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function sessionCustomer(customer) {
  return {
    id: clean(customer.id, 120),
    email: cleanEmail(customer.email),
    firstName: clean(customer.firstName, 120),
    lastName: clean(customer.lastName, 120),
    name: clean(customer.name, 180),
    phone: clean(customer.phone, 80),
    intent: clean(customer.intent || "villa-booking", 80),
    provider: clean(customer.provider || "email", 40),
    source: clean(customer.source || "craysclub-account", 120),
    updatedAt: clean(customer.updatedAt || new Date().toISOString(), 80)
  };
}

export function createCustomerSession(customer) {
  const payload = Buffer.from(JSON.stringify(sessionCustomer(customer)), "utf8").toString("base64url");
  const signature = signSession(payload);
  return signature ? payload + "." + signature : "";
}

function cookieValue(req, name) {
  const header = req.headers.cookie || "";
  return header.split(";").map((part) => part.trim()).find((part) => part.startsWith(name + "="))?.slice(name.length + 1) || "";
}

export function readCustomerSession(req) {
  const value = cookieValue(req, SESSION_COOKIE);
  if (!value) return null;
  const [payload, signature] = decodeURIComponent(value).split(".");
  const expected = signSession(payload || "");
  if (!payload || !signature || !expected || signature.length !== expected.length) return null;
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch (error) {
    return null;
  }
}

export function setCustomerSessionCookie(req, res, customer) {
  const session = createCustomerSession(customer);
  if (!session) return false;
  const host = req.headers.host || "";
  const secure = host.includes("localhost") || host.startsWith("127.") ? "" : "; Secure";
  res.setHeader("Set-Cookie", SESSION_COOKIE + "=" + encodeURIComponent(session) + "; Path=/; Max-Age=" + SESSION_MAX_AGE + "; SameSite=Lax; HttpOnly" + secure);
  return true;
}

export function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(payload));
}

export function requestContext(req) {
  return {
    path: req.headers["x-crays-path"] || req.url || "",
    referrer: req.headers.referer || "",
    userAgent: req.headers["user-agent"] || "",
    ipCountry: req.headers["x-vercel-ip-country"] || ""
  };
}

export function baseUrl(req) {
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers.host || "www.craysclub.com";
  return proto + "://" + host;
}

export function redirect(res, location) {
  res.statusCode = 302;
  res.setHeader("Location", location);
  res.end();
}
