import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  ExternalLink,
  History,
  Image as ImageIcon,
  Info,
  Loader2,
  MoreHorizontal,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Upload,
} from "lucide-react";

import { PageHeader } from "@/components/app-shell";
import EvidenceFrame from "@/components/evidence-frame";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { forensicsAPI } from "@/api/forensics";
import { collectDevice, requestLocation } from "@/lib/client-metadata";
import { useApiImage } from "@/lib/use-api-image";
import { cn } from "@/lib/utils";

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Custody entries should arrive in order, but the newest one decides the badge. */
function newestEntry(entries) {
  return (entries ?? []).reduce(
    (newest, entry) => (!newest || (entry?.seq ?? 0) >= (newest?.seq ?? 0) ? entry : newest),
    null,
  );
}

function actorLabel(actor) {
  if (!actor) return "—";
  if (actor === "system") return "Registered by the service";
  if (actor === "unauthenticated") return "Unverified";
  if (actor.startsWith("user:")) return "Signed-in user";
  return actor;
}

const ANCHOR_STATUSES = {
  confirmed: {
    label: "Anchored on-chain",
    short: "Anchored",
    pill: "border-success/30 bg-success/10 text-success",
    dot: "bg-success",
  },
  pending: {
    label: "Anchoring…",
    short: "Anchoring",
    pill: "border-warning/40 bg-warning/15 text-warning-foreground",
    dot: "bg-warning",
  },
  failed: {
    label: "Not anchored",
    short: "Not anchored",
    pill: "border-border bg-muted text-muted-foreground",
    dot: "bg-muted-foreground/50",
  },
  not_required: {
    label: "No anchor",
    short: "No anchor",
    pill: "border-border bg-muted text-muted-foreground",
    dot: "bg-muted-foreground/50",
  },
};

function anchorStatus(status) {
  return ANCHOR_STATUSES[status] ?? ANCHOR_STATUSES.not_required;
}

function shortHash(hash) {
  if (!hash) return "—";
  return hash.length > 20 ? `${hash.slice(0, 10)}…${hash.slice(-6)}` : hash;
}

function AnchorPill({ status }) {
  const presentation = anchorStatus(status);
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
        presentation.pill,
      )}
    >
      <span className={cn("size-1.5 rounded-full", presentation.dot)} aria-hidden="true" />
      {presentation.label}
    </span>
  );
}

/** Muted until a custody summary arrives, then the newest anchor's state. */
function AnchorIndicator({ summary }) {
  if (!summary) {
    return (
      <span
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/70"
        title="Anchor status not loaded"
      >
        <span className="size-2 rounded-full bg-muted-foreground/30" aria-hidden="true" />—
      </span>
    );
  }

  if (summary.failed) {
    return (
      <span
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/70"
        title="Could not load the anchor status"
      >
        <span className="size-2 rounded-full bg-muted-foreground/30" aria-hidden="true" />—
      </span>
    );
  }

  const presentation = anchorStatus(summary.status);
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
      title={presentation.label}
    >
      <span className={cn("size-2 rounded-full", presentation.dot)} aria-hidden="true" />
      {presentation.short}
    </span>
  );
}

const DETAIL_TIME = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });

function formatDetailTime(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? DETAIL_TIME.format(date) : null;
}

/** One labelled value, with where it came from. Hidden when there is no value. */
function DetailRow({ label, value }) {
  if (value == null || value === "") return null;
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5 text-[0.8125rem]">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 break-words text-right">{value}</span>
    </div>
  );
}

function DetailGroup({ title, source, children }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <h4 className="text-[0.8125rem] font-semibold">{title}</h4>
        <span className="text-[0.6875rem] text-muted-foreground">{source}</span>
      </div>
      <div className="divide-y divide-border">{children}</div>
    </div>
  );
}

/**
 * What was recorded alongside the file when it was registered, grouped by
 * where each value came from. Only the server's clock is beyond the
 * registering user's control; the rest is context, not proof.
 */
