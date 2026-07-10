import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useCourses, useDiscs, useRounds } from "@/lib/use-storage";

export const Route = createFileRoute("/discs/$id")({
  component: DiscDetail,
});

function DiscDetail() {
  const { id } = Route.useParams();
  const disc = useDiscs().find((d) => d.id === id);
  const rounds = useRounds();
  const courses = useCourses();

  if (!disc) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Disc not found. <Link to="/discs" className="text-primary underline">Back to bag</Link>
      </div>
    );
  }

  // Gather throws
  const throws: {
    roundId: string; courseName: string; date: string;
    holeIdx: number; par: number; score: number;
  }[] = [];
  for (const r of rounds) {
    const c = courses.find((c) => c.id === r.courseId);
    if (!c) continue;
    r.holes.forEach((h, i) => {
      if (h.discId === disc.id) {
        throws.push({
          roundId: r.id, courseName: c.name, date: r.date,
          holeIdx: i, par: c.holes[i]?.par ?? 0, score: h.score,
        });
      }
    });
  }

  const avg = throws.length
    ? (throws.reduce((s, t) => s + (t.score - t.par), 0) / throws.length)
    : 0;

  return (
    <div className="space-y-6">
      <Link to="/discs" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Bag
      </Link>

      <section className="disc-card p-6">
        <div className="display text-xs uppercase tracking-widest text-muted-foreground">
          {disc.category} · {disc.plastic || "—"} · {disc.weight ? `${disc.weight}g` : "—"}
        </div>
        <h1 className="display text-4xl font-bold uppercase">{disc.name}</h1>
        <div className="mt-4 flex items-center gap-3">
          {(["Spd", "Gld", "Trn", "Fad"] as const).map((label, i) => {
            const v = [disc.speed, disc.glide, disc.turn, disc.fade][i];
            return (
              <div key={label} className="flex flex-col items-center rounded-lg bg-background/60 px-4 py-2">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
                <span className="num text-2xl font-bold">{v}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-3 gap-3">
        <Tile label="Throws logged" value={throws.length} />
        <Tile
          label="Avg vs par"
          value={throws.length ? (avg > 0 ? `+${avg.toFixed(2)}` : avg.toFixed(2)) : "—"}
        />
        <Tile label="Rounds used" value={new Set(throws.map((t) => t.roundId)).size} />
      </section>

      <section>
        <h2 className="display text-lg font-bold uppercase tracking-wider mb-3">Throw history</h2>
        {throws.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground">
            Not thrown yet. Tag this disc on a hole when logging your round.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm num">
              <thead className="bg-muted/60 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left">Course</th>
                  <th className="px-3 py-2 text-right">Hole</th>
                  <th className="px-3 py-2 text-right">Par</th>
                  <th className="px-3 py-2 text-right">Score</th>
                </tr>
              </thead>
              <tbody>
                {throws.map((t, i) => (
                  <tr key={i} className="border-t border-border/70">
                    <td className="px-3 py-2 font-sans">{t.date}</td>
                    <td className="px-3 py-2 font-sans">
                      <Link to="/rounds/$id" params={{ id: t.roundId }} className="hover:text-primary">
                        {t.courseName}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-right">{t.holeIdx + 1}</td>
                    <td className="px-3 py-2 text-right text-muted-foreground">{t.par}</td>
                    <td className={`px-3 py-2 text-right font-bold ${t.score - t.par < 0 ? "text-birdie" : t.score - t.par > 0 ? "text-rust" : ""}`}>
                      {t.score}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/60 p-4">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
      <div className="num mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}
