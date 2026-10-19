import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from "path"

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // '' loads every variable, not just the VITE_-prefixed ones, because the
  // proxy target is server-side config and should not be exposed to the client.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve("./src"),
      },
    },
    server: env.NEON_AUTH_UPSTREAM
      ? {
          proxy: {
            // Neon Auth is served from a different host than the app, which
            // makes its session cookie third-party - and browsers block those
            // by default, so the SPA signs in and is immediately signed out
            // again. Proxying it under our own origin makes the cookie
            // first-party. Auth is then reached at a relative
            // VITE_NEON_AUTH_URL=/api/auth.
            '/api/auth': {
              target: env.NEON_AUTH_UPSTREAM,
              changeOrigin: true,
              secure: true,
              rewrite: (requestPath) => requestPath.replace(/^\/api\/auth/, ''),
            },
          },
        }
      : undefined,
  }
})
