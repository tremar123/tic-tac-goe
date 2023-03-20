.PHONY: run
run:
	@go run ./cmd

.PHONY: run/clients
run/clients:
	./clients.sh
