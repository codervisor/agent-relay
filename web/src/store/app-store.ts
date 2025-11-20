import { create } from 'zustand'

export interface Runner {
  id: string
  status: 'online' | 'offline'
  hostname?: string
  ip?: string
  lastSeen?: Date
  activeSessions?: number
}

export interface TerminalSession {
  id: string
  runnerId: string
  name: string
  active: boolean
}

interface AppState {
  // Runners
  runners: Runner[]
  setRunners: (runners: Runner[]) => void
  
  // Terminal sessions
  sessions: TerminalSession[]
  activeSessionId: string | null
  addSession: (session: TerminalSession) => void
  removeSession: (sessionId: string) => void
  setActiveSession: (sessionId: string) => void
  
  // Theme
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void
}

export const useAppStore = create<AppState>((set) => ({
  // Runners
  runners: [],
  setRunners: (runners) => set({ runners }),
  
  // Terminal sessions
  sessions: [],
  activeSessionId: null,
  addSession: (session) => 
    set((state) => ({ 
      sessions: [...state.sessions, session],
      activeSessionId: session.id
    })),
  removeSession: (sessionId) => 
    set((state) => {
      const newSessions = state.sessions.filter(s => s.id !== sessionId)
      const newActiveId = state.activeSessionId === sessionId 
        ? (newSessions[0]?.id || null)
        : state.activeSessionId
      return {
        sessions: newSessions,
        activeSessionId: newActiveId
      }
    }),
  setActiveSession: (sessionId) => 
    set({ activeSessionId: sessionId }),
  
  // Theme
  theme: 'system',
  setTheme: (theme) => set({ theme }),
}))
