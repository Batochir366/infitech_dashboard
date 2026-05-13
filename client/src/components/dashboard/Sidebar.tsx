import { Link, useLocation, useNavigate } from "react-router-dom"
import {
  Users,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Server,
  Monitor,
} from "lucide-react"
import { cn } from "../../utils/cn"
import { Button } from "../ui/Button"
import { useToast } from "../../context/ToastContext"

interface SidebarProps {
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
}

const navItems = [
  { icon: Users, label: "Харилцагчид", href: "/clients" },
  { icon: Monitor, label: "Системүүд", href: "/systems" },
  { icon: Server, label: "Модулиуд", href: "/modules" },
]

export function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const toast = useToast()
  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen transition-all duration-300 border-r bg-card",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center justify-between px-4">
          {!collapsed && (
            <img src="/logo_black.png" alt="logo" className="w-auto h-6 sm:h-8" />
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </Button>
        </div>

        <nav className="flex-1 space-y-1 px-2 py-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  collapsed && "justify-center px-2"
                )}
              >
                <item.icon size={20} className={cn(!collapsed && "mr-3")} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        <div className="border-t p-4">
          <Button
            onClick={() => {
              localStorage.removeItem("auth_token")
              toast.success("Bye bye!")
              navigate("/auth/login")
            }}
            variant="ghost"
            className={cn(
              "w-full justify-start text-muted-foreground hover:text-destructive",
              collapsed && "justify-center px-2"
            )}
          >
            <LogOut size={20} className={cn(!collapsed && "mr-3")} />
            {!collapsed && <span>Системээс гарах</span>}
          </Button>
        </div>
      </div>
    </aside>
  )
}
