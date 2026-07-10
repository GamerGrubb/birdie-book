import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useCourses, useRounds } from "@/lib/use-storage";
import { computeTotals } from "@/lib/rating";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { format, parseISO } from "date-fns";

export const Route = createFileRoute("/stats")({
  component: StatsPage,
});

function StatsPage() {
  const rounds = useRounds();
  const courses = useCourses();
  const [courseFilter, setCourseFilter] = useState<string>("all");

  const series = useMemo(() => {
    const items = rounds
      .filter((r) => courseFilter === "all" || r.courseId === courseFilter)
      .map((r) => {
        const c = courses.find((c) => c.id === r.courseId);
        if (!c) return null;
        const t = computeTotals(r, c);
        return {
          date: r.date,
          label: format(parseISO(r.date), "MMM d"),
          rating: t.rating,
          toPar: t.toPar,
          score: t.totalScore,
          putts: t.totalPutts,
          puttPct: t.totalPutts ? Math.round((t.puttsMade / t.totalPutts) * 100) : 0,
          fairwayPct: t.fairwayPct,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => a.date.localeCompare(b.date));
    return items;
  }, [rounds, courses, courseFilter]);

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-primary">Progress</div>
          <h1 className="display text-3xl font-bold uppercase">Trends</h1>
        </div>
        <div className="w-56">
          <Select value={courseFilter} onValueChange={setCourseFilter}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All courses</SelectItem>
              {courses.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      {series.length < 2 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
          Need at least two rounds to see trends.
        </div>
      ) : (
        <div className="grid gap-4">
          <ChartCard title="Round rating" dataKey="rating" color="var(--color-primary)" data={series} />
          <ChartCard title="Scoring average (total score)" dataKey="score" color="var(--color-rust)" data={series} />
          <ChartCard title="Putting %" dataKey="puttPct" color="var(--color-accent)" data={series} suffix="%" />
          <ChartCard title="Fairway hit %" dataKey="fairwayPct" color="var(--color-birdie)" data={series} suffix="%" />
        </div>
      )}
    </div>
  );
}

function ChartCard({
  title,
  dataKey,
  color,
  data,
  suffix,
}: {
  title: string;
  dataKey: string;
  color: string;
  data: Array<Record<string, unknown>>;
  suffix?: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/60 p-5">
      <h3 className="display text-sm font-bold uppercase tracking-widest text-muted-foreground mb-3">
        {title}
      </h3>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
              width={35}
              domain={["auto", "auto"]}
              tickFormatter={(v) => (suffix ? `${v}${suffix}` : `${v}`)}
            />
            <Tooltip
              contentStyle={{
                background: "var(--color-popover)",
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                color: "var(--color-foreground)",
              }}
              formatter={(v) => (suffix ? `${v}${suffix}` : v)}
            />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2.5}
              dot={{ r: 3, fill: color }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
