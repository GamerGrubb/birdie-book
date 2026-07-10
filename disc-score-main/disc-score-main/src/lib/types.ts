export type DiscCategory = "driver" | "fairway" | "midrange" | "putter" | "other";
export type DiscStatus = "in-bag" | "retired" | "lost";

export interface Disc {
  id: string;
  name: string;
  category: DiscCategory;
  speed: number;
  glide: number;
  turn: number;
  fade: number;
  plastic: string;
  weight: number | null;
  status: DiscStatus;
  color?: string;
  createdAt: string;
}

export interface CourseHole {
  par: number;
  distance: number; // feet
}

export interface Course {
  id: string;
  name: string;
  holes: CourseHole[];
  anchorScore: number;
  anchorRating: number;
  pointsPerThrow: number; // default 15
  createdAt: string;
}

export interface RoundHole {
  score: number;
  puttsMade: number;
  puttsMissed: number;
  fairwayHit: boolean;
  penalties: number;
  driveDistance: number | null;
  discId: string | null;
}

export interface Round {
  id: string;
  courseId: string;
  date: string; // ISO date (yyyy-mm-dd)
  holes: RoundHole[];
  notes?: string;
  createdAt: string;
}

export interface RoundTotals {
  totalScore: number;
  totalPar: number;
  toPar: number;
  totalPutts: number;
  puttsMade: number;
  fairwayHits: number;
  fairwayEligible: number;
  fairwayPct: number;
  penalties: number;
  rating: number;
}
