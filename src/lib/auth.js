import { useCallback, useEffect, useState } from "react";
import { createAuthClient } from "@neondatabase/auth";
import { BetterAuthReactAdapter } from "@neondatabase/auth/react/adapters";

/**
 * Neon Managed Auth (Better Auth) client.
 *
 * The adapter is what gives us `useSession`-style behaviour and React state
 * integration; calling an adapter factory is required, so it is invoked rather
 * than passed by reference.
 *
 * `VITE_NEON_AUTH_URL` is the branch's auth URL *including its path*. Neon's
 * `env pull` does not create this alias, so it is set by hand in `.env.local`.
 * The origin must also be a trusted domain or sign-in redirects are rejected -
 * `neon neon-auth domain list` shows what is registered.
 *
 * The app still renders when auth is unconfigured: `authClient` is null, every
 * call throws a clear error, and `useAuth` reports `configured: false` so the
 * UI can say so rather than silently failing.
 */

const authUrl = import.meta.env.VITE_NEON_AUTH_URL;

export const isAuthConfigured = Boolean(authUrl);

export const authClient = isAuthConfigured
  ? createAuthClient(authUrl, { adapter: BetterAuthReactAdapter() })
  : null;

const NOT_CONFIGURED =
  "Authentication is not configured. Set VITE_NEON_AUTH_URL in frontend/.env.local.";

/** Run a client call, turning Better Auth's `{ data, error }` into throw/return. */
async function call(invoke) {
  if (!authClient) throw new Error(NOT_CONFIGURED);
  const { data, error } = await invoke(authClient);
  if (error) {
    throw new Error(error.message || error.statusText || "Authentication request failed.");
  }
  return data;
}

export const signUpWithEmail = ({ email, password, name }) =>
  call((client) => client.signUp.email({ email, password, name }));

export const signInWithEmail = ({ email, password }) =>
  call((client) => client.signIn.email({ email, password }));

export const signOutUser = () => call((client) => client.signOut());

export const fetchSession = () => call((client) => client.getSession());

/**
 * A short-lived JWT (EdDSA, ~15 minutes) for calling the API.
 *
 * The backend verifies this against Neon's JWKS rather than trusting anything
 * the client claims, so an unverified session here buys no access.
 */
export async function fetchToken() {
  const data = await call((client) => client.token());
  return data?.token ?? null;
}

/**
 * Session state for the app.
 *
 * Managed with state and an effect rather than the adapter's `useSession` hook,
 * so the hook can be called unconditionally even when auth is unconfigured -
 * hooks must not be skipped, and the app should still render without auth.
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(isAuthConfigured);

  const refresh = useCallback(async () => {
    if (!isAuthConfigured) {
      setLoading(false);
      return null;
    }
    try {
      const session = await fetchSession();
      setUser(session?.user ?? null);
      return session?.user ?? null;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const signIn = useCallback(async (credentials) => {
    const result = await signInWithEmail(credentials);
    setUser(result?.user ?? null);
    return result;
  }, []);

  const signUp = useCallback(async (details) => {
    const result = await signUpWithEmail(details);
    setUser(result?.user ?? null);
    return result;
  }, []);

  const signOut = useCallback(async () => {
    try {
      await signOutUser();
    } finally {
      setUser(null);
    }
  }, []);

  return { user, loading, configured: isAuthConfigured, signIn, signUp, signOut, refresh };
}
