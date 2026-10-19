import { useState } from "react";
import { FolderOpen, Info, Plus } from "lucide-react";

import { PageHeader } from "@/components/app-shell";
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

export default function CasesPage() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [notice, setNotice] = useState(null);

  function resetForm() {
    setTitle("");
    setSummary("");
    setNotice(null);
  }

  function handleOpenChange(next) {
    setOpen(next);
    if (!next) resetForm();
  }

  function handleSubmit(event) {
    event.preventDefault();
    // No cases API exists yet: be explicit rather than pretend it saved.
    setNotice("Case storage isn't connected yet. Your case was not saved.");
  }

  return (
    <>
      <PageHeader
        title="Cases"
        description="Keep one incident's evidence together."
      >
        <Button type="button" onClick={() => setOpen(true)}>
          <Plus data-icon="inline-start" />
          New case
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="flex flex-col items-center gap-4 px-6 py-16 text-center">
          <span className="grid size-11 place-items-center rounded-xl bg-muted text-muted-foreground">
            <FolderOpen className="size-5" />
          </span>
          <div className="space-y-1.5">
            <h2 className="text-base font-medium">No cases yet</h2>
            <p className="mx-auto max-w-md text-sm text-muted-foreground">
              A case groups related evidence from a single incident — the
              screenshots, replies and direct messages that belong together — so
              you can check them as one story instead of one file at a time.
            </p>
          </div>
          <Button type="button" onClick={() => setOpen(true)}>
            <Plus data-icon="inline-start" />
            Create a case
          </Button>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New case</DialogTitle>
            <DialogDescription>
              Give the incident a name you'll recognise later.
            </DialogDescription>
          </DialogHeader>

          <form className="grid gap-4" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="case-title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="case-title"
                name="title"
                required
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Instagram comments, March"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="case-summary">Summary</Label>
              <textarea
                id="case-summary"
                name="summary"
                rows={3}
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
                placeholder="Optional — what happened, and where."
                className="w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>

            {notice && (
              <p
                role="status"
                className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/15 px-2.5 py-2 text-sm text-warning-foreground"
              >
                <Info className="mt-0.5 size-4 shrink-0" />
                {notice}
              </p>
            )}

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={!title.trim()}>
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
