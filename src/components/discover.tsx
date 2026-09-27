import { Link } from "@tanstack/react-router";
import { Bot, GitBranch, ImageIcon, MessageSquare, Sparkles, SquareTerminal } from "lucide-react";
import type { AppView } from "@/lib/types";

const PROMPTS = [
  { title: "ติดตั้งแพ็กเกจจริง", body: "ใช้ Sandbox Terminal ติดตั้ง dayjs แล้วพิมพ์วันที่วันนี้ แสดงผลที่รันจริง" },
  { title: "ทดสอบ Python และ Git", body: "ใช้ Sandbox Terminal ตรวจเวอร์ชัน Python และ Git แล้วใช้ Python คำนวณผลรวม 1 ถึง 100" },
  { title: "Write a story", body: "Write a short, imaginative story about a city that wakes up under the ocean." },
  { title: "Explain a concept", body: "Explain quantum computing in simple terms, with a helpful analogy." },
  { title: "Plan a trip", body: "Help me plan a relaxing three-day trip with great food and local highlights." },
  { title: "Solve a problem", body: "Help me think through a difficult decision by laying out the options and trade-offs." },
];

export function Discover({ onPrompt, onView }: { onPrompt: (text: string) => void; onView: (view: AppView) => void }) {
  return (
    <div className="mx-auto flex w-full max-w-[760px] flex-col items-center px-5 pt-10 pb-8 sm:pt-[13vh]">
      <div className="mb-5 grid size-12 place-items-center rounded-full bg-[#eaf2ff] text-primary"><Sparkles className="size-6" /></div>
      <h1 className="lumina-rise text-center text-[30px] font-semibold tracking-[-0.04em] text-[#252a32] sm:text-[36px]">Hi, I’m DeepSeek.</h1>
      <p className="mt-2 text-center text-[15px] text-[#9299a3]">How can I help you today?</p>
      <div className="mt-10 grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
        {PROMPTS.map((p, i) => (
          <button key={p.title} type="button" onClick={() => onPrompt(p.body)} className="lumina-rise group min-h-[112px] rounded-2xl border border-[#eaedf1] bg-white p-4 text-left transition hover:border-[#b9d1fb] hover:bg-[#fbfdff]" style={{ animationDelay: `${i * 35}ms` }}>
            <p className="text-[14px] font-semibold text-[#3d4653]">{p.title}</p>
            <p className="mt-2 line-clamp-2 text-[13px] leading-[1.6] text-[#9098a3]">{p.body}</p>
          </button>
        ))}
      </div>
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        <ModePill icon={MessageSquare} label="Chat" onClick={() => onView("chat")} />
        <ModePill icon={GitBranch} label="Mind maps" onClick={() => onView("maps")} />
        <ModePill icon={Bot} label="AI Builder" onClick={() => onView("builder")} />
        <ModePill icon={ImageIcon} label="Studio" onClick={() => onView("studio")} />
        <Link to="/sandbox" className="inline-flex h-9 items-center gap-2 rounded-full border border-[#e8ebef] bg-white px-3.5 text-xs font-medium text-[#66707c] transition hover:bg-[#f6f8fb]"><SquareTerminal className="size-3.5 text-primary" />Sandbox</Link>
      </div>
    </div>
  );
}
function ModePill({ icon: Icon, label, onClick }: { icon: typeof MessageSquare; label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="inline-flex h-9 items-center gap-2 rounded-full border border-[#e8ebef] bg-white px-3.5 text-xs font-medium text-[#66707c] transition hover:bg-[#f6f8fb]"><Icon className="size-3.5 text-primary" />{label}</button>;
}
