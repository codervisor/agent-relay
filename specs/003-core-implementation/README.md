---
status: complete
created: '2025-11-20'
tags:
  - backend
  - core
  - websocket
  - pty
  - architecture
priority: high
created_at: '2025-11-20T07:07:46.709Z'
updated_at: '2025-11-20T07:27:33.826Z'
transitions:
  - status: in-progress
    at: '2025-11-20T07:11:39.366Z'
  - status: complete
    at: '2025-11-20T07:27:33.826Z'
completed_at: '2025-11-20T07:27:33.826Z'
completed: '2025-11-20'
---

# Core HQ and Runner Implementation

> **Status**: ✅ Complete · **Priority**: High · **Created**: 2025-11-20 · **Tags**: backend, core, websocket, pty, architecture

## Overview

Implement the complete reverse-connection architecture with WebSocket-based communication between HQ server and Runner agents, including PTY handling, session management, and real-time terminal streaming.

**Why now?** The current implementation has only stub code. We need the full bidirectional communication layer to enable remote agent execution and terminal streaming.

**What this delivers:**
- Runners connect to HQ via WebSocket (reverse-connection architecture)
- HQ manages Runner registry and proxies browser connections to Runners
- PTY spawning and streaming on Runner side
- Frontend terminal that connects to HQ and streams PTY output

## Design

### Architecture Overview

```
[Browser Client] <--WS--> [HQ Server] <--WS--> [Runner Agent]
                            |
                            ├─ Connection Hub (manages active connections)
                            ├─ Runner Registry (tracks available runners)
                            └─ Session Manager (maps clients to runners)
```

### Reverse-Connection Flow

1. **Runner Registration**:
   - Runner dials HQ on `:8080/ws/runner`
   - Sends `register` message with token
   - HQ tracks runner in registry
   - Connection stays open for lifetime

2. **Client Terminal Connection**:
   - Browser connects to HQ on `:8080/ws/terminal/:runner_id`
   - HQ looks up runner by ID
   - HQ proxies messages between browser and runner
   - Session state tracked in memory

3. **PTY Spawning & Streaming**:
   - Client sends `start_session` message through HQ to runner
   - Runner spawns PTY with `/bin/bash` (or specified command)
   - Runner streams PTY output as binary frames to HQ
   - HQ forwards to client browser
   - Client input forwarded back through HQ to runner

### WebSocket Protocol

**Message Types** (text frames):
```go
type MessageType string

const (
    MessageTypeRegister      MessageType = "register"       // Runner -> HQ
    MessageTypeStartSession  MessageType = "start_session"  // Client -> Runner
    MessageTypeResize        MessageType = "resize"         // Client -> Runner
    MessageTypeError         MessageType = "error"          // Bidirectional
)
```

**Binary Frames**: Raw PTY I/O data (stdin/stdout/stderr)

### Component Design

#### 1. HQ Server (`internal/server/`)

**hub.go** - Connection Hub:
```go
type Hub struct {
    runners   map[string]*RunnerConn    // runner_id -> connection
    clients   map[string]*ClientConn    // session_id -> connection
    sessions  map[string]string         // session_id -> runner_id
    mu        sync.RWMutex
}

// Methods:
// - RegisterRunner(id string, conn *websocket.Conn)
// - UnregisterRunner(id string)
// - RegisterClient(sessionID, runnerID string, conn *websocket.Conn)
// - UnregisterClient(sessionID string)
// - RouteMessage(sessionID string, message []byte) error
```

**websocket.go** - WebSocket Handlers:
```go
// HandleRunnerConnection: /ws/runner
// - Upgrade to WebSocket
// - Read register message
// - Add to hub
// - Listen for messages, route to clients

// HandleTerminalConnection: /ws/terminal/:runner_id
// - Upgrade to WebSocket
// - Create session ID
// - Link client to runner in hub
// - Proxy bidirectional messages
```

#### 2. Runner Agent (`internal/agent/`)

**client.go** - Connection Manager:
```go
type Client struct {
    hqURL     string
    token     string
    conn      *websocket.Conn
    pty       *PTY
    reconnect bool
}

// Methods:
// - Connect() error
// - Register() error
// - HandleMessages() // message loop
// - SendOutput(data []byte) error
```

**pty.go** - PTY Handler:
```go
type PTY struct {
    cmd      *exec.Cmd
    pty      *os.File
    mu       sync.Mutex
}

// Methods:
// - Start(command []string) error
// - Resize(rows, cols int) error
// - Write(data []byte) error
// - Read() ([]byte, error)
// - Close() error
```

