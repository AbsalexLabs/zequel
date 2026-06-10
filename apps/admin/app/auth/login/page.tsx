"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@zequel/shared/supabase/client"
import { ZequelLogo } from "@zequel/ui/components/zequel-logo"
import { Input } from "@zequel/ui/components/input"
import { Button } from "@zequel/ui/components/button"

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) throw signInError

      // Verify the signed-in user actually has admin privileges before
      // sending them into the dashboard — otherwise the dashboard layout
      // would redirect straight back here and create a loop.
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single()

      if (!profile || (profile.role !== "admin" && profile.role !== "superadmin")) {
        await supabase.auth.signOut()
        setError("Access denied. This account does not have admin privileges.")
        return
      }

      router.replace("/")
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to sign in")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <ZequelLogo />
          <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Control Center
          </p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="h-10 rounded-md border-border bg-background font-sans text-sm text-foreground placeholder:text-muted-foreground/40"
              autoComplete="email"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-10 rounded-md border-border bg-background font-sans text-sm text-foreground placeholder:text-muted-foreground/40"
              autoComplete="current-password"
            />
          </div>
          {error && <p className="font-mono text-[11px] text-destructive">{error}</p>}
          <Button
            type="submit"
            disabled={isLoading}
            className="mt-2 h-10 w-full rounded-md bg-foreground font-mono text-xs uppercase tracking-wider text-background hover:bg-foreground/90"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="mt-12 text-center">
          <span className="font-mono text-[10px] tracking-wider text-muted-foreground/40">Absalex Labs</span>
        </div>
      </div>
    </div>
  )
}
