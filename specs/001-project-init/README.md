---
status: complete
created: '2025-11-20'
tags: []
priority: medium
created_at: '2025-11-20T03:28:37.018Z'
updated_at: '2025-11-20T05:27:30.662Z'
completed_at: '2025-11-20T05:27:30.662Z'
completed: '2025-11-20'
transitions:
  - status: complete
    at: '2025-11-20T05:27:30.662Z'
---

# project-init

> **Status**: ✅ Complete · **Priority**: Medium · **Created**: 2025-11-20

## Overview

AgentRelay is a lightweight, self-hosted orchestration platform for AI coding agents. This spec covers the initial project setup and MVP implementation using a reverse-connection architecture where Runners dial the HQ server.

**Why now?** Need a secure, scalable way to manage AI agent execution across distributed infrastructure without complex networking requirements.

## Design

### Architecture
- **HQ (Control Plane)**: Centralized Go server with Gin framework for HTTP/WebSocket handling
- **Runner (Execution Plane)**: Lightweight daemon executing commands via PTY
- **Protocol**: WebSocket-based (binary frames for PTY data, text frames for control)
- **Frontend**: React + TypeScript + Vite with xterm.js for terminal emulation

### Technology Stack
- Backend: Go 1.23+ with Gin, gorilla/websocket, creack/pty
- Frontend: React, TypeScript, Vite, xterm.js
- Deployment: Docker Compose + standalone binaries

## Plan

- [x] Initialize Go module and project structure
- [x] Set up protocol definitions (`internal/protocol/messages.go`)
- [x] Implement Runner PTY logic (`internal/agent/`)
- [x] Implement HQ server with WebSocket hub (`internal/server/`)
- [x] Create WebSocket utilities (`internal/websocket/`)
- [x] Build command entry points (`cmd/hq/`, `cmd/runner/`)
- [x] Set up React frontend with Vite (`web/`)
- [x] Implement Terminal component with xterm.js (`web/src/components/Terminal.tsx`)
- [x] Create Docker configuration (`Dockerfile.hq`, `Dockerfile.runner`, `docker-compose.yml`)
- [x] Add build automation (`Makefile`)
- [x] Document architecture and quick start (`README.md`)
- [x] Set up LeanSpec structure (`specs/`, `AGENTS.md`)

## Test

### Verification Criteria
- [x] HQ server starts and listens for connections
- [x] Runner connects to HQ and registers successfully
- [x] PTY spawns and streams output bidirectionally
- [x] Frontend terminal displays and accepts input
- [x] Docker Compose deployment works end-to-end
- [x] Build commands produce working binaries (`make build`)

### Manual Testing
```bash
# Start HQ
make run-hq

# Start Runner (separate terminal)
make run-runner

# Start Frontend (separate terminal)
cd web && npm run dev

# Verify connection and terminal interaction in browser
```

## Notes

### Implementation Details
- Reverse-connection design eliminates need for open ports on Runner side
- WebSocket protocol handles both control messages (JSON text frames) and PTY data (binary frames)
- HQ acts as transparent proxy between browser and Runner WebSocket connections
- In-memory session management for MVP (no persistence layer yet)

### Project Structure
```
├── cmd/hq/              # HQ server entry point
├── cmd/runner/          # Runner entry point
├── internal/server/     # HTTP/WS handlers for HQ
├── internal/agent/      # PTY logic for Runner
├── internal/protocol/   # Shared message definitions
├── internal/websocket/  # WebSocket utilities
├── web/                 # React frontend with xterm.js
└── specs/               # LeanSpec documentation
```

### Completed Deliverables
- ✅ Working Go backend (HQ + Runner)
- ✅ React frontend with terminal emulation
- ✅ Docker deployment configuration
- ✅ Build automation and documentation
- ✅ LeanSpec agent workflow setup

**Status**: All MVP components implemented and tested. Project ready for next phase.
