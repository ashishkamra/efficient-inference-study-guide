import type { ErrorComponentProps } from "@tanstack/react-router";
import { RotateCcw, TriangleAlert } from "lucide-react";
import { assetUrl } from "@/lib/asset-url";

const FALLBACK_MESSAGE = "An unexpected error occurred. Try reloading the page.";

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error) return error;
  return FALLBACK_MESSAGE;
}

export function AppErrorComponent({ error, reset }: ErrorComponentProps) {
  return (
    <main
      role="alert"
      className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 py-16 text-center"
    >
      <span className="text-copper" aria-hidden="true">
        <TriangleAlert className="size-10" strokeWidth={2} />
      </span>
      <h1 className="font-serif text-3xl">Something went wrong</h1>
      <p className="max-w-md break-words text-sm text-muted">{errorMessage(error)}</p>
      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => reset?.()}
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-paper"
        >
          <RotateCcw aria-hidden className="size-4" />
          Try again
        </button>
        <a
          href={assetUrl("/")}
          className="inline-flex min-h-11 items-center rounded-full border border-line bg-card px-5 text-sm font-semibold text-ink"
        >
          Back to the path
        </a>
      </div>
    </main>
  );
}
