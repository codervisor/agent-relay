import React from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

function App() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">AgentRelay - Mission Control</h1>
          <p className="text-muted-foreground">
            Lightweight, self-hosted orchestration platform for AI coding agents
          </p>
        </div>

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
              <Button variant="default">Start HQ</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Runner</CardTitle>
              <CardDescription>
                Lightweight daemon executing commands and streaming PTY output
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Execution plane connecting to HQ via WebSocket. Runs your agent workloads securely.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="outline">Connect Runner</Button>
            </CardFooter>
          </Card>
        </div>

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
              <h4 className="font-semibold">2. Start the HQ server</h4>
              <code className="block bg-muted p-2 rounded text-sm">make run-hq</code>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">3. Connect a runner</h4>
              <code className="block bg-muted p-2 rounded text-sm">make run-runner</code>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="secondary">View Documentation</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

export default App
