import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Clock,
  EyeOff,
  FileText,
  Loader2,
  ScanSearch,
  Timer,
  Unlock,
  Upload,
  UserPlus,
} from "lucide-react";

import { forensicsAPI } from "@/api/forensics";
import EvidenceFrame from "@/components/evidence-frame";
import VerdictBanner from "@/components/verdict-banner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { matchConfidence, matchMethod } from "@/lib/verdict";
import { cn } from "@/lib/utils";

const CHECKED_AT = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatCheckedAt(value) {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? CHECKED_AT.format(new Date()) : CHECKED_AT.format(date);
}

/**
 * The evidence flow exists for the whole app; the visitor here has no registry
 * of their own, so anything phrased as "your registry" would be wrong. These
 * sentences replace the signed-in wording with a public, no-account voice - and
 * a miss is described as a miss, never as an accusation.
 */
function publicExplanation(status) {
  switch (status) {
    case "VERIFIED_AUTHENTIC":
      return "The file you uploaded is byte-for-byte identical to an original already registered on ForenScreen. Nothing in it has been changed.";
    case "TAMPERED_MANIPULATED":
      return "This picture matches an original registered on ForenScreen, but the file itself is not the copy that was registered - it has been changed.";
    case "UNREGISTERED_ASSET":
      return "This image is not in the ForenScreen registry yet, so there was nothing to compare it against. That is not a judgement about the picture - it only means no original of it has been registered.";
    case "AMBIGUOUS_MATCH":
      return "This image is close to more than one registered original, so a public check cannot say which one it came from.";
    case "PROCESSING_ERROR":
      return "We could not decode this file, so nothing was compared. Exporting it again as PNG or JPEG usually fixes this.";
    default:
      return undefined;
  }
}

function foundSentence(status, hasMarkedRegions) {
  switch (status) {
    case "VERIFIED_AUTHENTIC":
      return "The file you sent is the same file, down to the last byte, as a registered original. It has not been re-saved, cropped or retouched.";
    case "TAMPERED_MANIPULATED":
      return hasMarkedRegions
        ? "The picture is the same, but the file is not: it was changed after the original was registered. The outlined areas on your image mark where the two differ."
        : "The picture is the same, but the file is not: it was changed after the original was registered.";
    case "UNREGISTERED_ASSET":
      return "No original registered on ForenScreen matches this image. It may be brand new, or it may simply never have been registered for public checking.";
    case "AMBIGUOUS_MATCH":
      return "More than one registered original is a close match for this image, so the result cannot be pinned to a single one from here.";
    case "PROCESSING_ERROR":
      return "The file could not be read, so no fingerprints were compared at all.";
    default:
      return "We compared this image with the originals registered on ForenScreen.";
  }
}

function ExplainStep({ number, title, children }) {
  return (
    <li className="flex items-start gap-3">
      <span
        aria-hidden="true"
        className="grid size-6 shrink-0 place-items-center rounded-full bg-muted text-[0.75rem] font-semibold text-muted-foreground"
      >
        {number}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold leading-snug">{title}</p>
        <p className="mt-1 text-[0.8125rem] text-muted-foreground">{children}</p>
      </div>
    </li>
  );
}

