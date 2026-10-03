import { useEffect } from "react";
import { useAppStore } from "@/lib/store";

/**
 * MATA ships a single locked Material 3 scheme — there is intentionally no
 * theme or accent switching. Only the accessibility-level preferences
 * (font scale + motion) are applied to <html>.
 */
export function useAppearance() {
  const fontScale = useAppStore((s) => s.ui.fontScale);
  const animations = useAppStore((s) => s.ui.animations);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = "dark";
    root.style.colorScheme = "dark";
  }, []);

  useEffect(() => {
    document.documentElement.dataset.font = fontScale;
  }, [fontScale]);

  useEffect(() => {
    document.documentElement.dataset.motion = animations ? "on" : "off";
  }, [animations]);
}
