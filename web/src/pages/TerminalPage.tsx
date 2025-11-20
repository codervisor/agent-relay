import React from 'react'
import { X } from 'lucide-react'
import { Terminal as TerminalComponent } from '@/components/Terminal'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAppStore } from '@/store/app-store'

export function TerminalPage() {
  const { sessions, activeSessionId, setActiveSession, removeSession } = useAppStore()

  const handleCloseTab = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    removeSession(sessionId)
  }

  if (sessions.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Terminal</h2>
          <p className="text-muted-foreground">
            Manage multiple terminal sessions across your runners
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>No Active Sessions</CardTitle>
            <CardDescription>
              Connect to a runner to start a terminal session
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Go to the Runners page and click Connect on any available runner to start a session.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <Tabs 
        value={activeSessionId || sessions[0]?.id} 
        onValueChange={setActiveSession}
        className="h-full flex flex-col"
      >
        <div className="border-b border-border px-4">
          <TabsList className="h-12 bg-transparent p-0">
            {sessions.map((session) => (
              <TabsTrigger
                key={session.id}
                value={session.id}
                className="relative h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4"
              >
                <span className="mr-2">{session.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={(e) => handleCloseTab(session.id, e)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {sessions.map((session) => (
          <TabsContent 
            key={session.id} 
            value={session.id}
            className="flex-1 mt-0 data-[state=active]:flex data-[state=active]:flex-col"
          >
            <div className="flex-1 overflow-hidden">
              <TerminalComponent 
                runnerID={session.runnerId}
                sessionID={session.id}
              />
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
