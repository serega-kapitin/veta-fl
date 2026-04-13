# Veta-FL Makefile
# Quick commands for common development tasks
# All builds use local cache only — no DockerHub pull/push

.PHONY: help up down build rebuild logs backend-logs frontend-logs shell-backend shell-frontend shell-db test

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

up: ## Start all services
	docker compose up -d

down: ## Stop all services
	docker compose down

build: ## Rebuild and start (local cache only, no registry pull)
	docker compose build --pull=never
	docker compose up -d

rebuild: ## Force rebuild without cache (no registry pull)
	docker compose build --pull=never --no-cache
	docker compose up -d

logs: ## Show logs from all services
	docker compose logs -f

backend-logs: ## Show backend logs
	docker compose logs -f backend

frontend-logs: ## Show frontend logs
	docker compose logs -f frontend

db-logs: ## Show database logs
	docker compose logs -f postgres

nginx-logs: ## Show nginx proxy logs
	docker compose logs -f nginx

shell-backend: ## Open shell in backend container
	docker compose exec backend sh

shell-frontend: ## Open shell in frontend container
	docker compose exec frontend sh

shell-db: ## Open psql in postgres container
	docker compose exec postgres psql -U $${POSTGRES_USER:-user} -d $${POSTGRES_DB:-db}

restart-backend: ## Restart backend service
	docker compose restart backend

restart-frontend: ## Restart frontend service
	docker compose restart frontend

restart-nginx: ## Restart nginx proxy
	docker compose restart nginx

clean: ## Remove all containers, volumes, and local images
	docker compose down -v --rmi local

init-db: ## Create database tables (run once)
	docker compose exec backend python -c "from app.database import engine; from app.models import Base; Base.metadata.create_all(bind=engine); print('Tables created')"
