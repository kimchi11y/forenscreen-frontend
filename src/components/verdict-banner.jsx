import { cn } from "@/lib/utils";
import { tone, verdict as lookup } from "@/lib/verdict";

/**
 * The verdict pill. Icon + text label, never colour alone.
 */
export function VerdictPill({ status, label, className }) {
  const v = lookup(status);
  const t = tone(v.tone);
  const { Icon } = v;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-[3px]",
        "text-xs font-semibold",
        t.pill,
        className,
      )}
    >
      <Icon className="size-3" />
      {label ?? v.label}
    </span>
  );
}

/**
 * The full-width verdict banner shown above the comparison.
 *
 * `status` is the raw backend enum; the wording, tone and icon all come from
 * lib/verdict.js so they cannot drift from the rest of the app.
 */
export default function VerdictBanner({
  status,
  ownsOriginal = true,
  description,
  confidence,
  actions,
  className,
}) {
  const v = lookup(status, { ownsOriginal });
  const t = tone(v.tone);
  const { Icon } = v;

  return (
    <div
      role="status"
      className={cn(
        "flex flex-wrap items-start gap-4 rounded-xl border border-l-4 p-4 sm:flex-nowrap",
        t.banner,
        className,
      )}
    >
      <span className={cn("grid size-10 shrink-0 place-items-center rounded-[10px]", t.icon)}>
        <Icon className="size-5" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-base font-semibold leading-snug">{v.headline}</p>
        <p className="mt-0.5 text-[0.8125rem] text-muted-foreground">
          {description ?? v.explanation}
        </p>

        {confidence?.inliers != null && (
          <p className="mt-2 text-[0.75rem] text-muted-foreground">
            Matched on {confidence.inliers} consistent feature points
            {confidence.phashDistance != null && ` · pHash distance ${confidence.phashDistance} bits`}
          </p>
        )}
      </div>

      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
