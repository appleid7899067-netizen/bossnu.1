import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import appCss from "../styles.css?url";

const APP_NAME = "Lumina";

/**
 * Applies the persisted appearance (theme / accent / font / motion) before the
 * first paint so dark-mode users never see a light flash while React hydrates.
 * Must stay tiny and dependency-free — it runs before hydration.
 */
const APPEARANCE_BOOT = `(function(){var d=document.documentElement;d.dataset.theme="dark";d.dataset.accent="violet";d.dataset.font="normal";d.dataset.motion="on";
try{var s=JSON.parse(localStorage.getItem("bossnu-silelo-v1")||"{}").state||{};
var ui=s.ui||{},p=s.personality||{};
var theme=ui.theme||(p.darkMode===false?"light":"dark");
if(theme==="system")theme=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";
d.dataset.theme=theme;d.style.colorScheme=theme;
if(ui.accent)d.dataset.accent=ui.accent;
if(ui.fontScale)d.dataset.font=ui.fontScale;
if(ui.animations===false)d.dataset.motion="off";
}catch(e){}})();`;

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      {
        name: "description",
        content: "A calm place to think, map ideas, and make pictures.",
      },
      { name: "theme-color", content: "#f3efe6" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap",
      },
    ],
  }),
  component: () => (
    <html lang="en" className="antialiased" data-theme="dark" data-accent="violet" data-font="normal" data-motion="on" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="bg-bg text-fg font-sans">
        <script dangerouslySetInnerHTML={{ __html: APPEARANCE_BOOT }} />
        <PreviewHostBridge />
        <AuthProvider>
          <Outlet />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});
