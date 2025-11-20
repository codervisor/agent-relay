package agent

import (
	"fmt"
	"io"
	"log"
	"os"
	"os/exec"
	"sync"

	"github.com/creack/pty"
)

// PTY represents a pseudo-terminal session
type PTY struct {
	cmd       *exec.Cmd
	ptmx      *os.File
	sessionID string
	mu        sync.Mutex
	closed    bool
}

// NewPTY creates a new PTY instance
func NewPTY(sessionID string, command []string) (*PTY, error) {
	if len(command) == 0 {
		command = []string{"/bin/bash"}
	}

	cmd := exec.Command(command[0], command[1:]...)

	// Set environment variables
	cmd.Env = append(os.Environ(),
		"TERM=xterm-256color",
		"COLORTERM=truecolor",
	)

	ptmx, err := pty.Start(cmd)
	if err != nil {
		return nil, fmt.Errorf("failed to start PTY: %w", err)
	}

	p := &PTY{
		cmd:       cmd,
		ptmx:      ptmx,
		sessionID: sessionID,
		closed:    false,
	}

	log.Printf("[PTY] Started session %s with command: %v", sessionID, command)
	return p, nil
}

// Read reads output from the PTY
// Returns data or error (including io.EOF when PTY closes)
func (p *PTY) Read() ([]byte, error) {
	p.mu.Lock()
	if p.closed {
		p.mu.Unlock()
		return nil, io.EOF
	}
	p.mu.Unlock()

	buf := make([]byte, 4096)
	n, err := p.ptmx.Read(buf)
	if err != nil {
		return nil, err
	}
	return buf[:n], nil
}

// Write writes input to the PTY
func (p *PTY) Write(data []byte) error {
	p.mu.Lock()
	defer p.mu.Unlock()

	if p.closed {
		return fmt.Errorf("PTY is closed")
	}

	_, err := p.ptmx.Write(data)
	return err
}

// Resize changes the PTY dimensions
func (p *PTY) Resize(rows, cols int) error {
	p.mu.Lock()
	defer p.mu.Unlock()

	if p.closed {
		return fmt.Errorf("PTY is closed")
	}

	size := &pty.Winsize{
		Rows: uint16(rows),
		Cols: uint16(cols),
	}

	if err := pty.Setsize(p.ptmx, size); err != nil {
		return fmt.Errorf("failed to resize PTY: %w", err)
	}

	log.Printf("[PTY] Resized session %s to %dx%d", p.sessionID, cols, rows)
	return nil
}

// Wait waits for the PTY process to exit and returns the exit code
func (p *PTY) Wait() int {
	if err := p.cmd.Wait(); err != nil {
		if exitErr, ok := err.(*exec.ExitError); ok {
			return exitErr.ExitCode()
		}
		return 1
	}
	return 0
}

// Close closes the PTY and terminates the process
func (p *PTY) Close() error {
	p.mu.Lock()
	defer p.mu.Unlock()

	if p.closed {
		return nil
	}

	p.closed = true

	// Close the PTY file descriptor
	if err := p.ptmx.Close(); err != nil {
		log.Printf("[PTY] Error closing ptmx: %v", err)
	}

	// Kill the process if still running
	if p.cmd.Process != nil {
		if err := p.cmd.Process.Kill(); err != nil {
			log.Printf("[PTY] Error killing process: %v", err)
		}
	}

	log.Printf("[PTY] Closed session %s", p.sessionID)
	return nil
}

// SessionID returns the session ID
func (p *PTY) SessionID() string {
	return p.sessionID
}
