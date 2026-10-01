import { puter } from "@heyputer/puter.js";

export const authEnabled = true;
export const AUTH_PROVIDERS = [{ providerId: "puter", idp: "puter", label: "Puter" }] as const;
export const GROK_PROVIDERS = AUTH_PROVIDERS;

export async function signIn(
  _providerId = "puter",
  opts: { callbackURL?: string; errorCallbackURL?: string } = {},
): Promise<void> {
  await puter.auth.signIn();
  if (typeof window !== "undefined") {
    const dest = opts.callbackURL ?? "/";
    const target = new URL(dest, window.location.origin);
    if (window.location.pathname !== target.pathname || window.location.search !== target.search) {
      window.location.href = target.href;
    } else {
      window.location.reload();
    }
  }
}

export async function signOut(redirectTo = "/login"): Promise<void> {
  puter.auth.signOut();
  if (typeof window !== "undefined") window.location.href = redirectTo;
}
