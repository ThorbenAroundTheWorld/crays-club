import { baseUrl, redirect, sendJson } from "../_lib/customer-store.js";

export default async function handler(req, res) {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const returnTo = new URL(req.url || "/", baseUrl(req)).searchParams.get("returnTo") || "/account";
  if (!clientId) {
    redirect(res, "/account?auth_provider=linkedin&auth_error=missing_linkedin_config");
    return;
  }

  const redirectUri = baseUrl(req) + "/api/auth/linkedin/callback";
  const state = Buffer.from(JSON.stringify({ returnTo })).toString("base64url");
  const url = new URL("https://www.linkedin.com/oauth/v2/authorization");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("scope", "openid profile email");

  if (req.method !== "GET") {
    sendJson(res, 405, { ok: false, error: "Method not allowed" });
    return;
  }

  redirect(res, url.toString());
}
