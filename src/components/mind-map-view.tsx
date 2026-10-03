import { useMemo, useState } from "react";
import { MessageSquare, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Composer } from "@/components/composer";
import { EXAMPLE_MAPS } from "@/lib/maps/examples";
import type { MapBranch, MindMapData, SavedMap } from "@/lib/types";
import { cn } from "@/lib/utils";

const TONE: Record<MapBranch["tone"], string> = {
  sage: "var(--color-primary)",
  ink: "var(--color-on-surface-variant)",
  clay: "var(--color-tertiary)",
  sky: "var(--color-secondary)",
  sand: "var(--color-tertiary-container)",
};

type LaidOut = {
  id: string;
  label: string;
  note?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  tone: MapBranch["tone"];
  kind: "root" | "branch" | "leaf";
  parentId?: string;
};

function layoutMap(data: MindMapData): { nodes: LaidOut[]; width: number; height: number } {
  const nodes: LaidOut[] = [];
  const rootW = 176;
  const rootH = 52;
  const bw = 156;
  const bh = 42;
  const lw = 148;
  const lh = 38;
  const dx = 88;
  const leafGap = 50;
  const branchPad = 28;

  let y = 16;
  const branchBoxes = data.branches.map((b) => {
    const count = Math.max(b.children.length, 1);
    const height = Math.max(count * leafGap, bh);
    const top = y;
    y += height + branchPad;
    return { branch: b, top, height, mid: top + height / 2 };
  });

  const totalH = Math.max(y, 220);
  const rootY = totalH / 2 - rootH / 2;
  const rootX = 20;
  nodes.push({
    id: "root",
    label: data.topic,
    note: data.summary,
    x: rootX,
    y: rootY,
    w: rootW,
    h: rootH,
    tone: "sage",
    kind: "root",
  });

  const branchX = rootX + rootW + dx;
  branchBoxes.forEach(({ branch, top, mid }) => {
    nodes.push({
      id: branch.id,
      label: branch.label,
      x: branchX,
      y: mid - bh / 2,
      w: bw,
      h: bh,
      tone: branch.tone,
      kind: "branch",
      parentId: "root",
    });
    branch.children.forEach((child, j) => {
      nodes.push({
        id: child.id,
        label: child.label,
        note: child.note,
        x: branchX + bw + dx - 8,
        y: top + j * leafGap,
        w: lw,
        h: lh,
        tone: branch.tone,
        kind: "leaf",
        parentId: branch.id,
      });
    });
  });

  const width = Math.max(...nodes.map((n) => n.x + n.w)) + 24;
  const height = Math.max(...nodes.map((n) => n.y + n.h)) + 24;
  return { nodes, width, height };
}

