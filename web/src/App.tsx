import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Terminal } from '@/components/Terminal'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

function App() {
  const [runners, setRunners] = useState<string[]>([])
  const [selectedRunner, setSelectedRunner] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch available runners
    const fetchRunners = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/runners')
        const data = await response.json()
        setRunners(data.runners || [])
        setLoading(false)
      } catch (err) {
        console.error('Failed to fetch runners:', err)
        setLoading(false)
      }
    }

    fetchRunners()
    // Poll for runners every 5 seconds
    const interval = setInterval(fetchRunners, 5000)
    return () => clearInterval(interval)
  }, [])

  if (selectedRunner) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <div className="border-b border-border px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">AgentRelay Terminal</h1>
            <span className="text-sm text-muted-foreground">→ {selectedRunner}</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => setSelectedRunner(null)}>
            Disconnect
          </Button>
        </div>
        <div className="flex-1 overflow-hidden">
          <Terminal runnerID={selectedRunner} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">AgentRelay - Mission Control</h1>
          <p className="text-muted-foreground">
            Lightweight, self-hosted orchestration platform for AI coding agents
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Available Runners</CardTitle>
            <CardDescription>
              Select a runner to connect and start a terminal session
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading runners...</p>
            ) : runners.length === 0 ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">No runners connected.</p>
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <p className="text-sm font-semibold">Start a runner:</p>
                  <code className="block text-xs bg-background p-2 rounded">
                    go run ./cmd/runner --runner-id my-runner --token dev-token
                  </code>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {runners.map((runner) => (
                  <div
                    key={runner}
                    className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted transition-colors"
                  >
                    <div>
                      <p className="font-medium">{runner}</p>
                      <p className="text-sm text-muted-foreground">Ready to connect</p>
                    </div>
                    <Button onClick={() => setSelectedRunner(runner)}>
                      Connect
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>HQ Server</CardTitle>
              <CardDescription>
                Centralized server managing authentication, session state, and web UI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                The control plane for your agent infrastructure. Manages runners and coordinates workflows.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" disabled>HQ Running</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>
                Quick start guide to set up your agent relay infrastructure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold">1. Build the project</h4>
                <code className="block bg-muted p-2 rounded text-sm">make build</code>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">2. Start a runner</h4>
                <code className="block bg-muted p-2 rounded text-sm">make run-runner</code>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default App

