# Veta-FL Project Context

## Overview
Бухгалтерское приложение для учёта покупок и продаж цветов, сопутствующих товаров и расходных материалов. Несколько пользователей, приходно-расходные операции.

**Стек**: React 19 + FastAPI + PostgreSQL 15 + Docker Compose

## Architecture
- **Frontend**: React 19 (CRA) → Nginx (SPA)
- **Backend**: FastAPI + Uvicorn (Python 3.12)
- **Database**: PostgreSQL 15
- **Reverse Proxy**: Nginx (routes frontend + backend API + Swagger)
- **SSL**: Certbot-ready (directories prepared, not configured)

## Services (docker-compose.yml)
| Service | Internal | External | Notes |
|---------|----------|----------|-------|
| postgres | 5432 | 5433 | Volume: postgres_data |
| backend | 8000 | — | FastAPI/Uvicorn |
| frontend | 80 | — | React build + Nginx |
| nginx | — | 80, 443 | Reverse proxy, domain: veta-fl.ru |

## Backend API

### Auth (`routers/auth.py`)
- `POST /api/auth` — Login, body: `{login, password}`, returns `{access_token, token_type}`

### Profile (`routers/profile.py`)
- `GET /api/profile` — Returns `{login, name}` (Bearer required)
- `PUT /api/profile` — Update name and/or password (Bearer required)
  - Body: `{name?, current_password?, new_password?}`
  - Verifies current password before changing

### Flowers (`routers/flowers.py`)
- `GET /api/flowers?sold=false` — Unsold flowers (default)
- `GET /api/flowers?sold=true` — Sold flowers
  - Bearer required
  - Returns `[{id, name, foto_base64, buy_price, buy_date, sell_price, sell_date}]`
  - `foto_base64`: PNG image as base64 string (40x40 colored placeholder)

### Docs
- `GET /docs` — Swagger UI
- `GET /redoc` — ReDoc

## Database Schema

### `user`
| Column | Type | Nullable |
|--------|------|----------|
| login | VARCHAR | PK, NOT NULL |
| password | VARCHAR | NOT NULL (SHA256 of login+password) |
| name | VARCHAR | YES |

### `flower`
| Column | Type | Nullable |
|--------|------|----------|
| id | SERIAL | PK |
| name | VARCHAR | NOT NULL |
| foto | BYTEA | YES |
| buy_price | FLOAT | YES |
| buy_date | DATE | YES |
| sell_price | FLOAT | YES |
| sell_date | DATE | YES |

**Migrations**: `backend/migrations/`
- `001_add_user_name.sql` — adds `name` column
- `002_create_flower_table.sql` — creates `flower` table

## Backend Structure
```
backend/app/
├── main.py              — FastAPI app + include_router
├── routers/
│   ├── __init__.py
│   ├── auth.py          — POST /api/auth
│   ├── profile.py       — GET/PUT /api/profile
│   └── flowers.py       — GET /api/flowers
├── schemas.py           — Pydantic: AuthRequest, FlowerResponse
├── models.py            — SQLAlchemy: User, Flower
├── database.py          — DB session
└── jwt_handler.py       — create_access_token, verify_token
```

## Frontend Structure
```
frontend/src/
├── App.js               — BrowserRouter, routes, profile fetch
├── services/
│   ├── api.js           — Axios instance (token interceptor, 401 redirect)
│   └── auth.js          — login, getProfile, updateProfile, logout
├── components/
│   ├── PrivateRoute.js  — Auth guard
│   ├── Sidebar.js       — Nav: Operations, Counterparties, Warehouse, Reports, Settings
│   ├── Header.js        — Page title
│   └── OperationsTable.js — Mock ops table with filters
├── pages/
│   ├── LoginPage.js     — Login form
│   ├── MainPage.js      — Operations journal (Sidebar + Header + table)
│   └── ProfilePage.js   — Edit name + change password
└── data/
    └── mockOperations.js — Mock data for ops table
```

## Frontend Flow
1. User opens app → `App.js` calls `GET /api/profile` on mount
2. No token → axios interceptor redirects to `/login` (no loop guard)
3. Login → `POST /api/auth` → token saved → full page reload → profile fetched
4. Sidebar shows user name (from profile) + avatar (first letter of name/login)
5. Click avatar/name → `/profile` page → edit name, change password
6. Logout → `localStorage` cleared → `window.location.href = '/login'`

## Key Files
- `docker-compose.yml` — service orchestration
- `nginx/default.conf` — reverse proxy config
- `backend/app/main.py` — FastAPI entry point
- `backend/app/routers/` — API route modules
- `backend/app/models.py` — DB models
- `frontend/src/App.js` — React router setup
- `frontend/src/services/auth.js` — auth API calls
- `frontend/src/components/Sidebar.js` — main navigation

## Development Commands
```bash
# Start all services
docker compose up -d --build

# Stop
docker compose down

# Run migration
docker exec postgres_db psql -U vetafl -d vetafl -f /docker-entrypoint-initdb.d/migration.sql
# or via docker compose exec with file redirect

# Frontend dev server
cd frontend && npm start

# Build frontend
cd frontend && npm run build
```

## Environment Variables (.env)
- `POSTGRES_USER` (vetafl)
- `POSTGRES_PASSWORD`
- `POSTGRES_DB` (vetafl)
- `JWT_SECRET_KEY`
- `JWT_ALGORITHM` (HS256)
- `ACCESS_TOKEN_EXPIRE_MINUTES` (30)

## Branches
- `main` — stable
- `feature/frontend` — merged (login, main page, profile, operations)
- `feature/user-profile` — merged (profile API, name field, sidebar display)
- `feature/flower-management` — active (flower table, GET /api/flowers)

## Known Issues
1. SHA256 for password hashing (bcrypt/passlib in requirements but unused)
2. No HTTPS (port 443 open but no SSL certs)
3. No rate limiting on `/api/auth`
4. No auto DB table creation (`Base.metadata.create_all()` missing)
5. Operations page uses mock data — no real API endpoints yet
