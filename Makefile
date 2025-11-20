.PHONY: help build run-hq run-runner clean test

help:
	@echo "AgentRelay Makefile"
	@echo "==================="
	@echo "build        - Build both HQ and Runner binaries"
	@echo "run-hq       - Run the HQ server"
	@echo "run-runner   - Run the Runner"
	@echo "clean        - Remove built binaries"
	@echo "test         - Run tests"

build:
	@echo "Building HQ..."
	@go build -o bin/hq ./cmd/hq
	@echo "Building Runner..."
	@go build -o bin/runner ./cmd/runner
	@echo "Build complete!"

run-hq:
	@go run ./cmd/hq

run-runner:
	@go run ./cmd/runner

clean:
	@rm -rf bin/

test:
	@go test ./...
