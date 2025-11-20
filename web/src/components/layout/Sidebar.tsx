import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Server, 
  Terminal as TerminalIcon, 
  Settings 
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'

interface SidebarProps {
  collapsed?: boolean
}

export function Sidebar({ collapsed = false }: SidebarProps) {
  const location = useLocation()
  
  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/runners', icon: Server, label: 'Runners' },
    { path: '/terminal', icon: TerminalIcon, label: 'Terminal' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ]

  return (
    <div className={cn(
      "flex flex-col h-full bg-card border-r border-border transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Logo/Title */}
      <div className="h-16 flex items-center justify-center border-b border-border px-4">
        {collapsed ? (
          <TerminalIcon className="h-6 w-6" />
        ) : (
          <div className="flex items-center gap-2">
            <TerminalIcon className="h-6 w-6" />
            <span className="font-bold text-lg">AgentRelay</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border">
        <div className={cn(
          "text-xs text-muted-foreground",
          collapsed ? "text-center" : "px-3"
        )}>
          {collapsed ? "v0.1" : "Version 0.1.0"}
        </div>
      </div>
    </div>
  )
}
