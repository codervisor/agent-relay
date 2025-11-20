/**
 * TerminalWebSocket - WebSocket client for terminal connections
 * 
 * Handles communication between browser and HQ server for terminal sessions.
 */

type MessageType = 'start_session' | 'resize' | 'error' | 'session_started' | 'session_ended';

interface Message {
  type: MessageType;
  payload?: any;
}

interface StartSessionPayload {
  session_id: string;
  command?: string[];
}

interface ResizePayload {
  session_id: string;
  rows: number;
  cols: number;
}

export class TerminalWebSocket {
  private ws: WebSocket | null = null;
  private runnerID: string;
  private sessionID: string;
  private url: string;
  private onDataCallback?: (data: ArrayBuffer) => void;
  private onErrorCallback?: (error: string) => void;
  private onCloseCallback?: () => void;

  constructor(runnerID: string, sessionID: string) {
    this.runnerID = runnerID;
    this.sessionID = sessionID;
    
    // Build WebSocket URL (use ws:// for localhost, wss:// for production)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname === 'localhost' ? 'localhost:8080' : window.location.host;
    this.url = `${protocol}//${host}/ws/terminal/${runnerID}`;
  }

  /**
   * Connect to HQ and start terminal session
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);
        this.ws.binaryType = 'arraybuffer';

        this.ws.onopen = () => {
          console.log('[WS] Connected to HQ');
          
          // Send start_session message
          this.sendMessage({
            type: 'start_session',
            payload: {
              session_id: this.sessionID,
              command: ['/bin/bash'],
            } as StartSessionPayload,
          });

          resolve();
        };

        this.ws.onmessage = (event) => {
          if (event.data instanceof ArrayBuffer) {
            // Binary message - PTY output
            if (this.onDataCallback) {
              this.onDataCallback(event.data);
            }
          } else {
            // Text message - control message
            try {
              const msg = JSON.parse(event.data) as Message;
              this.handleControlMessage(msg);
            } catch (err) {
              console.error('[WS] Failed to parse control message:', err);
            }
          }
        };

        this.ws.onerror = (event) => {
          console.error('[WS] WebSocket error:', event);
          if (this.onErrorCallback) {
            this.onErrorCallback('WebSocket connection error');
          }
          reject(new Error('WebSocket connection failed'));
        };

        this.ws.onclose = () => {
          console.log('[WS] Disconnected from HQ');
          if (this.onCloseCallback) {
            this.onCloseCallback();
          }
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Send terminal input to runner
   */
  send(data: string | Uint8Array): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[WS] Cannot send: not connected');
      return;
    }

    // Convert string to Uint8Array if needed
    const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
    
    // Send as binary message
    this.ws.send(bytes);
  }

  /**
   * Send terminal resize event
   */
  resize(rows: number, cols: number): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[WS] Cannot resize: not connected');
      return;
    }

    this.sendMessage({
      type: 'resize',
      payload: {
        session_id: this.sessionID,
        rows,
        cols,
      } as ResizePayload,
    });
  }

  /**
   * Register callback for PTY output data
   */
  onData(callback: (data: ArrayBuffer) => void): void {
    this.onDataCallback = callback;
  }

  /**
   * Register callback for errors
   */
  onError(callback: (error: string) => void): void {
    this.onErrorCallback = callback;
  }

  /**
   * Register callback for connection close
   */
  onClose(callback: () => void): void {
    this.onCloseCallback = callback;
  }

  /**
   * Close the WebSocket connection
   */
  close(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Handle control messages from HQ
   */
  private handleControlMessage(msg: Message): void {
    switch (msg.type) {
      case 'session_started':
        console.log('[WS] Session started');
        break;
      case 'session_ended':
        console.log('[WS] Session ended:', msg.payload);
        if (this.onCloseCallback) {
          this.onCloseCallback();
        }
        break;
      case 'error':
        console.error('[WS] Error from server:', msg.payload);
        if (this.onErrorCallback) {
          this.onErrorCallback(msg.payload?.message || 'Unknown error');
        }
        break;
      default:
        console.log('[WS] Unknown message type:', msg.type);
    }
  }

  /**
   * Send a control message
   */
  private sendMessage(msg: Message): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[WS] Cannot send message: not connected');
      return;
    }

    this.ws.send(JSON.stringify(msg));
  }
}
