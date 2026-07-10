import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Trash2 } from "lucide-react";
import { useCourses, useRounds } from "@/lib/use-storage";
import { computeTotals, scoreClass, formatToPar } from "@/lib/rating";
import { RatingPill } from "@/components/rating-pill";
import { deleteRound, getDisc } from "@/lib/storage";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/rounds/$id")({
  component: RoundDetail,
  notFoundComponent: () => <div className="p-8">Round not found.</div>,
});

function RoundDetail() {
  const { id } = Route.useParams();
  const rounds = useRounds();
  const courses = useCourses();
  const round = rounds.find((r) => r.id === id);
  const course = round ? courses.find((c) => c.id === round.courseId) : undefined;
  const navigate = useNavigate();

  if (!round || !course) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Round not found.
        <div className="mt-4">
          <Link to="/rounds" className="text-primary underline">Back to rounds</Link>
        </div>
      </div>
    );
  }

  const t = computeTotals(round, course);

  return (
    <div className="space-y-6">
      <Link to="/rounds" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All rounds
      </Link>

      <section className="scorecard scorecard-perforated p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-widest text-parchment-foreground/70">
              {format(parseISO(round.date), "EEEE, MMM d yyyy")}
            </div>
            <h1 className="display text-3xl font-bold uppercase text-parchment-foreground">
              {course.name}
            </h1>
          </div>
          <RatingPill rating={t.rating} size="lg" />
        </div>
        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-parchment-line/60 pt-4 sm:grid-cols-5">
          <Stat label="Score" value={`${t.totalScore} / ${t.totalPar}`} />
          <Stat label="To par" value={formatToPar(t.toPar)} />
          <Stat label="Putts" value={`${t.puttsMade} / ${t.totalPutts}`} />
          <Stat label="Fairways" value={`${t.fairwayPct}%`} />
          <Stat label="Penalties" value={t.penalties} />
        </div>
      </section>

      <section>
        <h2 className="display text-lg font-bold uppercase tracking-wider mb-3">Hole by hole</h2>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">#</th>
                <th className="px-3 py-2 text-right">Par</th>
                <th className="px-3 py-2 text-right">Score</th>
                <th className="px-3 py-2 text-right">+/-</th>
                <th className="px-3 py-2 text-right">Putts</th>
                <th className="px-3 py-2 text-center">Fwy</th>
                <th className="px-3 py-2 text-right">Pen</th>
                <th className="px-3 py-2 text-right">Drive</th>
                <th className="px-3 py-2 text-left">Disc</th>
              </tr>
            </thead>
            <tbody className="num">
              {course.holes.map((ch, i) => {
                const rh = round.holes[i];
                if (!rh) return null;
                const diff = rh.score - ch.par;
                const disc = rh.discId ? getDisc(rh.discId) : null;
                return (
                  <tr key={i} className="border-t border-border/70">
                    <td className="px-3 py-2 font-semibold">{i + 1}</td>
                    <td className="px-3 py-2 text-right text-muted-foreground">{ch.par}</td>
                    <td className={`px-3 py-2 text-right font-bold ${scoreClass(rh.score, ch.par)}`}>
                      {rh.score}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {diff === 0 ? "E" : diff > 0 ? `+${diff}` : diff}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {rh.puttsMade}/{rh.puttsMade + rh.puttsMissed}
                    </td>
                    <td className="px-3 py-2 text-center">{rh.fairwayHit ? "✓" : "—"}</td>
                    <td className={`px-3 py-2 text-right ${rh.penalties ? "text-rust" : "text-muted-foreground"}`}>
                      {rh.penalties || 0}
                    </td>
                    <td className="px-3 py-2 text-right text-muted-foreground">
                      {rh.driveDistance ? `${rh.driveDistance}ft` : "—"}
                    </td>
                    <td className="px-3 py-2 text-left font-sans text-xs">
                      {disc ? disc.name : <span className="text-muted-foreground">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex justify-end">
        <Button
          variant="ghost"
          className="text-rust hover:bg-rust/10 hover:text-rust"
          onClick={() => {
            if (confirm("Delete this round?")) {
              deleteRound(round.id);
              toast.success("Round deleted");
              navigate({ to: "/rounds" });
            }
          }}
        >
          <Trash2 className="h-4 w-4 mr-1.5" /> Delete round
        </Button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-parchment-foreground/60">{label}</div>
      <div className="num text-xl font-bold text-parchment-foreground">{value}</div>
    </div>
  );
}
