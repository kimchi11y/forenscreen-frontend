import { useState } from "react";
import { CheckCircle2, Info, KeyRound, Loader2, ShieldAlert, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/app-shell";
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
import { changeUserPassword, clearCachedToken } from "@/lib/auth";

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

/** Same rule as sign-up, so a changed password is never weaker than a new one. */
function passwordProblem(current, next, confirm) {
  if (!current) return "Enter your current password.";
  if (next.length < 8) return "Use at least 8 characters for your new password.";
  if (!/\d/.test(next)) return "Add at least one number to your new password.";
  if (next === current) return "Choose a password different from your current one.";
  if (next !== confirm) return "The new passwords don't match.";
  return "";
}

function ChangePasswordDialog({ open, onOpenChange }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // Passwords must not linger in state once the dialog is closed.
  function handleOpenChange(next) {
    if (submitting) return;
    onOpenChange(next);
    if (!next) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setError("");
      setDone(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;

    const problem = passwordProblem(currentPassword, newPassword, confirmPassword);
    setError(problem);
    if (problem) return;

    setSubmitting(true);
    try {
      await changeUserPassword({ currentPassword, newPassword });
      clearCachedToken();
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setDone(true);
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : "We couldn't change your password. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change password</DialogTitle>
          <DialogDescription>
            {done
              ? "Your password has been changed."
              : "Enter your current password, then choose a new one. You'll be signed out on every other device."}
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <>
            <p
              role="status"
              className="flex items-start gap-2 rounded-lg border border-success/40 bg-success/10 px-2.5 py-2 text-sm"
            >
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
              Any other devices signed in to this account have been signed out.
            </p>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button">Done</Button>
              </DialogClose>
            </DialogFooter>
          </>
        ) : (
          <form className="grid gap-4" onSubmit={handleSubmit} noValidate>
            <div className="grid gap-2">
              <Label htmlFor="current-password">Current password</Label>
              <Input
                id="current-password"
                name="current-password"
                type="password"
                autoComplete="current-password"
                disabled={submitting}
                value={currentPassword}
                onChange={(event) => {
                  setCurrentPassword(event.target.value);
                  setError("");
                }}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                name="new-password"
                type="password"
                autoComplete="new-password"
                disabled={submitting}
                value={newPassword}
                onChange={(event) => {
                  setNewPassword(event.target.value);
                  setError("");
                }}
              />
              <p className="text-xs text-muted-foreground">At least 8 characters, one number.</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm-new-password">Confirm new password</Label>
              <Input
                id="confirm-new-password"
                name="confirm-new-password"
                type="password"
                autoComplete="new-password"
                disabled={submitting}
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  setError("");
                }}
              />
            </div>

            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={submitting}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={submitting} aria-busy={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin" data-icon="inline-start" />
                    Changing…
                  </>
                ) : (
                  "Change password"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function SettingsPage() {
  const [displayName, setDisplayName] = useState("Aisha Rahman");
  const [email, setEmail] = useState("aisha@example.com");
  const [profileNotice, setProfileNotice] = useState(false);

  const [passwordOpen, setPasswordOpen] = useState(false);

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
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                <KeyRound className="size-4" />
              </span>
              <div>
                <p className="text-sm font-medium">Password</p>
                <p className="text-sm text-muted-foreground">
                  Changing it signs you out on every other device.
                </p>
              </div>
            </div>
            <Button type="button" variant="outline" onClick={() => setPasswordOpen(true)}>
              Change password
            </Button>
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

      <ChangePasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} />

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
