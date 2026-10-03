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
      <section className="m3-dialog w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 grid size-14 place-items-center rounded-2xl bg-primary-container text-on-primary-container text-xl">
            ✦
          </div>
          <h1 className="m3-title-lg text-center">เข้าสู่ระบบ</h1>
          <p className="m3-body-md mt-1 text-center text-muted">เข้าสู่ Bossnu.Silelo เพื่อใช้งานต่อ</p>
        </div>
        <SignInButtons />
      </section>
    </main>
  );
}
