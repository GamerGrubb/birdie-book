import { getCourses, getDiscs, getRounds, saveCourse, saveDisc, saveRound } from "./storage";
import type { Course, Disc, Round } from "./types";

export interface BackupFile {
  app: "disc-golf-log";
  version: 1;
  exportedAt: string;
  data: {
    courses: Course[];
    discs: Disc[];
    rounds: Round[];
  };
}

export function buildBackup(): BackupFile {
  return {
    app: "disc-golf-log",
    version: 1,
    exportedAt: new Date().toISOString(),
    data: {
      courses: getCourses(),
      discs: getDiscs(),
      rounds: getRounds(),
    },
  };
}

export function downloadBackup() {
  const backup = buildBackup();
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `disc-golf-log-backup-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export type ImportMode = "merge" | "replace";

export interface ImportResult {
  courses: number;
  discs: number;
  rounds: number;
}

function validate(obj: unknown): BackupFile {
  if (!obj || typeof obj !== "object") throw new Error("Invalid file");
  const b = obj as Partial<BackupFile>;
  if (b.app !== "disc-golf-log") throw new Error("Not a Disc Golf Log backup");
  if (
    !b.data ||
    !Array.isArray(b.data.courses) ||
    !Array.isArray(b.data.discs) ||
    !Array.isArray(b.data.rounds)
  ) {
    throw new Error("Backup missing data arrays");
  }
  return b as BackupFile;
}

function clearAll() {
  if (typeof localStorage === "undefined") return;
  ["dgl.courses.v1", "dgl.discs.v1", "dgl.rounds.v1"].forEach((k) => localStorage.removeItem(k));
  window.dispatchEvent(new CustomEvent("dgl:change", { detail: { key: "all" } }));
}

export async function importBackupFromFile(file: File, mode: ImportMode): Promise<ImportResult> {
  const text = await file.text();
  const parsed = JSON.parse(text);
  const backup = validate(parsed);

  if (mode === "replace") clearAll();

  const existingCourses = new Set(getCourses().map((c) => c.id));
  const existingDiscs = new Set(getDiscs().map((d) => d.id));
  const existingRounds = new Set(getRounds().map((r) => r.id));

  let courses = 0;
  let discs = 0;
  let rounds = 0;

  for (const c of backup.data.courses) {
    if (mode === "merge" && existingCourses.has(c.id)) continue;
    saveCourse(c);
    courses++;
  }
  for (const d of backup.data.discs) {
    if (mode === "merge" && existingDiscs.has(d.id)) continue;
    saveDisc(d);
    discs++;
  }
  for (const r of backup.data.rounds) {
    if (mode === "merge" && existingRounds.has(r.id)) continue;
    saveRound(r);
    rounds++;
  }

  return { courses, discs, rounds };
}
