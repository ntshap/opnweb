import type React from "react"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"

export default function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <DashboardLayout>{children}</DashboardLayout>
    </ProtectedRoute>
  )
}

