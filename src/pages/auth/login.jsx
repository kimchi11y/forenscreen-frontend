import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Eye, EyeOff, Loader2, Lock, ShieldCheck, TriangleAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/lib/auth"

function LoginPage() {
  const navigate = useNavigate()
  const { user, loading, configured, signIn } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [keepSignedIn, setKeepSignedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  // Someone who already has a session has no business on the login screen.
  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard", { replace: true })
    }
  }, [loading, user, navigate])

  async function handleSubmit(event) {
    event.preventDefault()
    setError("")

    if (!email.trim()) {
      setError("Enter the email address you registered with.")
      return
    }
    if (!password) {
      setError("Enter your password.")
      return
    }
    if (password.length < 6) {
      setError("Your password must be at least 6 characters.")
      return
    }

    setIsLoading(true)
    try {
      await signIn({ email: email.trim(), password })
      navigate("/dashboard", { replace: true })
    } catch (signInError) {
      setError(
        signInError?.message || "We couldn't sign you in. Please try again."
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-10 [background-image:radial-gradient(70%_55%_at_50%_-5%,color-mix(in_oklab,var(--primary)_8%,transparent),transparent_72%)]">
      <div className="w-full max-w-[420px]">
        <header className="mb-6 flex flex-col items-center gap-3 text-center">
          <div
            className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground"
            aria-hidden="true"
          >
            <ShieldCheck className="size-[22px]" />
          </div>
          <div>
            <p className="text-[1.0625rem] font-semibold tracking-tight">ForenScreen</p>
            <p className="text-xs text-muted-foreground">Digital evidence integrity</p>
          </div>
        </header>

        <Card className="gap-5 p-7 shadow-sm">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
            <p className="mt-1 text-sm text-muted-foreground">Sign in to your evidence registry.</p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center" role="status">
              <Loader2 className="size-5 animate-spin text-muted-foreground" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">Checking your session…</p>
            </div>
          ) : !configured ? (
            <div
              role="alert"
              className="flex flex-col gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-4"
            >
              <p className="flex items-center gap-2 text-sm font-medium text-destructive">
                <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
                Authentication is not configured
              </p>
              <p className="text-sm text-muted-foreground">
                Sign-in is unavailable until{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">VITE_NEON_AUTH_URL</code> is
                set in <code className="rounded bg-muted px-1 py-0.5 text-xs">frontend/.env.local</code>,
                then the dev server is restarted.
              </p>
            </div>
          ) : (
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email" className="text-[0.8125rem]">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                name="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={isLoading}
                aria-describedby={error ? "login-error" : undefined}
                className="h-10"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-[0.8125rem]">
                  Password
                </Label>
                <button
                  type="button"
                  aria-disabled="true"
                  title="Password reset isn't available yet — contact support to reset your password."
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Forgot password?
                  <span className="sr-only"> (password reset isn't available yet)</span>
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={isLoading}
                  aria-describedby={error ? "login-error" : undefined}
                  className="h-10 pr-11"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute top-1/2 right-1.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2.5">
                <Checkbox
                  id="keep-signed-in"
                  name="keep-signed-in"
                  checked={keepSignedIn}
                  onCheckedChange={(checked) => setKeepSignedIn(checked === true)}
                  disabled={isLoading}
                />
                <Label htmlFor="keep-signed-in" className="text-[0.8125rem] font-normal">
                  Keep me signed in on this device
                </Label>
              </div>
              <p className="pl-[26px] text-xs text-muted-foreground">
                Recommended only on a phone or laptop you own.
              </p>
            </div>

            {error ? (
              <p id="login-error" role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}

            <Button type="submit" size="lg" disabled={isLoading} className="h-11 w-full">
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" aria-hidden="true" />
                  Signing in…
                </>
              ) : (
                <>
                  <Lock aria-hidden="true" />
                  Sign in
                </>
              )}
            </Button>

            <div className="relative flex items-center" role="separator" aria-label="or">
              <Separator />
              <span className="absolute left-1/2 -translate-x-1/2 bg-card px-2.5 text-xs text-muted-foreground">
                or
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="lg"
                disabled
                className="h-11 w-full"
                title="Not connected yet"
              >
                <svg viewBox="0 0 18 18" className="size-[18px]" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
                  />
                  <path
                    fill="#34A853"
                    d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.34A9 9 0 0 0 9 18z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.94H.96a9 9 0 0 0 0 8.12l3.01-2.34z"
                  />
                  <path
                    fill="#EA4335"
                    d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.94l3.01 2.34C4.68 5.16 6.66 3.58 9 3.58z"
                  />
                </svg>
                Continue with Google
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Not connected yet — Google sign-in is coming soon.
              </p>
            </div>
          </form>
          )}
        </Card>

        <p className="mt-5 text-center text-[0.8125rem]">
          New to ForenScreen?{" "}
          <Link to="/signup" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </p>

        <div className="mt-5 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
          <Lock className="size-3.5 shrink-0" aria-hidden="true" />
          <span>Your images are never shared. Fingerprints are computed on our servers.</span>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
