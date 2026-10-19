import { Link } from "react-router-dom";
import {
  ArrowRight,
  Camera,
  Eye,
  Fingerprint,
  FolderOpen,
  Hash,
  Image as ImageIcon,
  Lock,
  ScanSearch,
  ShieldCheck,
  Upload,
} from "lucide-react";

import VerdictBanner, { VerdictPill } from "@/components/verdict-banner";
import EvidenceFrame from "@/components/evidence-frame";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const TRUST = [
  { Icon: Lock, label: "No account needed to check" },
  { Icon: Hash, label: "SHA-256 fingerprints" },
  { Icon: ShieldCheck, label: "Free for individuals" },
];

const STEPS = [
  {
    number: "01",
    Icon: Upload,
    title: "Save your original",
    body: "Add the image to your registry while the file is still on your phone or laptop. It takes a few seconds and stays private to your account.",
  },
  {
    number: "02",
    Icon: Fingerprint,
    title: "We fingerprint it",
    body: "ForenScreen stores an exact SHA-256 hash plus a perceptual sketch, so byte-identical files and images that merely look the same can both be compared later.",
  },
  {
    number: "03",
    Icon: ScanSearch,
    title: "Check any later copy",
    body: "Upload the suspect image whenever it turns up. You get one plain-language verdict and the area of the picture that changed — nothing to decode.",
  },
];

const VERDICT_ROWS = [
  {
    status: "VERIFIED_AUTHENTIC",
    text: "The file matches your registered original exactly, so nothing has been cropped, re-encoded or retouched.",
  },
  {
    status: "TAMPERED_MANIPULATED",
    text: "It is the same picture, but the file has changed — expect edits, filters, crops or text added on top.",
  },
  {
    status: "UNREGISTERED_ASSET",
    text: "Nothing in your registry resembles this image closely enough for ForenScreen to make a claim either way.",
  },
  {
    status: "AMBIGUOUS_MATCH",
    text: "The match is close but not conclusive, so ForenScreen asks you to look at it yourself before you rely on it.",
  },
];

const BUILT_FOR = [
  {
    Icon: Camera,
    title: "Screenshots welcome",
    body: "ForenScreen works on the images you already have. There is no special capture app to install and nothing to take before the fact.",
  },
  {
    Icon: FolderOpen,
    title: "Group evidence into cases",
    body: "Keep every file from one incident together in a named case, so the story stays in order when you need to look back at it.",
  },
  {
    Icon: Eye,
    title: "Plain-language results",
    body: "Every result is a sentence you can read out loud, not a forensic score you have to interpret first.",
  },
];

function Container({ className, children }) {
  return (
    <div className={cn("mx-auto w-full max-w-[1200px] px-5 lg:px-6", className)}>{children}</div>
  );
}

