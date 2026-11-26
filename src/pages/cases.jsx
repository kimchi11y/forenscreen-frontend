import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FileImage, FolderOpen, Loader2, Plus, ScanSearch, Trash2 } from "lucide-react";

import { forensicsAPI } from "@/api/forensics";
import { PageHeader } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VerdictPill } from "@/components/verdict-banner";

const DATE = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });

function formatDate(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? DATE.format(date) : "—";
}

function countLabel(n, one, many) {
  return `${n} ${n === 1 ? one : many}`;
}

/** Create a case. Calls `onCreated` with the new case. */
function NewCaseDialog({ open, onOpenChange, onCreated }) {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function handleOpenChange(next) {
    onOpenChange(next);
    if (!next) {
      setTitle("");
      setSummary("");
      setError("");
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const created = await forensicsAPI.createCase({ title, summary });
      onCreated(created);
      handleOpenChange(false);
    } catch (err) {
      setError(err?.message || "The case could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New case</DialogTitle>
          <DialogDescription>Give the incident a name you&rsquo;ll recognise later.</DialogDescription>
        </DialogHeader>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="case-title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="case-title"
              required
              maxLength={120}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Instagram comments, March"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="case-summary">Summary</Label>
            <textarea
              id="case-summary"
              rows={3}
              maxLength={2000}
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              placeholder="Optional — what happened, and where."
              className="w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={!title.trim() || saving}>
              {saving && <Loader2 className="animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * One case: its originals and checks, what else could go in it, and closing or
 * reopening it. Mounted fresh for each case (keyed by id), so its state never
 * carries over from the previous one.
 */
function CaseDetail({ caseId, onChanged }) {
  const [data, setData] = useState(null);
  const [available, setAvailable] = useState({ originals: [], checks: [] });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Fetching and applying are separate so the effect only sets state once
  // the data has arrived, never synchronously while rendering.
  const fetchDetail = useCallback(async () => {
    const [detail, assets, checks] = await Promise.all([
      forensicsAPI.getCase(caseId),
      forensicsAPI.listAssets(),
      forensicsAPI.listChecks({ limit: 100 }),
    ]);
    const inCase = new Set([
      ...detail.items.originals.map((item) => `asset:${item.id}`),
      ...detail.items.checks.map((item) => `evidence:${item.id}`),
    ]);
    return {
      detail,
      available: {
        originals: (assets.assets ?? []).filter((a) => !inCase.has(`asset:${a.id}`)),
        checks: (checks.checks ?? []).filter((c) => !inCase.has(`evidence:${c.file_id}`)),
      },
    };
  }, [caseId]);

  const apply = useCallback((loaded) => {
    setData(loaded.detail);
    setAvailable(loaded.available);
    setError("");
  }, []);

  useEffect(() => {
    let active = true;
    fetchDetail()
      .then((loaded) => active && apply(loaded))
      .catch((err) => active && setError(err?.message || "This case could not be loaded."));
    return () => {
      active = false;
    };
  }, [fetchDetail, apply]);

  async function run(action) {
    setBusy(true);
    try {
      await action();
      apply(await fetchDetail());
      onChanged();
    } catch (err) {
      setError(err?.message || "That did not work. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!data) {
    return error ? (
      <p role="alert" className="text-sm text-destructive">{error}</p>
    ) : (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Loading case…
      </div>
    );
  }

  const closed = data.status === "closed";
  const { originals, checks } = data.items;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Badge variant={closed ? "secondary" : "outline"}>{closed ? "Closed" : "Open"}</Badge>
        <span>Created {formatDate(data.created_at)}</span>
        <span>· {countLabel(originals.length, "original", "originals")}</span>
        <span>· {countLabel(checks.length, "check", "checks")}</span>
      </div>
      {data.summary && <p className="text-sm text-pretty">{data.summary}</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

      <section aria-labelledby="case-originals" className="space-y-2">
        <h3 id="case-originals" className="text-sm font-semibold">Originals</h3>
        {originals.length === 0 ? (
          <p className="text-xs text-muted-foreground">No originals in this case yet.</p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {originals.map((item) => (
              <li key={item.id} className="flex items-center gap-3 px-3 py-2">
                <FileImage className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.8125rem] font-medium">{item.file_name}</p>
                  <p className="text-xs text-muted-foreground">Registered {formatDate(item.registered_at)}</p>
                </div>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  disabled={busy}
                  aria-label={`Remove ${item.file_name} from this case`}
                  onClick={() => run(() => forensicsAPI.removeCaseItem(caseId, "asset", item.id))}
                >
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="case-checks" className="space-y-2">
        <h3 id="case-checks" className="text-sm font-semibold">Checks</h3>
        {checks.length === 0 ? (
          <p className="text-xs text-muted-foreground">No checks in this case yet.</p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {checks.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center gap-3 px-3 py-2">
                <ScanSearch className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <div className="min-w-0 flex-1 space-y-1">
                  <VerdictPill status={item.verification_status} />
                  <p className="text-xs text-muted-foreground">
                    Checked {formatDate(item.checked_at)}
                    {item.matched_asset_name && ` · against ${item.matched_asset_name}`}
                  </p>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link to={`/compare/${item.id}`}>Open</Link>
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  disabled={busy}
                  aria-label="Remove this check from the case"
                  onClick={() => run(() => forensicsAPI.removeCaseItem(caseId, "evidence", item.id))}
                >
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {!closed && (available.originals.length > 0 || available.checks.length > 0) && (
        <section aria-labelledby="case-add" className="space-y-2">
          <h3 id="case-add" className="text-sm font-semibold">Add to this case</h3>
          <ul className="max-h-56 divide-y divide-border overflow-y-auto rounded-lg border border-border">
            {available.originals.map((asset) => (
              <li key={`a-${asset.id}`} className="flex items-center gap-3 px-3 py-2">
                <FileImage className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate text-[0.8125rem]">{asset.file_name}</span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => run(() => forensicsAPI.addCaseItem(caseId, "asset", asset.id))}
                >
                  Add
                </Button>
              </li>
            ))}
            {available.checks.map((check) => (
              <li key={`c-${check.file_id}`} className="flex flex-wrap items-center gap-3 px-3 py-2">
                <ScanSearch className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <div className="min-w-0 flex-1 space-y-1">
                  <VerdictPill status={check.verification_status} />
                  <p className="text-xs text-muted-foreground">Checked {formatDate(check.created_at)}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => run(() => forensicsAPI.addCaseItem(caseId, "evidence", check.file_id))}
                >
                  Add
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-xs text-muted-foreground">
        Adding or removing evidence is recorded in that item&rsquo;s chain of custody. Cases are
        closed rather than deleted, so those records always point somewhere.
      </p>

      <DialogFooter>
        <Button
          variant="outline"
          disabled={busy}
          onClick={() =>
            run(() => forensicsAPI.updateCase(caseId, { status: closed ? "open" : "closed" }))
          }
        >
          {closed ? "Reopen case" : "Close case"}
        </Button>
      </DialogFooter>
    </div>
  );
}

export default function CasesPage() {
  const [cases, setCases] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [creating, setCreating] = useState(false);
  const [openCase, setOpenCase] = useState(null); // { id, title }

  const showCases = useCallback((data) => {
    setCases(data.cases ?? []);
    setLoadError("");
  }, []);

  const showLoadError = useCallback((err) => {
    setLoadError(err?.message || "Your cases could not be loaded.");
    setCases((previous) => previous ?? []);
  }, []);

  const refresh = useCallback(
    () => forensicsAPI.listCases().then(showCases, showLoadError),
    [showCases, showLoadError],
  );

  useEffect(() => {
    let active = true;
    forensicsAPI.listCases().then(
      (data) => active && showCases(data),
      (err) => active && showLoadError(err),
    );
    return () => {
      active = false;
    };
  }, [showCases, showLoadError]);

  return (
    <>
      <PageHeader title="Cases" description="Keep one incident's evidence together.">
        <Button type="button" onClick={() => setCreating(true)}>
          <Plus data-icon="inline-start" />
          New case
        </Button>
      </PageHeader>

      {loadError && (
        <p role="alert" className="mb-4 text-sm text-destructive">
          {loadError}
        </p>
      )}

      {cases === null ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Loading cases…
        </div>
      ) : cases.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 px-6 py-16 text-center">
            <span className="grid size-11 place-items-center rounded-xl bg-muted text-muted-foreground">
              <FolderOpen className="size-5" />
            </span>
            <div className="space-y-1.5">
              <h2 className="text-base font-medium">No cases yet</h2>
              <p className="mx-auto max-w-md text-sm text-muted-foreground">
                A case groups related evidence from a single incident — the screenshots,
                replies and direct messages that belong together — so you can check them as
                one story instead of one file at a time.
              </p>
            </div>
            <Button type="button" onClick={() => setCreating(true)}>
              <Plus data-icon="inline-start" />
              Create a case
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {cases.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => setOpenCase({ id: item.id, title: item.title })}
                className="flex h-full w-full flex-col gap-2 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium">{item.title}</span>
                  <Badge variant={item.status === "closed" ? "secondary" : "outline"}>
                    {item.status === "closed" ? "Closed" : "Open"}
                  </Badge>
                </div>
                {item.summary && (
                  <p className="line-clamp-2 text-sm text-muted-foreground">{item.summary}</p>
                )}
                <p className="mt-auto text-xs text-muted-foreground">
                  {countLabel(item.originals, "original", "originals")} ·{" "}
                  {countLabel(item.checks, "check", "checks")} · Created {formatDate(item.created_at)}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}

      <NewCaseDialog
        open={creating}
        onOpenChange={setCreating}
        onCreated={(created) => {
          setCases((previous) => [created, ...(previous ?? [])]);
          setOpenCase({ id: created.id, title: created.title });
        }}
      />

      <Dialog open={openCase !== null} onOpenChange={(next) => !next && setOpenCase(null)}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="pr-8">{openCase?.title}</DialogTitle>
            <DialogDescription>The originals and checks for this incident.</DialogDescription>
          </DialogHeader>
          {openCase && <CaseDetail key={openCase.id} caseId={openCase.id} onChanged={refresh} />}
        </DialogContent>
      </Dialog>
    </>
  );
}
