import { useEffect, useState } from "react";
import { Check, Copy, Link2, Loader2 } from "lucide-react";

import { forensicsAPI } from "@/api/forensics";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const DATE = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });
const LIFETIMES = [7, 30, 90];

function formatDate(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? DATE.format(date) : "—";
}

function shareUrl(token) {
  return `${window.location.origin}/shared/${token}`;
}

/**
 * Create, copy and revoke share links for one check. A new link's address is
 * only known right after it is made - the server keeps just a hash - so it is
 * shown once, with a copy button.
 */
export default function ShareDialog({ checkId, open, onOpenChange }) {
  const [links, setLinks] = useState(null);
  const [days, setDays] = useState(30);
  const [fresh, setFresh] = useState(null); // { id, url }
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return undefined;
    let active = true;
    forensicsAPI.listShareLinks(checkId).then(
      (data) => active && setLinks(data.shares ?? []),
      (err) => active && setError(err?.message || "Share links could not be loaded."),
    );
    return () => {
      active = false;
    };
  }, [open, checkId]);

  async function run(action) {
    setBusy(true);
    setError("");
    try {
      await action();
      setLinks((await forensicsAPI.listShareLinks(checkId)).shares ?? []);
    } catch (err) {
      setError(err?.message || "That did not work. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function create() {
    run(async () => {
      const link = await forensicsAPI.createShareLink(checkId, days);
      setFresh({ id: link.id, url: shareUrl(link.token) });
      setCopied(false);
    });
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(fresh.url);
      setCopied(true);
    } catch {
      setError("Copying failed. Select the link and copy it by hand.");
    }
  }

  function handleOpenChange(next) {
    onOpenChange(next);
    if (!next) {
      setFresh(null);
      setError("");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Share this result</DialogTitle>
          <DialogDescription>
            Anyone with the link can see this result without an account, side by side with your
            original if it is yours. Send it only to people you trust, such as the police or your
            school. You can revoke it at any time.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm">Link lasts</span>
          {LIFETIMES.map((value) => (
            <Button
              key={value}
              size="sm"
              variant={days === value ? "default" : "outline"}
              onClick={() => setDays(value)}
              disabled={busy}
            >
              {value} days
            </Button>
          ))}
          <Button size="sm" onClick={create} disabled={busy} className="ml-auto">
            {busy ? <Loader2 className="animate-spin" /> : <Link2 />}
            Create link
          </Button>
        </div>

        {fresh && (
          <div className="space-y-2 rounded-lg border border-primary/35 bg-primary/10 p-3">
            <p className="text-xs font-medium">Copy this link now. It will not be shown again.</p>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={fresh.url}
                onFocus={(event) => event.target.select()}
                aria-label="Share link"
                className="min-w-0 flex-1 rounded-md border border-input bg-background px-2 py-1 font-mono text-xs"
              />
              <Button size="sm" variant="outline" onClick={copy}>
                {copied ? <Check /> : <Copy />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>
        )}

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Links for this result</h3>
          {links === null ? (
            <p className="text-xs text-muted-foreground">Loading…</p>
          ) : links.length === 0 ? (
            <p className="text-xs text-muted-foreground">No links yet.</p>
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-border">
              {links.map((link) => (
                <li key={link.id} className="flex flex-wrap items-center gap-2 px-3 py-2 text-xs">
                  <Badge variant={link.active ? "outline" : "secondary"}>
                    {link.active ? "Active" : link.revoked_at ? "Revoked" : "Expired"}
                  </Badge>
                  <span className="text-muted-foreground">
                    Created {formatDate(link.created_at)} · expires {formatDate(link.expires_at)} ·{" "}
                    {link.view_count} {link.view_count === 1 ? "view" : "views"}
                  </span>
                  {link.active && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="ml-auto text-destructive"
                      disabled={busy}
                      onClick={() => run(() => forensicsAPI.revokeShareLink(link.id))}
                    >
                      Revoke
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
