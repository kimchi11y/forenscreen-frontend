import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Image as ImageIcon,
  Info,
  Loader2,
  MoreHorizontal,
  Scale,
  Upload,
} from "lucide-react";

import { PageHeader } from "@/components/app-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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

/** 32px thumbnail, falling back to a soft tile when the image won't load. */
function AssetThumb({ assetId }) {
  const [failed, setFailed] = useState(false);

  if (failed || !assetId) {
    return (
      <div
        aria-hidden="true"
        className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted ring-1 ring-border"
      />
    );
  }

  return (
    <img
      src={forensicsAPI.assetImageUrl(assetId)}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      className="size-8 shrink-0 rounded-lg border border-border object-cover"
    />
  );
}

export default function RegistryPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const copyTimerRef = useRef(null);

  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [notice, setNotice] = useState(null); // { title, text }
  const [highlightId, setHighlightId] = useState(null);
  const [copyFeedback, setCopyFeedback] = useState(null); // { text, failed }

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

  async function registerFile(file) {
    if (!file || uploading) return;

    setUploading(true);
    setUploadError("");
    setNotice(null);
    setHighlightId(null);

    try {
      const result = await forensicsAPI.uploadOriginalAsset(file);

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
            itself is kept, so a later copy can be compared against it.
          </span>
        </p>

        {uploadError && (
          <p role="alert" className="text-sm text-destructive">
            {uploadError}
          </p>
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
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell className="px-4">
                      <Skeleton className="size-7 rounded-lg" />
                    </TableCell>
                  </TableRow>
                ))}

              {isEmpty && (
                <TableRow>
                  <TableCell colSpan={5} className="px-4 py-14">
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
                    className={cn(
                      "transition-colors",
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
                    <TableCell className="px-4 text-muted-foreground tabular-nums">
                      {formatDate(asset.created_at)}
                    </TableCell>
                    <TableCell className="px-4 text-right">
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
    </div>
  );
}
