/** Native Google identity provider for Bossnu.Silelo. */
export type AuthProvider = {
  providerId: "google";
  idp: "google";
  label: "Google";
};

export const AUTH_PROVIDERS: readonly AuthProvider[] = [
  { providerId: "google", idp: "google", label: "Google" },
];
