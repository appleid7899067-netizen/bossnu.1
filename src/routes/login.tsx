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
    <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-[#09070f] px-4 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(196,167,255,0.16),transparent_38%),radial-gradient(circle_at_80%_80%,rgba(0,255,157,0.07),transparent_32%)]" />
      <section className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-[#12101b]/95 p-7 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl border border-[#c4a7ff]/25 bg-[#c4a7ff]/10 text-2xl text-[#c4a7ff] shadow-[0_0_35px_rgba(196,167,255,0.12)]">
            ✦
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-white">เข้าสู่ระบบ</h1>
          <p className="mt-1 text-sm text-white/50">เข้าสู่ Bossnu.Silelo เพื่อใช้งานต่อ</p>
        </div>
        <SignInButtons />
      </section>
    </main>
  );
}
