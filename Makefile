.PHONY: help build build-web run-hq run-runner run-web clean test verify

help:
	@echo "AgentRelay Makefile"
	@echo "==================="
	@echo "build        - Build both HQ and Runner binaries"
	@echo "build-web    - Build the web frontend"
	@echo "run-hq       - Run the HQ server"
	@echo "run-runner   - Run the Runner"
	@echo "run-web      - Run the web frontend dev server"
	@echo "verify       - Verify system is running correctly"
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
	@cd web && pnpm run build
	@echo "Web build complete!"

run-hq:
	@./bin/hq

run-runner:
	@./bin/runner --runner-id $${RUNNER_ID:-local-runner} --token $${RUNNER_TOKEN:-dev-token}

run-web:
	@cd web && pnpm run dev

verify:
	@./scripts/verify.sh

clean:
	@rm -rf bin/
	@rm -rf web/dist/

test:
	@go test ./...
