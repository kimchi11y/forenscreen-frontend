import { useState } from "react"
import { Link } from "react-router-dom"
import { Eye, EyeOff, Loader2, Fingerprint, Shield, Network, LogIn, IdCard, Lock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function LoginPage() {
  const [badgeId, setBadgeId] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  function handleSubmit(e) {
    e.preventDefault()
    setError("")

    if (!badgeId) {
      setError("Police Badge ID is required.")
      return
    }
    if (!password) {
      setError("Password is required.")
      return
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }

    setIsLoading(true)

    // TODO: Replace with actual auth API call
    setTimeout(() => {
      setIsLoading(false)
      setError("Invalid badge ID or password.")
    }, 1500)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-4 py-8">
      {/* Header with logo and branding */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-lg mb-4">
          <Fingerprint className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">ForenScreen</h1>
        <p className="text-blue-200 text-sm italic">Securing Digital Evidence. Protecting Every Case.</p>
      </div>

      {/* Login Form Card */}
      <Card className="w-full max-w-md bg-white shadow-2xl">
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Badge ID Field */}
            <div className="space-y-2">
              <Label htmlFor="badgeId" className="text-gray-700">Police Badge ID</Label>
              <div className="relative">
                <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="badgeId"
                  type="text"
                  placeholder="Enter identification"
                  value={badgeId}
                  onChange={(e) => setBadgeId(e.target.value)}
                  disabled={isLoading}
                  className="pl-10 h-12"
                  autoFocus
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-gray-700">Password</Label>
                <Link
                  to="/forgot-password"
                  className="text-blue-600 hover:text-blue-700 text-xs underline-offset-4 hover:underline font-medium"
                >
                  Forgot Access?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="pl-10 pr-10 h-12"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <p className="text-red-500 text-sm bg-red-50 p-2 rounded border border-red-200">{error}</p>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-12 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-base"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-5 w-5" />
                  Sign In
                </>
              )}
            </Button>

            {/* Security Notice */}
            <div className="flex items-center justify-center gap-2 text-gray-600 text-xs pt-2 border-t border-gray-100">
              <Shield className="w-4 h-4" />
              <span className="font-medium">AUTHORISED PERSONNEL ONLY. ALL ACCESS IS LOGGED.</span>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Footer Security Indicators */}
      <div className="mt-8 flex flex-col items-center gap-2">
        <div className="flex items-center gap-6 text-blue-200 text-xs">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            <span>AES-256 SECURED</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Network className="w-3.5 h-3.5" />
            <span>IP WHITE-LISTED</span>
          </div>
        </div>
        <p className="text-blue-300/60 text-xs mt-1">v2.4.1</p>
      </div>
    </div>
  )
}

export default LoginPage
