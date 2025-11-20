import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Server, Circle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAppStore, type Runner } from '@/store/app-store'

export function Runners() {
  const navigate = useNavigate()
  const { runners, setRunners, addSession } = useAppStore()

  useEffect(() => {
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

  const handleConnect = (runner: Runner) => {
    const sessionId = crypto.randomUUID()
    addSession({
      id: sessionId,
      runnerId: runner.id,
      name: runner.id,
      active: true
    })
    navigate('/terminal')
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Runners</h2>
          <p className="text-muted-foreground">
            Manage and connect to your agent runners
          </p>
        </div>
      </div>

      {runners.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Runners Connected</CardTitle>
            <CardDescription>
              Start a runner to see it appear here
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <p className="text-sm font-semibold">Start a runner:</p>
              <code className="block text-xs bg-background p-2 rounded">
                ./bin/runner --runner-id my-runner --token dev-token
              </code>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Available Runners</CardTitle>
            <CardDescription>
              {runners.length} {runners.length === 1 ? 'runner' : 'runners'} connected
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Runner ID</TableHead>
                  <TableHead>Hostname</TableHead>
                  <TableHead>Last Seen</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runners.map((runner) => (
                  <TableRow key={runner.id}>
                    <TableCell>
                      <Badge 
                        variant={runner.status === 'online' ? 'default' : 'secondary'}
                        className="gap-1"
                      >
                        <Circle className="h-2 w-2 fill-current" />
                        {runner.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{runner.id}</TableCell>
                    <TableCell>{runner.hostname || '-'}</TableCell>
                    <TableCell>
                      {runner.lastSeen 
                        ? new Date(runner.lastSeen).toLocaleTimeString() 
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => handleConnect(runner)}
                        disabled={runner.status !== 'online'}
                      >
                        Connect
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
