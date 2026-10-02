import { createFileRoute, Navigate } from "@tanstack/react-router";
import { SignInButtons } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { user, isPending } = useCurrentUserState();

  if (isPending) return null;
  if (user) return <Navigate to="/" search={{ view: "chat" }} />;

  return (
    <main className="grid min-h-dvh place-items-center bg-bg px-4 text-fg">
      <section className="w-full max-w-sm rounded-2xl border border-border bg-elevated p-6 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-primary/10 text-xl">
            ✦
          </div>
          <h1 className="text-lg font-semibold">เข้าสู่ระบบ</h1>
          <p className="mt-1 text-sm text-muted">เข้าสู่ Bossnu.Silelo เพื่อใช้งานต่อ</p>
        </div>
        <SignInButtons />
      </section>
    </main>
  );
}
