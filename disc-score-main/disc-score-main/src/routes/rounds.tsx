import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useCourses, useRounds } from "@/lib/use-storage";
import { computeTotals } from "@/lib/rating";
import { RatingPill, ToParPill } from "@/components/rating-pill";
import { format, parseISO } from "date-fns";

export const Route = createFileRoute("/rounds")({
  component: RoundsLayout,
});

function RoundsLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname !== "/rounds") return <Outlet />;
  return <RoundsList />;
}

function RoundsList() {
  const rounds = useRounds();
  const courses = useCourses();

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-primary">Scorecards</div>
          <h1 className="display text-3xl font-bold uppercase">Rounds</h1>
        </div>
        <Link
          to="/rounds/new"
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow"
        >
          <Plus className="h-4 w-4" /> New round
        </Link>
      </header>

      {rounds.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">
          No rounds yet. Log your first round to see it here.
        </div>
      ) : (
        <div className="space-y-3">
          {rounds.map((r) => {
            const c = courses.find((c) => c.id === r.courseId);
            if (!c) return null;
            const t = computeTotals(r, c);
            return (
              <Link
                key={r.id}
                to="/rounds/$id"
                params={{ id: r.id }}
                className="block scorecard scorecard-perforated px-5 py-4 transition hover:translate-y-[-1px]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-parchment-foreground/70">
                      {format(parseISO(r.date), "EEE, MMM d yyyy")}
                    </div>
                    <div className="display text-xl font-bold uppercase text-parchment-foreground">
                      {c.name}
                    </div>
                  </div>
                  <RatingPill rating={t.rating} />
                </div>
                <div className="mt-3 flex items-center gap-4 border-t border-parchment-line/60 pt-3 text-sm text-parchment-foreground/90">
                  <span className="num">
                    <b>{t.totalScore}</b>{" "}
                    <span className="text-parchment-foreground/60">/ par {t.totalPar}</span>
                  </span>
                  <ToParPill toPar={t.toPar} />
                  <span className="num text-parchment-foreground/70">
                    {t.puttsMade}/{t.totalPutts} putts
                  </span>
                  <span className="num text-parchment-foreground/70">
                    {t.fairwayPct}% fwy
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
