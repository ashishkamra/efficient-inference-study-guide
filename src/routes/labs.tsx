import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { LabsPanel } from "@/components/labs-panel";

export const Route = createFileRoute("/labs")({
  head: () => ({ meta: [{ title: "Labs · Ridge" }] }),
  component: LabsPage,
});

function LabsPage() {
  useEffect(() => {
    const id = window.location.hash.replace("#", "");
    if (!id) return;
    document.getElementById(id)?.scrollIntoView({ block: "start" });
  }, []);
  return <LabsPanel />;
}