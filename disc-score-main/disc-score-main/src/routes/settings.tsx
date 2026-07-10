import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Download, Upload, Trash2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { downloadBackup, importBackupFromFile, type ImportMode } from "@/lib/backup";
import { useCourses, useDiscs, useRounds } from "@/lib/use-storage";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const courses = useCourses();
  const discs = useDiscs();
  const rounds = useRounds();
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<ImportMode>("merge");

  const handleImport = async (file: File) => {
    try {
      const res = await importBackupFromFile(file, mode);
      toast.success(
        `Imported ${res.courses} courses, ${res.discs} discs, ${res.rounds} rounds`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const wipe = () => {
    if (!confirm("Delete ALL local data? This cannot be undone.")) return;
    ["dgl.courses.v1", "dgl.discs.v1", "dgl.rounds.v1"].forEach((k) =>
      localStorage.removeItem(k),
    );
    window.dispatchEvent(new CustomEvent("dgl:change", { detail: { key: "all" } }));
    toast.success("All data cleared");
  };

  return (
    <div className="space-y-6">
      <header>
        <div className="text-xs uppercase tracking-[0.3em] text-primary">Data</div>
        <h1 className="display text-3xl font-bold uppercase">Settings & Backup</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-lg">
          Everything is stored on this device only. Nothing is sent to a server.
          Use export/import to move your data between devices or keep a backup.
        </p>
      </header>

      <section className="rounded-2xl border border-border/60 bg-card/60 p-5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span>
            <span className="num font-semibold text-foreground">
              {courses.length}
            </span>{" "}
            courses ·{" "}
            <span className="num font-semibold text-foreground">
              {discs.length}
            </span>{" "}
            discs ·{" "}
            <span className="num font-semibold text-foreground">
              {rounds.length}
            </span>{" "}
            rounds stored locally
          </span>
        </div>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card/60 p-5 space-y-4">
        <div>
          <h2 className="display text-lg font-bold uppercase">Export</h2>
          <p className="text-sm text-muted-foreground">
            Download a JSON snapshot of every course, disc, and round.
          </p>
        </div>
        <Button onClick={downloadBackup} className="gap-2">
          <Download className="h-4 w-4" /> Download backup (.json)
        </Button>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card/60 p-5 space-y-4">
        <div>
          <h2 className="display text-lg font-bold uppercase">Import</h2>
          <p className="text-sm text-muted-foreground">
            Restore from a backup file created on another device.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="mode"
              value="merge"
              checked={mode === "merge"}
              onChange={() => setMode("merge")}
            />
            Merge (keep existing)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="mode"
              value="replace"
              checked={mode === "replace"}
              onChange={() => setMode("replace")}
            />
            Replace (wipe first)
          </label>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleImport(f);
          }}
        />
        <Button
          variant="secondary"
          className="gap-2"
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="h-4 w-4" /> Choose backup file
        </Button>
      </section>

      <section className="rounded-2xl border border-destructive/40 bg-destructive/5 p-5 space-y-3">
        <div>
          <h2 className="display text-lg font-bold uppercase text-destructive">
            Danger zone
          </h2>
          <p className="text-sm text-muted-foreground">
            Permanently delete all locally stored data.
          </p>
        </div>
        <Button variant="destructive" className="gap-2" onClick={wipe}>
          <Trash2 className="h-4 w-4" /> Clear all data
        </Button>
      </section>
    </div>
  );
}