#### 3. Frontend (`web/src/`)

**lib/websocket.ts** - WebSocket Client:
```typescript
class TerminalWebSocket {
  private ws: WebSocket;
  private runnerID: string;
  
  connect(runnerID: string): void;
  send(data: string | ArrayBuffer): void;
  onData(callback: (data: ArrayBuffer) => void): void;
  resize(rows: number, cols: number): void;
  close(): void;
}
```

**components/Terminal.tsx** - Updated Terminal:
- Connect to `ws://localhost:8080/ws/terminal/:runner_id`
- Send terminal input to WebSocket
- Receive binary frames and write to xterm.js
- Handle resize events

### Security Considerations

**For MVP**:
- Simple token-based runner authentication
- No TLS (local development)
- No user authentication on HQ

**Future**:
- TLS/WSS support
- JWT-based authentication
- RBAC for multi-user access
- Runner certificate pinning

### Error Handling

- **Connection Loss**: Runners auto-reconnect to HQ
- **Session Cleanup**: HQ cleans up on disconnect
- **PTY Errors**: Propagate as error messages to client
- **Invalid Messages**: Log and drop malformed messages

## Plan

- [x] **Update protocol definitions** (`internal/protocol/messages.go`)
  - [x] Add error message type
  - [x] Add session lifecycle types (session_started, session_ended)
  - [x] Document protocol specification inline

- [ ] **Implement HQ Connection Hub** (`internal/server/hub.go`)
  - [ ] Create Hub struct with connection registries
  - [ ] Implement RegisterRunner/UnregisterRunner
  - [ ] Implement RegisterClient/UnregisterClient
  - [ ] Implement message routing logic
  - [ ] Add proper synchronization with RWMutex

- [ ] **Implement HQ WebSocket Handlers** (`internal/server/websocket.go`)
  - [ ] HandleRunnerConnection: accept runner connections, parse register
  - [ ] HandleTerminalConnection: accept browser clients, create sessions
  - [ ] Implement bidirectional message proxying
  - [ ] Add connection upgrade utilities

- [ ] **Implement Runner PTY Handler** (`internal/agent/pty.go`)
  - [ ] PTY spawning with creack/pty
  - [ ] Read loop for PTY output
  - [ ] Write method for PTY input
  - [ ] Resize support
  - [ ] Graceful cleanup on close

- [ ] **Implement Runner Connection Client** (`internal/agent/client.go`)
  - [ ] WebSocket connection to HQ
  - [ ] Registration handshake
  - [ ] Message loop: handle start_session, resize, stdin
  - [ ] Auto-reconnect logic with backoff
  - [ ] Integrate with PTY handler

- [ ] **Update HQ main.go** (`cmd/hq/main.go`)
  - [ ] Initialize Hub
  - [ ] Wire up WebSocket routes
  - [ ] Add CORS for frontend
  - [ ] Add static file serving for web UI

- [ ] **Update Runner main.go** (`cmd/runner/main.go`)
  - [ ] Parse CLI flags (hq-url, token)
  - [ ] Initialize Client
  - [ ] Start connection and message loop
  - [ ] Handle signals for graceful shutdown

- [ ] **Implement Frontend WebSocket Client** (`web/src/lib/websocket.ts`)
  - [ ] WebSocket connection class
  - [ ] Message encoding/decoding
  - [ ] Binary frame handling
  - [ ] Event-based API for Terminal component

- [ ] **Update Terminal Component** (`web/src/components/Terminal.tsx`)
  - [ ] Connect to HQ WebSocket on mount
  - [ ] Send start_session message
  - [ ] Wire xterm.js input to WebSocket
  - [ ] Wire WebSocket binary output to xterm.js
  - [ ] Send resize events on terminal resize

- [ ] **Add Configuration Management**
  - [ ] Environment variables for HQ (PORT, AUTH_TOKEN)
  - [ ] CLI flags for Runner (--hq-url, --token, --runner-id)
  - [ ] Document configuration in README

## Test

### Unit Tests
- [ ] Hub: registration, routing, cleanup
- [ ] PTY: spawn, read, write, resize
- [ ] Protocol: message marshaling/unmarshaling

### Integration Tests
- [ ] Runner connects to HQ successfully
- [ ] Multiple runners can register
- [ ] Client connects and creates session
- [ ] PTY spawns and streams output
- [ ] Bidirectional communication works (input/output)
- [ ] Resize messages work
- [ ] Cleanup on disconnect

