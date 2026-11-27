import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  ExternalLink,
  FileQuestion,
  Loader2,
  MinusCircle,
  ScanSearch,
  Share2,
  ShieldAlert,
  ShieldCheck,
  TriangleAlert,
  XCircle,
} from "lucide-react";

import { PageHeader } from "@/components/app-shell";
import VerdictBanner from "@/components/verdict-banner";
import EvidenceFrame from "@/components/evidence-frame";
import PrivateOriginal from "@/components/private-original";
import ShareDialog from "@/components/share-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { forensicsAPI } from "@/api/forensics";
import { matchConfidence, matchMethod, showsDifferences } from "@/lib/verdict";
import { cn } from "@/lib/utils";

const TIMESTAMP = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const ANCHOR_STATES = {
  confirmed: {
    label: "Anchored on-chain",
    className: "text-success bg-success/10 border-success/30",
    Icon: ShieldCheck,
  },
  pending: {
    label: "Anchoring…",
    className: "text-warning-foreground bg-warning/15 border-warning/40",
    Icon: Loader2,
    spin: true,
  },
  failed: {
    label: "Not anchored",
    className: "text-destructive bg-destructive/10 border-destructive/30",
    Icon: XCircle,
  },
  not_required: {
    label: "No anchor",
    className: "text-muted-foreground bg-muted border-border",
    Icon: MinusCircle,
  },
};

function etherscanTx(txHash) {
  return `https://sepolia.etherscan.io/tx/${txHash}`;
}

function formatTimestamp(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : TIMESTAMP.format(date);
}

function shorten(value, lead = 8, tail = 6) {
  const text = String(value ?? "");
  if (text.length <= lead + tail + 1) return text;
  return `${text.slice(0, lead)}…${text.slice(-tail)}`;
}

function actorLabel(actor) {
  if (!actor) return "—";
  const value = String(actor).trim();
  if (!value) return "—";
  const lower = value.toLowerCase();
  if (lower === "system" || lower === "unauthenticated") return lower;
  if (lower.startsWith("user:")) return "Signed-in user";
  return value;
}

function humanize(value) {
  if (!value) return "—";
  return String(value).toLowerCase().replaceAll("_", " ");
}

/**
 * The stored check is flat, while the result returned by /analyze nests the
 * match under `matched_asset`. Fold the flat fields into that same shape so a
 * reloaded check renders through exactly the same markup.
 */
function fromStoredCheck(check) {
  if (!check) return null;

  const matched = {};
  if (check.asset_id != null) {
    matched.original_asset_id = check.asset_id;
    matched.is_owner = Boolean(check.asset_is_owner);
    matched.original_public = Boolean(check.asset_public);
    matched.registered_at = check.asset_registered_at ?? null;
  }
  if (check.match_method != null) matched.match_method = check.match_method;
  if (check.orb_inliers != null) matched.orb_inliers = check.orb_inliers;
  if (check.orb_inlier_ratio != null) {
    matched.orb_inlier_ratio = check.orb_inlier_ratio;
  }
  if (check.phash_distance != null) matched.phash_distance = check.phash_distance;

  return {
    file_id: check.file_id,
    verification_status: check.verification_status,
    sha256_hash: check.sha256_hash,
    saved_filename: check.saved_filename,
    phash: check.phash,
    created_at: check.created_at,
    filename: check.saved_filename,
    file_name: check.saved_filename,
    matched_asset: Object.keys(matched).length > 0 ? matched : null,
  };
}

/**
 * Stored values win, but a result passed through router state still supplies
 * detail the database does not keep (forensic analysis, candidate originals).
 */
function withRouterDetail(storedFile, routerFile) {
  if (!storedFile) return routerFile ?? null;
  if (!routerFile) return storedFile;

  return {
    ...routerFile,
    ...storedFile,
    forensics: routerFile.forensics,
    matched_asset: storedFile.matched_asset
      ? { ...routerFile.matched_asset, ...storedFile.matched_asset }
      : null,
  };
}

/** A label/value line inside a detail card. */
function Row({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <span className="text-[0.8125rem] text-muted-foreground">{label}</span>
      <span className="min-w-0 text-[0.8125rem] font-medium">{children}</span>
    </div>
  );
}