function RegistrationDetails({ details }) {
  if (!details) {
    return (
      <p className="text-xs text-muted-foreground">
        No registration details were recorded for this original.
      </p>
    );
  }
  const file = details.file ?? {};
  const device = details.device;
  const location = details.location;
  const signals = details.signals ?? [];
  const camera = [file.camera_make, file.camera_model].filter(Boolean).join(" ");

  return (
    <section aria-labelledby="registration-details-title" className="space-y-3">
      <h3 id="registration-details-title" className="text-sm font-semibold">
        Registration details
      </h3>

      {signals.length > 0 && (
        <Alert className="border-caution/45 bg-caution/15">
          <Info className="size-4" />
          <AlertTitle>Worth a closer look</AlertTitle>
          <AlertDescription>
            <ul className="list-disc space-y-1 pl-4">
              {signals.map((signal) => (
                <li key={signal.code}>{signal.message}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <DetailGroup title="Received" source="Server clock">
          <DetailRow label="Received at" value={formatDetailTime(details.server?.received_at)} />
        </DetailGroup>

        <DetailGroup title="From the file" source="File metadata (editable)">
          <DetailRow label="Taken" value={formatDetailTime(file.captured_at)} />
          <DetailRow label="Last modified" value={formatDetailTime(file.modified_at)} />
          <DetailRow label="Camera" value={camera || null} />
          <DetailRow label="Software" value={file.software} />
          <DetailRow label="Comment" value={file.user_comment} />
          <DetailRow
            label="GPS in file"
            value={
              file.gps
                ? `${file.gps.lat}, ${file.gps.lon}`
                : file.gps_present
                  ? "Yes (not saved: location sharing was off)"
                  : "None"
            }
          />
          <DetailRow
            label="Size"
            value={file.width && file.height ? `${file.width} × ${file.height} ${file.format ?? ""}` : null}
          />
        </DetailGroup>

        <DetailGroup title="Your device" source="Reported by your browser">
          {device ? (
            <>
              <DetailRow label="Platform" value={device.platform} />
              <DetailRow label="Time zone" value={device.timezone} />
              <DetailRow label="Screen" value={device.screen} />
              <DetailRow label="Language" value={device.language} />
              <DetailRow label="Browser" value={device.user_agent} />
            </>
          ) : (
            <DetailRow label="Device" value="Not recorded" />
          )}
        </DetailGroup>

        <DetailGroup title="Location" source="Shared by you">
          <DetailRow
            label="Location"
            value={
              location
                ? `${location.lat}, ${location.lon}${location.accuracy_m != null ? ` (±${location.accuracy_m} m)` : ""}`
                : "Not shared"
            }
          />
        </DetailGroup>
      </div>
    </section>
  );
}

function AssetProvenanceDialog({ asset, open, onOpenChange }) {
  const [custody, setCustody] = useState(null);
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !asset?.id) return undefined;

    let active = true;
    setLoading(true);
    setError("");
    setCustody(null);
    setVerification(null);

    (async () => {
      // Exactly two calls per open: the history, and the chain verification.
      const [historyResult, verifyResult] = await Promise.allSettled([
        forensicsAPI.getCustody("asset", asset.id),
        forensicsAPI.verifyCustody("asset", asset.id),
      ]);
      if (!active) return;

      if (historyResult.status === "fulfilled") {
        setCustody(historyResult.value);
      }
      if (verifyResult.status === "fulfilled") {
        setVerification(verifyResult.value);
      }

      const failures = [];
      if (historyResult.status === "rejected") {
        failures.push(
          `the handling history (${historyResult.reason?.message || "request failed"})`,
        );
      }
      if (verifyResult.status === "rejected") {
        failures.push(
          `the chain integrity check (${verifyResult.reason?.message || "request failed"})`,
        );
      }
      if (failures.length > 0) {
        setError(`We could not load ${failures.join(" or ")}.`);
      }
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [open, asset?.id]);

  const entries = [...(custody?.entries ?? [])].sort(
    (a, b) => (a?.seq ?? 0) - (b?.seq ?? 0),
  );
  const anchor = newestEntry(entries)?.anchor?.status ?? null;
  const verifiedEntries = verification?.entries ?? entries;
  const problems = verification?.problems ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="pr-8">
            {asset?.file_name ?? "Original"}
          </DialogTitle>
          <DialogDescription>
            Handling history and on-chain anchor status for this original.
          </DialogDescription>
        </DialogHeader>

        {asset && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>Registered {formatDate(asset.created_at)}</span>
            <span className="font-mono" title={asset.sha256 || undefined}>
              SHA-256 {shortHash(asset.sha256)}
            </span>
          </div>
        )}

        {asset && <RegistrationDetails details={asset.registration_metadata} />}

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Loading provenance…
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}

            {verification && (
              <div
                className={cn(
                  "rounded-xl border p-3",
                  verification.intact
                    ? "border-success/30 bg-success/10"
                    : "border-destructive/30 bg-destructive/10",
                )}
              >
                <div className="flex flex-wrap items-center gap-2">
                  {verification.intact ? (
                    <ShieldCheck className="size-4 text-success" aria-hidden="true" />
                  ) : (
                    <ShieldAlert className="size-4 text-destructive" aria-hidden="true" />
                  )}
                  <span
                    className={cn(
                      "text-sm font-medium",
                      verification.intact ? "text-success" : "text-destructive",
                    )}
                  >
                    {verification.intact ? "Chain intact" : "Chain broken"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {verifiedEntries.length}{" "}
                    {verifiedEntries.length === 1 ? "entry" : "entries"}
                  </span>
                </div>
                {problems.length > 0 && (
                  <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-xs text-destructive">
                    {problems.map((problem, index) => (
                      <li key={index}>
                        {typeof problem === "string" ? problem : JSON.stringify(problem)}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-medium">Handling history</h3>
              {custody && <AnchorPill status={anchor} />}
            </div>

            {custody && entries.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No custody entries have been recorded for this original.
              </p>
            )}

            {entries.length > 0 && (
              <ol className="flex flex-col">
                {entries.map((entry, index) => {
                  const presentation = anchorStatus(entry?.anchor?.status);
                  const txHash = entry?.anchor?.tx_hash;
                  const last = index === entries.length - 1;
                  return (
                    <li
                      key={entry?.id ?? `${entry?.seq ?? index}-${index}`}
                      className="flex gap-3 pb-4 last:pb-0"
                    >
                      <div className="flex flex-col items-center">
                        <span
                          className={cn(
                            "mt-1.5 size-2.5 shrink-0 rounded-full ring-4 ring-popover",
                            presentation.dot,
                          )}
                          aria-hidden="true"
                        />
                        {!last && <span className="mt-1 w-px flex-1 bg-border" />}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                          <span className="text-sm font-medium">
                            {entry?.label || entry?.event_type || "Event"}
                          </span>
                          <time
                            className="text-xs tabular-nums text-muted-foreground"
                            dateTime={entry?.occurred_at || undefined}
                          >
                            {formatDateTime(entry?.occurred_at)}
                          </time>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {actorLabel(entry?.actor)}
                        </span>
                        {txHash && (
                          <a
                            href={`https://sepolia.etherscan.io/tx/${txHash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex w-fit items-center gap-1 font-mono text-[0.6875rem] text-primary underline-offset-4 hover:underline"
                            title={txHash}
                          >
                            {shortHash(txHash)}
                            <ExternalLink className="size-3" aria-hidden="true" />
                            <span className="sr-only">View transaction on Etherscan</span>
                          </a>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** 32px thumbnail, falling back to a soft tile when the image won't load. */
function AssetThumb({ assetId }) {
  const { src, failed: loadFailed } = useApiImage(
    assetId ? forensicsAPI.assetImageUrl(assetId) : null,
  );
  const [failed, setFailed] = useState(false);

  if (failed || loadFailed || !src) {
    return (
      <div
        aria-hidden="true"
        className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted ring-1 ring-border"
      />
    );
  }

  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      className="size-8 shrink-0 rounded-lg border border-border object-cover"
    />
  );
}

/**
 * The user's image beside a preview of the earlier, similar original, so they
 * can judge for themselves whether it really is the same picture before
 * registering anyway. The preview is a downscaled copy, and the backend records
 * every time one is shown.
 */
function SimilarComparison({ file, earlierPreview }) {
  const ownSrc = useMemo(() => URL.createObjectURL(file), [file]);
  useEffect(() => () => URL.revokeObjectURL(ownSrc), [ownSrc]);

  return (
    <div className="grid max-w-[520px] grid-cols-2 gap-3">
      <figure className="flex flex-col gap-1.5">
        <figcaption className="text-xs font-medium">Your image</figcaption>
        <EvidenceFrame src={ownSrc} alt={`Your image: ${file.name}`} />
      </figure>
      <figure className="flex flex-col gap-1.5">
        <figcaption className="text-xs font-medium">Already registered (earlier)</figcaption>
        <EvidenceFrame
          src={earlierPreview}
          alt="The similar image registered earlier by another account"
        />
      </figure>
    </div>
  );
}

export default function RegistryPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const copyTimerRef = useRef(null);
  const anchorRequestsRef = useRef(new Set());
  const mountedRef = useRef(true);

  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [notice, setNotice] = useState(null); // { title, text }
  const [pendingSimilar, setPendingSimilar] = useState(null); // { file, detail }
  // Off by default. Turning it on asks the browser for permission straight away,
  // so the user sees the prompt as a result of their own choice.
  const [shareLocation, setShareLocation] = useState(false);
  const [location, setLocation] = useState(null); // { lat, lon, accuracy_m }
  const [locationNote, setLocationNote] = useState("");
  const [highlightId, setHighlightId] = useState(null);
  const [copyFeedback, setCopyFeedback] = useState(null); // { text, failed }
  const [detailAsset, setDetailAsset] = useState(null);
  const [anchorSummaries, setAnchorSummaries] = useState({}); // id -> { status } | { failed }

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await forensicsAPI.listAssets();
        if (active) setAssets(data?.assets ?? []);
      } catch (error) {
        if (active) {
          setLoadError(error?.message || "We could not load your registry.");
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
    };
  }, []);

  // One custody request per visible original, at most: the anchor column reuses
  // these summaries for the life of the page and never refetches on render.
  useEffect(() => {
    const pending = assets
      .map((asset) => asset?.id)
      .filter((id) => id && !anchorRequestsRef.current.has(id));
    if (pending.length === 0) return;

    pending.forEach((id) => anchorRequestsRef.current.add(id));
    const queue = [...pending];

    async function fetchSummary() {
      while (queue.length > 0) {
        const id = queue.shift();
        try {
          const data = await forensicsAPI.getCustody("asset", id);
          if (!mountedRef.current) return;
          const status = newestEntry(data?.entries)?.anchor?.status ?? "not_required";
          setAnchorSummaries((previous) => ({ ...previous, [id]: { status } }));
        } catch {
          if (!mountedRef.current) return;
          setAnchorSummaries((previous) => ({ ...previous, [id]: { failed: true } }));
        }
      }
    }

    // Four at a time keeps the registry responsive without a request storm.
    Promise.all(
      Array.from({ length: Math.min(4, pending.length) }, () => fetchSummary()),
    );
  }, [assets]);

  async function registerFile(file, { confirmSimilar = false } = {}) {
    if (!file || uploading) return;

    setUploading(true);
    setUploadError("");
    setNotice(null);
    setHighlightId(null);
    setPendingSimilar(null);

    try {
      const result = await forensicsAPI.uploadOriginalAsset(file, {
        confirmSimilar,
        clientMetadata: {
          device: collectDevice(),
          ...(shareLocation && location ? { location } : {}),
        },
      });

      if (result?.similar) {
        // Another account registered a similar picture first. Nothing has been
        // saved; ask before registering anyway.
        setPendingSimilar({
          file,
          detail: result.detail,
          earlierPreview: result.earlier_preview ?? null,
        });
        return;
      }

      if (result?.duplicate) {
        setNotice({
          title: "Already in your registry",
          text: `“${result.file_name ?? file.name}” is already saved — this exact file has been registered before, so nothing was added.`,
        });
        setHighlightId(result.id);
        return;
      }

      const asset = {
        id: result.id,
        file_name: result.file_name ?? file.name,
        phash: result.phash,
        sha256: result.sha256,
        created_at: new Date().toISOString(),
        image_url: forensicsAPI.assetImageUrl(result.id),
        registration_metadata: result.registration_metadata ?? null,
      };
      setAssets((previous) => [asset, ...previous]);
      setHighlightId(asset.id);
      setNotice({
        title: "Original registered",
        text: `“${asset.file_name}” is now in your registry. Any later copy can be checked against it.`,
      });
    } catch (error) {
      setUploadError(
        error?.message || "We could not register that file. Please try again.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleShareLocation(checked) {
    setLocationNote("");
    if (!checked) {
      setShareLocation(false);
      setLocation(null);
      return;
    }
    setShareLocation(true);
    setLocationNote("Asking your browser for your location…");
    try {
      setLocation(await requestLocation());
      setLocationNote("Your location will be saved with the next registration.");
    } catch (error) {
      setShareLocation(false);
      setLocation(null);
      setLocationNote(error.message);
    }
  }

  function handleInputChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    registerFile(file);
  }

  function handleDragOver(event) {
    event.preventDefault();
    if (!uploading) setDragActive(true);
  }

  function handleDragLeave(event) {
    event.preventDefault();
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setDragActive(false);
    }
  }

  function handleDrop(event) {
    event.preventDefault();
    setDragActive(false);
    if (uploading) return;
    const file = event.dataTransfer?.files?.[0];
    if (file) registerFile(file);
  }

  async function copySha256(asset) {
    if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
    try {
      await navigator.clipboard.writeText(asset.sha256 ?? "");
      setCopyFeedback({
        text: `SHA-256 for “${asset.file_name}” copied to the clipboard.`,
        failed: false,
      });
    } catch {
      setCopyFeedback({
        text: "Your browser blocked the clipboard. Open the row and copy the hash manually.",
        failed: true,
      });
    }
    copyTimerRef.current = window.setTimeout(() => setCopyFeedback(null), 4000);
  }

  const isEmpty = !loading && !loadError && assets.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Registry"
        description="The originals you have saved for comparison."
      >
        <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          <Upload className="size-4" />
          Register an original
        </Button>
      </PageHeader>

      {/* ------------------------------ dropzone ------------------------------ */}
      <div className="flex flex-col gap-3">
        <label
          htmlFor="registry-file-input"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-primary/30 bg-primary/[0.04] px-6 py-9 text-center transition-colors",
            "focus-within:ring-3 focus-within:ring-ring/40",
            dragActive && "border-primary bg-primary/10",
            uploading && "pointer-events-none opacity-70",
          )}
        >
          <input
            ref={fileInputRef}
            id="registry-file-input"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleInputChange}
            disabled={uploading}
          />
          {uploading ? (
            <>
              <Loader2 className="size-6 animate-spin text-primary" aria-hidden="true" />
              <span className="text-sm font-medium">Processing…</span>
              <span className="text-xs text-muted-foreground">
                Reading the fingerprints, this only takes a moment.
              </span>
            </>
          ) : (
            <>
              <span className="grid size-10 place-items-center rounded-full bg-primary/10 text-primary">
                <Upload className="size-5" aria-hidden="true" />
              </span>
              <span className="text-sm font-medium">
                Drop an image here, or click to browse
              </span>
              <span className="text-xs text-muted-foreground">
                PNG, JPEG or WebP
              </span>
            </>
          )}
        </label>

        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <span>
            Registering stores a SHA-256 fingerprint and a perceptual hash. The image
            itself is kept, so a later copy can be compared against it. The time it
            arrives, what the file says about itself, and your browser and device type
            are saved with it.
          </span>
        </p>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Checkbox
              id="share-location"
              checked={shareLocation}
              onCheckedChange={(checked) => handleShareLocation(checked === true)}
              disabled={uploading}
            />
            <Label htmlFor="share-location" className="text-sm">
              Share my location
            </Label>
          </div>
          <p className="pl-6 text-xs text-muted-foreground">
            {locationNote ||
              "Off by default. If you turn it on, your current location is saved with the registration. It is only shown to you."}
          </p>
        </div>

        {uploadError && (
          <p role="alert" className="text-sm text-destructive">
            {uploadError}
          </p>
        )}

        {pendingSimilar && (
          <Alert role="alertdialog" className="border-caution/45 bg-caution/15">
            <Info className="size-4" />
            <AlertTitle>A similar image is already registered</AlertTitle>
            <AlertDescription className="space-y-3">
              <p>{pendingSimilar.detail}</p>
              {pendingSimilar.earlierPreview && (
                <SimilarComparison
                  file={pendingSimilar.file}
                  earlierPreview={pendingSimilar.earlierPreview}
                />
              )}
              <p className="text-xs">
                If you go ahead, both registrations are kept and linked, and the other
                account&rsquo;s owner is told a similar image was registered. Checks of
                your copy will show that an earlier similar original exists.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  disabled={uploading}
                  onClick={() => registerFile(pendingSimilar.file, { confirmSimilar: true })}
                >
                  Register anyway
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={uploading}
                  onClick={() => setPendingSimilar(null)}
                >
                  Cancel
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {notice && (
          <Alert className="border-primary/35 bg-primary/10 text-primary">
            {notice.title === "Already in your registry" ? (
              <Info className="size-4" />
            ) : (
              <CheckCircle2 className="size-4" />
            )}
            <AlertTitle>{notice.title}</AlertTitle>
            <AlertDescription className="text-primary/90">{notice.text}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* ------------------------------- table -------------------------------- */}
      <section
        aria-labelledby="registry-table-title"
        className="overflow-hidden rounded-xl border border-border bg-card"
      >
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <h2 id="registry-table-title" className="text-sm font-medium">
            Registered originals
          </h2>
          {!loading && !loadError && (
            <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs tabular-nums text-muted-foreground">
              {assets.length}
            </span>
          )}
        </div>

        {loadError && (
          <div className="p-4">
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertTitle>Could not load your registry</AlertTitle>
              <AlertDescription>{loadError}</AlertDescription>
            </Alert>
          </div>
        )}

        {!loadError && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-4">File</TableHead>
                <TableHead className="px-4">Perceptual hash</TableHead>
                <TableHead className="px-4">SHA-256</TableHead>
                <TableHead className="px-4">Anchor</TableHead>
                <TableHead className="px-4">Registered</TableHead>
                <TableHead className="w-12 px-4">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading &&
                [0, 1, 2].map((row) => (
                  <TableRow key={row}>
                    <TableCell className="px-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="size-8 rounded-lg" />
                        <Skeleton className="h-4 w-40" />
                      </div>
                    </TableCell>
                    <TableCell className="px-4">
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell className="px-4">
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell className="px-4">
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell className="px-4">
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell className="px-4">
                      <Skeleton className="size-7 rounded-lg" />
                    </TableCell>
                  </TableRow>
                ))}

              {isEmpty && (
                <TableRow>
                  <TableCell colSpan={6} className="px-4 py-14">
                    <div className="mx-auto flex max-w-sm flex-col items-center gap-3 text-center">
                      <span className="grid size-11 place-items-center rounded-full bg-muted text-muted-foreground">
                        <ImageIcon className="size-5" aria-hidden="true" />
                      </span>
                      <div>
                        <p className="text-sm font-medium">No originals registered yet</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Registering an original is what makes later tampering
                          detectable: without it there is nothing to compare a
                          suspicious copy against.
                        </p>
                      </div>
                      <Button
                        className="mt-1"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="size-4" />
                        Register your first original
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {!loading &&
                assets.map((asset) => (
                  <TableRow
                    key={asset.id}
                    tabIndex={0}
                    aria-label={`View provenance for ${asset.file_name}`}
                    onClick={() => setDetailAsset(asset)}
                    onKeyDown={(event) => {
                      if (
                        (event.key === "Enter" || event.key === " ") &&
                        event.target === event.currentTarget
                      ) {
                        event.preventDefault();
                        setDetailAsset(asset);
                      }
                    }}
                    className={cn(
                      "cursor-pointer transition-colors focus-visible:bg-muted/60 focus-visible:outline-none",
                      highlightId === asset.id && "bg-primary/[0.07]",
                    )}
                  >
                    <TableCell className="px-4">
                      <div className="flex items-center gap-3">
                        <AssetThumb assetId={asset.id} />
                        <span
                          className="max-w-[240px] truncate font-medium"
                          title={asset.file_name}
                        >
                          {asset.file_name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4">
                      <code
                        className="rounded-md border border-border bg-muted px-1.5 py-0.5 font-mono text-[0.6875rem] text-muted-foreground"
                        title={asset.phash}
                      >
                        {asset.phash || "—"}
                      </code>
                    </TableCell>
                    <TableCell className="px-4">
                      <span
                        className="font-mono text-[0.6875rem] text-muted-foreground"
                        title={asset.sha256}
                      >
                        {asset.sha256 ? `${asset.sha256.slice(0, 24)}…` : "—"}
                      </span>
                    </TableCell>
                    <TableCell className="px-4">
                      <AnchorIndicator summary={anchorSummaries[asset.id]} />
                    </TableCell>
                    <TableCell className="px-4 text-muted-foreground tabular-nums">
                      {formatDate(asset.created_at)}
                    </TableCell>
                    <TableCell
                      className="px-4 text-right"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Actions for ${asset.file_name}`}
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onSelect={() =>
                              navigate("/analyze", {
                                state: { originalAssetId: asset.id },
                              })
                            }
                          >
                            <Scale className="size-4" />
                            Check this original
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => setDetailAsset(asset)}>
                            <History className="size-4" />
                            View provenance
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={() => copySha256(asset)}>
                            <Copy className="size-4" />
                            Copy SHA-256
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        )}

        {copyFeedback && (
          <p
            aria-live="polite"
            className={cn(
              "flex items-center gap-2 border-t border-border px-4 py-2 text-xs",
              copyFeedback.failed ? "text-destructive" : "text-muted-foreground",
            )}
          >
            {copyFeedback.failed ? (
              <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="size-3.5 shrink-0" aria-hidden="true" />
            )}
            {copyFeedback.text}
          </p>
        )}
      </section>

      <AssetProvenanceDialog
        key={detailAsset?.id ?? "closed"}
        asset={detailAsset}
        open={Boolean(detailAsset)}
        onOpenChange={(open) => {
          if (!open) setDetailAsset(null);
        }}
      />
    </div>
  );
}
