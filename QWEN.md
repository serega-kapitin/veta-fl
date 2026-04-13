# Veta-FL Project Context

## Overview
Full-stack web application with React frontend, FastAPI backend, and PostgreSQL database, orchestrated via Docker Compose.

## Architecture
- **Frontend**: React 19 (Create React App) → Nginx (SPA serving)
- **Backend**: FastAPI + Uvicorn (Python 3.12)
- **Database**: PostgreSQL 15
- **Reverse Proxy**: Nginx (routes traffic to frontend/backend)
- **SSL**: Certbot-ready (directories prepared, not yet configured)

## Services (docker-compose.yml)
| Service | Internal Port | External | Notes |
|---------|--------------|----------|-------|
| postgres | 5432 | 5433 | Volume: postgres_data |
| backend | 8000 | — | FastAPI/Uvicorn |
| frontend | 80 | — | React + Nginx |
| nginx | — | 80, 443 | Reverse proxy, domain: veta-fl.ru |

## Backend API
- `POST /api/auth` — Login (returns JWT), body: `{login, password}`
- `GET /api/me` — Get current user info (requires Bearer token)
- `GET /docs` — Swagger UI
- `GET /redoc` — ReDoc

## Database Schema
- Table: `user`
  - `login` (VARCHAR, PK)
  - `password` (VARCHAR, SHA256 hash of login+password)

## Key Files
- Backend entry: `backend/app/main.py`
- DB models: `backend/app/models.py`
- JWT logic: `backend/app/jwt_handler.py`
- Nginx proxy: `nginx/default.conf`
- Docker Compose: `docker-compose.yml`

## Known Issues
1. Password hashing uses raw SHA256 (bcrypt/passlib in requirements but unused)
2. `GET /api/me` returns password hash to client
3. No HTTPS configured (port 443 open but no SSL certs)
4. No rate limiting on `/api/auth`
5. Type bug in jwt_handler.py: `login: int` should be `str`
6. No automatic DB table creation (`Base.metadata.create_all()` missing)
7. Frontend is empty CRA template — no auth UI, no API calls, no routing
8. No `.env.example` template

## Development Commands
```bash
# Start all services
docker-compose up -d

# Backend dependencies
pip install -r backend/requirements.txt

# Frontend dev server
cd frontend && npm start

# Build frontend
cd frontend && npm run build

# Run backend directly
uvicorn backend.app.main:app --reload --port 8000
```

## Environment Variables (.env)
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `JWT_SECRET_KEY`
- `JWT_ALGORITHM` (default: HS256)
- `ACCESS_TOKEN_EXPIRE_MINUTES` (default: 30)

## Qwen Added Memories
- Veta-FL — это бухгалтерское приложение для нескольких пользователей, где ведутся приходно-расходные операции покупок и продаж цветов, сопутствующих товаров и расходных материалов.
