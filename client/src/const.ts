export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;

  // When OAuth is not configured, use local login page
  if (!oauthPortalUrl || !appId) {
    // Save current path for redirect after login
    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      try {
        sessionStorage.setItem("login_redirect", window.location.pathname);
      } catch {
        // sessionStorage may not be available
      }
    }
    return "/login";
  }

  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
