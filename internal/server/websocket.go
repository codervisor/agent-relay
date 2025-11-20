package server

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/codervisor/agent-relay/internal/protocol"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		// Allow all origins for development
		// TODO: Restrict in production
		return true
	},
}

// HandleRunnerConnection handles incoming runner WebSocket connections
// Endpoint: /ws/runner
func HandleRunnerConnection(hub *Hub) gin.HandlerFunc {
	return func(c *gin.Context) {
		conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
		if err != nil {
			log.Printf("[WS] Failed to upgrade runner connection: %v", err)
			return
		}

		// Read registration message
		var msg protocol.Message
		if err := conn.ReadJSON(&msg); err != nil {
			log.Printf("[WS] Failed to read registration message: %v", err)
			conn.Close()
			return
		}

		if msg.Type != protocol.MessageTypeRegister {
			log.Printf("[WS] Expected register message, got: %s", msg.Type)
			conn.Close()
			return
		}

		// Parse registration payload
		payloadBytes, err := json.Marshal(msg.Payload)
		if err != nil {
			log.Printf("[WS] Failed to marshal payload: %v", err)
			conn.Close()
			return
		}

		var regPayload protocol.RegisterPayload
		if err := json.Unmarshal(payloadBytes, &regPayload); err != nil {
			log.Printf("[WS] Failed to parse registration payload: %v", err)
			conn.Close()
			return
		}

		// TODO: Validate token
		if regPayload.Token == "" {
			log.Printf("[WS] Empty token in registration")
			conn.Close()
			return
		}

		// Register runner in hub
		if err := hub.RegisterRunner(regPayload.RunnerID, conn); err != nil {
			log.Printf("[WS] Failed to register runner: %v", err)
			conn.Close()
			return
		}

		log.Printf("[WS] Runner connected: %s", regPayload.RunnerID)

		// Start message routing loop
		runnerMessageLoop(hub, regPayload.RunnerID, conn)
	}
}

// runnerMessageLoop handles messages from a runner
func runnerMessageLoop(hub *Hub, runnerID string, conn *websocket.Conn) {
	defer func() {
		hub.UnregisterRunner(runnerID)
		conn.Close()
		log.Printf("[WS] Runner disconnected: %s", runnerID)
	}()

	for {
		messageType, data, err := conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("[WS] Runner read error: %v", err)
			}
			break
		}

		// Handle text messages (control messages)
		if messageType == websocket.TextMessage {
			var msg protocol.Message
			if err := json.Unmarshal(data, &msg); err != nil {
				log.Printf("[WS] Failed to parse message from runner: %v", err)
				continue
			}

			// Route control messages to appropriate clients
			handleRunnerControlMessage(hub, runnerID, msg)
		} else if messageType == websocket.BinaryMessage {
			// Binary messages contain session ID prefix (first 36 bytes for UUID)
			// Format: [session_id(36 bytes)][pty_data]
			if len(data) < 36 {
				log.Printf("[WS] Invalid binary message: too short")
				continue
			}

			sessionID := string(data[:36])
			ptyData := data[36:]

			// Route PTY data to client
			if err := hub.RouteToClient(sessionID, websocket.BinaryMessage, ptyData); err != nil {
				log.Printf("[WS] Failed to route PTY data to client: %v", err)
			}
		}
	}
}

// handleRunnerControlMessage processes control messages from runners
func handleRunnerControlMessage(hub *Hub, runnerID string, msg protocol.Message) {
	switch msg.Type {
	case protocol.MessageTypeSessionStarted:
		log.Printf("[WS] Session started on runner %s", runnerID)
		// Forward to client if needed
	case protocol.MessageTypeSessionEnded:
		log.Printf("[WS] Session ended on runner %s", runnerID)
		// Forward to client and cleanup
	case protocol.MessageTypeError:
		log.Printf("[WS] Error from runner %s: %+v", runnerID, msg.Payload)
		// Forward to client
	default:
		log.Printf("[WS] Unknown message type from runner: %s", msg.Type)
	}
}

// HandleTerminalConnection handles incoming browser client WebSocket connections
// Endpoint: /ws/terminal/:runner_id
func HandleTerminalConnection(hub *Hub) gin.HandlerFunc {
	return func(c *gin.Context) {
		runnerID := c.Param("runner_id")
		if runnerID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "runner_id required"})
			return
		}

		// Check if runner exists
		_, exists := hub.GetRunner(runnerID)
		if !exists {
			c.JSON(http.StatusNotFound, gin.H{"error": "runner not found"})
			return
		}

		// Upgrade connection
		conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
		if err != nil {
			log.Printf("[WS] Failed to upgrade terminal connection: %v", err)
			return
		}

		// Wait for start_session message to get session ID
		var msg protocol.Message
		if err := conn.ReadJSON(&msg); err != nil {
			log.Printf("[WS] Failed to read start_session message: %v", err)
			conn.Close()
			return
		}

		if msg.Type != protocol.MessageTypeStartSession {
			log.Printf("[WS] Expected start_session message, got: %s", msg.Type)
			conn.Close()
			return
		}

		// Parse session payload
		payloadBytes, err := json.Marshal(msg.Payload)
		if err != nil {
			log.Printf("[WS] Failed to marshal payload: %v", err)
			conn.Close()
			return
		}

		var sessionPayload protocol.StartSessionPayload
		if err := json.Unmarshal(payloadBytes, &sessionPayload); err != nil {
			log.Printf("[WS] Failed to parse session payload: %v", err)
			conn.Close()
			return
		}

		sessionID := sessionPayload.SessionID
		if sessionID == "" {
			log.Printf("[WS] Empty session ID")
			conn.Close()
			return
		}

		// Register client in hub
		if err := hub.RegisterClient(sessionID, runnerID, conn); err != nil {
			log.Printf("[WS] Failed to register client: %v", err)
			conn.Close()
			return
		}

		log.Printf("[WS] Client connected: session=%s runner=%s", sessionID, runnerID)

		// Forward start_session message to runner with original data
		msgBytes, _ := json.Marshal(msg)
		if err := hub.RouteToRunner(sessionID, websocket.TextMessage, msgBytes); err != nil {
			log.Printf("[WS] Failed to route start_session to runner: %v", err)
			conn.Close()
			return
		}

		// Start client message loop
		clientMessageLoop(hub, sessionID, conn)
	}
}

// clientMessageLoop handles messages from a browser client
func clientMessageLoop(hub *Hub, sessionID string, conn *websocket.Conn) {
	defer func() {
		hub.UnregisterClient(sessionID)
		conn.Close()
		log.Printf("[WS] Client disconnected: session=%s", sessionID)
	}()

	for {
		messageType, data, err := conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("[WS] Client read error: %v", err)
			}
			break
		}

		// For binary messages (terminal input), prepend session ID
		if messageType == websocket.BinaryMessage {
			// Format: [session_id(36 bytes)][input_data]
			sessionBytes := []byte(sessionID)
			paddedSession := make([]byte, 36)
			copy(paddedSession, sessionBytes)

			fullData := append(paddedSession, data...)

			if err := hub.RouteToRunner(sessionID, websocket.BinaryMessage, fullData); err != nil {
				log.Printf("[WS] Failed to route input to runner: %v", err)
			}
		} else if messageType == websocket.TextMessage {
			// Text messages are control messages (resize, etc.)
			if err := hub.RouteToRunner(sessionID, websocket.TextMessage, data); err != nil {
				log.Printf("[WS] Failed to route control message to runner: %v", err)
			}
		}
	}
}
