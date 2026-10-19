import { useState } from "react";
import { Info, Lock, ShieldAlert, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

function Notice({ children }) {
  return (
    <p
      role="status"
      className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/15 px-2.5 py-2 text-sm text-warning-foreground"
    >
      <Info className="mt-0.5 size-4 shrink-0" />
      {children}
    </p>
  );
}

export default function SettingsPage() {
  const [displayName, setDisplayName] = useState("Aisha Rahman");
  const [email, setEmail] = useState("aisha@example.com");
  const [profileNotice, setProfileNotice] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleteNotice, setDeleteNotice] = useState(false);

  function handleProfileSubmit(event) {
    event.preventDefault();
    // No account API exists yet: say so instead of pretending it saved.
    setProfileNotice(true);
  }

  function handleDeleteOpenChange(next) {
    setDeleteOpen(next);
    if (!next) {
      setConfirmText("");
      setDeleteNotice(false);
    }
  }

  function handleDeleteSubmit(event) {
    event.preventDefault();
    if (confirmText !== "DELETE") return;
    setDeleteNotice(true);
  }

  return (
    <>
      <PageHeader title="Settings" description="Your account and data." />

      <div className="grid gap-5">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid max-w-md gap-4" onSubmit={handleProfileSubmit}>
              <div className="grid gap-2">
                <Label htmlFor="settings-name">Display name</Label>
                <Input
                  id="settings-name"
                  name="name"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="settings-email">Email</Label>
                <Input
                  id="settings-email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>

              {profileNotice && (
                <Notice>
                  Editing your profile isn&apos;t connected yet. Your changes were
                  not saved.
                </Notice>
              )}

              <div>
                <Button type="submit">Save changes</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                  <Lock className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-medium">Two-factor authentication</p>
                  <p className="text-sm text-muted-foreground">
                    Add a second step when you sign in, so a stolen password
                    isn&apos;t enough on its own.
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                aria-disabled="true"
                className="text-muted-foreground"
              >
                Coming soon
              </Badge>
            </div>

            <div className="border-t border-border pt-4">
              <Button type="button" variant="outline" disabled>
                Change password
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Privacy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              When you register an original, we keep a copy of it so that later
              images can be compared against it. That record is what lets a
              modified copy of your image be spotted, even after it has been
              re-shared or re-compressed.
            </p>
            <p>
              You stay in control of that record. As the account holder, you can
              delete any registered original at any time, and we stop comparing
              against it from that moment.
            </p>
          </CardContent>
        </Card>

        <Card className="border border-destructive/30 ring-destructive/25">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="size-4" />
              Danger zone
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Delete account</p>
              <p className="text-sm text-muted-foreground">
                Removes your account and every registered original. This can&apos;t
                be undone.
              </p>
            </div>
            <Button
              type="button"
              variant="destructive"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 data-icon="inline-start" />
              Delete account
            </Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={deleteOpen} onOpenChange={handleDeleteOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete account</DialogTitle>
            <DialogDescription>
              This removes your account and every registered original. To
              confirm, type DELETE below.
            </DialogDescription>
          </DialogHeader>

          <form className="grid gap-4" onSubmit={handleDeleteSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="confirm-delete">Type DELETE to confirm</Label>
              <Input
                id="confirm-delete"
                name="confirm"
                autoComplete="off"
                value={confirmText}
                onChange={(event) => setConfirmText(event.target.value)}
                placeholder="DELETE"
              />
            </div>

            {deleteNotice && (
              <Notice>
                Account deletion isn&apos;t connected yet. Nothing was deleted.
              </Notice>
            )}

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                variant="destructive"
                disabled={confirmText !== "DELETE"}
              >
                Delete account
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
