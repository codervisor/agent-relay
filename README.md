# AgentRelay

AgentRelay is a lightweight, self-hosted orchestration platform for AI coding agents.

## Architecture

AgentRelay uses a reverse-connection architecture where Runners dial the HQ server:

- **HQ (Control Plane)**: Centralized server managing authentication, session state, and web UI
- **Runner (Execution Plane)**: Lightweight daemon executing commands and streaming PTY output
- **Protocol**: WebSocket-based (binary frames for PTY data, text frames for control)

## Quick Start

### Build

```bash
make build
```

### Run HQ Server

```bash
make run-hq
# or
go run ./cmd/hq
```

### Run Runner

```bash
make run-runner
# or
go run ./cmd/runner
```

### Run Frontend

```bash
cd web
npm run dev
```

### Docker Compose

```bash
docker-compose up
```

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