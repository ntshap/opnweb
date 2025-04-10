"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface SummaryCardProps {
  title: string
  value: string | number
  description?: string
  trend?: {
    value: number
    isPositive: boolean
  }
}

export function SummaryCard({ title, value, description, trend }: SummaryCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
        {trend && (
          <div className={`text-xs mt-1 ${trend.isPositive ? "text-green-600" : "text-red-600"}`}>
            {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
          </div>
        )}
      </CardContent>
    </Card>
  )
}

