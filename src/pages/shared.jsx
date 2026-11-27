import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Link2Off, Loader2, ShieldCheck } from "lucide-react";

import { forensicsAPI } from "@/api/forensics";
import EvidenceFrame from "@/components/evidence-frame";
import PrivateOriginal from "@/components/private-original";
import VerdictBanner from "@/components/verdict-banner";
import { Card, CardContent } from "@/components/ui/card";
import { showsDifferences, verdict } from "@/lib/verdict";

const WHEN = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });

function formatWhen(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? WHEN.format(date) : "—";
}

function Fact({ label, children }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border py-2 text-[0.8125rem] last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 break-all text-right">{children}</span>
    </div>
  );
}

/**
 * What someone sees when a check's owner sends them a share link. No account
 * is needed: the link is the permission. The original is shown only when the
 * person who shared the check also owns it.
 */
export default function SharedPage() {
  const { token } = useParams();
  const [shared, setShared] = useState(null);
  const [regions, setRegions] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    forensicsAPI.getShared(token).then(
      async (data) => {
        if (!active) return;
        setShared(data);
        if (data.matched_original && showsDifferences(data.verification_status)) {
          try {
            const located = await forensicsAPI.getSharedRegions(token);
            if (active) setRegions(located?.regions ?? []);
          } catch {
            // the overlay image still shows where the copy differs
          }
        }
      },
      (err) => active && setError(err?.message || "This link could not be opened."),
    );
    return () => {
      active = false;
    };
  }, [token]);

  if (error) {
    return (
      <div className="mx-auto w-full max-w-[560px] px-5 py-20 text-center">
        <Link2Off className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
        <h1 className="mt-4 text-xl font-semibold">This link can&rsquo;t be opened</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (!shared) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Opening the shared result…
      </div>
    );
  }

  const original = shared.matched_original;
  const differs = Boolean(original) && showsDifferences(shared.verification_status);

  return (
    <div className="mx-auto flex w-full max-w-[880px] flex-col gap-6 px-5 py-10 pb-16 lg:px-0">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">Shared verification result</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Someone shared this ForenScreen result with you. It was checked on{" "}
          {formatWhen(shared.checked_at)}. This link expires on {formatWhen(shared.share.expires_at)}.
        </p>
      </section>

      <VerdictBanner
        status={shared.verification_status}
        ownsOriginal={false}
        description={verdict(shared.verification_status, { ownsOriginal: false }).explanation}
      />

      <div className={original ? "grid gap-5 sm:grid-cols-2" : "mx-auto w-full max-w-[400px]"}>
        <figure className="flex flex-col gap-2">
          <figcaption className="text-xs text-muted-foreground">The checked image</figcaption>
          <EvidenceFrame
            src={forensicsAPI.sharedImageUrl(token, "evidence")}
            alt="The checked image"
            overlaySrc={differs ? forensicsAPI.sharedImageUrl(token, "difference-overlay") : undefined}
            regions={differs ? regions : []}
            tag={differs ? "Differences marked" : undefined}
          />
        </figure>

        {original && (
          <figure className="flex flex-col gap-2">
            <figcaption className="text-xs text-muted-foreground">The registered original</figcaption>
            {original.visible ? (
              <EvidenceFrame
                src={forensicsAPI.sharedImageUrl(token, "original")}
                alt={`The registered original: ${original.file_name}`}
                tag={`Registered ${formatWhen(original.registered_at)}`}
              />
            ) : (
              <PrivateOriginal registeredAt={original.registered_at} sha256={original.sha256} />
            )}
          </figure>
        )}
      </div>

      <Card>
        <CardContent className="space-y-1">
          <Fact label="Checked image fingerprint (SHA-256)">
            <span className="font-mono text-xs">{shared.sha256_hash}</span>
          </Fact>
          {original && (
            <>
              <Fact label="Original registered">{formatWhen(original.registered_at)}</Fact>
              <Fact label="Original fingerprint (SHA-256)">
                <span className="font-mono text-xs">{original.sha256}</span>
              </Fact>
              <Fact label="Blockchain record">
                <Link
                  to={`/verify?hash=${original.sha256}`}
                  className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
                >
                  <ShieldCheck className="size-3.5" aria-hidden="true" />
                  Check it on the blockchain
                </Link>
              </Fact>
            </>
          )}
          <Fact label="Chain of custody">
            {shared.custody.intact ? "Intact, no entry has been changed" : "Broken, an entry has been changed"}
          </Fact>
        </CardContent>
      </Card>

      <section aria-labelledby="shared-history" className="space-y-2">
        <h2 id="shared-history" className="text-sm font-semibold">What happened to this result</h2>
        <ol className="divide-y divide-border rounded-lg border border-border">
          {shared.custody.entries.map((entry, index) => (
            <li key={index} className="flex flex-wrap justify-between gap-2 px-3 py-2 text-[0.8125rem]">
              <span>{entry.label}</span>
              <span className="text-muted-foreground">{formatWhen(entry.occurred_at)}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
