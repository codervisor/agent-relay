import React from 'react'
import { useLocation } from 'react-router-dom'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store/app-store'

export function Header() {
  const location = useLocation()
  const { theme, setTheme } = useAppStore()
  
  const getPageTitle = (pathname: string) => {
    switch (pathname) {
      case '/': return 'Dashboard'
      case '/runners': return 'Runners'
      case '/terminal': return 'Terminal'
      case '/settings': return 'Settings'
      default: return 'AgentRelay'
    }
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  React.useEffect(() => {
    const root = window.document.documentElement
    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme])

  return (
    <header className="h-16 border-b border-border bg-background">
      <div className="h-full px-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{getPageTitle(location.pathname)}</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </header>
  )
}
