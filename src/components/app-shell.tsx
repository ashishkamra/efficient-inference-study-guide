import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { BookOpen, FlaskConical, GraduationCap, Route } from "lucide-react";
import { lessons } from "@/lib/course";
import { useProgress } from "@/lib/progress";
import { cn } from "@/lib/cn";

const links = [
  { to: "/", label: "Path", icon: Route },
  { to: "/labs", label: "Labs", icon: FlaskConical },
  { to: "/exam", label: "Exam", icon: GraduationCap },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const complete = useProgress((s) => s.complete);
  const setHydrated = useProgress((s) => s.setHydrated);

  useEffect(() => {
    const pending = useProgress.persist.rehydrate();
    void Promise.resolve(pending).then(() => setHydrated());
  }, [setHydrated]);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 md:px-6">
          <Link to="/" className="group flex items-baseline gap-2">
            <span className="font-serif text-xl font-semibold tracking-tight text-ink">Ridge</span>
            <span className="hidden text-xs uppercase tracking-[0.16em] text-muted sm:inline">
              Inference studio
            </span>
          </Link>
          <nav className="ml-auto hidden items-center gap-1 md:flex">
            {links.map((l) => {
              const active = l.to === "/" ? pathname === "/" : pathname.startsWith(l.to);
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className={cn(
                    "rounded-full px-3 py-2 text-sm font-medium",
                    active ? "bg-ink text-paper" : "text-muted hover:bg-paper-2 hover:text-ink",
                  )}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
          <p className="hidden text-sm text-muted tabular md:block">
            {complete.length}/{lessons.length}
          </p>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 md:px-6 md:pb-16 md:pt-8">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-card/95 backdrop-blur-md md:hidden">
        <ul className="grid grid-cols-3">
          {links.map((l) => {
            const active = l.to === "/" ? pathname === "/" : pathname.startsWith(l.to);
            const Icon = l.icon;
            return (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className={cn(
                    "flex min-h-14 flex-col items-center justify-center gap-1 text-xs font-medium",
                    active ? "text-copper-deep" : "text-muted",
                  )}
                >
                  <Icon aria-hidden className="size-5" />
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

export function Mark({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-copper-deep">
      <BookOpen aria-hidden className="size-3.5" />
      {children}
    </span>
  );
}
