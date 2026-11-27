import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { ImageOff, Loader2, ScanSearch, Upload } from "lucide-react";

import { PageHeader } from "@/components/app-shell";
import EvidenceFrame from "@/components/evidence-frame";
import PrivateOriginal from "@/components/private-original";
import VerdictBanner from "@/components/verdict-banner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { forensicsAPI } from "@/api/forensics";
import { cn } from "@/lib/utils";
import { matchConfidence, showsDifferences } from "@/lib/verdict";

/** Sentinel for "search the whole registry instead of one original". */
const ALL_SCOPE = "__all__";

const FILE_INPUT_ID = "analyze-evidence-file";
const SCOPE_SELECT_ID = "analyze-scope";
const SCOPE_HINT_ID = "analyze-scope-hint";

const DATE_TIME = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const DATE_ONLY = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** Parsed date, or null when the value is missing or unreadable. */
function toDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateTime(value) {
  const date = toDate(value);
  return date ? DATE_TIME.format(date).replace(",", "") : "—";
}

function formatDate(value) {
  const date = toDate(value);
  return date ? DATE_ONLY.format(date) : "—";
}

function formatBytes(bytes) {
  if (typeof bytes !== "number" || !Number.isFinite(bytes)) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function truncateHash(hash) {
  if (!hash) return "—";
  return hash.length > 17 ? `${hash.slice(0, 16)}…` : hash;
}

/** One label/value line under an evidence frame. */
function MetaRow({ label, value, mono = false, title }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border py-2 text-[0.8125rem] last:border-b-0">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span
        className={cn("min-w-0 truncate text-right font-medium", mono && "font-mono text-xs")}
        title={title ?? undefined}
      >
        {value ?? "—"}
      </span>
    </div>
  );
}

