import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Loader2,
  ShieldQuestion,
  XCircle,
} from "lucide-react";

/**
 * The single source of truth for what a `verification_status` means.
 *
 * The backend returns an enum; users should never see it. Every place that
 * renders a verdict - pills, banners, tables, the result page - reads from
 * here, so the wording cannot drift between screens.
 *
 * `tone` selects a colour family from index.css. A verdict is always rendered
 * as icon + text label, never colour alone, so it survives greyscale printing
 * and colour-blind readers.
 */

const TONES = {
  success: {
    pill: "border-success/30 bg-success/10 text-success",
    banner: "border-success/40 bg-success/10",
    icon: "bg-success/15 text-success",
    text: "text-success",
    bar: "bg-success",
  },
  destructive: {
    pill: "border-destructive/30 bg-destructive/10 text-destructive",
    banner: "border-destructive/40 bg-destructive/10",
    icon: "bg-destructive/15 text-destructive",
    text: "text-destructive",
    bar: "bg-destructive",
  },
  warning: {
    pill: "border-warning/40 bg-warning/15 text-warning-foreground",
    banner: "border-warning/45 bg-warning/15",
    icon: "bg-warning/20 text-warning-foreground",
    text: "text-warning-foreground",
    bar: "bg-warning",
  },
  caution: {
    pill: "border-caution/40 bg-caution/15 text-caution",
    banner: "border-caution/45 bg-caution/15",
    icon: "bg-caution/20 text-caution",
    text: "text-caution",
    bar: "bg-caution",
  },
  info: {
    pill: "border-primary/30 bg-primary/10 text-primary",
    banner: "border-primary/35 bg-primary/10",
    icon: "bg-primary/15 text-primary",
    text: "text-primary",
    bar: "bg-primary",
  },
  neutral: {
    pill: "border-border bg-muted text-muted-foreground",
    banner: "border-border bg-muted",
    icon: "bg-muted text-muted-foreground",
    text: "text-muted-foreground",
    bar: "bg-muted-foreground",
  },
};

export const VERDICTS = {
  VERIFIED_AUTHENTIC: {
    label: "Original — unmodified",
    headline: "This is your original",
    tone: "success",
    Icon: CheckCircle2,
    explanation:
      "This file is byte-for-byte identical to the copy you registered. Nothing has changed.",
  },
  TAMPERED_MANIPULATED: {
    label: "Modified copy detected",
    headline: "This is a modified copy",
    tone: "destructive",
    Icon: XCircle,
    explanation:
      "This looks like your registered image, but the file itself has been changed.",
  },
  UNREGISTERED_ASSET: {
    label: "No match found",
    headline: "No match found",
    tone: "warning",
    Icon: AlertTriangle,
    explanation:
      "Nothing in your registry matches this image. Register it now to protect it from here on.",
  },
  AMBIGUOUS_MATCH: {
    label: "Needs confirmation",
    headline: "Which original is this?",
    tone: "caution",
    Icon: HelpCircle,
    explanation:
      "More than one of your registered images matches this one. Pick the right original to finish the check.",
  },
  PROCESSING_ERROR: {
    label: "Could not read file",
    headline: "We could not read that file",
    tone: "neutral",
    Icon: ShieldQuestion,
    explanation:
      "The image could not be decoded. Try exporting it again as PNG or JPEG.",
  },
  UNKNOWN_ASSET: {
    label: "Not checked",
    headline: "Not checked yet",
    tone: "neutral",
    Icon: Loader2,
    explanation: "This file has not been compared against your registry.",
  },
};

const FALLBACK = VERDICTS.UNKNOWN_ASSET;

/** Look up a verdict by the backend's enum, never throwing on an unknown value. */
export function verdict(status) {
  return VERDICTS[status] ?? FALLBACK;
}

/** Colour classes for a tone, with a safe default. */
export function tone(toneName) {
  return TONES[toneName] ?? TONES.neutral;
}

/** True for the verdicts that need the user to do something. */
export function needsAttention(status) {
  return status === "TAMPERED_MANIPULATED" || status === "AMBIGUOUS_MATCH";
}

/**
 * How the match was decided. The backend sets this on `matched_asset` so the
 * UI can be honest about confidence rather than presenting every verdict as
 * equally certain.
 */
export function matchMethod(matched) {
  switch (matched?.match_method) {
    case "sha256_exact":
      return "Exact file match (SHA-256)";
    case "orb_ransac":
      return "Visual match with located differences";
    case "phash_fallback":
      return "Visual match (low-detail image)";
    default:
      return null;
  }
}

/** Structured similarity data, only present when ORB decided the match. */
export function matchConfidence(matched) {
  if (!matched || matched.orb_inliers == null) return null;
  return {
    inliers: matched.orb_inliers,
    ratio: matched.orb_inlier_ratio,
    goodMatches: matched.orb_good_matches,
    phashDistance: matched.phash_distance,
  };
}
