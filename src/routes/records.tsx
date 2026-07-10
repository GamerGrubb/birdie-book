import { createFileRoute, Link } from "@tanstack/react-router";
import { Trophy, TrendingUp, Target, Disc3 } from "lucide-react";
import { useCourses, useDiscs, useRounds } from "@/lib/use-storage";
import { computeTotals } from "@/lib/rating";
import { RatingPill } from "@/components/rating-pill";
import { format, parseISO } from "date-fns";

export const Route = createFileRoute("/records")({
  component: RecordsPage,
});

function RecordsPage() {
  const rounds = useRounds();
  const courses = useCourses();
  const discs = useDiscs();

  const enriched = rounds
    .map((r) => {
      const c = courses.find((c) => c.id === r.courseId);
      if (!c) return null;
      return { round: r, course: c, totals: computeTotals(r, c) };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const bestRound = enriched.reduce<null | (typeof enriched)[number]>(
    (b, r) => (!b || r.totals.rating > b.totals.rating ? r : b),
    null,
  );

  const bestPerCourse = new Map<string, (typeof enriched)[number]>();
  for (const e of enriched) {
    const cur = bestPerCourse.get(e.course.id);
    if (!cur || e.totals.rating > cur.totals.rating) bestPerCourse.set(e.course.id, e);
  }

  // Improving streak: consecutive rounds with strictly better rating over time (globally by date)
  const chrono = [...enriched].sort((a, b) => a.round.date.localeCompare(b.round.date));
  let bestStreak = 0;
  let cur = 0;
  let lastRating = -Infinity;
  for (const e of chrono) {
    if (e.totals.rating > lastRating) {
      cur += 1;
      bestStreak = Math.max(bestStreak, cur);
    } else {
      cur = 1;
    }
    lastRating = e.totals.rating;
  }

  const totalHoles = enriched.reduce((s, e) => s + e.course.holes.length, 0);

  // Most-thrown disc
  const throwByDisc = new Map<string, { count: number; diffs: number[] }>();
  for (const e of enriched) {
    e.round.holes.forEach((h, i) => {
      if (!h.discId) return;
      const par = e.course.holes[i]?.par ?? 0;
      const rec = throwByDisc.get(h.discId) ?? { count: 0, diffs: [] };
      rec.count += 1;
      rec.diffs.push(h.score - par);
      throwByDisc.set(h.discId, rec);
    });
  }
  const mostThrownEntry = [...throwByDisc.entries()].sort((a, b) => b[1].count - a[1].count)[0];
  const mostThrown = mostThrownEntry ? discs.find((d) => d.id === mostThrownEntry[0]) : undefined;

  const bestDiscEntry = [...throwByDisc.entries()]
    .filter(([, v]) => v.count >= 3)
    .map(([id, v]) => ({
      id,
      avg: v.diffs.reduce((s, n) => s + n, 0) / v.diffs.length,
      count: v.count,
    }))
    .sort((a, b) => a.avg - b.avg)[0];
  const bestDisc = bestDiscEntry ? discs.find((d) => d.id === bestDiscEntry.id) : undefined;

  return (
    <div className="space-y-6">
      <header>
        <div className="text-xs uppercase tracking-[0.3em] text-primary">Hall of chains</div>
        <h1 className="display text-3xl font-bold uppercase">Records</h1>
      </header>

      {enriched.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
          Log some rounds and your records will appear here.
        </div>
      ) : (
        <>
          {/* Big headline record */}
          {bestRound && (
            <section className="relative overflow-hidden rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/15 via-card to-card p-6">
              <Trophy className="absolute right-4 top-4 h-10 w-10 text-primary/40" />
              <div className="text-xs uppercase tracking-[0.3em] text-primary">All-time best round</div>
              <div className="mt-2 flex items-end gap-4">
                <RatingPill rating={bestRound.totals.rating} size="lg" />
                <div>
                  <div className="display text-2xl font-bold uppercase">{bestRound.course.name}</div>
                  <div className="text-sm text-muted-foreground num">
                    Score {bestRound.totals.totalScore} · {format(parseISO(bestRound.round.date), "MMM d, yyyy")}
                  </div>
                </div>
              </div>
              <Link
                to="/rounds/$id"
                params={{ id: bestRound.round.id }}
                className="mt-4 inline-block text-xs text-primary hover:underline"
              >
                View scorecard →
              </Link>
            </section>
          )}

          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <RecTile icon={TrendingUp} label="Improving streak" value={`${bestStreak} rounds`} />
            <RecTile icon={Target} label="Total rounds" value={enriched.length} />
            <RecTile icon={Target} label="Holes played" value={totalHoles} />
            <RecTile
              icon={Disc3}
              label="Most thrown"
              value={mostThrown ? `${mostThrown.name}` : "—"}
              sub={mostThrownEntry ? `${mostThrownEntry[1].count} throws` : ""}
            />
          </section>

          {bestDisc && bestDiscEntry && (
            <section className="rounded-2xl border border-border/60 bg-card/60 p-5">
              <div className="text-xs uppercase tracking-[0.3em] text-primary">Best average outcome</div>
              <div className="mt-1 display text-xl font-bold uppercase">{bestDisc.name}</div>
              <div className="mt-1 text-sm text-muted-foreground num">
                {bestDiscEntry.avg > 0 ? `+${bestDiscEntry.avg.toFixed(2)}` : bestDiscEntry.avg.toFixed(2)} vs par
                over {bestDiscEntry.count} throws
              </div>
            </section>
          )}

          <section>
            <h2 className="display text-lg font-bold uppercase tracking-wider mb-3">Best rating per course</h2>
            <div className="space-y-2">
              {[...bestPerCourse.values()]
                .sort((a, b) => b.totals.rating - a.totals.rating)
                .map((e) => (
                  <Link
                    key={e.course.id}
                    to="/courses/$id"
                    params={{ id: e.course.id }}
                    className="flex items-center justify-between rounded-xl border border-border/60 bg-card/60 px-4 py-3 hover:bg-card"
                  >
                    <div>
                      <div className="font-semibold">{e.course.name}</div>
                      <div className="text-xs text-muted-foreground num">
                        Score {e.totals.totalScore} · {format(parseISO(e.round.date), "MMM d, yyyy")}
                      </div>
                    </div>
                    <RatingPill rating={e.totals.rating} />
                  </Link>
                ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function RecTile({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/60 p-4">
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
        <Icon className="h-4 w-4 text-primary/70" />
      </div>
      <div className="num mt-1 text-lg font-bold">{value}</div>
      {sub && <div className="text-xs text-muted-foreground num">{sub}</div>}
    </div>
  );
}
