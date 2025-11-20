package protocol

// MessageType defines the type of control message sent over WebSocket
type MessageType string

const (
	// Runner -> HQ registration
	MessageTypeRegister MessageType = "register"

	// Client -> Runner session control
	MessageTypeStartSession MessageType = "start_session"
	MessageTypeResize       MessageType = "resize"

	// Bidirectional status messages
	MessageTypeSessionStarted MessageType = "session_started"
	MessageTypeSessionEnded   MessageType = "session_ended"
	MessageTypeError          MessageType = "error"
)

// Message is the base structure for all control messages
// Binary frames (PTY I/O) are sent separately without this wrapper
type Message struct {
	Type    MessageType `json:"type"`
	Payload interface{} `json:"payload,omitempty"`
}

// RegisterPayload is sent by Runner to HQ to register itself
type RegisterPayload struct {
	RunnerID string `json:"runner_id"` // Unique identifier for this runner
	Token    string `json:"token"`     // Authentication token
}

// StartSessionPayload is sent by client to start a new PTY session
type StartSessionPayload struct {
	SessionID string   `json:"session_id"` // Client-generated session ID
	Command   []string `json:"command"`    // Command to execute (default: ["/bin/bash"])
}

// ResizePayload is sent when terminal dimensions change
type ResizePayload struct {
	Rows int `json:"rows"`
	Cols int `json:"cols"`
}

// SessionStartedPayload confirms successful session creation
type SessionStartedPayload struct {
	SessionID string `json:"session_id"`
}

// SessionEndedPayload notifies session termination
type SessionEndedPayload struct {
	SessionID string `json:"session_id"`
	ExitCode  int    `json:"exit_code"`
}

// ErrorPayload contains error information
type ErrorPayload struct {
	Message string `json:"message"`
	Code    string `json:"code,omitempty"`
}
