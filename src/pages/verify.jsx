import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  Blocks,
  Check,
  Copy,
  Database,
  ExternalLink,
  History,
  Loader2,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

import { forensicsAPI } from "@/api/forensics";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { tone } from "@/lib/verdict";
import { cn } from "@/lib/utils";

const SHA256 = /^[0-9a-f]{64}$/;
const INVALID = "A SHA-256 digest is 64 hexadecimal characters (0–9, a–f).";
const EMPTY = "Paste a SHA-256 digest to verify.";

const DATE = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const DATE_TIME = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/**
 * The four states the backend reports, and the wording for each. The server
 * sends its own `explanation`; these labels only name the state, so the two
 * cannot drift into different verdicts.
 */
const STATES = {
  registered_and_anchored: {
    label: "Registered and anchored",
    tone: "success",
    Icon: ShieldCheck,
  },
  registered_not_anchored: {
    label: "Registered, not anchored",
    tone: "warning",
    Icon: AlertTriangle,
  },
  anchored_not_registered: {
    label: "Anchored but missing from the registry",
    tone: "destructive",
    Icon: ShieldAlert,
  },
  not_found: {
    label: "Not found",
    tone: "neutral",
    Icon: Search,
  },
};

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : DATE.format(date);
}

/** The chain stores Unix seconds; accept milliseconds too so a change is safe. */
function formatChainTime(value) {
  const seconds = Number(value);
  if (!Number.isFinite(seconds) || seconds <= 0) return "—";
  const date = new Date(seconds > 1e12 ? seconds : seconds * 1000);
  return Number.isNaN(date.getTime()) ? "—" : DATE_TIME.format(date);
}

function BreakdownItem({ Icon, label, value, detail }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5 rounded-lg border border-border bg-background/60 p-3.5">
      <dt className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Icon className="size-3.5 shrink-0" aria-hidden="true" />
        {label}
      </dt>
      <dd className="min-w-0 break-words text-sm font-medium">{value}</dd>
      {detail && (
        <dd className="flex min-w-0 flex-col gap-1 text-xs text-muted-foreground">{detail}</dd>
      )}
    </div>
  );
}

