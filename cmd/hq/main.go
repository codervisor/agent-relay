package main

import (
	"log"
	"os"

	"github.com/codervisor/agent-relay/internal/server"
	"github.com/gin-gonic/gin"
)

func main() {
	// Get configuration from environment
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Create connection hub
	hub := server.NewHub()

	// Setup Gin router
	r := gin.Default()

	// CORS for development
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"runners": hub.ListRunners(),
		})
	})

	// WebSocket endpoints
	r.GET("/ws/runner", server.HandleRunnerConnection(hub))
	r.GET("/ws/terminal/:runner_id", server.HandleTerminalConnection(hub))

	// API endpoint to list runners
	r.GET("/api/runners", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"runners": hub.ListRunners(),
		})
	})

	log.Printf("HQ starting on :%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}
