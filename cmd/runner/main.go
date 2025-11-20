package main

import (
	"flag"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/codervisor/agent-relay/internal/agent"
)

func main() {
	// Parse CLI flags
	hqURL := flag.String("hq-url", getEnv("HQ_URL", "ws://localhost:8080/ws/runner"), "HQ WebSocket URL")
	runnerID := flag.String("runner-id", getEnv("RUNNER_ID", getHostname()), "Unique runner ID")
	token := flag.String("token", getEnv("RUNNER_TOKEN", "dev-token"), "Authentication token")
	flag.Parse()

	log.Printf("Runner starting...")
	log.Printf("  Runner ID: %s", *runnerID)
	log.Printf("  HQ URL: %s", *hqURL)

	// Create client
	client := agent.NewClient(*hqURL, *runnerID, *token)

	// Handle shutdown signals
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)

	go func() {
		<-sigChan
		log.Printf("Shutdown signal received, closing...")
		client.Close()
		os.Exit(0)
	}()

	// Run client (blocks until closed)
	client.Run()
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getHostname() string {
	hostname, err := os.Hostname()
	if err != nil {
		return "unknown-runner"
	}
	return hostname
}
