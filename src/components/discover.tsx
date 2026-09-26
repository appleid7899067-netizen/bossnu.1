import { Bot, GitBranch, ImageIcon, MessageSquare } from "lucide-react";
import { greetingForHour } from "@/lib/utils";
import type { AppView } from "@/lib/types";

const PROMPTS = [
  {
    title: "Explain rainbows",
    body: "How do rainbows form, in a way a curious kid would love?",
  },
  {
    title: "Bedtime lighthouse",
    body: "Write a short bedtime story about a brave little lighthouse.",
  },
  {
    title: "Picnic plan",
    body: "Help me plan a weekend picnic for friends, including games.",
  },
  {
    title: "Animal quiz",
    body: "Quiz me on world animals. Five questions, then tell me the score.",
  },
];

export function Discover({
  onPrompt,
  onView,
}: {
  onPrompt: (text: string) => void;
  onView: (view: AppView) => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center px-4 pt-5 pb-10 sm:pt-16">
      <p className="lumina-rise text-sm font-medium tracking-wide text-muted">
        {greetingForHour()}
      </p>
      <h1
        className="lumina-rise mt-2 text-center font-display text-[2.1rem] leading-[1.15] font-medium tracking-tight sm:text-5xl"
        style={{ animationDelay: "40ms" }}
      >
        What shall we think through?
      </h1>
      <p
        className="lumina-rise mt-3 max-w-md text-center text-[0.975rem] leading-relaxed text-muted"
        style={{ animationDelay: "80ms" }}
      >
        Chat, map an idea, or make a picture. Everything here is built to stay
        kind and clear.
      </p>

      <div className="mt-8 grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
        {PROMPTS.map((p, i) => (
          <button
            key={p.title}
            type="button"
            onClick={() => onPrompt(p.body)}
            className="lumina-rise rounded-2xl bg-elevated px-4 py-4 text-left shadow-[var(--shadow-border)] transition-[box-shadow,transform] duration-150 ease-out hover:shadow-[var(--shadow-border-hover)] active:scale-[0.99]"
            style={{ animationDelay: `${120 + i * 40}ms` }}
          >
            <p className="text-sm font-semibold">{p.title}</p>
            <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted">
              {p.body}
            </p>
          </button>
        ))}
      </div>

      <div className="mt-8 grid w-full grid-cols-2 gap-2 sm:grid-cols-4">
        <ModeCard
          icon={MessageSquare}
          title="Chat"
          copy="Ask, write, and reason."
          onClick={() => onView("chat")}
        />
        <ModeCard
          icon={GitBranch}
          title="Mind maps"
          copy="See a topic as a picture."
          onClick={() => onView("maps")}
        />
        <ModeCard
          icon={Bot}
          title="AI Builder"
          copy="Build an app from a prompt."
          onClick={() => onView("builder")}
        />
        <ModeCard
          icon={ImageIcon}
          title="Studio"
          copy="Turn a sentence into art."
          onClick={() => onView("studio")}
        />
      </div>
    </div>
  );
}

function ModeCard({
  icon: Icon,
  title,
  copy,
  onClick,
}: {
  icon: typeof MessageSquare;
  title: string;
  copy: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-start gap-2 rounded-2xl bg-surface px-2.5 py-3 text-left shadow-[var(--shadow-border)] transition-[box-shadow] duration-150 ease-out hover:shadow-[var(--shadow-border-hover)] sm:flex-row sm:items-start sm:gap-3 sm:px-3.5 sm:py-3.5"
    >
      <span className="flex size-9 items-center justify-center rounded-lg bg-clay text-primary">
        <Icon className="size-4" strokeWidth={1.8} />
      </span>
      <span>
        <span className="block text-sm font-semibold">{title}</span>
        <span className="mt-0.5 hidden text-sm text-muted sm:block">{copy}</span>
        <span className="mt-0.5 block text-[0.7rem] leading-snug text-muted sm:hidden">
          {copy}
        </span>
      </span>
    </button>
  );
}
