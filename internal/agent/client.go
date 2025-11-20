package agent

import (
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/codervisor/agent-relay/internal/protocol"
	"github.com/gorilla/websocket"
)

// Client manages the runner's connection to HQ
type Client struct {
	hqURL     string
	runnerID  string
	token     string
	conn      *websocket.Conn
	sessions  map[string]*PTY
	mu        sync.RWMutex
	writeMu   sync.Mutex
	reconnect bool
	closed    bool
}

// NewClient creates a new runner client
func NewClient(hqURL, runnerID, token string) *Client {
	return &Client{
		hqURL:     hqURL,
		runnerID:  runnerID,
		token:     token,
		sessions:  make(map[string]*PTY),
		reconnect: true,
	}
}

// Connect establishes connection to HQ and registers
func (c *Client) Connect() error {
	log.Printf("[Client] Connecting to HQ: %s", c.hqURL)

	conn, _, err := websocket.DefaultDialer.Dial(c.hqURL, nil)
	if err != nil {
		return fmt.Errorf("failed to connect to HQ: %w", err)
	}

	c.conn = conn

	// Send registration message
	if err := c.register(); err != nil {
		conn.Close()
		return err
	}

	log.Printf("[Client] Successfully registered with HQ as %s", c.runnerID)
	return nil
}

// register sends the registration message to HQ
func (c *Client) register() error {
	msg := protocol.Message{
		Type: protocol.MessageTypeRegister,
		Payload: protocol.RegisterPayload{
			RunnerID: c.runnerID,
			Token:    c.token,
		},
	}

	if err := c.writeJSON(msg); err != nil {
		return fmt.Errorf("failed to send registration: %w", err)
	}

	return nil
}

// Run starts the main message handling loop
func (c *Client) Run() {
	for c.reconnect && !c.closed {
		if err := c.Connect(); err != nil {
			log.Printf("[Client] Connection failed: %v. Retrying in 5s...", err)
			time.Sleep(5 * time.Second)
			continue
		}

		// Handle messages until connection closes
		c.handleMessages()

		// Clean up connection
		c.conn.Close()

		// Retry connection if not explicitly closed
		if c.reconnect && !c.closed {
			log.Printf("[Client] Connection lost. Reconnecting in 5s...")
			time.Sleep(5 * time.Second)
		}
	}

	log.Printf("[Client] Client stopped")
}

// handleMessages processes incoming messages from HQ
func (c *Client) handleMessages() {
	for {
		messageType, data, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("[Client] Read error: %v", err)
			}
			break
		}

		if messageType == websocket.TextMessage {
			c.handleControlMessage(data)
		} else if messageType == websocket.BinaryMessage {
			c.handleBinaryMessage(data)
		}
	}
}

// handleControlMessage processes text/JSON control messages
func (c *Client) handleControlMessage(data []byte) {
	var msg protocol.Message
	if err := json.Unmarshal(data, &msg); err != nil {
		log.Printf("[Client] Failed to parse message: %v", err)
		return
	}

	switch msg.Type {
	case protocol.MessageTypeStartSession:
		c.handleStartSession(msg)
	case protocol.MessageTypeResize:
		c.handleResize(msg)
	default:
		log.Printf("[Client] Unknown message type: %s", msg.Type)
	}
}

// handleStartSession starts a new PTY session
func (c *Client) handleStartSession(msg protocol.Message) {
	payloadBytes, err := json.Marshal(msg.Payload)
	if err != nil {
		log.Printf("[Client] Failed to marshal payload: %v", err)
		return
	}

	var payload protocol.StartSessionPayload
	if err := json.Unmarshal(payloadBytes, &payload); err != nil {
		log.Printf("[Client] Failed to parse start_session payload: %v", err)
		return
	}

	sessionID := payload.SessionID
	command := payload.Command

	// Create PTY
	pty, err := NewPTY(sessionID, command)
	if err != nil {
		log.Printf("[Client] Failed to create PTY: %v", err)
		c.sendError(sessionID, fmt.Sprintf("Failed to start PTY: %v", err))
		return
	}

	// Store session
	c.mu.Lock()
	c.sessions[sessionID] = pty
	c.mu.Unlock()

	// Send session_started confirmation
	c.sendSessionStarted(sessionID)

	// Start reading PTY output
	go c.streamPTYOutput(pty)

	// Wait for process to exit
	go func() {
		exitCode := pty.Wait()
		c.mu.Lock()
		delete(c.sessions, sessionID)
		c.mu.Unlock()

		c.sendSessionEnded(sessionID, exitCode)
		log.Printf("[Client] Session %s ended with exit code %d", sessionID, exitCode)
	}()
}