export default function AnalyzePage() {
  const location = useLocation();

  const [assets, setAssets] = useState([]);
  const [assetsError, setAssetsError] = useState("");
  const [assetsLoading, setAssetsLoading] = useState(true);

  const [scope, setScope] = useState(() =>
    location.state?.originalAssetId != null
      ? String(location.state.originalAssetId)
      : ALL_SCOPE,
  );

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [diff, setDiff] = useState({ status: "idle", regions: [], overlaySrc: null });

  const inputRef = useRef(null);

  // The registry drives the scope picker. A failure here must not take the page
  // down: the "all originals" scope still works without the list.
  useEffect(() => {
    let cancelled = false;
    setAssetsLoading(true);
    forensicsAPI
      .listAssets()
      .then((data) => {
        if (cancelled) return;
        setAssets(Array.isArray(data?.assets) ? data.assets : []);
        setAssetsError("");
      })
      .catch((err) => {
        if (cancelled) return;
        setAssets([]);
        setAssetsError(err?.message || "Could not load your registered originals.");
      })
      .finally(() => {
        if (!cancelled) setAssetsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Thumbnail of the chosen file, released as soon as it is replaced.
  useEffect(() => {
    if (!file) {
      setPreview(null);
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // The difference map only exists for a modified copy that matched a specific
  // original. While it loads (or if it fails) the frames simply render clean.
  useEffect(() => {
    const originalAssetId = result?.matched_asset?.original_asset_id;
    if (!showsDifferences(result?.verification_status) || !originalAssetId) {
      setDiff({ status: "idle", regions: [], overlaySrc: null });
      return undefined;
    }

    let cancelled = false;
    setDiff({ status: "loading", regions: [], overlaySrc: null });

    forensicsAPI
      .getAlteredRegions(result.file_id, originalAssetId)
      .then((data) => {
        if (cancelled) return;
        setDiff({
          status: "loaded",
          regions: Array.isArray(data?.regions) ? data.regions : [],
          overlaySrc: forensicsAPI.differenceOverlayUrl(result.file_id, originalAssetId),
        });
      })
      .catch(() => {
        if (cancelled) return;
        setDiff({ status: "failed", regions: [], overlaySrc: null });
      });

    return () => {
      cancelled = true;
    };
  }, [result]);

  function acceptFile(next) {
    if (!next) return;
    setFile(next);
    setResult(null);
    setDiff({ status: "idle", regions: [], overlaySrc: null });
    setError("");
  }

  function handleInputChange(event) {
    const next = event.target.files?.[0];
    if (next) acceptFile(next);
  }

  function handleDrop(event) {
    event.preventDefault();
    setDragging(false);
    if (running) return;
    const next = event.dataTransfer?.files?.[0];
    if (next) acceptFile(next);
  }

  function reset() {
    setFile(null);
    setResult(null);
    setDiff({ status: "idle", regions: [], overlaySrc: null });
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  async function runAnalysis(targetFile, scopeValue) {
    if (!targetFile) return;
    setRunning(true);
    setError("");
    try {
      const payload = await forensicsAPI.uploadEvidence(targetFile, {
        originalAssetId: scopeValue && scopeValue !== ALL_SCOPE ? scopeValue : null,
      });
      const first = payload?.files?.[0];
      if (!first) {
        throw new Error(payload?.message || "The server did not return a result for that file.");
      }
      setResult(first);
    } catch (err) {
      setResult(null);
      setError(err?.message || "The check could not be completed. Please try again.");
    } finally {
      setRunning(false);
    }
  }

  function useCandidate(candidateId) {
    const value = String(candidateId);
    setScope(value);
    runAnalysis(file, value);
  }

  const analysis = result?.forensics?.image_analysis ?? null;
  // What the submitted file says about itself (objective 4: traces of editing
  // software, inconsistent timestamps). Hints for the reviewer, not the verdict.
  const fileMetadata = result?.forensics?.file_metadata ?? null;
  const metadataSignals = result?.forensics?.metadata_signals ?? [];

  const dimensions =
    analysis?.width != null && analysis?.height != null
      ? `${analysis.width} × ${analysis.height}`
      : "—";

  const candidates = Array.isArray(result?.matched_asset?.candidates)
    ? result.matched_asset.candidates
    : [];

  const matchedAsset = result?.matched_asset ?? null;
  const originalAssetId = matchedAsset?.original_asset_id ?? null;
  const isTampered = showsDifferences(result?.verification_status);

  // Checks match against every account's originals, but only the owner may
  // see an original's image and filename.
  const ownsOriginal = Boolean(matchedAsset?.is_owner);
  // The owner may have chosen to show the original to everyone.
  const canSeeOriginal = ownsOriginal || Boolean(matchedAsset?.original_public);
  const originalAsset = useMemo(
    () => assets.find((asset) => String(asset.id) === String(originalAssetId)) ?? null,
    [assets, originalAssetId],
  );
  const originalRegisteredAt = matchedAsset?.registered_at ?? originalAsset?.created_at ?? null;

  const scopeName =
    scope === ALL_SCOPE
      ? "all registered originals"
      : (assets.find((asset) => String(asset.id) === scope)?.file_name ??
        "the selected original");

  const verdictDescription =
    isTampered && matchedAsset?.original_filename
      ? `This looks like ${ownsOriginal ? "your" : "the"} registered ${matchedAsset.original_filename}, but the file itself has changed.`
      : undefined;

  return (
    <>
      <PageHeader
        title="Analyze evidence"
        description="Check an image against your registered originals."
      />

      <div className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle>Choose the image to check</CardTitle>
            <CardAction>
              <Badge variant="outline">{assetsLoading ? "Loading originals…" : `${assets.length} registered`}</Badge>
            </CardAction>
          </CardHeader>

          <CardContent className="space-y-4">
            <label
              htmlFor={FILE_INPUT_ID}
              onDragOver={(event) => {
                event.preventDefault();
                if (!running) setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={cn(
                "flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border border-dashed border-border bg-muted/40 px-6 py-9 text-center transition-colors",
                "hover:border-ring/60 hover:bg-accent/50",
                dragging && "border-ring bg-accent/60",
                running && "cursor-not-allowed opacity-60",
              )}
            >
              <input
                id={FILE_INPUT_ID}
                ref={inputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                disabled={running}
                onChange={handleInputChange}
              />
              <span className="grid size-10 place-items-center rounded-full bg-background text-muted-foreground ring-1 ring-border">
                <Upload className="size-4" aria-hidden="true" />
              </span>
              <span className="text-[0.875rem] font-medium">
                {file
                  ? "Drop a different image, or click to browse"
                  : "Drop the image to check, or click to browse"}
              </span>
              <span className="text-xs text-muted-foreground">PNG, JPEG or HEIC · up to 10 MB</span>
            </label>

            {file && (
              <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-3">
                {preview ? (
                  <img
                    src={preview}
                    alt=""
                    className="size-14 shrink-0 rounded-md border border-border bg-background object-cover"
                  />
                ) : (
                  <span className="grid size-14 shrink-0 place-items-center rounded-md border border-border bg-background">
                    <ImageOff className="size-4 text-muted-foreground" aria-hidden="true" />
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {[formatBytes(file.size), file.type || "image"].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="ml-auto shrink-0"
                  onClick={reset}
                  disabled={running}
                >
                  Remove
                </Button>
              </div>
            )}

            <div className="space-y-1.5 border-t border-border pt-4">
              <Label htmlFor={SCOPE_SELECT_ID}>Check against</Label>
              <Select value={scope} onValueChange={setScope} disabled={running || assetsLoading}>
                <SelectTrigger
                  id={SCOPE_SELECT_ID}
                  aria-describedby={SCOPE_HINT_ID}
                  className="w-full sm:w-[22rem]"
                >
                  <SelectValue placeholder="All registered originals" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_SCOPE}>All registered originals</SelectItem>
                  {assets.map((asset) => (
                    <SelectItem key={asset.id} value={String(asset.id)}>
                      {asset.file_name}
                    </SelectItem>
                  ))}
                  {/* A scope handed over from the registry, before the list
                      arrives (or if it fails), still needs a name to show. */}
                  {scope !== ALL_SCOPE &&
                    !assets.some((asset) => String(asset.id) === scope) && (
                      <SelectItem value={scope}>Selected original</SelectItem>
                    )}
                </SelectContent>
              </Select>
              <p id={SCOPE_HINT_ID} className="text-xs text-muted-foreground">
                Picking a specific original avoids ambiguous matches.
              </p>
              {assetsError && (
                <p className="text-[0.8125rem] text-destructive">
                  {assetsError} You can still check against all registered originals.
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
              <Button
                type="button"
                onClick={() => runAnalysis(file, scope)}
                disabled={!file || running}
              >
                {running ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <ScanSearch className="size-4" aria-hidden="true" />
                )}
                {running ? "Analyzing…" : "Analyze"}
              </Button>
              {running && (
                <p role="status" className="text-[0.8125rem] text-muted-foreground">
                  Comparing this file against {scopeName}…
                </p>
              )}
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-[0.8125rem] text-destructive"
              >
                {error}
              </p>
            )}
          </CardContent>
        </Card>

        {result && (
          <>
            <VerdictBanner
              status={result.verification_status}
              ownsOriginal={ownsOriginal}
              description={verdictDescription}
              confidence={matchConfidence(matchedAsset)}
              actions={
                <Button type="button" variant="outline" size="sm" onClick={reset}>
                  Run another check
                </Button>
              }
            />

            {candidates.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Which of these is the original?</CardTitle>
                  <CardAction>
                    <Badge variant="outline">
                      {candidates.length} {candidates.length === 1 ? "candidate" : "candidates"}
                    </Badge>
                  </CardAction>
                </CardHeader>
                <CardContent className="space-y-2">
                  {candidates.map((candidate, index) => (
                    <div
                      key={candidate.original_asset_id ?? index}
                      className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p
                          className="truncate text-[0.8125rem] font-medium"
                          title={candidate.original_filename}
                        >
                          {candidate.is_owner
                            ? candidate.original_filename || "Unnamed original"
                            : "Registered by another account"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {candidate.orb_inliers != null
                            ? `${candidate.orb_inliers} matching feature points`
                            : "Matching feature points —"}
                          {candidate.phash_distance != null &&
                            ` · pHash distance ${candidate.phash_distance} bits`}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="shrink-0"
                        disabled={running}
                        onClick={() => useCandidate(candidate.original_asset_id)}
                      >
                        Use this original
                      </Button>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground">
                    Choosing an original re-checks the same file against that original only.
                  </p>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-5 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Evidence — as submitted</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <EvidenceFrame
                    src={
                      result.saved_filename
                        ? forensicsAPI.evidenceImageUrl(result.file_id)
                        : undefined
                    }
                    alt={
                      result.filename
                        ? `Submitted image ${result.filename}`
                        : "Submitted image"
                    }
                    tag="Submitted"
                    regions={diff.status === "loaded" ? diff.regions : []}
                    overlaySrc={diff.status === "loaded" ? diff.overlaySrc : undefined}
                    className="mx-auto max-w-[400px]"
                  />

                  {isTampered && (
                    <p className="text-xs text-muted-foreground">
                      Highlighted areas differ from the registered original.
                      {diff.status === "loading" && " Locating the changed areas…"}
                      {diff.status === "loaded" &&
                        diff.regions.length === 0 &&
                        " No localized region could be isolated, so the change is spread across the image."}
                      {diff.status === "failed" &&
                        " The difference map could not be loaded, so no areas are highlighted."}
                    </p>
                  )}

                  <div>
                    <MetaRow
                      label="SHA-256"
                      value={truncateHash(result.sha256_hash)}
                      title={result.sha256_hash ?? undefined}
                      mono
                    />
                    <MetaRow label="Dimensions" value={dimensions} />
                    <MetaRow label="Format" value={analysis?.format} />
                    <MetaRow label="Received" value={formatDateTime(result.uploaded_at)} />
                    <MetaRow label="Software (from file)" value={fileMetadata?.software ?? "—"} />
                    <MetaRow
                      label="Taken (from file)"
                      value={fileMetadata?.captured_at ? formatDateTime(fileMetadata.captured_at) : "—"}
                    />
                  </div>

                  {metadataSignals.length > 0 && (
                    <div className="rounded-lg border border-caution/45 bg-caution/15 p-3 text-xs">
                      <p className="font-medium">The file&rsquo;s own metadata is worth a closer look</p>
                      <ul className="mt-1 list-disc space-y-0.5 pl-4">
                        {metadataSignals.map((signal) => (
                          <li key={signal.code}>{signal.message}</li>
                        ))}
                      </ul>
                      <p className="mt-1.5 text-muted-foreground">
                        Metadata can be edited by anyone, so this is a hint, not part of the verdict.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Registered original</CardTitle>
                  {originalAssetId && (
                    <CardAction>
                      <Badge variant="secondary">Baseline</Badge>
                    </CardAction>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  {originalAssetId && !canSeeOriginal ? (
                    <PrivateOriginal
                      registeredAt={originalRegisteredAt}
                      sha256={matchedAsset?.original_sha256}
                      className="mx-auto max-w-[400px]"
                    />
                  ) : originalAssetId ? (
                    <>
                      <EvidenceFrame
                        src={forensicsAPI.assetImageUrl(originalAssetId)}
                        alt={
                          matchedAsset?.original_filename
                            ? `Registered original ${matchedAsset.original_filename}`
                            : "Registered original"
                        }
                        tag={
                          originalRegisteredAt
                            ? `Registered ${formatDate(originalRegisteredAt)}`
                            : "Registered original"
                        }
                        className="mx-auto max-w-[400px]"
                      />
                      <p className="text-xs text-muted-foreground">
                        The baseline copy and its hash stay unchanged.
                      </p>
                    </>
                  ) : (
                    <div className="mx-auto flex aspect-[3/4] max-w-[400px] flex-col items-center justify-center gap-2 rounded-[0.6rem] border border-dashed border-border bg-muted/40 px-6 text-center">
                      <ImageOff className="size-5 text-muted-foreground" aria-hidden="true" />
                      <p className="text-sm font-medium">No matching original</p>
                      <p className="text-xs text-muted-foreground">
                        No registered original matched this image.
                      </p>
                    </div>
                  )}

                  <div>
                    <MetaRow
                      label="SHA-256"
                      value={truncateHash(matchedAsset?.original_sha256)}
                      title={matchedAsset?.original_sha256 ?? undefined}
                      mono
                    />
                    {/* The check response carries no size or format for the
                        original, so these stay blank rather than guessed. */}
                    <MetaRow label="Dimensions" value="—" />
                    <MetaRow label="Format" value="—" />
                    <MetaRow
                      label="Registered"
                      value={originalRegisteredAt ? formatDateTime(originalRegisteredAt) : "—"}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </>
  );
}
