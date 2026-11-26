import { Link } from "react-router-dom";
import { Lock, ShieldCheck } from "lucide-react";

import { cn } from "@/lib/utils";

const REGISTERED_ON = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });

function formatRegistered(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? REGISTERED_ON.format(date) : null;
}

/**
 * Stands in for a matched original that belongs to another account.
 *
 * Checks are compared against every account's originals, but an original's
 * image and filename are shown to its owner only. What anyone may know is that
 * it exists, when it was registered, and that its fingerprint can be checked on
 * the blockchain without trusting ForenScreen - so that is what this says.
 */
export default function PrivateOriginal({ registeredAt, sha256, className }) {
  const registered = formatRegistered(registeredAt);

  return (
    <div
      className={cn(
        "flex aspect-[3/4] flex-col items-center justify-center gap-2 rounded-[0.6rem] border border-dashed border-border bg-muted p-5 text-center",
        className,
      )}
    >
      <Lock className="size-5 text-muted-foreground" aria-hidden="true" />
      <p className="text-sm font-medium">Registered by another account</p>
      <p className="text-xs text-muted-foreground text-pretty">
        The original is kept private.
        {registered && ` It was registered on ${registered}.`}
      </p>
      {sha256 && (
        <Link
          to={`/verify?hash=${sha256}`}
          className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
        >
          <ShieldCheck className="size-3.5" aria-hidden="true" />
          Check it on the blockchain
        </Link>
      )}
    </div>
  );
}