// handleResize resizes an active PTY session
func (c *Client) handleResize(msg protocol.Message) {
	payloadBytes, err := json.Marshal(msg.Payload)
	if err != nil {
		log.Printf("[Client] Failed to marshal payload: %v", err)
		return
	}

	var payload struct {
		SessionID string `json:"session_id"`
		Rows      int    `json:"rows"`
		Cols      int    `json:"cols"`
	}
	if err := json.Unmarshal(payloadBytes, &payload); err != nil {
		log.Printf("[Client] Failed to parse resize payload: %v", err)
		return
	}

	c.mu.RLock()
	pty, exists := c.sessions[payload.SessionID]
	c.mu.RUnlock()

	if !exists {
		log.Printf("[Client] Session %s not found for resize", payload.SessionID)
		return
	}

	if err := pty.Resize(payload.Rows, payload.Cols); err != nil {
		log.Printf("[Client] Failed to resize PTY: %v", err)
	}
}

// handleBinaryMessage processes binary data (terminal input)
func (c *Client) handleBinaryMessage(data []byte) {
	// Format: [session_id(36 bytes)][input_data]
	if len(data) < 36 {
		log.Printf("[Client] Invalid binary message: too short")
		return
	}

	sessionID := string(data[:36])
	inputData := data[36:]

	c.mu.RLock()
	pty, exists := c.sessions[sessionID]
	c.mu.RUnlock()

	if !exists {
		log.Printf("[Client] Session %s not found for input", sessionID)
		return
	}

	if err := pty.Write(inputData); err != nil {
		log.Printf("[Client] Failed to write to PTY: %v", err)
	}
}

// streamPTYOutput reads PTY output and sends it to HQ
func (c *Client) streamPTYOutput(pty *PTY) {
	sessionID := pty.SessionID()

	for {
		data, err := pty.Read()
		if err != nil {
			// PTY closed or error
			break
		}

		// Send binary message with session ID prefix
		// Format: [session_id(36 bytes)][pty_data]
		sessionBytes := []byte(sessionID)
		paddedSession := make([]byte, 36)
		copy(paddedSession, sessionBytes)

		fullData := append(paddedSession, data...)

		if err := c.writeMessage(websocket.BinaryMessage, fullData); err != nil {
			log.Printf("[Client] Failed to send PTY output: %v", err)
			break
		}
	}
}

// sendSessionStarted sends a session_started message
func (c *Client) sendSessionStarted(sessionID string) {
	msg := protocol.Message{
		Type: protocol.MessageTypeSessionStarted,
		Payload: protocol.SessionStartedPayload{
			SessionID: sessionID,
		},
	}
	c.writeJSON(msg)
}

// sendSessionEnded sends a session_ended message
func (c *Client) sendSessionEnded(sessionID string, exitCode int) {
	msg := protocol.Message{
		Type: protocol.MessageTypeSessionEnded,
		Payload: protocol.SessionEndedPayload{
			SessionID: sessionID,
			ExitCode:  exitCode,
		},
	}
	c.writeJSON(msg)
}

// sendError sends an error message
func (c *Client) sendError(sessionID, errMsg string) {
	msg := protocol.Message{
		Type: protocol.MessageTypeError,
		Payload: protocol.ErrorPayload{
			Message: errMsg,
		},
	}
	c.writeJSON(msg)
}

// writeJSON serializes access to the websocket connection for JSON messages
func (c *Client) writeJSON(msg protocol.Message) error {
	c.writeMu.Lock()
	defer c.writeMu.Unlock()
	return c.conn.WriteJSON(msg)
}

// writeMessage serializes access to the websocket connection for binary frames
func (c *Client) writeMessage(messageType int, data []byte) error {
	c.writeMu.Lock()
	defer c.writeMu.Unlock()
	return c.conn.WriteMessage(messageType, data)
}

// Close gracefully shuts down the client
func (c *Client) Close() {
	c.mu.Lock()
	c.closed = true
	c.reconnect = false

	// Close all sessions
	for _, pty := range c.sessions {
		pty.Close()
	}
	c.mu.Unlock()

	if c.conn != nil {
		c.conn.Close()
	}

	log.Printf("[Client] Client closed")
}
