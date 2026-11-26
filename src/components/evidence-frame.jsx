import { useState } from "react";

import { cn } from "@/lib/utils";

/**
 * An evidence image in a frame, optionally with the difference overlay and the
 * located "altered" rectangles drawn on top.
 *
 * `regions` is what the backend returns from /altered-regions: each entry has
 * x_pct/y_pct/w_pct/h_pct as percentages of the analysed frame. Those
 * percentages are relative to the *image*, so the frame must adopt the image's
 * own aspect ratio - if it kept a fixed ratio, `object-contain` would letterbox
 * the image and every box would be offset from the pixels it points at.
 * The natural size arrives on load, so `aspect` is only the pre-load stand-in.
 */
export default function EvidenceFrame({
  src,
  alt,
  tag,
  overlaySrc,
  regions = [],
  aspect = "3 / 4",
  className,
  imageClassName,
}) {
  const [imageAspect, setImageAspect] = useState(null);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[0.6rem] border border-border bg-muted",
        className,
      )}
      style={{ aspectRatio: imageAspect ?? aspect }}
    >
      {src ? (
        <img
          src={src}
          alt={alt ?? ""}
          className={cn("size-full object-contain", imageClassName)}
          onLoad={(event) => {
            const { naturalWidth, naturalHeight } = event.currentTarget;
            if (naturalWidth && naturalHeight) {
              setImageAspect(`${naturalWidth} / ${naturalHeight}`);
            }
          }}
        />
      ) : (
        <div className="size-full bg-gradient-to-br from-muted to-accent" />
      )}

      {overlaySrc && (
        <img
          src={overlaySrc}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 size-full object-contain"
        />
      )}

      {regions.map((region, index) => (
        <span
          key={index}
          aria-hidden="true"
          className="pointer-events-none absolute rounded-sm border-2 border-destructive bg-destructive/15"
          style={{
            left: `${region.x_pct}%`,
            top: `${region.y_pct}%`,
            width: `${region.w_pct}%`,
            height: `${region.h_pct}%`,
          }}
        />
      ))}

      {tag && (
        <span className="absolute left-2.5 top-2.5 rounded-md bg-foreground/75 px-2 py-[3px] text-[0.6875rem] font-semibold text-background backdrop-blur">
          {tag}
        </span>
      )}
    </div>
  );
}
