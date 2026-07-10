import { cn } from "@/lib/utils";

export function RatingPill({
  rating,
  size = "md",
  className,
}: {
  rating: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = {
    sm: "text-sm px-2.5 py-0.5",
    md: "text-base px-3 py-1",
    lg: "text-3xl px-5 py-2",
  } as const;
  const tone =
    rating >= 950
      ? "bg-accent text-accent-foreground"
      : rating >= 850
        ? "bg-primary text-primary-foreground"
        : rating >= 700
          ? "bg-muted text-foreground"
          : "bg-secondary text-secondary-foreground";
  return (
    <span
      className={cn(
        "rating-badge num inline-flex items-center rounded-full font-bold tabular-nums",
        sizes[size],
        tone,
        className,
      )}
    >
      {rating}
    </span>
  );
}

export function ToParPill({ toPar, className }: { toPar: number; className?: string }) {
  const tone =
    toPar < 0 ? "bg-birdie/20 text-birdie" : toPar === 0 ? "bg-muted text-foreground" : "bg-rust/20 text-rust";
  const label = toPar === 0 ? "E" : toPar > 0 ? `+${toPar}` : `${toPar}`;
  return (
    <span
      className={cn(
        "num inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-semibold tabular-nums",
        tone,
        className,
      )}
    >
      {label}
    </span>
  );
}