function connector(a: LaidOut, b: LaidOut) {
  const x1 = a.x + a.w;
  const y1 = a.y + a.h / 2;
  const x2 = b.x;
  const y2 = b.y + b.h / 2;
  const mid = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`;
}

export function MindMapView({
  maps,
  active,
  topic,
  onTopic,
  onGenerate,
  onSelect,
  onDelete,
  onAsk,
  onExample,
  busy,
  error,
}: {
  maps: SavedMap[];
  active: SavedMap | null;
  topic: string;
  onTopic: (v: string) => void;
  onGenerate: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onAsk: (prompt: string) => void;
  onExample: (data: MindMapData) => void;
  busy: boolean;
  error: string | null;
}) {
  const laid = useMemo(
    () => (active ? layoutMap(active.data) : null),
    [active],
  );
  const [selected, setSelected] = useState<string | null>(null);
  const selectedNode = laid?.nodes.find((n) => n.id === selected);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="mx-auto w-full max-w-3xl px-4 pt-6 sm:pt-8">
        <p className="text-sm font-medium text-muted">Mind maps</p>
        <h1 className="m3-headline-md mt-1">
          See the shape of an idea
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
          Name a topic. Lumina breaks it into branches you can tap and then
          talk about.
        </p>
        <div className="mt-4">
          <Composer
            value={topic}
            onChange={onTopic}
            onSubmit={onGenerate}
            placeholder="The solar system, photosynthesis, how ovens work…"
            busy={busy}
            extra={
              <span className="px-2 text-xs text-subtle">
                Short topics make cleaner maps
              </span>
            }
          />
        </div>
        {error ? <p className="mt-2 px-1 text-sm text-danger">{error}</p> : null}
      </header>

      {busy && !active ? (
        <div className="mx-auto mt-8 w-full max-w-3xl px-4">
          <div className="h-48 rounded-2xl bg-elevated lumina-rise" />
        </div>
      ) : null}

      {laid && active ? (
        <div className="mt-6 min-h-0 flex-1 overflow-auto px-3 pb-8">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 lg:flex-row">
            <div className="min-w-0 flex-1 overflow-x-auto rounded-2xl bg-elevated p-3">
              <svg
                viewBox={`0 0 ${laid.width} ${laid.height}`}
                className="h-auto w-full min-w-[720px]"
                role="img"
                aria-label={`Mind map of ${active.data.topic}`}
              >
                {laid.nodes
                  .filter((n) => n.parentId)
                  .map((n) => {
                    const parent = laid.nodes.find((p) => p.id === n.parentId);
                    if (!parent) return null;
                    return (
                      <path
                        key={`e-${n.id}`}
                        d={connector(parent, n)}
                        fill="none"
                        stroke="var(--color-border)"
                        strokeWidth="1.4"
                      />
                    );
                  })}
                {laid.nodes.map((n) => {
                  const isSel = selected === n.id;
                  return (
                    <g
                      key={n.id}
                      onClick={() => setSelected(n.id)}
                      className="cursor-pointer"
                    >
                      <rect
                        x={n.x}
                        y={n.y}
                        width={n.w}
                        height={n.h}
                        rx={n.kind === "root" ? 16 : 12}
                        fill={
                          n.kind === "root"
                            ? "var(--color-primary-container)"
                            : "var(--color-clay)"
                        }
                        stroke={
                          isSel ? TONE[n.tone] : "var(--color-border)"
                        }
                        strokeWidth={isSel ? 2 : 1}
                      />
                      <text
                        x={n.x + n.w / 2}
                        y={n.y + n.h / 2 + 4}
                        textAnchor="middle"
                        fill={
                          n.kind === "root"
                            ? "var(--color-on-primary-container)"
                            : "var(--color-fg)"
                        }
                        fontSize={n.kind === "root" ? 14 : 12}
                        fontFamily="var(--font-sans)"
                        fontWeight={n.kind === "leaf" ? 500 : 600}
                      >
                        {n.label.length > 22 ? `${n.label.slice(0, 22)}…` : n.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
            <aside className="w-full shrink-0 rounded-2xl bg-surface p-4 lg:w-72">
              <p className="text-xs font-medium tracking-[0.08em] text-subtle uppercase">
                {selectedNode?.kind === "root" ? "Overview" : "Branch"}
              </p>
              <h2 className="m3-title-lg mt-1">
                {selectedNode?.label ?? active.data.topic}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {selectedNode?.note ?? active.data.summary}
              </p>
              <Button
                className="mt-4 w-full"
                variant="outline"
                onClick={() => {
                  const label = selectedNode?.label ?? active.data.topic;
                  const note = selectedNode?.note ?? active.data.summary;
                  onAsk(
                    `Tell me more about "${label}" as part of ${active.data.topic}. ${note}`,
                  );
                }}
              >
                <MessageSquare className="size-4" />
                Ask about this
              </Button>
              <button
                type="button"
                onClick={() => onDelete(active.id)}
                className="mt-3 inline-flex h-10 items-center gap-1.5 text-sm text-muted transition-[color] duration-150 hover:text-danger"
              >
                <Trash2 className="size-3.5" />
                Remove map
              </button>
            </aside>
          </div>
        </div>
      ) : maps.length > 0 ? (
        <div className="mx-auto mt-6 grid w-full max-w-3xl grid-cols-1 gap-2 px-4 sm:grid-cols-2">
          {maps.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onSelect(m.id)}
              className={cn(
                "m3-card-elevated rounded-2xl px-4 py-4 text-left",
              )}
            >
              <p className="font-medium">{m.data.topic}</p>
              <p className="mt-1 line-clamp-2 text-sm text-muted">
                {m.data.summary}
              </p>
            </button>
          ))}
        </div>
      ) : (
        <div className="mx-auto mt-8 w-full max-w-3xl px-4 pb-10">
          <p className="text-xs font-medium tracking-[0.08em] text-subtle uppercase">
            Try an example
          </p>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {EXAMPLE_MAPS.map((ex) => (
              <button
                key={ex.id}
                type="button"
                onClick={() => onExample(ex.data)}
                className="m3-card-elevated rounded-2xl px-4 py-4 text-left"
              >
                <p className="font-medium">{ex.data.topic}</p>
                <p className="mt-1 line-clamp-2 text-sm text-muted">
                  {ex.data.summary}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
