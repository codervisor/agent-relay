# Project Specification: AgentRelay

Version: 0.1.0 (MVP) Architecture: Distributed Master-Worker (Go-Native) License: Apache 2.

## 1. Executive Summary

AgentRelay is a lightweight, self-hosted, and scalable orchestration platform for AI coding agents.
Unlike "all-in-one" agent frameworks, AgentRelay acts as the "Mission Control" (HQ) for arbitrary CLI-
based tools (e.g., GitHub Copilot CLI, Claude Code, custom scripts).

It uses a reverse-connection architecture (Runners dial HQ) to allow users to securely run agents on
local machines, private servers, or isolated sandboxes without complex networking/firewalls, while
streaming the rich terminal interface (PTY) to a centralized web dashboard.

## 2. Core Architecture

2.1. Topology
HQ (Control Plane): A centralized server managing authentication, session state, and the web UI.
Runner (Execution Plane): A lightweight, single-binary daemon running on the target
infrastructure (laptop, VPS, Docker). It executes commands and streams the PTY.
Protocol:
Transport: WebSocket (Binary frames for PTY data, Text frames for control signals).
Connection: Outbound only (Runner -> HQ). No open ports required on Runner.

2.2. Technology Stack
Backend (HQ & Runner): Go (Golang) 1.23+
Web Framework: github.com/gin-gonic/gin (HTTP/WS)
PTY Library: github.com/creack/pty (Cross-platform terminal emulation)
WebSocket: github.com/gorilla/websocket
UUID: github.com/google/uuid
Frontend (HQ UI): React + TypeScript + Vite
Terminal Component: xterm.js (with xterm-addon-fit, xterm-addon-web-links)
Styling: Tailwind CSS
Deployment: Docker Compose (Single container for HQ, separate binary for Runner).

## 3. Component Specifications

3.1. The Runner (cmd/runner)


The Runner is a dumb execution engine. It does not know "business logic"; it only knows "Processes"
and "Streams".

Key Responsibilities:

1. Registration: On boot, dial ws://<hq_url>/api/v1/ws/register with a RUNNER_TOKEN.
2. Job Handling: Listen for StartSession events containing a command (e.g., ["gh", "copilot",
    "explain"]).
3. PTY Spawning:
    Create a PTY using pty.Start().
    Set window size (rows/cols) based on frontend events.
4. Bi-Directional Streaming:
    Read Pump: Read stdout from PTY -> Send Binary WS Message to HQ.
    Write Pump: Read Binary WS Message from HQ -> Write to PTY stdin.

3.2. The HQ (cmd/hq)
The HQ is the state manager and proxy.

Key Responsibilities:

1. Runner Registry: Maintain an in-memory map of connected Runners (identified by UUID).
2. Session Orchestration:
    REST API POST /api/sessions -> Allocates a session on a specific Runner.
    Signals the Runner via the Control WebSocket to start the process.
3. Client Bridging:
    Browser connects to ws://<hq_url>/api/v1/ws/session/<id>.
    HQ bridges the Browser WebSocket <-> Runner WebSocket.
    _Note:_ HQ acts as a transparent pipe for binary PTY data.

## 4. Data Protocol (WebSocket)

Control Messages (JSON Text Frames): Used for signaling status changes or resizes.

```
{
"type": "resize",
"payload": { "rows": 24, "cols": 80 }
}
```
Data Messages (Binary Frames): Raw streams.
Runner -> HQ -> Browser: Raw bytes from the process stdout (includes ANSI colors).


```
Browser -> HQ -> Runner: Raw bytes from user keystrokes (sent to process stdin).
```
## 5. Directory Structure

```
/
├── cmd/
│ ├── hq/ # Main entry point for Server
│ │ └── main.go
│ └── runner/ # Main entry point for Agent Runner
│ └── main.go
├── internal/
│ ├── server/ # HTTP/WS handlers for HQ
│ ├── agent/ # PTY logic for Runner
│ ├── protocol/ # Shared struct definitions (JSON messages)
│ └── websocket/ # Shared WS utility wrappers
├── web/ # React Frontend
│ ├── src/
│ │ ├── components/
│ │ │ └── Terminal.tsx # Xterm.js wrapper
│ │ └── ...
│ └── package.json
├── docker-compose.yml
├── Makefile
└── SPEC.md
```
## 6. MVP Implementation Steps

1. Setup: Initialize Go module github.com/yourname/agentrelay.
2. Protocol: Define Message structs in internal/protocol.
3. Runner Core: Implement internal/agent/pty.go to wrap creack/pty and expose
    input/output channels.
4. HQ Core: Implement internal/server/hub.go to manage WebSocket connections.
5. Integration: Connect Runner to HQ and verify PTY data piping (echo test).
6. Frontend: Scaffold React app with Xterm.js connecting to HQ WebSocket.



