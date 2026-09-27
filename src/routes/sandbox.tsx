import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { SaliAgent } from "@/components/sali-agent";

type SandboxSearch = { skill?: string };

export const Route = createFileRoute("/sandbox")({
  validateSearch: (raw: Record<string, unknown>): SandboxSearch => ({
    skill: typeof raw.skill === "string" && raw.skill ? raw.skill : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sali Sandbox Agent" },
      {
        name: "description",
        content: "รันคำสั่งในแซนด์บ็อกแยก โหลด Grok Skills และดู Live Preview ในที่เดียว",
      },
    ],
  }),
  component: SandboxPage,
});

function SandboxPage() {
  const { skill } = Route.useSearch();
  return (
    <div className="h-dvh overflow-hidden bg-bg text-fg">
      <SaliAgent
        initialSkill={skill}
        leading={
          <Link
            to="/"
            search={{ view: "chat" }}
            className="grid size-9 shrink-0 place-items-center rounded-xl text-muted transition-colors hover:bg-hover hover:text-fg"
            aria-label="กลับหน้าแชต"
            title="กลับหน้าแชต"
          >
            <ArrowLeft className="size-4" />
          </Link>
        }
      />
    </div>
  );
}
