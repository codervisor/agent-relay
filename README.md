# AgentRelay

AgentRelay is a lightweight, self-hosted orchestration platform for AI coding agents.

## Architecture

AgentRelay uses a reverse-connection architecture where Runners dial the HQ server:

- **HQ (Control Plane)**: Centralized server managing authentication, session state, and web UI
- **Runner (Execution Plane)**: Lightweight daemon executing commands and streaming PTY output
- **Protocol**: WebSocket-based (binary frames for PTY data, text frames for control)

## Quick Start

### Prerequisites

- Go 1.23+
- Node.js 18+ and pnpm
- Linux/macOS (PTY support required)

### Build

```bash
make build
```

Or manually:
```bash
go build -o bin/hq ./cmd/hq
go build -o bin/runner ./cmd/runner
```

### Run HQ Server

```bash
make run-hq
# or
./bin/hq
```

HQ will start on port 8080 by default. You can change this with the `PORT` environment variable.

### Run Runner

```bash
make run-runner
# or
./bin/runner --runner-id my-runner --token dev-token
```

**Configuration options:**
- `--hq-url`: WebSocket URL of HQ (default: `ws://localhost:8080/ws/runner`)
- `--runner-id`: Unique identifier for this runner (default: hostname)
- `--token`: Authentication token (default: "dev-token")

**Environment variables:**
- `HQ_URL`: Same as --hq-url
- `RUNNER_ID`: Same as --runner-id
- `RUNNER_TOKEN`: Same as --token

### Run Frontend

```bash
cd web
pnpm install
pnpm dev
```

Frontend will be available at http://localhost:5173 (or next available port).

### Docker Compose

```bash
docker-compose up
```

## Testing the System

1. **Start HQ**: `./bin/hq`
2. **Start Runner**: `./bin/runner --runner-id test-runner --token dev-token`
3. **Start Frontend**: `cd web && pnpm dev`
4. **Open browser** to http://localhost:5173
5. **Select runner** from the list
6. **Click Connect** to start a terminal session

You should see a bash terminal that accepts input and displays output in real-time.

## Project Structure

```
├── cmd/
│   ├── hq/          # HQ server entry point
│   └── runner/      # Runner entry point
├── internal/
│   ├── server/      # HTTP/WS handlers for HQ
│   ├── agent/       # PTY logic for Runner
│   ├── protocol/    # Shared message definitions
│   └── websocket/   # WebSocket utilities
├── web/             # React frontend
│   └── src/
│       ├── components/
│       │   └── Terminal.tsx
│       └── ...
└── specs/           # LeanSpec documentation
```

## Technology Stack

- **Backend**: Go 1.23+
- **Web Framework**: Gin
- **WebSocket**: gorilla/websocket
- **PTY**: creack/pty
- **Frontend**: React + TypeScript + Vite
- **Terminal**: xterm.js

## License

Apache 2.0