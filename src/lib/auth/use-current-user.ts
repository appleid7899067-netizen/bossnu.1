import { puter } from "@heyputer/puter.js";
import { useEffect, useState } from "react";

export type AppUser = {
  id: string;
  displayName: string | null;
  primaryEmail: string | null;
  profileImageUrl: string | null;
  isDevFallback: boolean;
};

export type CurrentUserState = {
  user: AppUser | null;
  isPending: boolean;
};

function mapPuterUser(user: any): AppUser | null {
  if (!user) return null;
  const id = String(user.uuid ?? user.id ?? user.username ?? user.email ?? "");
  if (!id) return null;
  return {
    id,
    displayName: user.username ?? user.name ?? null,
    primaryEmail: user.email ?? null,
    profileImageUrl: user.avatar ?? user.image ?? null,
    isDevFallback: false,
  };
}

export function useCurrentUserState(): CurrentUserState {
  const [state, setState] = useState<CurrentUserState>({ user: null, isPending: true });

  useEffect(() => {
    let alive = true;
    const sync = async () => {
      try {
        const signedIn = puter.auth.isSignedIn();
        const user = signedIn ? mapPuterUser(await puter.auth.getUser()) : null;
        if (alive) setState({ user, isPending: false });
      } catch {
        if (alive) setState({ user: null, isPending: false });
      }
    };
    void sync();
    const timer = window.setInterval(() => void sync(), 1500);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, []);

  return state;
}

export function useCurrentUser(): AppUser | null {
  return useCurrentUserState().user;
}
