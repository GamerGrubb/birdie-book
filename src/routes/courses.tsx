import { createFileRoute, Outlet, Link, useRouterState } from "@tanstack/react-router";
import { Plus, MapPinned } from "lucide-react";
import { useCourses } from "@/lib/use-storage";

export const Route = createFileRoute("/courses")({
  component: CoursesLayout,
});

function CoursesLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname !== "/courses") return <Outlet />;
  return <CoursesList />;
}

function CoursesList() {
  const courses = useCourses();
  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-primary">Layouts</div>
          <h1 className="display text-3xl font-bold uppercase">Courses</h1>
        </div>
        <Link
          to="/courses/new"
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          <Plus className="h-4 w-4" /> New course
        </Link>
      </header>

      {courses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">
          No courses yet. Add one to start logging rounds.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {courses.map((c) => {
            const par = c.holes.reduce((s, h) => s + h.par, 0);
            const dist = c.holes.reduce((s, h) => s + h.distance, 0);
            return (
              <Link
                key={c.id}
                to="/courses/$id"
                params={{ id: c.id }}
                className="rounded-2xl border border-border/60 bg-card/70 p-5 transition hover:bg-card"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <MapPinned className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="display text-xl font-bold uppercase leading-tight">{c.name}</div>
                    <div className="mt-1 text-xs text-muted-foreground num">
                      {c.holes.length} holes · Par {par} · {dist.toLocaleString()} ft
                    </div>
                    <div className="mt-2 text-[10px] uppercase tracking-widest text-muted-foreground num">
                      Anchor: {c.anchorScore} = {c.anchorRating} · {c.pointsPerThrow} pts/throw
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