/** A hash, shortened for display but complete on hover. */
function HashValue({ value }) {
  if (!value) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="block max-w-[15rem] truncate font-mono text-xs" title={value}>
      {value}
    </span>
  );
}

/** The newest anchor recorded on the chain, as a single status pill. */
function AnchorPill({ anchor }) {
  const state = ANCHOR_STATES[anchor?.status] ?? ANCHOR_STATES.not_required;
  const { Icon } = state;
  const txHash = anchor?.tx_hash;

  const content = (
    <>
      <Icon className={cn("size-3", state.spin && "animate-spin")} />
      {state.label}
      {txHash && <ExternalLink className="size-3 opacity-70" />}
    </>
  );

  const className = cn(
    "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-[3px] text-xs font-semibold",
    state.className,
  );

  if (!txHash) return <span className={className}>{content}</span>;

  return (
    <a
      href={etherscanTx(txHash)}
      target="_blank"
      rel="noreferrer"
      title={`View ${txHash} on Etherscan`}
      className={cn(className, "transition-opacity hover:opacity-80")}
    >
      {content}
    </a>
  );
}

/** Shown when the page is opened without a check result behind it. */
function EmptyState() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-20 text-center">
      <span className="grid size-12 place-items-center rounded-xl bg-muted text-muted-foreground">
        <FileQuestion className="size-6" />
      </span>
      <div>
        <h1 className="text-lg font-semibold">This check is not on screen</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          We could not find a saved check for this link. It may have been
          removed, or the link may be incomplete. Run the image through the
          analyzer again to see its comparison.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button asChild>
          <Link to="/analyze">
            <ScanSearch />
            Run a check
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/dashboard">Back to overview</Link>
        </Button>
      </div>
    </div>
  );
}

