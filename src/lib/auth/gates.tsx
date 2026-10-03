import { useState } from "react";
import { Navigate } from "@tanstack/react-router";
import { signIn, signOut } from "./client";
import { useCurrentUser, useCurrentUserState } from "./use-current-user";
import type { ReactNode } from "react";

export const SIGN_IN_PATH = "/login";

export function SignedIn({ children }: { children: ReactNode }) {
  const { user } = useCurrentUserState();
  return user ? <>{children}</> : null;
}

export function SignedOut({ children }: { children: ReactNode }) {
  const { user, isPending } = useCurrentUserState();
  if (isPending || user) return null;
  return <>{children}</>;
}

export function RedirectToSignIn({ to = SIGN_IN_PATH }: { to?: string }) {
  return <Navigate to={to} />;
}

export function SignInGate({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  const { user, isPending } = useCurrentUserState();
  if (isPending) return null;
  if (user) return <>{children}</>;
  return <>{fallback ?? <SignInButtons />}</>;
}

export function SignInButtons() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <button
        type="button"
        disabled={busy}
        onClick={() => {
          setBusy(true);
          setError(null);
          void signIn("puter", { callbackURL: "/" }).catch((err) => {
            setError(err instanceof Error ? err.message : "เข้าสู่ระบบไม่สำเร็จ");
            setBusy(false);
          });
        }}
        className="w-full cursor-pointer rounded-xl border border-[#c4a7ff]/25 bg-[#c4a7ff]/10 px-4 py-3 font-medium text-[#e8ddff] shadow-[0_8px_30px_rgba(196,167,255,0.08)] transition-all hover:border-[#c4a7ff]/45 hover:bg-[#c4a7ff]/15 hover:text-white disabled:cursor-wait disabled:opacity-60"
      >
        {busy ? "กำลังเชื่อมต่อ Puter…" : "เข้าสู่ระบบด้วย Puter"}
      </button>
      {error ? <p className="text-center text-xs text-red-500">{error}</p> : null}
    </div>
  );
}

export function UserButton() {
  const user = useCurrentUser();
  const [signingOut, setSigningOut] = useState(false);
  if (!user) return null;
  const label = user.displayName ?? user.primaryEmail ?? "Puter User";
  return (
    <div className="flex items-center gap-2">
      {user.profileImageUrl ? (
        <img src={user.profileImageUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
      ) : (
        <span className="grid h-8 w-8 place-items-center rounded-full bg-black/10 text-sm font-medium dark:bg-white/20">
          {label.charAt(0).toUpperCase()}
        </span>
      )}
      <span className="text-sm font-medium">{label}</span>
      <button
        type="button"
        disabled={signingOut}
        onClick={() => {
          setSigningOut(true);
          void signOut("/login").catch(() => setSigningOut(false));
        }}
        className="cursor-pointer text-sm underline-offset-4 opacity-70 hover:underline disabled:cursor-wait"
      >
        {signingOut ? "กำลังออก…" : "ออกจากระบบ"}
      </button>
    </div>
  );
}
