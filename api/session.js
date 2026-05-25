import { readCustomerSession, sendJson } from "./_lib/customer-store.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    sendJson(res, 405, { ok: false, error: "Method not allowed" });
    return;
  }

  const customer = readCustomerSession(req);
  if (!customer) {
    sendJson(res, 401, { ok: false, error: "No active Crays customer session." });
    return;
  }

  sendJson(res, 200, {
    ok: true,
    customer
  });
}
