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

  if (!code || !process.env.LINKEDIN_CLIENT_ID || !process.env.LINKEDIN_CLIENT_SECRET) {
    redirect(res, "/account?auth_provider=linkedin&auth_error=missing_linkedin_config");
    return;
  }

  try {
    const redirectUri = baseUrl(req) + "/api/auth/linkedin/callback";
    const tokenResponse = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET
      })
    });
    const token = await tokenResponse.json();
    if (!tokenResponse.ok) throw new Error(token.error_description || token.error || "LinkedIn token exchange failed");

    const userResponse = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: "Bearer " + token.access_token }
    });
    const profile = await userResponse.json();
    if (!userResponse.ok) throw new Error(profile.message || "LinkedIn profile fetch failed");

    const customer = normalizeCustomer({
      provider: "linkedin",
      email: profile.email,
      firstName: profile.given_name,
      lastName: profile.family_name,
      name: profile.name,
      intent: "company-team",
      source: "craysclub-linkedin-oauth"
    }, "customer.oauth", { path: returnTo, userAgent: req.headers["user-agent"] || "" });

    await saveCustomerRecord(customer);
    setCustomerSessionCookie(req, res, customer);
    redirect(res, returnTo + (returnTo.includes("?") ? "&" : "?") + "auth_provider=linkedin&auth=success&customer=" + encodeURIComponent(customer.id));
  } catch (error) {
    redirect(res, "/account?auth_provider=linkedin&auth_error=" + encodeURIComponent(error.message || "linkedin_oauth_failed"));
  }
}
