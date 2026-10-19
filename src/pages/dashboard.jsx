import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Images,
  Scale,
  Search,
  Upload,
} from "lucide-react";

import { forensicsAPI } from "@/api/forensics";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const QUICK_ACTIONS = [
  {
    to: "/assets",
    Icon: Upload,
    title: "Register an original",
    description: "Save a fingerprint before you post, so later copies trace back to you.",
  },
  {
    to: "/analyze",
    Icon: Scale,
    title: "Analyze evidence",
    description: "Compare a suspicious screenshot against the originals you registered.",
  },
  {
    to: "/check",
    Icon: Search,
    title: "Public check",
    description: "Share a link anyone can verify — no account needed.",
  },
];

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** 32px thumbnail, falling back to a gradient tile when the image won't load. */
function AssetThumb({ assetId }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        aria-hidden="true"
        className="size-8 shrink-0 rounded-lg bg-gradient-to-br from-primary/25 to-primary/5 ring-1 ring-border"
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

function StatCard({ label, value, foot }) {
  return (
    <Card size="sm" className="gap-1">
      <CardContent>
        <div className="text-[0.8125rem] text-muted-foreground">{label}</div>
        <div className="mt-1.5 text-2xl font-semibold tabular-nums">{value}</div>
        <div className="mt-1 text-xs text-muted-foreground">{foot}</div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [assets, setAssets] = useState([]);
  const [total, setTotal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await forensicsAPI.listAssets({ limit: 5, offset: 0 });
        if (cancelled) return;
        setAssets(data?.assets ?? []);
        setTotal(data?.total ?? 0);
      } catch (err) {
        if (cancelled) return;
        setError(err?.message || "Could not load your registry.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const isEmpty = !loading && !error && total === 0;

  return (
    <div>
      <PageHeader title="Overview" description="Your registry and recent activity.">
        <Button asChild>
          <Link to="/assets">
            <Upload />
            Register an original
          </Link>
        </Button>
      </PageHeader>

      <div className="flex flex-col gap-6">
        {/* ------------------------------- stats ------------------------------- */}
        <section
          aria-label="Registry summary"
          className="grid grid-cols-2 gap-4 lg:grid-cols-4"
        >
          <StatCard
            label="Registered originals"
            value={
              loading ? (
                <Skeleton className="h-7 w-14" />
              ) : error ? (
                "—"
              ) : (
                total
              )
            }
            foot={error ? "Could not load" : "In your registry"}
          />
          <StatCard label="Checks run" value="—" foot="Coming soon" />
          <StatCard label="Modified detected" value="—" foot="Coming soon" />
          <StatCard label="Open cases" value="—" foot="Coming soon" />
        </section>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        {/* ----------------------------- registry ----------------------------- */}
        <Card className="overflow-hidden">
          <CardHeader className="border-b">
            <CardTitle>Registered originals</CardTitle>
            <CardAction>
              <Button asChild variant="outline" size="sm">
                <Link to="/assets">View all</Link>
              </Button>
            </CardAction>
          </CardHeader>

          {isEmpty ? (
            <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
              <span className="grid size-11 place-items-center rounded-xl bg-muted text-muted-foreground">
                <Images className="size-5" />
              </span>
              <div>
                <p className="text-sm font-medium">No originals registered yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Register an image to create its fingerprint.
                </p>
              </div>
              <Button asChild className="mt-1">
                <Link to="/assets">Register your first original</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4">File</TableHead>
                  <TableHead className="px-4">Perceptual hash</TableHead>
                  <TableHead className="px-4">Cryptographic hash</TableHead>
                  <TableHead className="px-4">Registered</TableHead>
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
                        <Skeleton className="h-4 w-28" />
                      </TableCell>
                      <TableCell className="px-4">
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell className="px-4">
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                    </TableRow>
                  ))}

                {!loading && assets.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="px-4 py-10 text-center text-muted-foreground"
                    >
                      {error ? "Your originals could not be loaded." : "Nothing to show yet."}
                    </TableCell>
                  </TableRow>
                )}

                {!loading &&
                  assets.map((asset) => (
                    <TableRow key={asset.id}>
                      <TableCell className="px-4">
                        <div className="flex items-center gap-3">
                          <AssetThumb assetId={asset.id} />
                          <span className="max-w-[240px] truncate font-medium">
                            {asset.file_name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4">
                        <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.6875rem] text-muted-foreground">
                          {asset.phash || "—"}
                        </code>
                      </TableCell>
                      <TableCell className="px-4">
                        <span className="font-mono text-[0.6875rem] text-muted-foreground">
                          {asset.sha256 ? `${asset.sha256.slice(0, 16)}…` : "—"}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 text-muted-foreground tabular-nums">
                        {formatDate(asset.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </Card>

        {/* --------------------------- quick actions --------------------------- */}
        <section aria-labelledby="quick-actions-title">
          <h2 id="quick-actions-title" className="mb-3 text-base font-medium">
            Quick actions
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {QUICK_ACTIONS.map(({ to, Icon, title, description }) => (
              <Link
                key={to}
                to={to}
                className="group/qc rounded-xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
              >
                <Card className="h-full transition-all duration-150 group-hover/qc:-translate-y-0.5 group-hover/qc:shadow-md">
                  <CardContent className="flex flex-col">
                    <span className="mb-2.5 grid size-9 place-items-center rounded-[10px] bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </span>
                    <span className="text-sm font-medium">{title}</span>
                    <span className="mt-1 text-xs text-muted-foreground">
                      {description}
                    </span>
                    <span className="mt-3.5 flex justify-end text-muted-foreground group-hover/qc:text-primary">
                      <ArrowRight className="size-4 transition-transform duration-150 group-hover/qc:translate-x-1" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
