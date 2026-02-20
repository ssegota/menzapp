.PHONY: install run run-frontend run-backend

install:
	cd client && npm install
	cd server && npm install

run-frontend:
	cd client && npm run dev

run-backend:
	cd server && node index.js

run:
	@echo "Starting both backend and frontend servers..."
	$(MAKE) -j2 run-backend run-frontend

run-frontend-host:
	cd client && npm run dev -- --host

host:
	@echo "Starting both backend and frontend servers on host network..."
	$(MAKE) -j2 run-backend run-frontend-host
