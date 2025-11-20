package server

import (
	"fmt"
	"log"
	"sync"

	"github.com/gorilla/websocket"
)

// RunnerConn represents a connected runner agent
type RunnerConn struct {
	ID       string
	Conn     *websocket.Conn
	Sessions map[string]*ClientConn // session_id -> client
	mu       sync.RWMutex
}

// ClientConn represents a connected browser client
type ClientConn struct {
	SessionID string
	RunnerID  string
	Conn      *websocket.Conn
}

// Hub manages all active connections and routes messages between clients and runners
type Hub struct {
	runners  map[string]*RunnerConn // runner_id -> runner
	clients  map[string]*ClientConn // session_id -> client
	sessions map[string]string      // session_id -> runner_id
	mu       sync.RWMutex
}

// NewHub creates a new connection hub
func NewHub() *Hub {
	return &Hub{
		runners:  make(map[string]*RunnerConn),
		clients:  make(map[string]*ClientConn),
		sessions: make(map[string]string),
	}
}

// RegisterRunner adds a new runner to the hub
func (h *Hub) RegisterRunner(id string, conn *websocket.Conn) error {
	h.mu.Lock()
	defer h.mu.Unlock()

	if _, exists := h.runners[id]; exists {
		return fmt.Errorf("runner %s already registered", id)
	}

	h.runners[id] = &RunnerConn{
		ID:       id,
		Conn:     conn,
		Sessions: make(map[string]*ClientConn),
	}

	log.Printf("[Hub] Runner registered: %s", id)
	return nil
}

// UnregisterRunner removes a runner and cleans up all its sessions
func (h *Hub) UnregisterRunner(id string) {
	h.mu.Lock()
	defer h.mu.Unlock()

	runner, exists := h.runners[id]
	if !exists {
		return
	}

	// Close all client connections for this runner
	runner.mu.RLock()
	for sessionID, client := range runner.Sessions {
		if client.Conn != nil {
			client.Conn.Close()
		}
		delete(h.clients, sessionID)
		delete(h.sessions, sessionID)
	}
	runner.mu.RUnlock()

	delete(h.runners, id)
	log.Printf("[Hub] Runner unregistered: %s", id)
}

// RegisterClient links a browser client to a runner session
func (h *Hub) RegisterClient(sessionID, runnerID string, conn *websocket.Conn) error {
	h.mu.Lock()
	defer h.mu.Unlock()

	runner, exists := h.runners[runnerID]
	if !exists {
		return fmt.Errorf("runner %s not found", runnerID)
	}

	if _, exists := h.clients[sessionID]; exists {
		return fmt.Errorf("session %s already exists", sessionID)
	}

	client := &ClientConn{
		SessionID: sessionID,
		RunnerID:  runnerID,
		Conn:      conn,
	}

	h.clients[sessionID] = client
	h.sessions[sessionID] = runnerID

	runner.mu.Lock()
	runner.Sessions[sessionID] = client
	runner.mu.Unlock()

	log.Printf("[Hub] Client registered: session=%s runner=%s", sessionID, runnerID)
	return nil
}

// UnregisterClient removes a client connection
func (h *Hub) UnregisterClient(sessionID string) {
	h.mu.Lock()
	defer h.mu.Unlock()

	client, exists := h.clients[sessionID]
	if !exists {
		return
	}

	// Remove from runner's session map
	if runner, exists := h.runners[client.RunnerID]; exists {
		runner.mu.Lock()
		delete(runner.Sessions, sessionID)
		runner.mu.Unlock()
	}

	delete(h.clients, sessionID)
	delete(h.sessions, sessionID)

	log.Printf("[Hub] Client unregistered: session=%s", sessionID)
}

// RouteToRunner sends a message from a client to its associated runner
func (h *Hub) RouteToRunner(sessionID string, messageType int, data []byte) error {
	h.mu.RLock()
	defer h.mu.RUnlock()

	client, exists := h.clients[sessionID]
	if !exists {
		return fmt.Errorf("session %s not found", sessionID)
	}

	runner, exists := h.runners[client.RunnerID]
	if !exists {
		return fmt.Errorf("runner %s not found", client.RunnerID)
	}

	return runner.Conn.WriteMessage(messageType, data)
}

// RouteToClient sends a message from a runner to a specific client
func (h *Hub) RouteToClient(sessionID string, messageType int, data []byte) error {
	h.mu.RLock()
	defer h.mu.RUnlock()

	client, exists := h.clients[sessionID]
	if !exists {
		return fmt.Errorf("session %s not found", sessionID)
	}

	return client.Conn.WriteMessage(messageType, data)
}

// GetRunner returns a runner connection by ID
func (h *Hub) GetRunner(id string) (*RunnerConn, bool) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	runner, exists := h.runners[id]
	return runner, exists
}

// ListRunners returns a list of all registered runner IDs
func (h *Hub) ListRunners() []string {
	h.mu.RLock()
	defer h.mu.RUnlock()

	ids := make([]string, 0, len(h.runners))
	for id := range h.runners {
		ids = append(ids, id)
	}
	return ids
}

// GetRunnerForSession returns the runner ID associated with a session
func (h *Hub) GetRunnerForSession(sessionID string) (string, bool) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	runnerID, exists := h.sessions[sessionID]
	return runnerID, exists
}
