package protocol

type MessageType string

const (
	MessageTypeResize      MessageType = "resize"
	MessageTypeStartSession MessageType = "start_session"
	MessageTypeRegister    MessageType = "register"
)

type Message struct {
	Type    MessageType     `json:"type"`
	Payload interface{}     `json:"payload,omitempty"`
}

type ResizePayload struct {
	Rows int `json:"rows"`
	Cols int `json:"cols"`
}

type StartSessionPayload struct {
	SessionID string   `json:"session_id"`
	Command   []string `json:"command"`
}

type RegisterPayload struct {
	Token string `json:"token"`
}
