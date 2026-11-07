import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { LabsPanel } from "@/components/labs-panel";

export const Route = createFileRoute("/labs")({
  head: () => ({
    meta: [
      { title: "Labs · Ridge" },
      {
        name: "description",
        content: "Interactive teaching models for KV footprint, roofline, speculation, paging, and compression.",
      },
    ],
  }),
  component: LabsPage,
});

function scrollToHash() {
  const id = window.location.hash.replace("#", "");
  if (!id) return;
  document.getElementById(id)?.scrollIntoView({ block: "start" });
}

function LabsPage() {
  useEffect(() => {
    scrollToHash();
    window.addEventListener("hashchange", scrollToHash);
    return () => window.removeEventListener("hashchange", scrollToHash);
  }, []);
  return <LabsPanel />;
}
