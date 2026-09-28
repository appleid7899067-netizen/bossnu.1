import { useEffect } from "react";
import { useAppStore } from "@/lib/store";
import type { AccentId, ThemeMode } from "@/lib/types";

export const ACCENTS: { id: AccentId; label: string; swatch: string; darkSwatch: string }[] = [
  { id: "violet", label: "ม่วงกลางคืน", swatch: "#7c6cf6", darkSwatch: "#a99bff" },
  { id: "blue", label: "ฟ้าสดใส", swatch: "#3d7bfd", darkSwatch: "#7fb0ff" },
  { id: "rose", label: "ชมพูหวาน", swatch: "#f0568a", darkSwatch: "#ff8db2" },
  { id: "emerald", label: "เขียวมิ้นต์", swatch: "#10a678", darkSwatch: "#40d9a4" },
  { id: "amber", label: "ส้มอำพัน", swatch: "#d98406", darkSwatch: "#f5b545" },
  { id: "sky", label: "ฟ้าคราม", swatch: "#0891c9", darkSwatch: "#55c7ee" },
];

/** Resolves "system" against the OS preference, live. */
export function resolveTheme(mode: ThemeMode): "light" | "dark" {
  if (mode !== "system") return mode;
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * Applies the persisted appearance (theme, accent, font scale, motion) to <html>
 * and keeps the legacy personality.darkMode flag in sync so old code paths
 * (e.g. exports) stay truthful.
 */
export function useAppearance() {
  const ui = useAppStore((s) => s.ui);
  const updatePersonality = useAppStore((s) => s.updatePersonality);

  // Theme — react to OS changes when following "system".
  useEffect(() => {
    const root = document.documentElement;
    const apply = (animate: boolean) => {
      const resolved = resolveTheme(ui.theme);
      if (animate && root.dataset.theme !== resolved) {
        root.classList.add("theme-anim");
        window.setTimeout(() => root.classList.remove("theme-anim"), 420);
      }
      root.dataset.theme = resolved;
      root.style.colorScheme = resolved;
    };
    apply(ui.theme !== "system");
    if (ui.theme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply(false);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [ui.theme]);

  // Keep legacy darkMode flag aligned (used by old exports / sidebar quick toggle).
  useEffect(() => {
    const resolved = resolveTheme(ui.theme);
    const darkMode = useAppStore.getState().personality.darkMode;
    if ((resolved === "dark") !== darkMode) updatePersonality({ darkMode: resolved === "dark" });
  }, [ui.theme, updatePersonality]);

  // Accent, font scale, motion.
  useEffect(() => {
    const root = document.documentElement;
    const animate = root.dataset.accent !== undefined && root.dataset.accent !== ui.accent;
    if (animate) {
      root.classList.add("theme-anim");
      window.setTimeout(() => root.classList.remove("theme-anim"), 420);
    }
    root.dataset.accent = ui.accent;
  }, [ui.accent]);

  useEffect(() => {
    document.documentElement.dataset.font = ui.fontScale;
  }, [ui.fontScale]);

  useEffect(() => {
    document.documentElement.dataset.motion = ui.animations ? "on" : "off";
  }, [ui.animations]);
}
