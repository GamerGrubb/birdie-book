import type { Course, Round, RoundTotals } from "./types";

export function computeTotals(round: Round, course: Course): RoundTotals {
  let totalScore = 0;
  let totalPar = 0;
  let totalPutts = 0;
  let puttsMade = 0;
  let fairwayHits = 0;
  let fairwayEligible = 0;
  let penalties = 0;

  for (let i = 0; i < course.holes.length; i++) {
    const ch = course.holes[i];
    const rh = round.holes[i];
    totalPar += ch.par || 0;
    if (!rh) continue;
    totalScore += rh.score || 0;
    puttsMade += rh.puttsMade || 0;
    totalPutts += (rh.puttsMade || 0) + (rh.puttsMissed || 0);
    penalties += rh.penalties || 0;
    // Fairway only counted on par 4+ typically, but keep simple: all holes eligible
    if ((ch.par || 3) >= 3) {
      fairwayEligible += 1;
      if (rh.fairwayHit) fairwayHits += 1;
    }
  }

  const toPar = totalScore - totalPar;
  const rating =
    course.anchorRating +
    (course.anchorScore - totalScore) * (course.pointsPerThrow || 15);

  return {
    totalScore,
    totalPar,
    toPar,
    totalPutts,
    puttsMade,
    fairwayHits,
    fairwayEligible,
    fairwayPct: fairwayEligible
      ? Math.round((fairwayHits / fairwayEligible) * 100)
      : 0,
    penalties,
    rating: Math.round(rating),
  };
}

export function formatToPar(toPar: number): string {
  if (toPar === 0) return "E";
  return toPar > 0 ? `+${toPar}` : `${toPar}`;
}

export function scoreClass(score: number, par: number): string {
  const diff = score - par;
  if (diff <= -2) return "text-eagle";
  if (diff === -1) return "text-birdie";
  if (diff === 0) return "text-foreground";
  if (diff === 1) return "text-bogey";
  return "text-double";
}