export default function PublicCheckPage() {
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [regions, setRegions] = useState([]);

  async function checkFile(file) {
    setError("");

    if (!file) return;

    if (!file.type?.startsWith("image/")) {
      setResult(null);
      setRegions([]);
      setError(`“${file.name}” is not an image. Please choose a PNG, JPEG, WebP or HEIC file.`);
      return;
    }

    setBusy(true);
    setResult(null);
    setRegions([]);

    try {
      const data = await forensicsAPI.uploadEvidence(file);
      const checked = data?.files?.[0];

      if (!checked) {
        throw new Error("The check finished without a result. Please try that image again.");
      }

      setResult(checked);

      const originalAssetId = checked.matched_asset?.original_asset_id;
      if (originalAssetId) {
        try {
          const located = await forensicsAPI.getAlteredRegions(checked.file_id, originalAssetId);
          setRegions(located?.regions ?? []);
        } catch {
          // The comparison itself succeeded; the difference map is a bonus, so
          // a failure here must not turn a valid result into an error.
          setRegions([]);
        }
      }
    } catch (err) {
      setError(err?.message || "Something went wrong while checking that image. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function handleInputChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    checkFile(file);
  }

  function handleDrop(event) {
    event.preventDefault();
    setDragging(false);
    if (busy) return;
    checkFile(event.dataTransfer?.files?.[0]);
  }

  const status = result?.verification_status;
  const matched = result?.matched_asset ?? null;
  const matchedOriginal = matched?.original_asset_id ? matched : null;
  const candidates = matched?.candidates ?? [];
  const confidence = matchConfidence(matchedOriginal);
  const method = matchMethod(matchedOriginal);

  const similarity = confidence?.ratio != null
    ? `${Math.round(confidence.ratio <= 1 ? confidence.ratio * 100 : confidence.ratio)}% structural match`
    : method;

  const checkedAt = result?.forensics?.timeline_data?.analysis_timestamp ?? result?.uploaded_at;
  const evidenceSrc = result?.saved_filename
    ? forensicsAPI.evidenceImageUrl(result.saved_filename)
    : null;
  const overlaySrc = matchedOriginal && regions.length > 0
    ? forensicsAPI.differenceOverlayUrl(result.file_id, matchedOriginal.original_asset_id)
    : null;

  return (
    <div className="mx-auto flex w-full max-w-[820px] flex-col gap-6 px-5 py-12 pb-16 lg:px-0">
      <section className="mx-auto max-w-[640px] text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-[2.125rem]">
          Check an image for free
        </h1>
        <p className="mx-auto mt-2.5 max-w-[56ch] text-base text-muted-foreground">
          Upload a screenshot or photo. We&rsquo;ll tell you whether it matches an original
          registered on ForenScreen. No account needed.
        </p>
      </section>

      <Card aria-labelledby="upload-title">
        <CardContent className="flex flex-col gap-4">
          <h2 id="upload-title" className="sr-only">
            Upload an image to check
          </h2>

          <input
            id="check-file"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/heic,image/heif"
            className="sr-only"
            onChange={handleInputChange}
          />

          <label
            htmlFor="check-file"
            onDragOver={(event) => {
              event.preventDefault();
              if (!busy) setDragging(true);
            }}
            onDragLeave={(event) => {
              const next = event.relatedTarget;
              if (!(next instanceof Node) || !event.currentTarget.contains(next)) {
                setDragging(false);
              }
            }}
            onDrop={handleDrop}
            className={cn(
              "grid cursor-pointer place-items-center gap-2.5 rounded-lg border-[1.5px] border-dashed p-10 text-center transition-colors",
              dragging
                ? "border-primary bg-primary/5"
                : "border-primary/30 hover:border-primary hover:bg-primary/5",
              busy && "pointer-events-none opacity-60",
            )}
          >
            <span className="grid size-11 place-items-center rounded-xl bg-primary/12 text-primary">
              <Upload className="size-5" />
            </span>
            <span className="text-sm font-semibold">Drop an image here</span>
            <span className="text-xs text-muted-foreground text-pretty">
              Click to choose a file. Your image is only compared — it is never published.
            </span>
          </label>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Unlock className="size-3.5" />
              No account required
            </span>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1.5">
              <Timer className="size-3.5" />
              Takes a few seconds
            </span>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1.5">
              <EyeOff className="size-3.5" />
              Nothing is posted publicly
            </span>
          </div>

          {busy && (
            <p role="status" className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" />
              Making a fingerprint and comparing it with the registry…
            </p>
          )}

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </CardContent>
      </Card>

      {result && (
        <Card aria-live="polite">
          <CardHeader className="border-b border-border">
            <CardTitle>Check result</CardTitle>
            <CardDescription className="truncate">{result.filename}</CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-5">
            <VerdictBanner status={status} description={publicExplanation(status)} confidence={confidence} />

            {evidenceSrc && (
              <div
                className={cn(
                  "grid gap-5",
                  matchedOriginal ? "sm:grid-cols-2" : "mx-auto w-full max-w-[360px]",
                )}
              >
                <figure className="flex flex-col gap-2">
                  <figcaption className="text-xs text-muted-foreground">
                    The image you uploaded
                  </figcaption>
                  <EvidenceFrame
                    src={evidenceSrc}
                    alt={`The image you uploaded: ${result.filename}`}
                    overlaySrc={overlaySrc}
                    regions={regions}
                    tag={overlaySrc ? "Differences marked" : undefined}
                  />
                </figure>

                {matchedOriginal && (
                  <figure className="flex flex-col gap-2">
                    <figcaption className="text-xs text-muted-foreground">
                      The registered original
                    </figcaption>
                    <EvidenceFrame
                      src={forensicsAPI.assetImageUrl(matchedOriginal.original_asset_id)}
                      alt={`The registered original: ${matchedOriginal.original_filename}`}
                    />
                  </figure>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border pt-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Clock className="size-3.5" />
                Checked {formatCheckedAt(checkedAt)}
              </span>

              {similarity && (
                <span className="flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-0.5 font-medium text-foreground/80">
                  <ScanSearch className="size-3.5" />
                  {similarity}
                </span>
              )}

              {!similarity && candidates.length > 0 && (
                <span className="flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-0.5 font-medium text-foreground/80">
                  <ScanSearch className="size-3.5" />
                  Close to {candidates.length} registered originals
                </span>
              )}

              {matchedOriginal && (
                <span className="flex min-w-0 items-center gap-1.5">
                  <FileText className="size-3.5 shrink-0" />
                  <span className="truncate">Matched: {matchedOriginal.original_filename}</span>
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="flex flex-col gap-4">
          <h2 className="text-base font-semibold">What this means</h2>

          <ol className="flex flex-col gap-4">
            <ExplainStep number="1" title="What we compared">
              We made a digital fingerprint of the image you uploaded and compared it with the
              fingerprints of every original registered on ForenScreen and shared for public
              checking.
            </ExplainStep>

            <ExplainStep number="2" title="What we found">
              {foundSentence(status, regions.length > 0)}
            </ExplainStep>

            <ExplainStep number="3" title="What you can do next">
              Keep this page — it records what was compared and when. To prove what your own
              pictures looked like before anyone edited them,{" "}
              <Link
                to="/signup"
                className="font-medium text-primary underline underline-offset-2 hover:text-primary/80"
              >
                create a free account and register your originals
              </Link>
              .
            </ExplainStep>
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold">Create a free account</h2>
            <p className="mt-1 max-w-[52ch] text-[0.8125rem] text-muted-foreground">
              Register your images as originals before they are shared, so a later altered copy can
              be checked against the version you saved.
            </p>
          </div>
          <Button asChild size="lg">
            <Link to="/signup">
              <UserPlus className="size-4" />
              Create a free account
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
