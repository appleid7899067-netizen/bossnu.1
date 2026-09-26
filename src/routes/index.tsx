import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { parseSearch } from "@/lib/search";

export const Route = createFileRoute("/")({
  validateSearch: parseSearch,
  component: Home,
});

function Home() {
  const search = Route.useSearch();
  return <AppShell search={search} />;
}
