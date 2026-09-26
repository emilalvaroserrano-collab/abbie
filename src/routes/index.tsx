import { createFileRoute } from "@tanstack/react-router";
import { CsrDashboard } from "@/components/csr-dashboard";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return <CsrDashboard />;
}