function ResultCard({ result, digest, copied, onCopy, onReset }) {
  const summary = STATES[result.state] ?? {
    label: "Unrecognised result",
    tone: "neutral",
    Icon: Search,
  };
  const colors = tone(summary.tone);
  const SummaryIcon = summary.Icon;

  const database = result.database ?? {};
  const chain = result.chain ?? {};
  const custody = result.custody_chain;

  const registered = Boolean(database.registered);
  const registeredDetail = registered
    ? database.registered_at
      ? `Registered ${formatDate(database.registered_at)}`
      : "Registration date —"
    : "No matching record in the database";

  let chainValue = "Not configured";
  let chainDetail = "Anchoring is not configured for this deployment.";
  if (chain.available) {
    if (chain.anchored) {
      chainValue = "Anchored";
      chainDetail = `Anchored ${formatChainTime(chain.timestamp)}`;
    } else {
      chainValue = "Not anchored";
      chainDetail = "No anchor has been recorded on-chain for this digest.";
    }
  }

  let custodyValue = "Not available";
  let custodyDetail = registered
    ? "No custody chain was returned for this record."
    : "No registry record to trace.";
  if (custody) {
    const count =
      typeof custody.entries === "number"
        ? custody.entries
        : Array.isArray(custody.entries)
          ? custody.entries.length
          : null;
    const problems = Array.isArray(custody.problems) ? custody.problems.length : 0;
    custodyValue = `${custody.intact ? "Intact" : "Broken"}, ${count ?? "—"} ${
      count === 1 ? "entry" : "entries"
    }`;
    custodyDetail = custody.intact
      ? "Every entry links to the one before it."
      : `${problems} ${problems === 1 ? "problem" : "problems"} found while recomputing the chain.`;
  }

  return (
    <Card aria-live="polite">
      <CardContent className="flex flex-col gap-5">
        <div className={cn("flex items-start gap-3 rounded-xl border p-4", colors.banner)}>
          <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", colors.icon)}>
            <SummaryIcon className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold leading-snug">{summary.label}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{result.explanation}</p>
            {!chain.available && (
              <p className="mt-2 text-xs text-muted-foreground">
                On-chain anchoring is not configured for this deployment, so no anchor could be
                looked up. This says nothing about whether the digest itself is valid.
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2">
          <code className="min-w-0 flex-1 break-all font-mono text-xs leading-relaxed text-foreground/90">
            {result.sha256 ?? digest}
          </code>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={copied ? "Digest copied" : "Copy digest"}
            onClick={onCopy}
          >
            {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
          </Button>
        </div>

        <dl className="grid gap-3 md:grid-cols-3">
          <BreakdownItem
            Icon={Database}
            label="Registry"
            value={
              registered
                ? database.is_owner
                  ? database.file_name || "—"
                  : "Registered (owner kept private)"
                : "Not registered"
            }
            detail={registeredDetail}
          />

          <BreakdownItem
            Icon={Blocks}
            label="Chain"
            value={chainValue}
            detail={
              <>
                <span>{chainDetail}</span>
                {chain.available && chain.anchored && chain.submitted_by && (
                  <span className="break-all font-mono text-[0.6875rem] text-foreground/70">
                    {chain.submitted_by}
                  </span>
                )}
                {chain.available && chain.explorer && (
                  <a
                    href={chain.explorer}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex w-fit items-center gap-1 font-medium text-primary hover:underline"
                  >
                    View on Etherscan
                    <ExternalLink className="size-3" aria-hidden="true" />
                  </a>
                )}
              </>
            }
          />

          <BreakdownItem
            Icon={History}
            label="Custody chain"
            value={custodyValue}
            detail={custodyDetail}
          />
        </dl>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <p className="max-w-[46ch] text-xs text-muted-foreground">
            This result is a public read: it is not a verdict on your account or on the file content
            itself.
          </p>
          <Button type="button" variant="outline" onClick={onReset}>
            <RotateCcw className="size-4" />
            Check another
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * The public, no-account counterpart to a signed-in check: a digest is compared
 * against both the registry and the on-chain anchor, and the page is explicit
 * about where those two disagree.
 */
export default function VerifyPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [digest, setDigest] = useState(() => (searchParams.get("hash") ?? "").trim());
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const inputRef = useRef(null);
  const initialRun = useRef(false);
  const copiedTimer = useRef(null);

  const runLookup = useCallback(
    async (raw, { updateUrl = false } = {}) => {
      const value = raw.trim().toLowerCase();

      if (!value) {
        setError(EMPTY);
        setResult(null);
        return;
      }

      if (!SHA256.test(value)) {
        setError(INVALID);
        setResult(null);
        return;
      }

      setDigest(value);
      setError("");
      setResult(null);
      setBusy(true);

      try {
        const data = await forensicsAPI.verifyAnchor(value);
        setResult(data);
        if (updateUrl) setSearchParams({ hash: value }, { replace: true });
      } catch (err) {
        setError(err?.message || "The fingerprint could not be checked. Please try again.");
      } finally {
        setBusy(false);
      }
    },
    [setSearchParams],
  );

  useEffect(() => {
    // StrictMode mounts effects twice in development; a linkable result must
    // only produce one request.
    if (initialRun.current) return;
    initialRun.current = true;

    const fromUrl = searchParams.get("hash");
    if (!fromUrl) return;

    const value = fromUrl.trim().toLowerCase();
    setDigest(value);
    if (!SHA256.test(value)) {
      setError(INVALID);
      return;
    }
    runLookup(value);
  }, [runLookup, searchParams]);

  useEffect(() => () => clearTimeout(copiedTimer.current), []);

  function handleChange(event) {
    const next = event.target.value;
    setDigest(next);
    if (error) setError("");
    if (result && next.trim().toLowerCase() !== result.sha256) setResult(null);
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (busy) return;
    runLookup(digest, { updateUrl: true });
  }

  async function handleCopy() {
    const value = result?.sha256 ?? digest.trim().toLowerCase();
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be denied; the digest is still selectable in the
      // result card, so this must not turn a successful check into an error.
      setCopied(false);
    }
  }

  function handleReset() {
    setDigest("");
    setError("");
    setResult(null);
    setCopied(false);
    setSearchParams({}, { replace: true });
    inputRef.current?.focus();
  }

  return (
    <div className="mx-auto flex w-full max-w-[820px] flex-col gap-6 px-5 py-12 pb-16 lg:px-0">
      <section className="mx-auto max-w-[640px] text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-[2.125rem]">
          Verify a fingerprint
        </h1>
        <p className="mx-auto mt-2.5 max-w-[58ch] text-base text-muted-foreground">
          Paste a file&rsquo;s SHA-256 digest to check it against the public ledger and the registry.
          Anyone can run this check — no account required, and no need to trust this interface.
        </p>
      </section>

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="verify-digest" className="text-sm font-medium">
                SHA-256 digest
              </label>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  ref={inputRef}
                  id="verify-digest"
                  name="hash"
                  value={digest}
                  onChange={handleChange}
                  placeholder="Paste a 64-character SHA-256 digest"
                  autoComplete="off"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={
                    error ? "verify-digest-hint verify-digest-error" : "verify-digest-hint"
                  }
                  className="h-10 flex-1 font-mono text-[0.8125rem]"
                />
                <Button type="submit" size="lg" className="h-10" disabled={busy}>
                  {busy ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Search className="size-4" aria-hidden="true" />
                  )}
                  {busy ? "Checking…" : "Verify"}
                </Button>
              </div>

              <p id="verify-digest-hint" className="text-xs text-muted-foreground">
                On macOS run <code className="font-mono text-foreground/80">shasum -a 256 image.jpg</code>;
                on Linux run <code className="font-mono text-foreground/80">sha256sum image.jpg</code>.
              </p>

              {error && (
                <p id="verify-digest-error" role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {busy && (
        <p role="status" className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          Comparing the digest with the registry and the chain…
        </p>
      )}

      {result && (
        <ResultCard
          result={result}
          digest={digest}
          copied={copied}
          onCopy={handleCopy}
          onReset={handleReset}
        />
      )}
    </div>
  );
}
