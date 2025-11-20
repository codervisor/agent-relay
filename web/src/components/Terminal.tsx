import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { TerminalWebSocket } from '../lib/websocket';
import 'xterm/css/xterm.css';

interface TerminalProps {
  runnerID: string;
  sessionID?: string;
}

export const Terminal: React.FC<TerminalProps> = ({ runnerID, sessionID }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<TerminalWebSocket | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const stableSessionIDRef = useRef<string>(sessionID ?? crypto.randomUUID());

  // Keep session ID stable unless an explicit one is provided and changes
  useEffect(() => {
    if (sessionID && sessionID !== stableSessionIDRef.current) {
      stableSessionIDRef.current = sessionID;
    }
  }, [sessionID]);

  const stableSessionID = stableSessionIDRef.current;

  useEffect(() => {
    if (!terminalRef.current) return;

    // Create terminal instance
    const term = new XTerm({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
      },
      rows: 24,
      cols: 80,
    });

    // Add addons
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(new WebLinksAddon());

    // Open terminal in DOM
    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Create WebSocket connection
    const ws = new TerminalWebSocket(runnerID, stableSessionID);
    wsRef.current = ws;

    // Handle PTY output
    ws.onData((data) => {
      const text = new TextDecoder().decode(data);
      term.write(text);
    });

    // Handle errors
    ws.onError((error) => {
      setError(error);
      term.writeln(`\r\n\x1b[31mError: ${error}\x1b[0m`);
    });

    // Handle close
    ws.onClose(() => {
      setConnected(false);
      term.writeln('\r\n\x1b[33mConnection closed\x1b[0m');
    });

    // Connect to HQ
    ws.connect()
      .then(() => {
        setError(null);
        setConnected(true);
        term.writeln('\x1b[32mConnected to runner\x1b[0m\r\n');
      })
      .catch((err) => {
        setError(err.message);
        term.writeln(`\r\n\x1b[31mFailed to connect: ${err.message}\x1b[0m`);
      });

    // Handle terminal input
    term.onData((data) => {
      if (ws) {
        ws.send(data);
      }
    });

    // Handle terminal resize
    term.onResize(({ rows, cols }) => {
      if (ws) {
        ws.resize(rows, cols);
      }
    });

    // Handle window resize
    const handleResize = () => {
      fitAddon.fit();
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      ws.close();
      term.dispose();
    };
  }, [runnerID, stableSessionID]);

  return (
    <div className="flex flex-col h-full">
      {error && (
        <div className="bg-red-500 text-white px-4 py-2 text-sm">
          Error: {error}
        </div>
      )}
      {!connected && !error && (
        <div className="bg-blue-500 text-white px-4 py-2 text-sm">
          Connecting to runner {runnerID}...
        </div>
      )}
      <div ref={terminalRef} className="flex-1" />
    </div>
  );
};
