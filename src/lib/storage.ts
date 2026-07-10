import type { Course, Disc, Round } from "./types";

const K_COURSES = "dgl.courses.v1";
const K_DISCS = "dgl.discs.v1";
const K_ROUNDS = "dgl.rounds.v1";

function isBrowser() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function read<T>(key: string): T[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

function write<T>(key: string, value: T[]) {
  if (!isBrowser()) return;
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("dgl:change", { detail: { key } }));
}

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Courses
export function getCourses(): Course[] {
  return read<Course>(K_COURSES);
}
export function getCourse(id: string): Course | undefined {
  return getCourses().find((c) => c.id === id);
}
export function saveCourse(c: Course) {
  const all = getCourses();
  const idx = all.findIndex((x) => x.id === c.id);
  if (idx >= 0) all[idx] = c;
  else all.unshift(c);
  write(K_COURSES, all);
}
export function deleteCourse(id: string) {
  write(
    K_COURSES,
    getCourses().filter((c) => c.id !== id),
  );
}

// Discs
export function getDiscs(): Disc[] {
  return read<Disc>(K_DISCS);
}
export function getDisc(id: string): Disc | undefined {
  return getDiscs().find((d) => d.id === id);
}
export function saveDisc(d: Disc) {
  const all = getDiscs();
  const idx = all.findIndex((x) => x.id === d.id);
  if (idx >= 0) all[idx] = d;
  else all.unshift(d);
  write(K_DISCS, all);
}
export function deleteDisc(id: string) {
  write(
    K_DISCS,
    getDiscs().filter((d) => d.id !== id),
  );
}

// Rounds
export function getRounds(): Round[] {
  return read<Round>(K_ROUNDS);
}
export function getRound(id: string): Round | undefined {
  return getRounds().find((r) => r.id === id);
}
export function saveRound(r: Round) {
  const all = getRounds();
  const idx = all.findIndex((x) => x.id === r.id);
  if (idx >= 0) all[idx] = r;
  else all.unshift(r);
  write(K_ROUNDS, all);
}
export function deleteRound(id: string) {
  write(
    K_ROUNDS,
    getRounds().filter((r) => r.id !== id),
  );
}
