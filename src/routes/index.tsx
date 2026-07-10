import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, ClipboardList, Disc3, MapPinned, TrendingUp } from "lucide-react";
import { useCourses, useDiscs, useRounds } from "@/lib/use-storage";
import { computeTotals } from "@/lib/rating";
import { RatingPill, ToParPill } from "@/components/rating-pill";
import { format, parseISO } from "date-fns";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const rounds = useRounds();
  const courses = useCourses();
  const discs = useDiscs();

  const recent = rounds.slice(0, 5);
  const lastRound = rounds[0];
  const lastCourse = lastRound ? courses.find((c) => c.id === lastRound.courseId) : undefined;
  const lastTotals = lastRound && lastCourse ? computeTotals(lastRound, lastCourse) : null;

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-card via-card to-background p-6 sm:p-8">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-primary">Welcome back</div>
            <h1 className="mt-2 display text-3xl sm:text-5xl font-bold uppercase leading-tight">
              Chase the chains.
            </h1>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Log a round hole-by-hole, tag which disc you threw, and watch your
              rating climb over time.
            </p>
          </div>
          <Link
            to="/rounds/new"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition hover:brightness-110"
          >
            <Plus className="h-4 w-4" /> Log new round
          </Link>
        </div>
      </section>

      {/* Quick stats */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Rounds" value={rounds.length} icon={ClipboardList} />
        <StatTile label="Courses" value={courses.length} icon={MapPinned} />
        <StatTile label="Discs in bag" value={discs.filter((d) => d.status === "in-bag").length} icon={Disc3} />
        <StatTile
          label="Best rating"
          value={
            rounds.length
              ? Math.max(
                  ...rounds
                    .map((r) => {
                      const c = courses.find((c) => c.id === r.courseId);
                      return c ? computeTotals(r, c).rating : 0;
                    })
                    .filter((n) => n > 0),
                ) || 0
              : 0
          }
          icon={TrendingUp}
        />
      </section>

      {/* Last round card */}
      {lastRound && lastCourse && lastTotals ? (
        <section>
          <SectionHeader title="Last round" href="/rounds" cta="See all" />
          <Link
            to="/rounds/$id"
            params={{ id: lastRound.id }}
            className="block scorecard scorecard-perforated px-6 py-5 mt-3 transition hover:translate-y-[-1px]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-widest text-parchment-foreground/70">
                  {format(parseISO(lastRound.date), "EEE, MMM d yyyy")}
                </div>
                <div className="display text-2xl font-bold uppercase text-parchment-foreground">
                  {lastCourse.name}
                </div>
              </div>
              <RatingPill rating={lastTotals.rating} size="lg" />
            </div>
            <div className="mt-4 grid grid-cols-4 gap-3 border-t border-parchment-line/60 pt-4">
              <ParchmentStat label="Score" value={lastTotals.totalScore} />
              <ParchmentStat
                label="To par"
                value={
                  lastTotals.toPar === 0
                    ? "E"
                    : lastTotals.toPar > 0
                      ? `+${lastTotals.toPar}` : `${lastTotals.toPar}`
                }
              />
              <ParchmentStat label="Putts" value={lastTotals.totalPutts} />
              <ParchmentStat label="Fwy" value={`${lastTotals.fairwayPct}%`} />
            </div>
          </Link>
        </section>
      ) : (
        <EmptyState />
      )}

      {/* Recent rounds */}
      {recent.length > 1 && (
        <section>
          <SectionHeader title="Recent rounds" href="/rounds" cta="See all" />
          <div className="mt-3 space-y-2">
            {recent.slice(1).map((r) => {
              const c = courses.find((c) => c.id === r.courseId);
              if (!c) return null;
              const t = computeTotals(r, c);
              return (
                <Link
                  key={r.id}
                  to="/rounds/$id"
                  params={{ id: r.id }}
                  className="flex items-center justify-between rounded-xl border border-border/60 bg-card/70 px-4 py-3 transition hover:bg-card"
                >
                  <div>
                    <div className="font-semibold">{c.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {format(parseISO(r.date), "MMM d yyyy")}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <ToParPill toPar={t.toPar} />
                    <RatingPill rating={t.rating} size="sm" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function StatTile({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/60 p-4">
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
        <Icon className="h-4 w-4 text-primary/70" />
      </div>
      <div className="num mt-1.5 text-2xl font-bold tabular-nums">{value}</div>
    </div>
  );
}

function ParchmentStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-parchment-foreground/60">{label}</div>
      <div className="num text-lg font-bold text-parchment-foreground tabular-nums">{value}</div>
    </div>
  );
}

function SectionHeader({ title, href, cta }: { title: string; href: string; cta?: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <h2 className="display text-lg font-bold uppercase tracking-wider">{title}</h2>
      {cta && (
        <Link to={href} className="text-xs text-primary hover:underline">
          {cta} →
        </Link>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-border p-8 text-center">
      <p className="text-muted-foreground">
        No rounds logged yet. Set up a course, build your bag, and log your first round.
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <Link to="/courses" className="rounded-full border border-border px-4 py-2 text-sm hover:bg-card">
          Add course
        </Link>
        <Link to="/discs" className="rounded-full border border-border px-4 py-2 text-sm hover:bg-card">
          Add discs
        </Link>
        <Link to="/rounds/new" className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
          Log round
        </Link>
      </div>
    </div>
  );
}
