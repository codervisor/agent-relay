.PHONY: help build build-web run-hq run-runner run-web clean test

help:
	@echo "AgentRelay Makefile"
	@echo "==================="
	@echo "build        - Build both HQ and Runner binaries"
	@echo "build-web    - Build the web frontend"
	@echo "run-hq       - Run the HQ server"
	@echo "run-runner   - Run the Runner"
	@echo "run-web      - Run the web frontend dev server"
	@echo "clean        - Remove built binaries"
	@echo "test         - Run tests"

build:
	@echo "Building HQ..."
	@go build -o bin/hq ./cmd/hq
	@echo "Building Runner..."
	@go build -o bin/runner ./cmd/runner
	@echo "Build complete!"

build-web:
	@echo "Building web frontend..."
	@cd web && npm run build
	@echo "Web build complete!"

run-hq:
	@go run ./cmd/hq

run-runner:
	@go run ./cmd/runner

run-web:
	@cd web && npm run dev

clean:
	@rm -rf bin/
	@rm -rf web/dist/

test:
	@go test ./...
