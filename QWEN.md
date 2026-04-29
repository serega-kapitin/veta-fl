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
| nginx | — | 80, 443 | Reverse proxy, domain: veta-fl.ru, client_max_body_size 20M |

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
- `GET /api/flowers?sold=true` — All flowers (sold + unsold)
  - Bearer required
  - Returns `[{id, name, foto_base64, buy_price, buy_date, sell_price, sell_date}]`
  - `foto_base64`: PNG image as base64 string (40x40 colored placeholder or real photo)
- `POST /api/flowers/{id}/sell` — Sell a flower
  - Body: `{sell_price: float}`
  - 404 if flower not found, 409 if already sold
  - Sets sell_price/sell_date, creates Operation record
- `PUT /api/flowers/{id}/photo` — Upload/replace flower photo
  - Multipart form with `file` field
  - Allowed types: jpeg, png, webp, gif, bmp (max 20MB)
  - 404 if not found, 409 if sold, 400 if invalid type/empty/too large

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
| foto | BYTEA | YES (PNG/JPEG up to 20MB) |
| buy_price | FLOAT | YES |
| buy_date | DATE | YES |
| sell_price | FLOAT | YES |
| sell_date | DATE | YES |

### `operation`
| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | SERIAL | PK | |
| operation_type | VARCHAR | NOT NULL | 'SELL', 'BUY', etc. |
| flower_id | INTEGER | NOT NULL | FK → flower(id) |
| date | DATE | NOT NULL | |
| price_add | FLOAT | YES | |
| price_subtr | FLOAT | YES | |
| user_login | VARCHAR | NOT NULL | FK → user(login) |

**Migrations**: `backend/migrations/`
- `001_add_user_name.sql` — adds `name` column to user
- `002_create_flower_table.sql` — creates `flower` table
- `003_create_operation_table.sql` — creates `operation` table

## Backend Structure
```
backend/app/
├── main.py              — FastAPI app + include_router (10 lines)
├── routers/
│   ├── __init__.py
│   ├── auth.py          — POST /api/auth
│   ├── profile.py       — GET/PUT /api/profile
│   └── flowers.py       — GET/POST/PUT /api/flowers/*
├── schemas.py           — Pydantic: AuthRequest, FlowerResponse, SellRequest
├── models.py            — SQLAlchemy: User, Flower, Operation
├── database.py          — DB session (sessionmaker)
└── jwt_handler.py       — create_access_token, verify_token
tests/
└── test_main.py         — 53 pytest tests
```

## Frontend Structure
```
frontend/src/
├── App.js               — BrowserRouter, routes, profile fetch on mount
├── App.test.js          — 23 Jest tests (SellModal, EditModal, format functions)
├── utils.test.js        — 35 Jest tests (sorting, selection, filter, format)
├── services/
│   ├── api.js           — Axios instance (token interceptor, 401 redirect guard)
│   ├── auth.js          — login, logout, getProfile, updateProfile, isAuthenticated, getCurrentUsername
│   └── flowers.js       — getFlowers, sellFlower, updateFlowerPhoto
├── components/
│   ├── PrivateRoute.js  — Auth guard (redirects to /login if not authenticated)
│   ├── Sidebar.js       — Nav: Операции, Цветы. User avatar/name + logout
│   ├── Header.js        — Page title only
│   ├── SellModal.js     — Sell flower modal with price input + validation
│   └── EditModal.js     — Edit flower modal with photo upload + validation
├── pages/
│   ├── LoginPage.js     — Login form (username + password)
│   ├── MainPage.js      — Operations journal (Sidebar + Header + mock table)
│   └── FlowersPage.js   — Flower grid with sorting, selection, sell/edit actions
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

### Flowers Page
- **Grid** with columns: Photo, Name, Buy Price, Buy Date, Sell Price, Sell Date
- **Sorting**: Click headers to cycle asc → desc → clear. Nulls always last.
- **Selection**: Single row selection. Click to select/deselect/switch.
- **Filter**: "Включая проданные" checkbox (default off = unsold only).
- **Actions**:
  - `+ Купить цветок` — always active (stub)
  - `Изменить цветок` — active when row selected → opens EditModal with photo upload
  - `Продать цветок` — active when row selected → opens SellModal with price input
- **Scroll**: Only table body scrolls. Header, toolbar, footer stay fixed (height: 100vh layout).

### Sell Modal
- Shows flower name, photo, buy price
- Price input with validation (must be > 0)
- On success: closes modal, refreshes grid
- On error: shows API error message

### Edit Modal
- Shows flower name, photo, buy price
- "Изменить фото" button → file picker (images only, max 20MB)
- On success: shows "Фото обновлено", refreshes grid
- On error: shows API error (invalid type, too large, sold flower, etc.)
- Handles nginx 413 gracefully

## Key Files
- `docker-compose.yml` — service orchestration
- `nginx/default.conf` — reverse proxy, client_max_body_size 20M
- `backend/app/main.py` — FastAPI entry point (10 lines)
- `backend/app/routers/` — API route modules (auth, profile, flowers)
- `backend/app/models.py` — DB models (User, Flower, Operation)
- `frontend/src/App.js` — React router setup
- `frontend/src/services/auth.js` — auth API calls
- `frontend/src/services/flowers.js` — flowers API calls
- `frontend/src/pages/FlowersPage.js` — main flower grid page
- `frontend/src/components/Sidebar.js` — main navigation

## Development Commands
```bash
# Start all services
docker compose up -d --build

# Stop
docker compose down

# Build (local cache only, no DockerHub pull)
docker compose build
docker compose up -d

# Rebuild without cache
docker compose build --no-cache
docker compose up -d

# Run backend tests
cd backend && PYTHONPATH=. .venv/bin/pytest tests/ -v

# Run frontend tests
cd frontend && npm test

# Frontend dev server
cd frontend && npm start

# Build frontend
cd frontend && npm run build

# Run migration
cat backend/migrations/NNN_xxx.sql | docker exec -i postgres_db psql -U vetafl -d vetafl

# Open psql
docker compose exec postgres psql -U vetafl -d vetafl
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
- `feature/flower-management` — merged (flower table, CRUD, photo upload, sell, sorting, tests)

## Test Coverage
| Suite | Tests | Description |
|-------|-------|-------------|
| **Backend** (pytest) | 53 | Auth, Profile, Flowers, Photo upload, JWT, Models, edge cases |
| **Frontend** (Jest) | 58 | SellModal, EditModal, format functions, sorting, selection, filter |
| **Total** | **111** | All passing |

## Known Issues
1. **SHA256 for password hashing** — bcrypt/passlib in requirements but unused
2. **No HTTPS** — port 443 open but no SSL certs configured
3. **No rate limiting** — `/api/auth` not protected from brute force
4. **No auto DB table creation** — `Base.metadata.create_all()` not called on startup
5. **Operations page uses mock data** — no real API endpoints yet (stub)
6. **No frontend tests for router-dependent components** — react-router-dom v7 ESM incompatible with CRA Jest setup