### Manual End-to-End Test
1. Start HQ: `make run-hq`
2. Start Runner: `go run ./cmd/runner --hq-url ws://localhost:8080/ws/runner --token test123`
3. Start Frontend: `cd web && pnpm dev`
4. Open browser to `http://localhost:5173`
5. Verify terminal appears and accepts commands
6. Verify output streams correctly
7. Verify resize works
8. Kill runner and verify error handling
9. Restart runner and verify reconnection

### Acceptance Criteria
- [ ] Runner registers with HQ on startup
- [ ] HQ tracks multiple runners
- [ ] Browser can connect to specific runner via HQ
- [ ] Terminal spawns `/bin/bash` successfully
- [ ] Terminal input reaches runner PTY
- [ ] Terminal output streams to browser in real-time
- [ ] Terminal resize works correctly
- [ ] Disconnection cleanup works (no goroutine leaks)
- [ ] Runner auto-reconnects on connection loss
- [ ] Error messages propagate to client

## Notes

### Implementation Order

**Phase 1 - Core Infrastructure** (High priority):
1. Protocol definitions
2. HQ Hub
3. HQ WebSocket handlers
4. Runner PTY
5. Runner Client

**Phase 2 - Integration** (High priority):
6. Wire up main.go files
7. Frontend WebSocket client
8. Terminal component updates

**Phase 3 - Testing & Polish** (Medium priority):
9. Manual testing
10. Error handling improvements
11. Documentation updates

### Dependencies

**Go packages needed**:
```go
github.com/gin-gonic/gin           // Already in go.mod
github.com/gorilla/websocket       // Need to add
github.com/creack/pty              // Need to add
```

**Frontend packages needed**:
```json
"xterm": "^5.x",                   // Already in package.json
"@xterm/addon-fit": "^0.x"        // May need to add
```

### Architecture Decisions

**Why reverse-connection?**
- No open ports needed on Runner side
- Simplifies firewall/NAT traversal
- Runner can be behind corporate firewall
- Single HQ ingress point

**Why in-memory sessions?**
- MVP simplicity
- Fast session lookup
- No database dependency
- Good enough for single-instance HQ
- Future: Redis for multi-instance HQ

**Why WebSocket over HTTP/2?**
- Better browser support
- Simpler binary streaming
- Natural fit for terminal use case
- gorilla/websocket is battle-tested

**Why gorilla/websocket over native?**
- More mature API
- Better connection management
- Proven in production at scale

### Deferred Features

**Not in this spec** (future iterations):
- Multi-user authentication
- TLS/WSS support
- Session persistence
- Session recording/replay
- Multi-command sessions
- Runner health checks
- Metrics/observability
- Rate limiting

### Open Questions

- **Runner ID generation**: UUID? Hostname? User-provided?
  - **Decision**: User-provided via CLI flag, defaults to hostname
  
- **Token storage**: Environment var? Config file? CLI flag?
  - **Decision**: CLI flag with env var fallback
  
- **Multiple sessions per runner**: Support parallel sessions?
  - **Decision**: MVP = one session per runner, future = multiple
  
- **Session timeout**: Auto-cleanup idle sessions?
  - **Decision**: Deferred to future iteration

### Alternatives Considered

**1. gRPC instead of WebSocket**
- ❌ More complex for browser clients
- ❌ Requires proxy for browser gRPC-web
- ✅ Better type safety
- **Decision**: Stick with WebSocket for simplicity

**2. SSH tunnels instead of WebSocket**
- ❌ Requires SSH key management
- ❌ More complex authentication flow
- ✅ Proven security model
- **Decision**: WebSocket simpler for MVP, SSH possible later

**3. Direct Runner-to-Browser connection (TURN/ICE)**
- ❌ Complex NAT traversal
- ❌ Requires STUN/TURN servers
- ❌ Harder to implement security
- **Decision**: HQ proxy is simpler and more controllable

### Related Specs

- **001-project-init**: Established project structure
- **002-frontend-arch-update**: Set up UI framework (prerequisite for terminal UI)

### Success Metrics

- [ ] Runner connects to HQ within 1 second
- [ ] Terminal spawns within 500ms of session start
- [ ] Latency <50ms for local connections
- [ ] Zero goroutine leaks after disconnect
- [ ] Handles 10+ concurrent sessions per runner
- [ ] Handles 100+ registered runners in hub
