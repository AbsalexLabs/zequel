"use client"

import { createContext, useContext, type ReactNode } from "react"
import type { AdminRole } from "@/lib/admin-dashboard/types"

export interface AdminSession {
  id: string
  name: string
  email: string
  role: AdminRole
}

interface AdminSessionContextValue {
  session: AdminSession
}

const AdminSessionContext = createContext<AdminSessionContextValue | null>(null)

export function AdminSessionProvider({
  session,
  children,
}: {
  session: AdminSession
  children: ReactNode
}) {
  return <AdminSessionContext.Provider value={{ session }}>{children}</AdminSessionContext.Provider>
}

export function useAdminSession(): AdminSessionContextValue {
  const ctx = useContext(AdminSessionContext)
  if (!ctx) throw new Error("useAdminSession must be used within AdminSessionProvider")
  return ctx
}
