.PHONY: build
build: build/server build/client

.PHONY: build/server
build/server:
	@echo Building server...
	$(MAKE) -C server build
	@echo Done building server

.PHONY: build/client
build/client:
	@echo Building client...
	cd client && VITE_API_URL=$(URL) npm run build
	@echo Done building client

.PHONY: deploy
deploy:
	rsync --mkpath -P ./server/bin/app $(SSH):~/tic-tac-goe/server
	rsync --mkpath -rP ./client/dist/* $(SSH):~/tic-tac-goe/client/
	rsync -P ./remote/tic-tac-goe.service $(SSH):~/
	rsync -P ./remote/tic-tac-goe.caddy $(SSH):~/
	ssh -t $(SSH) '\
		sudo mv ~/tic-tac-goe.service /etc/systemd/system/ \
		&& sudo systemctl enable tic-tac-goe \
		&& sudo systemctl restart tic-tac-goe \
		&& sudo mv ~/tic-tac-goe.caddy /etc/caddy/sites/ \
		&& sudo systemctl reload caddy \
		'
