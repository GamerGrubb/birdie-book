import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { useCourses, useRounds } from "@/lib/use-storage";
import { computeTotals } from "@/lib/rating";
import { RatingPill, ToParPill } from "@/components/rating-pill";
import { deleteCourse } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { CourseEditor } from "@/components/course-editor";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/courses/$id")({
  component: CourseDetail,
});

function CourseDetail() {
  const { id } = Route.useParams();
  const course = useCourses().find((c) => c.id === id);
  const rounds = useRounds().filter((r) => r.courseId === id);
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);

  if (!course) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Course not found. <Link to="/courses" className="text-primary underline">Back</Link>
      </div>
    );
  }

  if (editing) {
    return (
      <CourseEditor
        initial={course}
        onSaved={() => setEditing(false)}
        onCancel={() => setEditing(false)}
      />
    );
  }

  const par = course.holes.reduce((s, h) => s + h.par, 0);
  const dist = course.holes.reduce((s, h) => s + h.distance, 0);

  const roundStats = rounds.map((r) => ({ round: r, totals: computeTotals(r, course) }));
  const best = roundStats.reduce<null | typeof roundStats[number]>(
    (b, r) => (!b || r.totals.rating > b.totals.rating ? r : b),
    null,
  );
  const avgScore = rounds.length
    ? roundStats.reduce((s, r) => s + r.totals.totalScore, 0) / rounds.length
    : 0;

  return (
    <div className="space-y-6">
      <Link to="/courses" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Courses
      </Link>

      <section className="rounded-2xl border border-border/60 bg-card/70 p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-primary">Course</div>
            <h1 className="display text-3xl font-bold uppercase">{course.name}</h1>
            <div className="mt-1 text-sm text-muted-foreground num">
              {course.holes.length} holes · Par {par} · {dist.toLocaleString()} ft
            </div>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4 mr-1" /> Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-rust"
              onClick={() => {
                if (confirm(`Delete "${course.name}"? Existing rounds will stay but will lose the course link.`)) {
                  deleteCourse(course.id);
                  toast.success("Course deleted");
                  navigate({ to: "/courses" });
                }
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile label="Rounds" value={rounds.length} />
        <Tile label="Best rating" value={best ? best.totals.rating : "—"} />
        <Tile label="Best score" value={rounds.length ? Math.min(...roundStats.map((r) => r.totals.totalScore)) : "—"} />
        <Tile label="Avg score" value={rounds.length ? avgScore.toFixed(1) : "—"} />
      </section>

      <section>
        <h2 className="display text-lg font-bold uppercase tracking-wider mb-3">Layout</h2>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm num">
            <thead className="bg-muted/60 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Hole</th>
                <th className="px-3 py-2 text-right">Par</th>
                <th className="px-3 py-2 text-right">Distance</th>
              </tr>
            </thead>
            <tbody>
              {course.holes.map((h, i) => (
                <tr key={i} className="border-t border-border/70">
                  <td className="px-3 py-2 font-semibold">{i + 1}</td>
                  <td className="px-3 py-2 text-right">{h.par}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{h.distance} ft</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="display text-lg font-bold uppercase tracking-wider mb-3">Round history</h2>
        {rounds.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground">
            No rounds on this course yet.
          </div>
        ) : (
          <div className="space-y-2">
            {roundStats.map(({ round, totals }) => (
              <Link
                key={round.id}
                to="/rounds/$id"
                params={{ id: round.id }}
                className="flex items-center justify-between rounded-xl border border-border/60 bg-card/50 px-4 py-3 hover:bg-card"
              >
                <div className="text-sm">
                  <div className="font-semibold">{format(parseISO(round.date), "MMM d, yyyy")}</div>
                  <div className="text-muted-foreground num">
                    Score {totals.totalScore} · {totals.puttsMade}/{totals.totalPutts} putts
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ToParPill toPar={totals.toPar} />
                  <RatingPill rating={totals.rating} size="sm" />
                </div>
              </Link>
            ))}
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
      <div className="num mt-1 text-xl font-bold">{value}</div>
    </div>
  );
}
