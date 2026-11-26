/**
 * What the browser can say about where a registration came from.
 *
 * Sent with every registration and stored labelled "reported by the browser":
 * it is self-reported, so it adds context, not proof. Location is separate and
 * only ever requested after the user switches "Share my location" on.
 */

/** Device and browser details. Never fails: missing values are left out. */
export function collectDevice() {
  const nav = typeof navigator === "undefined" ? {} : navigator;
  let timezone;
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    timezone = undefined;
  }
  const screen = typeof window !== "undefined" && window.screen
    ? `${window.screen.width}x${window.screen.height}`
    : undefined;

  return {
    user_agent: nav.userAgent,
    platform: nav.userAgentData?.platform ?? nav.platform,
    language: nav.language,
    timezone,
    screen,
  };
}

/**
 * Ask the browser for the current position. Resolves to
 * `{ lat, lon, accuracy_m }`, or rejects with a message a person can read.
 */
export function requestLocation() {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("This browser cannot share a location."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          accuracy_m: position.coords.accuracy,
        }),
      (error) =>
        reject(
          new Error(
            error.code === error.PERMISSION_DENIED
              ? "Location permission was denied, so no location will be saved."
              : "Your location could not be found, so none will be saved.",
          ),
        ),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  });
}
