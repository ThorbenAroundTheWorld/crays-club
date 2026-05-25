import { normalizeCustomer, requestContext, saveCustomerRecord, sendJson, setCustomerSessionCookie } from "./_lib/customer-store.js";

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
    sendJson(res, 200, {
      ok: true,
      service: "craysclub-customers",
      accepts: ["customer.upsert", "checkout.requested"],
      persistence: {
        backendApi: Boolean(process.env.CRAYS_CUSTOMERS_API_URL || process.env.CRAYS_BACKEND_URL),
        kv: Boolean((process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL) && (process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN))
      }
    });
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { ok: false, error: "Method not allowed" });
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const type = body.type || "customer.upsert";
    const customer = normalizeCustomer(body.customer || body, type, body.context || requestContext(req));
    const result = await saveCustomerRecord(customer);
    setCustomerSessionCookie(req, res, customer);
    sendJson(res, 200, {
      ok: true,
      persistence: result.persistence,
      customer: {
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        name: customer.name,
        phone: customer.phone,
        intent: customer.intent,
        provider: customer.provider,
        updatedAt: customer.updatedAt
      }
    });
  } catch (error) {
    sendJson(res, error.statusCode || 500, {
      ok: false,
      error: error.message || "Customer sync failed",
      requiredEnv: [
        "CRAYS_CUSTOMERS_API_URL",
        "CRAYS_CUSTOMERS_API_TOKEN",
        "KV_REST_API_URL",
        "KV_REST_API_TOKEN"
      ]
    });
  }
}
