import { baseUrl, normalizeCustomer, redirect, saveCustomerRecord, setCustomerSessionCookie } from "../../_lib/customer-store.js";

function readState(value) {
  try {
    return JSON.parse(Buffer.from(value || "", "base64url").toString("utf8"));
  } catch (error) {
    return { returnTo: "/account" };
  }
}

export default async function handler(req, res) {
  const url = new URL(req.url || "/", baseUrl(req));
  const code = url.searchParams.get("code");
  const state = readState(url.searchParams.get("state"));
  const returnTo = state.returnTo || "/account";

  if (!code || !process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    redirect(res, "/account?auth_provider=google&auth_error=missing_google_config");
    return;
  }

  try {
    const redirectUri = baseUrl(req) + "/api/auth/google/callback";
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: "authorization_code"
      })
    });
    const token = await tokenResponse.json();
    if (!tokenResponse.ok) throw new Error(token.error_description || token.error || "Google token exchange failed");

    const userResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: "Bearer " + token.access_token }
    });
    const profile = await userResponse.json();
    if (!userResponse.ok) throw new Error(profile.error_description || "Google profile fetch failed");

    const customer = normalizeCustomer({
      provider: "google",
      email: profile.email,
      firstName: profile.given_name,
      lastName: profile.family_name,
      name: profile.name,
      intent: "villa-booking",
      source: "craysclub-google-oauth"
    }, "customer.oauth", { path: returnTo, userAgent: req.headers["user-agent"] || "" });

    await saveCustomerRecord(customer);
    setCustomerSessionCookie(req, res, customer);
    redirect(res, returnTo + (returnTo.includes("?") ? "&" : "?") + "auth_provider=google&auth=success&customer=" + encodeURIComponent(customer.id));
  } catch (error) {
    redirect(res, "/account?auth_provider=google&auth_error=" + encodeURIComponent(error.message || "google_oauth_failed"));
  }
}
