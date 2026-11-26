import { useEffect, useState } from "react";

import { API_BASE_URL, forensicsAPI } from "@/api/forensics";

/**
 * Turn an API image URL into something an <img> can show.
 *
 * The API serves an image only to whoever may see it, which it decides from the
 * sign-in token - and a plain <img src> request cannot send one. So API URLs
 * are fetched with the token and handed to the <img> as an object URL. Any
 * other URL (a local blob: preview, a static asset) is passed through as is.
 *
 * Returns `{ src, failed }`: `src` is null while loading or after a failure.
 */
export function useApiImage(url) {
  const isApi = typeof url === "string" && url.startsWith(API_BASE_URL);
  const [state, setState] = useState({ url: null, src: null, failed: false });

  useEffect(() => {
    if (!isApi) return undefined;

    let cancelled = false;
    let objectUrl = null;

    forensicsAPI
      .fetchImage(url)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setState({ url, src: objectUrl, failed: false });
      })
      .catch(() => {
        if (!cancelled) setState({ url, src: null, failed: true });
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url, isApi]);

  if (!isApi) return { src: url ?? null, failed: false };
  // Ignore a result left over from a previous URL while the new one loads.
  if (state.url !== url) return { src: null, failed: false };
  return { src: state.src, failed: state.failed };
}