function SectionHeading({ title, children }) {
  return (
    <div className="mb-8 max-w-[56ch]">
      <h2 className="text-2xl tracking-tight sm:text-[1.75rem]">{title}</h2>
      <p className="mt-2 text-[0.9375rem] text-muted-foreground">{children}</p>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div>
      {/* Hero */}
      <Container className="grid gap-12 py-14 lg:grid-cols-2 lg:items-center lg:gap-14 lg:py-16">
        <div className="max-w-[560px]">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
            <ShieldCheck className="size-3.5" />
            For creators and individuals
          </span>

          <h1 className="mt-5 text-[2.1rem] font-semibold leading-[1.07] tracking-tight sm:text-[2.6rem] lg:text-[3rem]">
            Prove what you posted was never edited.
          </h1>

          <p className="mt-5 text-[1.0625rem] leading-relaxed text-muted-foreground">
            Save a fingerprint of your image today, while the original is still on your device. Weeks
            or months later, when a copy turns up somewhere you never posted it, upload that file and
            ForenScreen tells you whether anything in it was changed.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="h-11 px-5 text-[0.9375rem]">
              <Link to="/signup">
                Save an original
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-11 gap-2 border-border px-5 text-[0.9375rem]"
            >
              <Link to="/check">
                <ScanSearch className="size-4" />
                Check an image free
              </Link>
            </Button>
          </div>

          <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2.5">
            {TRUST.map(({ Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-1.5 text-[0.8125rem] text-muted-foreground"
              >
                <Icon className="size-3.5" />
                {label}
              </li>
            ))}
          </ul>
        </div>

        {/* Illustrative check result */}
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <ImageIcon className="size-4 text-muted-foreground" />
              Check result
            </CardTitle>
            <span className="text-xs text-muted-foreground">12 Aug 2026</span>
          </CardHeader>

          <CardContent>
            <div className="grid gap-4 sm:grid-cols-[176px_1fr] sm:items-start">
              <div className="relative">
                <EvidenceFrame tag="Altered region" />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute rounded-sm border-2 border-destructive bg-destructive/10"
                  style={{ left: "18%", top: "26%", width: "64%", height: "46%" }}
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute rounded-sm border-2 border-destructive bg-destructive/10"
                  style={{ left: "8%", top: "64%", width: "34%", height: "20%" }}
                />
              </div>

              <div className="flex min-w-0 flex-col gap-4">
                <VerdictBanner
                  status="TAMPERED_MANIPULATED"
                  description="Same image, different file. The highlighted area is where it differs."
                />

                <dl className="flex flex-col gap-2.5 text-[0.8125rem]">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground">File</dt>
                    <dd className="truncate font-medium">post-2026-08-04.png</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground">Registered</dt>
                    <dd className="font-medium">4 Aug 2026</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground">Perceptual hash</dt>
                    <dd className="truncate font-mono text-xs">9e2f619ec42396c5</dd>
                  </div>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>
      </Container>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-20 bg-muted py-14 sm:py-20">
        <Container>
          <SectionHeading title="How it works">
            Three steps: one when you still have the original, one that runs automatically, one
            whenever you need an answer.
          </SectionHeading>

          <div className="grid gap-4 md:grid-cols-3">
            {STEPS.map(({ number, Icon, title, body }) => (
              <Card key={number} className="p-5">
                <div className="flex items-start justify-between">
                  <span className="grid size-10 place-items-center rounded-[11px] bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </span>
                  <span className="text-[0.8125rem] font-semibold tracking-[0.08em] text-muted-foreground tabular-nums">
                    {number}
                  </span>
                </div>
                <h3 className="mt-4 font-medium">{title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* What the verdicts mean */}
      <section id="verdicts" className="scroll-mt-20 py-14 sm:py-20">
        <Container>
          <SectionHeading title="What the verdicts mean">
            Four outcomes, stated in words rather than scores.
          </SectionHeading>

          <Card className="gap-0 py-2">
            <ul className="px-5">
              {VERDICT_ROWS.map((row) => (
                <li
                  key={row.status}
                  className="grid gap-2 border-b border-border py-4 last:border-b-0 sm:grid-cols-[250px_1fr] sm:items-center sm:gap-5"
                >
                  <VerdictPill status={row.status} className="justify-self-start" />
                  <p className="text-sm text-muted-foreground">{row.text}</p>
                </li>
              ))}
            </ul>
          </Card>
        </Container>
      </section>

      {/* Built for what actually happens online */}
      <section className="bg-muted py-14 sm:py-20">
        <Container>
          <SectionHeading title="Built for what actually happens online">
            No evidence kit required — just the files an incident leaves behind.
          </SectionHeading>

          <div className="grid gap-8 md:grid-cols-3">
            {BUILT_FOR.map(({ Icon, title, body }) => (
              <div key={title}>
                <Icon className="size-5 text-primary" />
                <h3 className="mt-3 font-medium">{title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Final CTA */}
      <Container className="py-14 sm:py-20">
        <Card className="items-center gap-5 px-6 py-14 text-center">
          <h2 className="text-2xl tracking-tight sm:text-[1.75rem]">Save it before it spreads.</h2>
          <p className="max-w-[52ch] text-[0.9375rem] text-muted-foreground">
            Register an image while the original is still in your hands — afterwards it is not
            possible to prove that you held it first.
          </p>
          <Button asChild size="lg" className="h-11 px-5 text-[0.9375rem]">
            <Link to="/signup">
              Create a free account
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </Card>
      </Container>
    </div>
  );
}
