import { useEffect, useState } from "react"
import { Outlet } from "react-router-dom"
import { Sidebar } from "../components/dashboard/Sidebar"

import { cn } from "../utils/cn"

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const mnMonths = [
    "1-р сар", "2-р сар", "3-р сар", "4-р сар",
    "5-р сар", "6-р сар", "7-р сар", "8-р сар",
    "9-р сар", "10-р сар", "11-р сар", "12-р сар",
  ]
  const pad = (n: number) => String(n).padStart(2, "0")

  const formattedDate = `${now.getFullYear()} оны ${mnMonths[now.getMonth()]}ын ${now.getDate()}`
  const formattedTime = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div
        className={cn(
          "transition-all duration-300",
          collapsed ? "pl-16" : "pl-64"
        )}
      >
        <header className="flex items-center justify-end px-4 md:px-6 lg:px-8 pt-4">
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">{formattedDate}</span>
            <span className="mx-2">·</span>
            <span>{formattedTime}</span>
          </div>
        </header>

        <main className="px-4 md:px-6 lg:px-8 pb-4">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
