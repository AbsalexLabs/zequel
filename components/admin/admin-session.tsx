"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import type { AdminRole } from "@/lib/admin-dashboard/types"

interface AdminSession {
  name: string
  email: string
  role: AdminRole
}

interface AdminSessionContextValue {
  session: AdminSession
  setRole: (role: AdminRole) => void
}

const DEFAULT_SESSION: AdminSession = {
  name: "Dr. Elena Royce",
  email: "elena.royce@lab.org",
  role: "superadmin",
}

const AdminSessionContext = createContext<AdminSessionContextValue | null>(null)

export function AdminSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AdminSession>(DEFAULT_SESSION)

  // Role switcher is a front-end-only affordance for previewing RBAC.
  // In production this comes from the authenticated admin session.
  const setRole = useCallback((role: AdminRole) => {
    setSession((prev) => ({
      ...prev,
      role,
      name: role === "superadmin" ? "Dr. Elena Royce" : "Marcus Vaughn",
      email: role === "superadmin" ? "elena.royce@lab.org" : "marcus.vaughn@lab.org",
    }))
  }, [])

  return (
    <AdminSessionContext.Provider value={{ session, setRole }}>{children}</AdminSessionContext.Provider>
  )
}

export function useAdminSession(): AdminSessionContextValue {
  const ctx = useContext(AdminSessionContext)
  if (!ctx) throw new Error("useAdminSession must be used within AdminSessionProvider")
  return ctx
}
