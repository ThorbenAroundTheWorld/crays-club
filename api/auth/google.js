import { baseUrl, redirect, sendJson } from "../_lib/customer-store.js";

export default async function handler(req, res) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const returnTo = new URL(req.url || "/", baseUrl(req)).searchParams.get("returnTo") || "/account";
  if (!clientId) {
    redirect(res, "/account?auth_provider=google&auth_error=missing_google_config");
    return;
  }

  const redirectUri = baseUrl(req) + "/api/auth/google/callback";
  const state = Buffer.from(JSON.stringify({ returnTo })).toString("base64url");
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("prompt", "select_account");

  if (req.method !== "GET") {
    sendJson(res, 405, { ok: false, error: "Method not allowed" });
    return;
  }

  redirect(res, url.toString());
}
