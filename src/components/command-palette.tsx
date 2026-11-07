import { Command } from "cmdk";
import { useNavigate } from "@tanstack/react-router";
import {
  BookOpen,
  BookMarked,
  FlaskConical,
  GraduationCap,
  Home,
  Search,
  Sigma,
} from "lucide-react";
import { useEffect, useState } from "react";
import { glossary, glossarySlug, lessons } from "@/lib/course";

const pages = [
  {
    label: "Path overview",
    hint: "Home, progress, all nine lessons",
    to: "/" as const,
    icon: Home,
  },
  {
    label: "Review sheet",
    hint: "Formulas, traps, oral prompts",
    to: "/review" as const,
    icon: BookMarked,
  },
  {
    label: "Labs",
    hint: "KV, roofline, speculation, paging, composed error",
    to: "/labs" as const,
    icon: FlaskConical,
  },
  {
    label: "Exam",
    hint: "Twelve mixed questions with review links",
    to: "/exam" as const,
    icon: GraduationCap,
  },
  {
    label: "Glossary",
    hint: "Definitions and search",
    to: "/glossary" as const,
    icon: BookOpen,
  },
];

export const OPEN_SEARCH_EVENT = "ridge:open-search";

/** A button that opens the palette from anywhere in the chrome. */
export function SearchTrigger({ className = "" }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_SEARCH_EVENT))}
      className={`inline-flex min-h-10 items-center gap-2 rounded-full border border-line bg-card px-3 text-sm font-medium text-muted hover:text-ink ${className}`}
    >
      <Search aria-hidden className="size-4" />
      <span className="hidden lg:inline">Search</span>
      <kbd className="hidden rounded border border-line bg-paper px-1.5 py-0.5 font-mono text-[10px] text-muted lg:inline">
        ⌘K
      </kbd>
      <span className="sr-only lg:hidden">Search lessons and glossary</span>
    </button>
  );
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    }
    function onOpenEvent() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_SEARCH_EVENT, onOpenEvent);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_SEARCH_EVENT, onOpenEvent);
    };
  }, []);

  function go(action: () => void) {
    setOpen(false);
    action();
  }

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Search Ridge"
      filter={(value, search) => {
        const q = search.trim().toLowerCase();
        if (!q) return 1;
        return value.toLowerCase().includes(q) ? 1 : 0;
      }}
      overlayClassName="fixed inset-0 z-50 bg-ink/35 backdrop-blur-[2px]"
      contentClassName="fixed left-1/2 top-[12%] z-50 w-[min(92vw,40rem)] -translate-x-1/2 overflow-hidden rounded-2xl border border-line bg-card shadow-2xl"
    >
      <div className="flex items-center gap-2 border-b border-line px-4">
        <Search aria-hidden className="size-4 shrink-0 text-muted" />
        <Command.Input
          placeholder="Search lessons, terms, and pages"
          className="min-h-14 w-full bg-transparent text-base outline-none placeholder:text-muted"
        />
      </div>
      <Command.List className="max-h-[62vh] overflow-y-auto p-2">
        <Command.Empty className="px-3 py-10 text-center text-sm text-muted">
          No lesson, term, or page matches that.
        </Command.Empty>

        <Command.Group
          heading="Pages"
          className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.14em] [&_[cmdk-group-heading]]:text-muted"
        >
          {pages.map((page) => {
            const Icon = page.icon;
            return (
              <Command.Item
                key={page.to}
                value={`${page.label} ${page.hint}`}
                onSelect={() => go(() => navigate({ to: page.to }))}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm data-[selected=true]:bg-paper-2"
              >
                <Icon aria-hidden className="size-4 shrink-0 text-copper-deep" />
                <span className="font-medium">{page.label}</span>
                <span className="ml-auto hidden truncate text-xs text-muted sm:inline">
                  {page.hint}
                </span>
              </Command.Item>
            );
          })}
        </Command.Group>

        <Command.Group
          heading="Lessons"
          className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.14em] [&_[cmdk-group-heading]]:text-muted"
        >
          {lessons.map((lesson) => (
            <Command.Item
              key={lesson.id}
              value={`${lesson.numeral} ${lesson.title} ${lesson.kicker} ${lesson.summary}`}
              onSelect={() =>
                go(() => navigate({ to: "/lesson/$id", params: { id: lesson.id } }))
              }
              className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm data-[selected=true]:bg-paper-2"
            >
              <span className="w-6 shrink-0 font-mono text-xs text-copper-deep">
                {lesson.numeral}
              </span>
              <span className="min-w-0 flex-1 truncate">{lesson.title}</span>
              <span className="hidden shrink-0 text-xs text-muted sm:inline">{lesson.minutes} min</span>
            </Command.Item>
          ))}
        </Command.Group>

        <Command.Group
          heading="Glossary"
          className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.14em] [&_[cmdk-group-heading]]:text-muted"
        >
          {glossary.map((entry) => (
            <Command.Item
              key={entry.term}
              value={`${entry.term} ${entry.def}`}
              onSelect={() =>
                go(() =>
                  navigate({ to: "/glossary", hash: glossarySlug(entry.term) }),
                )
              }
              className="flex cursor-pointer items-start gap-3 rounded-lg px-3 py-2.5 text-sm data-[selected=true]:bg-paper-2"
            >
              <Sigma aria-hidden className="mt-0.5 size-3.5 shrink-0 text-copper-deep" />
              <span className="min-w-0">
                <span className="block font-medium">{entry.term}</span>
                <span className="line-clamp-1 text-xs text-muted">{entry.def}</span>
              </span>
            </Command.Item>
          ))}
        </Command.Group>
      </Command.List>
      <div className="flex items-center justify-between gap-3 border-t border-line bg-paper/60 px-4 py-2 text-[11px] text-muted">
        <span>↑↓ to move · ↵ to open · esc to close</span>
        <span className="font-mono">Ridge</span>
      </div>
    </Command.Dialog>
  );
}
