import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Puzzle } from "lucide-react";

import { forensicsAPI } from "@/api/forensics";
import { PageHeader } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const FROM_APP = "forenscreen-app";
const FROM_EXTENSION = "forenscreen-extension";
const DATE = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });

function formatDate(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? DATE.format(date) : "—";
}

function send(message) {
  window.postMessage({ source: FROM_APP, ...message }, window.location.origin);
}

/** Wait for one reply of `type` from the extension's bridge script. */
function waitFor(type, ms) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      window.removeEventListener("message", listener);
      resolve(null);
    }, ms);
    function listener(event) {
      if (event.source !== window || event.origin !== window.location.origin) return;
      if (event.data?.source !== FROM_EXTENSION || event.data.type !== type) return;
      clearTimeout(timer);
      window.removeEventListener("message", listener);
      resolve(event.data);
    }
    window.addEventListener("message", listener);
  });
}

/**
 * Connect the ForenScreen browser extension to this account.
 *
 * The extension's bridge script runs on this site and answers a "ping". On
 * "Connect", the API issues an extension token - one that can only register
 * originals - and this page hands it straight to the extension. It is never
 * shown on screen.
 */
export default function ExtensionPage() {
  const [installed, setInstalled] = useState(null); // null = checking
  const [tokens, setTokens] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null); // { tone, text }

  useEffect(() => {
    let active = true;
    waitFor("present", 1500).then((reply) => active && setInstalled(Boolean(reply)));
    send({ type: "ping" });
    forensicsAPI.listExtensionTokens().then(
      (data) => active && setTokens(data.tokens ?? []),
      () => active && setTokens([]),
    );
    return () => {
      active = false;
    };
  }, []);

  async function refreshTokens() {
    setTokens((await forensicsAPI.listExtensionTokens()).tokens ?? []);
  }

  async function connect() {
    setBusy(true);
    setMessage(null);
    try {
      const issued = await forensicsAPI.createExtensionToken(
        `${navigator.userAgentData?.platform ?? navigator.platform} browser`,
      );
      const reply = waitFor("connected", 5000);
      send({ type: "connect-extension", token: issued.token });
      const result = await reply;
      if (result?.ok) {
        setMessage({ tone: "ok", text: "The extension is connected to your account." });
      } else {
        // The token reached nothing: revoke it rather than leave it lying around.
        await forensicsAPI.revokeExtensionToken(issued.id);
        setMessage({ tone: "bad", text: "The extension did not answer. Is it installed and enabled?" });
      }
      await refreshTokens();
    } catch (err) {
      setMessage({ tone: "bad", text: err?.message || "The extension could not be connected." });
    } finally {
      setBusy(false);
    }
  }

  async function revoke(id) {
    setBusy(true);
    try {
      await forensicsAPI.revokeExtensionToken(id);
      await refreshTokens();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Browser extension"
        description="Register screenshots and photos straight from your browser."
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Connect this browser</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              With the extension you can right-click any image to register it, drop a file on its
              icon, or be asked &ldquo;Register this?&rdquo; when you add a photo to a post on
              Instagram or X. It always asks before uploading anything.
            </p>
            <p className="flex items-center gap-2">
              {installed === null ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Looking for the extension…
                </>
              ) : installed ? (
                <>
                  <CheckCircle2 className="size-4 text-success" aria-hidden="true" /> Extension found in this browser.
                </>
              ) : (
                <>
                  <Puzzle className="size-4 text-muted-foreground" aria-hidden="true" />
                  Extension not found. Load the <code>extension</code> folder in Chrome first (see its README).
                </>
              )}
            </p>
            <Button onClick={connect} disabled={!installed || busy}>
              {busy && <Loader2 className="animate-spin" />}
              Connect extension
            </Button>
            {message && (
              <p role="status" className={message.tone === "ok" ? "text-success" : "text-destructive"}>
                {message.text}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              The extension gets its own sign-in that lasts 90 days and can only register
              originals. It cannot see your registry or checks.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Connected extensions</CardTitle>
          </CardHeader>
          <CardContent>
            {tokens === null ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : tokens.length === 0 ? (
              <p className="text-sm text-muted-foreground">None yet.</p>
            ) : (
              <ul className="divide-y divide-border rounded-lg border border-border">
                {tokens.map((token) => (
                  <li key={token.id} className="flex flex-wrap items-center gap-2 px-3 py-2 text-xs">
                    <Badge variant={token.active ? "outline" : "secondary"}>
                      {token.active ? "Active" : "Revoked or expired"}
                    </Badge>
                    <span className="font-medium">{token.label}</span>
                    <span className="text-muted-foreground">
                      Connected {formatDate(token.created_at)} · last used{" "}
                      {token.last_used_at ? formatDate(token.last_used_at) : "never"}
                    </span>
                    {token.active && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="ml-auto text-destructive"
                        disabled={busy}
                        onClick={() => revoke(token.id)}
                      >
                        Disconnect
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
