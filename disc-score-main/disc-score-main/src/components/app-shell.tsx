import { Link, useRouterState } from "@tanstack/react-router";
import { Home, ClipboardList, Disc3, MapPinned, LineChart, Trophy, Plus, Settings } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { registerPwa } from "@/lib/pwa-register";

const NAV: { to: string; label: string; icon: typeof Home }[] = [
  { to: "/", label: "Home", icon: Home },
  { to: "/rounds", label: "Rounds", icon: ClipboardList },
  { to: "/discs", label: "Bag", icon: Disc3 },
  { to: "/courses", label: "Courses", icon: MapPinned },
  { to: "/stats", label: "Trends", icon: LineChart },
  { to: "/records", label: "Records", icon: Trophy },
  { to: "/settings", label: "Data", icon: Settings },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    registerPwa();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 ring-1 ring-primary/40">
              <span className="absolute inset-1 rounded-full border-2 border-dashed border-primary/60" />
              <span className="h-2 w-2 rounded-full bg-accent" />
            </span>
            <div className="leading-tight">
              <div className="display text-lg font-bold uppercase tracking-widest text-foreground">
                Disc Golf Log
              </div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Personal scorecard
              </div>
            </div>
          </Link>
          <Link
            to="/rounds/new"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:brightness-110"
          >
            <Plus className="h-4 w-4" /> Log round
          </Link>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-5xl px-4 pt-6 pb-28 sm:pb-10">
        {children}
      </main>

      {/* Bottom nav (mobile) */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border/70 bg-background/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto grid max-w-5xl grid-cols-7">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] uppercase tracking-wider transition",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop side nav rendered as pill row under header */}
      <div className="hidden sm:block fixed left-4 top-1/2 -translate-y-1/2 z-30">
        <div className="flex flex-col gap-1 rounded-full border border-border/60 bg-card/70 p-1.5 shadow-lg backdrop-blur-md">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                title={label}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full transition",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                )}
              >
                <Icon className="h-4.5 w-4.5" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
