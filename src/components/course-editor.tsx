import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveCourse, uid } from "@/lib/storage";
import type { Course, CourseHole } from "@/lib/types";
import { toast } from "sonner";

export function CourseEditor({
  initial,
  onSaved,
  onCancel,
}: {
  initial?: Course;
  onSaved: (c: Course) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [holeCount, setHoleCount] = useState<number>(initial?.holes.length ?? 18);
  const [anchorScore, setAnchorScore] = useState<number>(initial?.anchorScore ?? 54);
  const [anchorRating, setAnchorRating] = useState<number>(initial?.anchorRating ?? 1000);
  const [pointsPerThrow, setPointsPerThrow] = useState<number>(initial?.pointsPerThrow ?? 15);
  const [holes, setHoles] = useState<CourseHole[]>(
    initial?.holes ?? Array.from({ length: 18 }, () => ({ par: 3, distance: 300 })),
  );

  const setHoleCountSafe = (n: number) => {
    const size = Math.max(1, Math.min(36, n || 1));
    setHoleCount(size);
    setHoles((prev) => {
      if (prev.length === size) return prev;
      if (prev.length < size) {
        return [...prev, ...Array.from({ length: size - prev.length }, () => ({ par: 3, distance: 300 }))];
      }
      return prev.slice(0, size);
    });
  };

  const updateHole = (i: number, patch: Partial<CourseHole>) => {
    setHoles((prev) => prev.map((h, idx) => (idx === i ? { ...h, ...patch } : h)));
  };

  const totalPar = holes.reduce((s, h) => s + (h.par || 0), 0);
  const totalDist = holes.reduce((s, h) => s + (h.distance || 0), 0);

  const submit = () => {
    if (!name.trim()) {
      toast.error("Name required");
      return;
    }
    const c: Course = {
      id: initial?.id ?? uid(),
      name: name.trim(),
      holes,
      anchorScore,
      anchorRating,
      pointsPerThrow,
      createdAt: initial?.createdAt ?? new Date().toISOString(),
    };
    saveCourse(c);
    toast.success(initial ? "Course updated" : "Course added");
    onSaved(c);
  };

  return (
    <div className="space-y-6">
      <header>
        <div className="text-xs uppercase tracking-[0.3em] text-primary">
          {initial ? "Edit course" : "New course"}
        </div>
        <h1 className="display text-3xl font-bold uppercase">{initial ? name || "Course" : "Add course"}</h1>
      </header>

      <section className="grid gap-4 rounded-2xl border border-border/60 bg-card/60 p-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label>Course name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Maple Hill" />
        </div>
        <div>
          <Label>Hole count</Label>
          <Input
            type="number"
            value={holeCount}
            onChange={(e) => setHoleCountSafe(Number(e.target.value))}
            className="num"
          />
        </div>
        <div className="grid grid-cols-3 gap-2 sm:col-span-1">
          <div>
            <Label>Anchor score</Label>
            <Input
              type="number"
              value={anchorScore}
              onChange={(e) => setAnchorScore(Number(e.target.value))}
              className="num"
            />
          </div>
          <div>
            <Label>= Rating</Label>
            <Input
              type="number"
              value={anchorRating}
              onChange={(e) => setAnchorRating(Number(e.target.value))}
              className="num"
            />
          </div>
          <div>
            <Label>Pts/throw</Label>
            <Input
              type="number"
              value={pointsPerThrow}
              onChange={(e) => setPointsPerThrow(Number(e.target.value))}
              className="num"
            />
          </div>
        </div>
        <p className="sm:col-span-2 text-xs text-muted-foreground">
          Rating formula: <span className="num">rating = {anchorRating} + ({anchorScore} - score) × {pointsPerThrow}</span>
        </p>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card/60 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="display text-lg font-bold uppercase">Holes</h2>
          <div className="text-xs text-muted-foreground num">
            Total: Par {totalPar} · {totalDist.toLocaleString()} ft
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="grid grid-cols-12 gap-2 px-2 text-[10px] uppercase tracking-widest text-muted-foreground">
            <div className="col-span-2">Hole</div>
            <div className="col-span-5">Par</div>
            <div className="col-span-5">Distance (ft)</div>
          </div>
          {holes.map((h, i) => (
            <div key={i} className="grid grid-cols-12 items-center gap-2">
              <div className="col-span-2 num font-semibold">{i + 1}</div>
              <Input
                className="col-span-5 num text-center h-10"
                type="number"
                value={h.par}
                onChange={(e) => updateHole(i, { par: Number(e.target.value) || 0 })}
              />
              <Input
                className="col-span-5 num text-center h-10"
                type="number"
                value={h.distance}
                onChange={(e) => updateHole(i, { distance: Number(e.target.value) || 0 })}
              />
            </div>
          ))}
        </div>
      </section>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button onClick={submit}>Save course</Button>
      </div>
    </div>
  );
}
