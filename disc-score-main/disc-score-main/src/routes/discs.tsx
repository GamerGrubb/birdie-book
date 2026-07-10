import { createFileRoute, Outlet, useRouterState, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useDiscs, useRounds } from "@/lib/use-storage";
import type { Disc, DiscCategory, DiscStatus } from "@/lib/types";
import { deleteDisc, saveDisc, uid } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/discs")({
  component: DiscsLayout,
});

function DiscsLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname !== "/discs") return <Outlet />;
  return <DiscsList />;
}

const CATEGORY_LABEL: Record<DiscCategory, string> = {
  driver: "Distance driver",
  fairway: "Fairway driver",
  midrange: "Midrange",
  putter: "Putter",
  other: "Other",
};

const CATEGORY_ORDER: DiscCategory[] = ["driver", "fairway", "midrange", "putter", "other"];

function DiscsList() {
  const discs = useDiscs();
  const rounds = useRounds();
  const [tab, setTab] = useState<"in-bag" | "retired">("in-bag");
  const [editing, setEditing] = useState<Disc | null>(null);
  const [open, setOpen] = useState(false);

  const filtered = discs.filter((d) =>
    tab === "in-bag" ? d.status === "in-bag" : d.status !== "in-bag",
  );
  const grouped = CATEGORY_ORDER.map((cat) => ({
    cat,
    items: filtered.filter((d) => d.category === cat),
  })).filter((g) => g.items.length > 0);

  const throwCount = (discId: string) =>
    rounds.reduce(
      (n, r) => n + r.holes.filter((h) => h.discId === discId).length,
      0,
    );

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-primary">Loadout</div>
          <h1 className="display text-3xl font-bold uppercase">Disc bag</h1>
        </div>
        <Button
          className="gap-1.5"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> Add disc
        </Button>
      </header>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "in-bag" | "retired")}>
        <TabsList>
          <TabsTrigger value="in-bag">
            In bag ({discs.filter((d) => d.status === "in-bag").length})
          </TabsTrigger>
          <TabsTrigger value="retired">
            Retired / lost ({discs.filter((d) => d.status !== "in-bag").length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {grouped.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">
          No discs here yet.
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(({ cat, items }) => (
            <div key={cat}>
              <h2 className="mb-2 display text-sm font-bold uppercase tracking-widest text-muted-foreground">
                {CATEGORY_LABEL[cat]}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((d) => (
                  <DiscCard
                    key={d.id}
                    disc={d}
                    throws={throwCount(d.id)}
                    onEdit={() => {
                      setEditing(d);
                      setOpen(true);
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <DiscDialog open={open} setOpen={setOpen} disc={editing} />
    </div>
  );
}

function DiscCard({
  disc,
  throws,
  onEdit,
}: {
  disc: Disc;
  throws: number;
  onEdit: () => void;
}) {
  return (
    <div className="disc-card p-4 relative">
      <div className="flex items-start justify-between">
        <Link
          to="/discs/$id"
          params={{ id: disc.id }}
          className="block"
        >
          <div className="display text-lg font-bold uppercase leading-tight">
            {disc.name}
          </div>
          <div className="text-xs text-muted-foreground">
            {disc.plastic || "—"} · {disc.weight ? `${disc.weight}g` : "—"}
          </div>
        </Link>
        <button
          onClick={onEdit}
          className="text-muted-foreground hover:text-foreground p-1"
          aria-label="Edit"
        >
          <Pencil className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <FlightBadge label="Spd" value={disc.speed} />
        <FlightBadge label="Gld" value={disc.glide} />
        <FlightBadge label="Trn" value={disc.turn} />
        <FlightBadge label="Fad" value={disc.fade} />
      </div>

      <div className="mt-3 flex items-center justify-between text-xs">
        <span
          className={cn(
            "num rounded-full px-2 py-0.5",
            disc.status === "in-bag"
              ? "bg-primary/15 text-primary"
              : "bg-muted text-muted-foreground",
          )}
        >
          {disc.status}
        </span>
        <span className="num text-muted-foreground">{throws} throws logged</span>
      </div>
    </div>
  );
}

function FlightBadge({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-md bg-background/60 px-2 py-1 min-w-[3rem]">
      <span className="text-[9px] uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className="num text-sm font-bold">{value}</span>
    </div>
  );
}

function DiscDialog({
  open,
  setOpen,
  disc,
}: {
  open: boolean;
  setOpen: (o: boolean) => void;
  disc: Disc | null;
}) {
  const key = disc?.id ?? "new";
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="display uppercase">
            {disc ? "Edit disc" : "Add disc"}
          </DialogTitle>
        </DialogHeader>
        <DiscForm
          key={key}
          initial={disc ?? blankDisc()}
          onSubmit={(v) => {
            saveDisc(v);
            toast.success(disc ? "Disc updated" : "Disc added");
            setOpen(false);
          }}
          onDelete={
            disc
              ? () => {
                  if (confirm(`Delete "${disc.name}"?`)) {
                    deleteDisc(disc.id);
                    toast.success("Disc deleted");
                    setOpen(false);
                  }
                }
              : undefined
          }
        />
      </DialogContent>
    </Dialog>
  );
}

function blankDisc(): Disc {
  return {
    id: uid(),
    name: "",
    category: "driver",
    speed: 0,
    glide: 0,
    turn: 0,
    fade: 0,
    plastic: "",
    weight: null,
    status: "in-bag",
    createdAt: new Date().toISOString(),
  };
}

function DiscForm({
  initial,
  onSubmit,
  onDelete,
}: {
  initial: Disc;
  onSubmit: (d: Disc) => void;
  onDelete?: () => void;
}) {
  const [f, setF] = useState<Disc>(initial);
  const set = <K extends keyof Disc>(k: K, v: Disc[K]) => setF((p) => ({ ...p, [k]: v }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!f.name.trim()) {
          toast.error("Name required");
          return;
        }
        onSubmit(f);
      }}
      className="space-y-4"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label>Name</Label>
          <Input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Destroyer" />
        </div>
        <div>
          <Label>Category</Label>
          <Select value={f.category} onValueChange={(v) => set("category", v as DiscCategory)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORY_ORDER.map((c) => (
                <SelectItem key={c} value={c}>{CATEGORY_LABEL[c]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Status</Label>
          <Select value={f.status} onValueChange={(v) => set("status", v as DiscStatus)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="in-bag">In bag</SelectItem>
              <SelectItem value="retired">Retired</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <FlightInput label="Speed" value={f.speed} onChange={(v) => set("speed", v)} />
        <FlightInput label="Glide" value={f.glide} onChange={(v) => set("glide", v)} />
        <FlightInput label="Turn" value={f.turn} onChange={(v) => set("turn", v)} />
        <FlightInput label="Fade" value={f.fade} onChange={(v) => set("fade", v)} />
        <div>
          <Label>Plastic</Label>
          <Input value={f.plastic} onChange={(e) => set("plastic", e.target.value)} placeholder="Star" />
        </div>
        <div>
          <Label>Weight (g)</Label>
          <Input
            type="number"
            value={f.weight ?? ""}
            onChange={(e) => set("weight", e.target.value ? Number(e.target.value) : null)}
            placeholder="175"
          />
        </div>
        <div className="sm:col-span-2">
          <Label>Color (optional)</Label>
          <Input value={f.color ?? ""} onChange={(e) => set("color", e.target.value)} placeholder="Blue" />
        </div>
      </div>
      <DialogFooter className="gap-2 sm:justify-between">
        {onDelete ? (
          <Button type="button" variant="ghost" className="text-rust" onClick={onDelete}>
            <Trash2 className="h-4 w-4 mr-1.5" /> Delete
          </Button>
        ) : (
          <span />
        )}
        <Button type="submit">Save disc</Button>
      </DialogFooter>
    </form>
  );
}

function FlightInput({
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
      <Label>{label}</Label>
      <Input
        type="number"
        step="0.5"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="num text-center font-bold"
      />
    </div>
  );
}
