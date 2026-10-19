import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ArrowLeft, FileQuestion, ScanSearch } from "lucide-react";

import { PageHeader } from "@/components/app-shell";
import VerdictBanner from "@/components/verdict-banner";
import EvidenceFrame from "@/components/evidence-frame";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { forensicsAPI } from "@/api/forensics";
import { matchConfidence, matchMethod } from "@/lib/verdict";
import { cn } from "@/lib/utils";

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
          A check's detail is only available straight after you run it. Run the
          image through the analyzer again to see its comparison.
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
  const file = location.state?.file;

  const matched = file?.matched_asset;
  const originalId = matched?.original_asset_id ?? null;

  const [regions, setRegions] = useState([]);
  const [regionsError, setRegionsError] = useState(null);

  useEffect(() => {
    if (
      !file?.file_id ||
      !originalId ||
      file.verification_status === "VERIFIED_AUTHENTIC"
    )
      return;
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

  if (!file) return <EmptyState />;

  const confidence = matchConfidence(matched);
  const analysis = file.forensics?.image_analysis ?? {};
  const edit = file.forensics?.edit_detection ?? {};
  const colorProfile = analysis.color_profile ?? {};
  const elaScore = edit.ela_score_normalized;
  const hasDimensions = analysis.width != null && analysis.height != null;
  const candidates = matched?.candidates;

  return (
    <div>
      <PageHeader title="Comparison" description={file.file_name}>
        <Button asChild variant="outline">
          <Link to="/analyze">
            <ArrowLeft />
            Back to analyze
          </Link>
        </Button>
      </PageHeader>

      <VerdictBanner status={file.verification_status} confidence={confidence} />

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
                  ? forensicsAPI.evidenceImageUrl(file.saved_filename)
                  : null
              }
              alt={`Submitted evidence file ${file.filename}`}
              tag="Evidence"
              overlaySrc={
                originalId && file.verification_status !== "VERIFIED_AUTHENTIC"
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
            <EvidenceFrame
              src={originalId ? forensicsAPI.assetImageUrl(originalId) : null}
              alt="Registered original this evidence was compared against"
              tag="Baseline"
              className="mx-auto w-full max-w-[400px]"
            />
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
            <div className="py-2.5">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[0.8125rem] text-muted-foreground">
                  Compression traces
                </span>
                <span className="text-[0.8125rem] font-medium">
                  {elaScore != null ? `${Math.round(elaScore)}%` : "—"}
                  {edit.edit_likelihood ? ` · ${edit.edit_likelihood}` : ""}
                </span>
              </div>
              <Progress
                value={elaScore != null ? Math.min(100, Math.max(0, elaScore)) : 0}
                className="mt-2"
                aria-label="Compression trace score"
              />
            </div>
            <Row label="Colour variance">
              {colorProfile.color_variance != null ? colorProfile.color_variance : "—"}
            </Row>
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
                    {candidate.original_filename ?? "Untitled original"}
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
    </div>
  );
}
