import { Trash2 } from "lucide-react";
import { Composer } from "@/components/composer";
import { Button } from "@/components/ui/button";
import type { StudioImage } from "@/lib/types";
import { cn } from "@/lib/utils";

const ASPECTS = ["1:1", "4:3", "3:4", "16:9"] as const;

const STARTERS = [
  "A watercolor fox asleep in a meadow of wildflowers",
  "A storybook lighthouse on a calm evening sea",
  "Paper-cut birds flying over rolling green hills",
  "A pencil sketch of the moon above a quiet village",
];

export function StudioView({
  prompt,
  onPrompt,
  aspect,
  onAspect,
  onGenerate,
  images,
  onDelete,
  busy,
  error,
}: {
  prompt: string;
  onPrompt: (v: string) => void;
  aspect: string;
  onAspect: (v: string) => void;
  onGenerate: () => void;
  images: StudioImage[];
  onDelete: (id: string) => void;
  busy: boolean;
  error: string | null;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <header className="mx-auto w-full max-w-2xl px-4 pt-6 sm:pt-8">
        <p className="text-sm font-medium text-muted">Studio</p>
        <h1 className="mt-1 font-display text-3xl font-medium tracking-tight">
          Make a picture
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
          Describe a scene. Lumina paints a family-friendly illustration.
        </p>
        <div className="mt-4">
          <Composer
            value={prompt}
            onChange={onPrompt}
            onSubmit={onGenerate}
            placeholder="A cozy treehouse with lanterns at dusk…"
            busy={busy}
            extra={
              <div className="flex flex-wrap gap-1">
                {ASPECTS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => onAspect(a)}
                    className={cn(
                      "h-8 rounded-lg px-2.5 text-xs font-medium",
                      "transition-[background-color,color] duration-150",
                      aspect === a
                        ? "bg-primary text-primary-fg"
                        : "text-muted hover:bg-fg/6 hover:text-fg",
                    )}
                  >
                    {a}
                  </button>
                ))}
              </div>
            }
          />
        </div>
        {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
        <div className="mt-4 flex flex-wrap gap-2">
          {STARTERS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onPrompt(s)}
              className="rounded-full bg-clay px-3 py-1.5 text-xs font-medium text-clay-fg transition-[background-color] duration-150 hover:bg-sand"
            >
              {s}
            </button>
          ))}
        </div>
      </header>

      <div className="mx-auto mt-8 grid w-full max-w-4xl grid-cols-1 gap-3 px-4 pb-10 sm:grid-cols-2">
        {busy ? (
          <div className="aspect-square rounded-2xl bg-clay/80 lumina-rise" />
        ) : null}
        {images.map((img) => (
          <figure
            key={img.id}
            className="overflow-hidden rounded-2xl bg-elevated shadow-[var(--shadow-border)]"
          >
            <img
              src={img.url}
              alt={img.prompt}
              className="aspect-square w-full object-cover outline outline-1 -outline-offset-1 outline-fg/10"
            />
            <figcaption className="flex items-start justify-between gap-3 px-3 py-3">
              <p className="line-clamp-2 text-sm leading-relaxed text-muted">
                {img.prompt}
              </p>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Remove picture"
                onClick={() => onDelete(img.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            </figcaption>
          </figure>
        ))}
      </div>
      {!busy && images.length === 0 ? (
        <p className="mx-auto max-w-sm px-4 pb-10 text-center text-sm text-muted">
          Pictures you make will appear here.
        </p>
      ) : null}
    </div>
  );
}