export default function ComparePage() {
  const { evidenceId } = useParams();
  const location = useLocation();
  const routerFile = location.state?.file ?? null;

  const [stored, setStored] = useState(null);
  const [checkLoading, setCheckLoading] = useState(true);

  const [custody, setCustody] = useState(null);
  const [custodyLoading, setCustodyLoading] = useState(true);
  const [custodyError, setCustodyError] = useState(null);
  const [chain, setChain] = useState(null);
  const [chainError, setChainError] = useState(null);

  const [regions, setRegions] = useState([]);
  const [regionsError, setRegionsError] = useState(null);

  const [exporting, setExporting] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [exportNotice, setExportNotice] = useState(null);
  const [exportError, setExportError] = useState(null);

  useEffect(() => {
    if (!evidenceId) {
      setCheckLoading(false);
      return undefined;
    }

    let cancelled = false;
    setCheckLoading(true);
    setStored(null);
    setExportNotice(null);
    setExportError(null);
    setExporting(false);

    (async () => {
      try {
        const data = await forensicsAPI.getCheck(evidenceId);
        if (!cancelled) setStored(data);
      } catch {
        // No stored copy: fall back to router state, or the empty state.
      } finally {
        if (!cancelled) setCheckLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [evidenceId]);

  useEffect(() => {
    if (!evidenceId) {
      setCustodyLoading(false);
      return undefined;
    }

    let cancelled = false;
    setCustody(null);
    setCustodyLoading(true);
    setCustodyError(null);
    setChain(null);
    setChainError(null);

    (async () => {
      try {
        const data = await forensicsAPI.getCustody("evidence", evidenceId);
        if (!cancelled) setCustody(data);
      } catch (error) {
        if (!cancelled) setCustodyError(error.message);
      } finally {
        if (!cancelled) setCustodyLoading(false);
      }

      try {
        const data = await forensicsAPI.verifyCustody("evidence", evidenceId);
        if (!cancelled) setChain(data);
      } catch (error) {
        if (!cancelled) setChainError(error.message);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [evidenceId]);

  const file = withRouterDetail(
    stored ? fromStoredCheck(stored) : null,
    routerFile,
  );
  const matched = file?.matched_asset;
  const originalId = matched?.original_asset_id ?? null;

  useEffect(() => {
    setRegions([]);
    setRegionsError(null);

    if (
      !file?.file_id ||
      !originalId ||
      !showsDifferences(file.verification_status)
    )
      return undefined;

    let cancelled = false;

    (async () => {
      try {
        const data = await forensicsAPI.getAlteredRegions(file.file_id, originalId);
        if (!cancelled) setRegions(data?.regions ?? []);
      } catch (error) {
        if (!cancelled) setRegionsError(error.message);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [evidenceId, file?.file_id, file?.verification_status, originalId]);

  const entries = [...(custody?.entries ?? [])].sort(
    (a, b) => (a.seq ?? 0) - (b.seq ?? 0),
  );
  const entryCount = chain?.entries?.length ?? custody?.count ?? entries.length;
  const problems = chain?.problems ?? [];
  const newestAnchor = entries.reduce((latest, entry) => {
    if (!entry.anchor) return latest;
    if (!latest) return entry;
    return (entry.seq ?? 0) >= (latest.seq ?? 0) ? entry : latest;
  }, null);
  const anchor = newestAnchor?.anchor ?? null;

  const shortId =
    String(evidenceId ?? "")
      .replace(/[^a-zA-Z0-9_-]/g, "")
      .slice(0, 8) || "check";

  async function handleExport() {
    setExporting(true);
    setExportNotice(null);
    setExportError(null);

    try {
      const blob = await forensicsAPI.exportReportPdf(evidenceId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `forenscreen-report-${shortId}.pdf`;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      setExportNotice("Report exported and recorded in the custody log");

      const [nextCustody, nextChain] = await Promise.allSettled([
        forensicsAPI.getCustody("evidence", evidenceId),
        forensicsAPI.verifyCustody("evidence", evidenceId),
      ]);
      if (nextCustody.status === "fulfilled") setCustody(nextCustody.value);
      if (nextChain.status === "fulfilled") {
        setChain(nextChain.value);
        setChainError(null);
      }
    } catch (error) {
      setExportError(error.message);
    } finally {
      setExporting(false);
    }
  }

  if (!file) {
    if (checkLoading) {
      return (
        <div>
          <PageHeader title="Comparison" description="Loading saved check" />
          <Card>
            <CardContent
              role="status"
              className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground"
            >
              <Loader2 className="size-4 animate-spin" />
              Loading the saved check…
            </CardContent>
          </Card>
        </div>
      );
    }
    return <EmptyState />;
  }

  const confidence = matchConfidence(matched);
  const analysis = file.forensics?.image_analysis ?? {};
  const hasDimensions = analysis.width != null && analysis.height != null;
  const candidates = matched?.candidates;

  return (
    <div>
      <PageHeader
        title="Comparison"
        description={file.file_name ?? file.saved_filename ?? "—"}
      >
        <Button variant="outline" onClick={() => setSharing(true)}>
          <Share2 />
          Share
        </Button>
        <Button onClick={handleExport} disabled={exporting}>
          {exporting ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Download />
          )}
          {exporting ? "Exporting…" : "Export report"}
        </Button>
        <Button asChild variant="outline">
          <Link to="/analyze">
            <ArrowLeft />
            Back to analyze
          </Link>
        </Button>
      </PageHeader>

      {exportNotice && (
        <p
          role="status"
          className="mb-4 flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-[0.8125rem] text-success"
        >
          <CheckCircle2 className="size-4 shrink-0" />
          {exportNotice}
        </p>
      )}
      {exportError && (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-[0.8125rem] text-destructive"
        >
          We could not export the report: {exportError}
        </p>
      )}

      <VerdictBanner
        status={file.verification_status}
        ownsOriginal={Boolean(matched?.is_owner)}
        confidence={confidence}
      />

      <section
        aria-label="Evidence compared with the registered original"
        className="relative mt-5 grid gap-4 md:grid-cols-2"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-6 left-1/2 hidden w-px -translate-x-1/2 bg-border md:block"
        />

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Evidence — as submitted</CardTitle>
          </CardHeader>
          <CardContent>
            <EvidenceFrame
              src={
                file.saved_filename
                  ? forensicsAPI.evidenceImageUrl(file.file_id)
                  : null
              }
              alt={`Submitted evidence file ${file.filename ?? ""}`}
              tag="Evidence"
              overlaySrc={
                originalId && showsDifferences(file.verification_status)
                  ? forensicsAPI.differenceOverlayUrl(file.file_id, originalId)
                  : undefined
              }
              regions={regions}
              className="mx-auto w-full max-w-[400px]"
            />
            <p className="mt-3 text-[0.75rem] text-muted-foreground">
              {regions.length > 0
                ? "Highlighted areas differ from the registered original."
                : "No differing areas were located in this copy."}
            </p>
            {regionsError && (
              <p className="mt-1 text-[0.75rem] text-destructive">
                We could not load the highlighted areas: {regionsError}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Registered original</CardTitle>
          </CardHeader>
          <CardContent>
            {originalId && !(matched?.is_owner || matched?.original_public) ? (
              <PrivateOriginal
                registeredAt={matched?.registered_at}
                sha256={matched?.original_sha256}
                className="mx-auto w-full max-w-[400px]"
              />
            ) : (
              <EvidenceFrame
                src={originalId ? forensicsAPI.assetImageUrl(originalId) : null}
                alt="Registered original this evidence was compared against"
                tag="Baseline"
                className="mx-auto w-full max-w-[400px]"
              />
            )}
            <p className="mt-3 text-[0.75rem] text-muted-foreground">
              {originalId
                ? "The baseline copy and its hash are kept unchanged."
                : "This check did not settle on one registered original."}
            </p>
          </CardContent>
        </Card>
      </section>

      <section
        aria-label="Forensic detail"
        className="mt-5 grid gap-4 md:grid-cols-2"
      >
        <Card className={cn(!confidence && "md:col-span-2")}>
          <CardHeader className="pb-3">
            <CardTitle>Forensic detail</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border pt-0">
            <Row label="Evidence SHA-256">
              <HashValue value={file.sha256_hash} />
            </Row>
            <Row label="Registered SHA-256">
              <HashValue value={matched?.original_sha256} />
            </Row>
            <Row label="Dimensions">
              {hasDimensions ? `${analysis.width} × ${analysis.height}` : "—"}
            </Row>
            <Row label="Format">{analysis.format ?? "—"}</Row>
            <Row label="How this was decided">{matchMethod(matched) ?? "—"}</Row>
          </CardContent>
        </Card>

        {confidence && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Match confidence</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="divide-y divide-border">
                <Row label="Consistent feature points">{confidence.inliers ?? "—"}</Row>
                <Row label="Inlier ratio">
                  {confidence.ratio != null
                    ? `${(confidence.ratio <= 1 ? confidence.ratio * 100 : confidence.ratio).toFixed(1)}%`
                    : "—"}
                </Row>
                <Row label="Good matches">{confidence.goodMatches ?? "—"}</Row>
                <Row label="pHash distance">
                  {confidence.phashDistance != null
                    ? `${confidence.phashDistance} bits`
                    : "—"}
                </Row>
              </div>
              <p className="mt-3 text-[0.75rem] text-muted-foreground">
                More geometrically consistent points means a stronger match — every
                point counted here agrees on the same alignment between the two images.
              </p>
            </CardContent>
          </Card>
        )}
      </section>

      <Card className="mt-5">
        <CardHeader className="pb-3">
          <CardTitle>Custody log</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {chainError && (
            <p role="alert" className="mb-4 text-[0.75rem] text-destructive">
              We could not verify the custody chain: {chainError}
            </p>
          )}

          {(chain || anchor) && (
            <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
              {chain && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-[3px] text-xs font-semibold",
                    chain.intact
                      ? "text-success bg-success/10 border-success/30"
                      : "text-destructive bg-destructive/10 border-destructive/30",
                  )}
                >
                  {chain.intact ? (
                    <ShieldCheck className="size-3" />
                  ) : (
                    <ShieldAlert className="size-3" />
                  )}
                  {chain.intact ? "Chain intact" : "Chain broken"}
                  <span className="font-normal">
                    · {entryCount} {entryCount === 1 ? "entry" : "entries"}
                  </span>
                </span>
              )}
              {anchor && <AnchorPill anchor={anchor} />}
            </div>
          )}

          {!chain && !chainError && (
            <p className="mb-4 flex items-center gap-2 text-[0.75rem] text-muted-foreground">
              <Loader2 className="size-3 animate-spin" />
              Checking chain integrity…
            </p>
          )}

          {problems.length > 0 && (
            <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3">
              <p className="flex items-center gap-1.5 text-[0.8125rem] font-medium text-destructive">
                <TriangleAlert className="size-4 shrink-0" />
                {problems.length === 1
                  ? "One problem was found in the custody chain"
                  : `${problems.length} problems were found in the custody chain`}
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-[0.75rem] text-destructive">
                {problems.map((problem, index) => (
                  <li key={index}>
                    {typeof problem === "string" ? problem : JSON.stringify(problem)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {custodyError ? (
            <p role="alert" className="text-[0.75rem] text-destructive">
              We could not load the custody log: {custodyError}
            </p>
          ) : custodyLoading ? (
            <p className="flex items-center gap-2 text-[0.75rem] text-muted-foreground">
              <Loader2 className="size-3 animate-spin" />
              Loading the custody log…
            </p>
          ) : entries.length === 0 ? (
            <p className="text-[0.8125rem] text-muted-foreground">
              No custody entries have been recorded for this evidence yet.
            </p>
          ) : (
            <ol className="relative ml-1 border-l border-border pl-5">
              {entries.map((entry, index) => {
                const txHash = entry.anchor?.tx_hash;
                return (
                  <li
                    key={entry.id ?? entry.seq ?? index}
                    className={cn("relative", index < entries.length - 1 && "pb-5")}
                  >
                    <span
                      aria-hidden="true"
                      className="absolute -left-6 top-1.5 size-2 rounded-full bg-border ring-4 ring-card"
                    />
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                      <p className="text-[0.8125rem] font-medium">
                        {entry.label || humanize(entry.event_type)}
                      </p>
                      <time
                        dateTime={entry.occurred_at ?? undefined}
                        className="text-[0.6875rem] tabular-nums text-muted-foreground"
                      >
                        {formatTimestamp(entry.occurred_at)}
                      </time>
                    </div>
                    <p className="mt-0.5 text-[0.75rem] text-muted-foreground">
                      {actorLabel(entry.actor)}
                    </p>
                    {txHash && (
                      <a
                        href={etherscanTx(txHash)}
                        target="_blank"
                        rel="noreferrer"
                        title={txHash}
                        className="mt-1.5 inline-flex max-w-full items-center gap-1 rounded-md border border-border bg-muted px-2 py-1 font-mono text-[0.6875rem] text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <ExternalLink className="size-3 shrink-0" />
                        <span className="truncate">{shorten(txHash)}</span>
                      </a>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </CardContent>
      </Card>

      {candidates?.length > 0 && (
        <Card className="mt-5">
          <CardHeader className="pb-3">
            <CardTitle>Which original is this?</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-[0.8125rem] text-muted-foreground">
              {matched.message ??
                "More than one registered image matches this one."}
            </p>
            <ul className="mt-3 divide-y divide-border">
              {candidates.map((candidate) => (
                <li
                  key={candidate.original_asset_id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2.5"
                >
                  <span className="min-w-0 truncate text-[0.8125rem] font-medium">
                    {candidate.is_owner
                      ? candidate.original_filename ?? "Untitled original"
                      : "Registered by another account"}
                  </span>
                  <span className="text-[0.75rem] text-muted-foreground">
                    {candidate.orb_inliers != null
                      ? `${candidate.orb_inliers} feature points`
                      : "—"}
                    {candidate.phash_distance != null
                      ? ` · pHash ${candidate.phash_distance} bits`
                      : ""}
                  </span>
                </li>
              ))}
            </ul>
            <Button asChild variant="outline" className="mt-4">
              <Link to="/analyze">Run the check against one original</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <ShareDialog checkId={evidenceId} open={sharing} onOpenChange={setSharing} />
    </div>
  );
}
