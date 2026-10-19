import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowRight, Check, Hash, Loader2, MailCheck, ShieldCheck, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { fetchSession, useAuth } from "@/lib/auth"
import { cn } from "@/lib/utils"

const STRENGTH_LABELS = ["", "Weak", "Good", "Strong"]

/**
 * Length plus character variety, deliberately blunt: someone typing their first
 * password should get a useful nudge, not a lecture.
 */
function strengthOf(password) {
  if (!password) return 0
  const variety = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) => re.test(password)).length
  let level = 1
  if (password.length >= 8 && /\d/.test(password)) level = 2
  if (level === 2 && password.length >= 10 && variety >= 3) level = 3
  return level
}

function Field({ id, label, hint, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-[0.8125rem]">
        {label}
      </Label>
      {children}
      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  )
}

function SignupPage() {
  const navigate = useNavigate()
  const { configured, signUp } = useAuth()

  const [displayName, setDisplayName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [pendingEmail, setPendingEmail] = useState("")

  const level = strengthOf(password)
  const mismatch = confirmPassword.length > 0 && confirmPassword !== password

  async function handleSubmit(event) {
    event.preventDefault()
    if (submitting) return

    const address = email.trim()
    const problem =
      !displayName.trim()
        ? "Add a display name — it appears on the evidence you register."
        : !/^\S+@\S+\.\S+$/.test(address)
          ? "Enter a valid email address."
          : password.length < 8
            ? "Use at least 8 characters for your password."
            : !/\d/.test(password)
              ? "Add at least one number to your password."
              : confirmPassword !== password
                ? "Those passwords don't match."
                : !agreed
                  ? "Please accept the Terms of Service and Privacy Policy."
                  : ""

    setError(problem)
    if (problem) return

    setSubmitting(true)
    try {
      const result = await signUp({ email: address, password, name: displayName.trim() })

      // Managed Auth returns a token when it signs the user straight in. When
      // email verification is required there is no session yet, so the session
      // is checked as well rather than treating "no token" as a failure.
      if (result?.token || result?.session) {
        navigate("/dashboard", { replace: true })
        return
      }

      let session = null
      try {
        session = await fetchSession()
      } catch {
        // Session probes are best-effort; signup itself already succeeded.
      }
      if (session?.user) {
        navigate("/dashboard", { replace: true })
        return
      }

      setPendingEmail(address)
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : "We couldn't create your account. Please try again.",
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-5 py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 46% at 50% -6%, color-mix(in oklab, var(--primary) 9%, transparent), transparent 70%), radial-gradient(40% 34% at 92% 104%, color-mix(in oklab, var(--primary) 5%, transparent), transparent 70%)",
        }}
      />

      <div className="relative w-full max-w-[440px]">
        <Link
          to="/"
          aria-label="ForenScreen home"
          className="mb-6 flex items-center justify-center gap-[11px]"
        >
          <span className="grid size-[34px] place-items-center rounded-[10px] bg-primary text-primary-foreground shadow-md">
            <ShieldCheck className="size-[18px]" />
          </span>
          <span className="text-[1.0625rem] font-semibold tracking-tight">ForenScreen</span>
        </Link>

        <Card className="gap-0 shadow-sm [--card-spacing:1.75rem]">
          {pendingEmail ? (
            <div className="flex flex-col gap-4">
              <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <MailCheck className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Check your email</h1>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  We sent a verification link to{" "}
                  <span className="font-medium break-all text-foreground">{pendingEmail}</span>. Open it to
                  verify your address and finish setting up your account.
                </p>
              </div>
              <p className="rounded-lg border border-border bg-muted/40 px-3.5 py-2.5 text-xs leading-relaxed text-muted-foreground">
                We use a shared sender in development, so this email may land in spam — check there if it
                hasn&apos;t arrived in a minute.
              </p>
              <Button asChild variant="outline" size="lg" className="h-10 w-full">
                <Link to="/login">Back to sign in</Link>
              </Button>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
              <p className="mt-1.5 text-sm text-muted-foreground">Free for individuals. No card required.</p>

              {!configured ? (
                <div
                  role="alert"
                  className="mt-[22px] flex flex-col gap-1.5 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3.5 text-sm"
                >
                  <p className="font-medium text-destructive">Authentication isn&apos;t configured</p>
                  <p className="text-muted-foreground">
                    This build is missing{" "}
                    <code className="font-mono text-xs text-foreground">VITE_NEON_AUTH_URL</code>. Set it in{" "}
                    <code className="font-mono text-xs text-foreground">frontend/.env.local</code> and restart
                    the dev server to enable account creation.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="mt-[22px] flex flex-col gap-[18px]">
            <Field id="display-name" label="Display name" hint="This is what appears on evidence you register.">
              <Input
                id="display-name"
                name="display-name"
                type="text"
                autoComplete="name"
                placeholder="Aisyah Rahman"
                disabled={submitting}
                value={displayName}
                onChange={(event) => {
                  setDisplayName(event.target.value)
                  setError("")
                }}
                className="h-[38px]"
              />
            </Field>

            <Field id="email" label="Email">
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                disabled={submitting}
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value)
                  setError("")
                }}
                className="h-[38px]"
              />
            </Field>

            <Field id="password" label="Password" hint="At least 8 characters, one number.">
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                disabled={submitting}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value)
                  setError("")
                }}
                className="h-[38px]"
              />
              {password.length > 0 && (
                <div
                  role="group"
                  aria-label={`Password strength: ${STRENGTH_LABELS[level]}`}
                  className="flex items-center gap-2.5"
                >
                  <div className="flex flex-1 gap-1" aria-hidden="true">
                    {[0, 1, 2].map((bar) => (
                      <span
                        key={bar}
                        className={cn("h-1.5 flex-1 rounded-full", bar < level ? "bg-success" : "bg-muted")}
                      />
                    ))}
                  </div>
                  <span aria-live="polite" className="text-xs font-medium text-muted-foreground">
                    {STRENGTH_LABELS[level]}
                  </span>
                </div>
              )}
            </Field>

            <Field
              id="confirm-password"
              label="Confirm password"
              error={mismatch ? "Those passwords don't match." : ""}
            >
              <Input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                placeholder="Re-enter your password"
                disabled={submitting}
                value={confirmPassword}
                aria-invalid={mismatch || undefined}
                onChange={(event) => {
                  setConfirmPassword(event.target.value)
                  setError("")
                }}
                className="h-[38px]"
              />
            </Field>

            <div className="flex items-start gap-2.5 pt-0.5">
              <Checkbox
                id="terms"
                checked={agreed}
                disabled={submitting}
                onCheckedChange={(checked) => {
                  setAgreed(checked === true)
                  setError("")
                }}
                className="mt-0.5 after:hidden"
              />
              <Label
                htmlFor="terms"
                className="items-start text-[0.8125rem] leading-relaxed font-normal text-muted-foreground"
              >
                <span>
                  I agree to the{" "}
                  <a href="#" className="font-medium text-primary underline underline-offset-2 hover:text-primary/80">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="#" className="font-medium text-primary underline underline-offset-2 hover:text-primary/80">
                    Privacy Policy
                  </a>
                </span>
              </Label>
            </div>

            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              disabled={submitting}
              aria-busy={submitting}
              className="h-10 w-full gap-2 text-[0.9375rem]"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Creating account…
                </>
              ) : (
                <>
                  Create account
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
                </form>
              )}
            </>
          )}
        </Card>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline hover:underline-offset-2">
            Sign in
          </Link>
        </p>

        <ul className="mt-7 flex flex-wrap items-center justify-center gap-x-[18px] gap-y-2 text-xs text-muted-foreground">
          <li className="flex items-center gap-1.5 whitespace-nowrap">
            <Check aria-hidden="true" className="size-3.5 shrink-0" />
            Free for individuals
          </li>
          <li className="flex items-center gap-1.5 whitespace-nowrap">
            <Trash2 aria-hidden="true" className="size-3.5 shrink-0" />
            Delete your data any time
          </li>
          <li className="flex items-center gap-1.5 whitespace-nowrap">
            <Hash aria-hidden="true" className="size-3.5 shrink-0" />
            SHA-256 fingerprints
          </li>
        </ul>

        <p className="mt-8 text-center text-[0.6875rem] text-muted-foreground">
          © 2026 ForenScreen · Made for people, not platforms.
        </p>
      </div>
    </div>
  )
}

export default SignupPage
