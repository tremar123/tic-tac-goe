.PHONY: run
run:
	@go run ./cmd

.PHONY: run/clients
run/clients:
	@./clients.sh

.PHONY: audit
audit:
	@echo "Tidying and verifying module dependencies..."
	go mod tidy
	go mod verify
	@echo "Formatting code..."
	go fmt ./...
	@echo "Vetting code..."
	go vet ./...
	staticcheck ./...

.PHONY: build
build:
	CGO_ENABLED=0 go build -ldflags="-s" -o=./bin/app ./cmd/
