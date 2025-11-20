import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, Server, Terminal as TerminalIcon, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store/app-store'

export function Dashboard() {
  const navigate = useNavigate()
  const { runners, setRunners, sessions } = useAppStore()
  const [uptime, setUptime] = useState('0m')

  useEffect(() => {
    // Fetch runners
    const fetchRunners = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/runners')
        const data = await response.json()
        const runnerList = (data.runners || []).map((id: string) => ({
          id,
          status: 'online' as const,
          hostname: id,
          lastSeen: new Date(),
          activeSessions: 0
        }))
        setRunners(runnerList)
      } catch (err) {
        console.error('Failed to fetch runners:', err)
      }
    }

    fetchRunners()
    const interval = setInterval(fetchRunners, 5000)
    return () => clearInterval(interval)
  }, [setRunners])

  useEffect(() => {
    // Calculate uptime (simplified - would need server endpoint in real scenario)
    const startTime = Date.now()
    const updateUptime = () => {
      const elapsed = Date.now() - startTime
      const minutes = Math.floor(elapsed / 60000)
      const hours = Math.floor(minutes / 60)
      if (hours > 0) {
        setUptime(`${hours}h ${minutes % 60}m`)
      } else {
        setUptime(`${minutes}m`)
      }
    }
    updateUptime()
    const interval = setInterval(updateUptime, 60000)
    return () => clearInterval(interval)
  }, [])

  const activeRunners = runners.filter(r => r.status === 'online').length
  const activeSessions = sessions.filter(s => s.active).length

  return (
    <div className="p-6 space-y-6">
      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Runners</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeRunners}</div>
            <p className="text-xs text-muted-foreground">
              {activeRunners === 0 ? 'No runners connected' : `${activeRunners} online`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <TerminalIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSessions}</div>
            <p className="text-xs text-muted-foreground">
              {activeSessions === 0 ? 'No active sessions' : `${activeSessions} running`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uptime}</div>
            <p className="text-xs text-muted-foreground">
              HQ running healthy
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and operations</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button onClick={() => navigate('/runners')}>
            <Server className="mr-2 h-4 w-4" />
            View Runners
          </Button>
          <Button 
            onClick={() => navigate('/terminal')} 
            variant="outline"
            disabled={activeRunners === 0}
          >
            <TerminalIcon className="mr-2 h-4 w-4" />
            Open Terminal
          </Button>
        </CardContent>
      </Card>

      {/* Recent Activity / Getting Started */}
      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>Start using AgentRelay in 3 simple steps</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
              1
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Build the project</p>
              <code className="block bg-muted p-2 rounded text-xs">make build</code>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
              2
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Start a runner</p>
              <code className="block bg-muted p-2 rounded text-xs">
                ./bin/runner --runner-id my-runner --token dev-token
              </code>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
              3
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Connect to a runner</p>
              <p className="text-sm text-muted-foreground">
                Navigate to the Runners page and click Connect on any available runner
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
