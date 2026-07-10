import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { useCourses, useDiscs } from "@/lib/use-storage";
import { computeTotals } from "@/lib/rating";
import { saveRound, uid } from "@/lib/storage";
import type { Round, RoundHole } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RatingPill, ToParPill } from "@/components/rating-pill";
import { toast } from "sonner";

export const Route = createFileRoute("/rounds/new")({
  component: NewRound,
});

function blankHole(): RoundHole {
  return {
    score: 0,
    puttsMade: 0,
    puttsMissed: 0,
    fairwayHit: false,
    penalties: 0,
    driveDistance: null,
    discId: null,
  };
}

function NewRound() {
  const courses = useCourses();
  const discs = useDiscs();
  const inBag = discs.filter((d) => d.status === "in-bag");
  const navigate = useNavigate();

  const [courseId, setCourseId] = useState<string>(courses[0]?.id ?? "");
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const course = useMemo(() => courses.find((c) => c.id === courseId), [courses, courseId]);

  const [holes, setHoles] = useState<RoundHole[]>(() =>
    course ? course.holes.map((h) => ({ ...blankHole(), score: h.par })) : [],
  );

  // Reset holes when course changes
  const onCourseChange = (id: string) => {
    setCourseId(id);
    const c = courses.find((c) => c.id === id);
    if (c) setHoles(c.holes.map((h) => ({ ...blankHole(), score: h.par })));
  };

  const updateHole = (i: number, patch: Partial<RoundHole>) => {
    setHoles((prev) => prev.map((h, idx) => (idx === i ? { ...h, ...patch } : h)));
  };

  const draft: Round | null = course
    ? {
        id: "draft",
        courseId: course.id,
        date,
        holes,
        createdAt: new Date().toISOString(),
      }
    : null;
  const totals = draft && course ? computeTotals(draft, course) : null;

  const save = () => {
    if (!course) return;
    const round: Round = {
      id: uid(),
      courseId: course.id,
      date,
      holes,
      createdAt: new Date().toISOString(),
    };
    saveRound(round);
    toast.success(`Round saved — rated ${computeTotals(round, course).rating}`);
    navigate({ to: "/rounds/$id", params: { id: round.id } });
  };

  if (courses.length === 0) {
    return (
      <div className="space-y-4">
        <BackLink />
        <div className="rounded-2xl border border-dashed border-border p-8 text-center">
          <p className="text-muted-foreground">Add a course before logging a round.</p>
          <Link
            to="/courses/new"
            className="mt-4 inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Add course
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackLink />

      <header>
        <div className="text-xs uppercase tracking-[0.3em] text-primary">New scorecard</div>
        <h1 className="display text-3xl font-bold uppercase">Log a round</h1>
      </header>

      {/* Setup */}
      <section className="grid gap-4 rounded-2xl border border-border/60 bg-card/60 p-5 sm:grid-cols-2">
        <div>
          <Label>Course</Label>
          <Select value={courseId} onValueChange={onCourseChange}>
            <SelectTrigger className="mt-1.5 h-11">
              <SelectValue placeholder="Pick a course" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name} · {c.holes.length} holes · par {c.holes.reduce((s, h) => s + h.par, 0)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Link to="/courses/new" className="mt-1 inline-block text-xs text-primary hover:underline">
            + Add new course
          </Link>
        </div>
        <div>
          <Label htmlFor="date">Date played</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1.5 h-11"
          />
        </div>
      </section>

      {/* Scorecard */}
      {course && (
        <section className="scorecard px-2 py-4 sm:p-4">
          <div className="mb-3 px-2 flex items-center justify-between">
            <h2 className="display text-lg font-bold uppercase text-parchment-foreground">
              Scorecard
            </h2>
            <div className="num text-xs text-parchment-foreground/70">
              {inBag.length} discs in bag
            </div>
          </div>
          <div className="space-y-2">
            {course.holes.map((ch, i) => {
              const rh = holes[i];
              return (
                <div
                  key={i}
                  className="rounded-lg bg-parchment-line/25 border border-parchment-line/40 p-3"
                >
                  <div className="flex items-center justify-between text-parchment-foreground">
                    <div className="flex items-center gap-2">
                      <span className="display text-lg font-bold">Hole {i + 1}</span>
                      <span className="text-xs uppercase tracking-widest text-parchment-foreground/70">
                        Par {ch.par} · {ch.distance}ft
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-3 sm:grid-cols-6 gap-2">
                    <NumField
                      label="Score"
                      value={rh.score}
                      onChange={(v) => updateHole(i, { score: v })}
                    />
                    <NumField
                      label="Putts in"
                      value={rh.puttsMade}
                      onChange={(v) => updateHole(i, { puttsMade: v })}
                    />
                    <NumField
                      label="Putts miss"
                      value={rh.puttsMissed}
                      onChange={(v) => updateHole(i, { puttsMissed: v })}
                    />
                    <NumField
                      label="Penalties"
                      value={rh.penalties}
                      onChange={(v) => updateHole(i, { penalties: v })}
                    />
                    <NumField
                      label="Drive ft"
                      value={rh.driveDistance ?? 0}
                      onChange={(v) => updateHole(i, { driveDistance: v || null })}
                    />
                    <div className="flex items-end pb-1.5">
                      <label className="flex items-center gap-2 text-xs uppercase tracking-widest text-parchment-foreground/80">
                        <Checkbox
                          checked={rh.fairwayHit}
                          onCheckedChange={(v) => updateHole(i, { fairwayHit: !!v })}
                          className="border-parchment-foreground/40 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                        Fairway
                      </label>
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="text-[10px] uppercase tracking-widest text-parchment-foreground/70">
                      Tee disc
                    </label>
                    <Select
                      value={rh.discId ?? "none"}
                      onValueChange={(v) =>
                        updateHole(i, { discId: v === "none" ? null : v })
                      }
                    >
                      <SelectTrigger className="mt-1 h-11 bg-background/40 border-parchment-line text-parchment-foreground">
                        <SelectValue placeholder="Pick disc" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— No disc —</SelectItem>
                        {inBag.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.name}{" "}
                            <span className="text-muted-foreground">
                              ({d.speed}/{d.glide}/{d.turn}/{d.fade})
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Running totals & save */}
      {totals && course && (
        <section className="sticky bottom-16 sm:bottom-4 z-20 rounded-2xl border border-border bg-card/95 p-4 shadow-2xl backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="num">
                <b className="text-lg">{totals.totalScore}</b>{" "}
                <span className="text-muted-foreground">/ par {totals.totalPar}</span>
              </span>
              <ToParPill toPar={totals.toPar} />
              <span className="num text-muted-foreground">
                {totals.puttsMade}/{totals.totalPutts} putts · {totals.fairwayPct}% fwy
              </span>
              <RatingPill rating={totals.rating} />
            </div>
            <Button onClick={save} className="gap-1.5">
              <Save className="h-4 w-4" /> Save round
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}

function BackLink() {
  return (
    <Link to="/rounds" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft className="h-4 w-4" /> Rounds
    </Link>
  );
}

function NumField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-widest text-parchment-foreground/70">
        {label}
      </label>
      <Input
        type="number"
        inputMode="numeric"
        value={value || ""}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="num mt-1 h-11 bg-background/40 border-parchment-line text-parchment-foreground text-center font-bold text-lg"
      />
    </div>
  );
}
