# 🏙️ Community Hero AI

### Self-Healing Civic Intelligence Platform

> An AI-powered hyperlocal civic problem-solving platform that transforms the traditional complaint management system into a self-healing city ecosystem.

[![CI](https://github.com/community-hero-ai/community-hero-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/community-hero-ai/community-hero-ai/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/)

---

## 🎯 The Problem → Solution Shift

| Traditional System | Community Hero AI |
|---|---|
| Citizen → Complaint → Authority | Citizen → AI → Community → Authority → Resolution → Prediction → Prevention |
| Passive reporting | Active community engagement |
| Slow manual triage | Instant AI analysis |
| Siloed departments | Cross-department coordination |
| Reactive repairs | Predictive prevention |

---

## ✨ Features

### 🤖 AI-Powered Analysis (Gemini)
- Multimodal issue analysis: image, video, voice
- Auto-classification: category, severity, department routing
- AI explainability: transparent reasoning for every decision
- Fraud detection: spot spam, fake images, AI-generated content
- Predictive intelligence: forecast issues before they occur

### 🌐 Community Intelligence
- Community verification with trust-weighted voting
- Duplicate detection with geospatial + semantic matching
- Civic Emergency Score: multi-factor priority calculation
- Real-time status updates via Socket.io

### 🎮 Gamification & Engagement
- XP system, levels, badges, achievements
- Weekly leaderboards (global + ward)
- Community missions with personalized tasks
- Volunteer skill marketplace

### 🗺️ Digital Twin Dashboard
- Google Maps heatmaps with severity overlays
- Ward health scores with color coding
- Cluster visualization of issue density
- Real-time issue tracking

### ⚡ AI Watchtower
- Hyperlocal predictions from historical data + weather
- Climate-aware alerts (flood risk, storm preparation)
- Trend analysis and anomaly detection

### 📊 Transparency Ledger
- Immutable public activity timeline
- Full audit trail for every issue
- No silent closures allowed
- SLA enforcement with auto-escalation

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    COMMUNITY HERO AI                         │
├─────────────────────────────────────────────────────────────┤
│  Frontend (Next.js 15)    │  Backend (Express + TypeScript)  │
│  ├── App Router           │  ├── REST API (v1)               │
│  ├── TanStack Query       │  ├── Socket.io (Realtime)        │
│  ├── Zustand State        │  ├── Prisma ORM                  │
│  ├── Framer Motion        │  ├── JWT Auth + OAuth            │
│  └── Google Maps SDK      │  └── Cron Jobs                   │
├─────────────────────────────────────────────────────────────┤
│  AI Layer                 │  Infrastructure                  │
│  ├── Gemini 1.5 Flash     │  ├── PostgreSQL (Supabase)       │
│  ├── Vision Analysis      │  ├── Redis (Cache + Sessions)    │
│  ├── Text Predictions     │  ├── Local Storage (→ Cloudinary)│
│  └── Fraud Detection      │  └── OpenWeatherMap API          │
└─────────────────────────────────────────────────────────────┘
```

See [docs/architecture.md](docs/architecture.md) for the full system design.

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 16 (or Docker)
- Redis 7 (or Docker)
- Git

### Option A: Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/your-username/community-hero-ai.git
cd community-hero-ai

# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# Fill in your API keys in both .env files

# Start all services
docker compose up -d

# Run database migrations and seed
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npm run seed

# Access the app
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
# API Docs: http://localhost:5000/api/docs
```

### Option B: Manual Setup

**Backend:**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your values

npx prisma generate
npx prisma migrate dev --name init
npm run seed
npm run dev
# Backend running at http://localhost:5000
```

**Frontend:**
```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with your values

npm run dev
# Frontend running at http://localhost:3000
```

---

## 🔑 Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | JWT signing secret (min 32 chars) |
| `JWT_REFRESH_SECRET` | ✅ | Refresh token secret |
| `GOOGLE_CLIENT_ID` | ✅ | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | ✅ | Google OAuth client secret |
| `GEMINI_API_KEY` | ✅ | Google Gemini API key |
| `REDIS_URL` | ✅ | Redis connection URL |
| `OPENWEATHER_API_KEY` | ⚠️ | OpenWeatherMap API key (climate alerts) |
| `GOOGLE_MAPS_API_KEY` | ⚠️ | Google Maps (distance calculations) |
| `SESSION_SECRET` | ✅ | Express session secret |
| `SENTRY_DSN` | Optional | Sentry error tracking |
| `POSTHOG_KEY` | Optional | PostHog analytics |

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | ✅ | Backend API URL |
| `NEXT_PUBLIC_SOCKET_URL` | ✅ | Socket.io server URL |
| `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | ✅ | Google Maps JavaScript API key |
| `NEXTAUTH_SECRET` | ✅ | NextAuth session secret |
| `NEXTAUTH_URL` | ✅ | Your app URL |
| `GOOGLE_CLIENT_ID` | ✅ | Google OAuth (server-side) |
| `GOOGLE_CLIENT_SECRET` | ✅ | Google OAuth (server-side) |

---

## 👥 User Roles

| Role | Permissions |
|---|---|
| **Citizen** | Report issues, verify, vote, complete missions |
| **Volunteer** | All Citizen + skill registration, skill-matched assignments |
| **Authority** | All Citizen + issue management for their department, status updates |
| **Admin** | Full system access, user management, fraud review, all departments |

### Demo Credentials (after seed)

| Role | Email | Password |
|---|---|---|
| Admin | admin@hero.city | password123 |
| Authority | authority@hero.city | password123 |
| Citizen | citizen@hero.city | password123 |
| Volunteer | volunteer@hero.city | password123 |

---

## 📡 API Documentation

Full Swagger/OpenAPI documentation available at: `http://localhost:5000/api/docs`

### Key Endpoints

```
POST   /api/v1/auth/register          Register new user
POST   /api/v1/auth/login             Login with email/password
GET    /api/v1/auth/google            Google OAuth redirect

POST   /api/v1/issues                 Report new issue (multipart)
GET    /api/v1/issues                 List issues (filters, pagination)
GET    /api/v1/issues/:id             Issue detail
PATCH  /api/v1/issues/:id/status      Update issue status (authority)
POST   /api/v1/issues/:id/upvote      Upvote issue

POST   /api/v1/ai/analyze             AI analysis of media
GET    /api/v1/ai/predictions         Get ward predictions

POST   /api/v1/verify                 Submit community verification
GET    /api/v1/verify/pending         Get pending verifications nearby

GET    /api/v1/dashboard/stats        System statistics
GET    /api/v1/dashboard/ward/:ward   Ward health score

GET    /api/v1/leaderboard            Global XP leaderboard
GET    /api/v1/leaderboard/weekly     Weekly heroes

GET    /api/v1/missions               Available missions
POST   /api/v1/missions/:id/complete  Complete a mission
```

---

## 🗄️ Database Schema

See [docs/database-schema.md](docs/database-schema.md) for the complete ERD.

Key entities:
- **User** — Citizens, volunteers, authorities, admins with trust scores
- **Issue** — Civic problems with AI analysis, geolocation, status lifecycle
- **Verification** — Community votes with trust-weighted scoring
- **LedgerEntry** — Immutable audit trail
- **Prediction** — AI-generated ward predictions
- **Mission** — Gamified community tasks

---

## 🧪 Testing

```bash
# Backend unit tests
cd backend && npm test

# Backend type checking
cd backend && npx tsc --noEmit

# Frontend type checking
cd frontend && npm run type-check

# Frontend linting
cd frontend && npm run lint
```

---

## 🚢 Deployment

### Frontend → Vercel

```bash
cd frontend
npx vercel --prod
```

Set Vercel environment variables matching `frontend/.env.local`.

### Backend → Render / Railway

1. Connect your GitHub repo to Render
2. Set build command: `npm ci && npx prisma generate && npm run build`
3. Set start command: `npx prisma migrate deploy && npm start`
4. Set all environment variables from `backend/.env.example`

### Database → Supabase

1. Create a new Supabase project
2. Copy the connection string (with `?pgbouncer=true&connection_limit=1` for serverless)
3. Set as `DATABASE_URL` in backend environment

### GitHub Secrets Required

| Secret | Used For |
|---|---|
| `VERCEL_TOKEN` | Frontend deployment |
| `RENDER_DEPLOY_HOOK_URL` | Backend deployment trigger |

---

## 📁 Project Structure

```
community-hero-ai/
├── backend/                    # Node.js + Express API
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema
│   │   └── seed.ts             # Demo data
│   ├── src/
│   │   ├── config/             # App configuration
│   │   ├── middleware/         # Auth, RBAC, upload, error
│   │   ├── routes/v1/          # All API endpoints
│   │   ├── services/           # Business logic
│   │   ├── jobs/               # Cron jobs
│   │   └── utils/              # Helpers
│   └── Dockerfile
│
├── frontend/                   # Next.js 15 App
│   ├── src/
│   │   ├── app/                # App Router pages
│   │   ├── components/         # UI components
│   │   ├── hooks/              # Custom React hooks
│   │   ├── lib/                # API client, socket, auth
│   │   ├── store/              # Zustand state
│   │   └── types/              # TypeScript types
│   └── Dockerfile
│
├── docs/                       # Documentation
│   ├── architecture.md
│   ├── api.md
│   ├── database-schema.md
│   └── demo-script.md
│
├── .github/workflows/          # CI/CD
│   ├── ci.yml
│   ├── deploy-frontend.yml
│   └── deploy-backend.yml
│
├── docker-compose.yml          # Production Docker
├── docker-compose.dev.yml      # Development overrides
└── README.md
```

---

## 🛡️ Security

- **HttpOnly cookies** for JWT storage
- **CSRF protection** via SameSite cookies
- **Rate limiting**: 100 requests/15 min globally
- **Helmet.js**: Security headers
- **Input sanitization**: express-validator + Zod
- **SQL injection prevention**: Prisma parameterized queries
- **XSS prevention**: Content Security Policy headers
- **Password hashing**: bcryptjs with salt rounds 12

---

## 🌐 Modules

| # | Module | Status |
|---|---|---|
| 1 | Multimodal Issue Reporting | ✅ |
| 2 | Gemini AI Analysis | ✅ |
| 3 | AI Explainability | ✅ |
| 4 | Duplicate Detection | ✅ |
| 5 | Fraud Detection | ✅ |
| 6 | Community Verification | ✅ |
| 7 | Trust Score Engine | ✅ |
| 8 | Civic Emergency Score | ✅ |
| 9 | Realtime Tracking | ✅ |
| 10 | Digital Twin Dashboard | ✅ |
| 11 | AI Watchtower | ✅ |
| 12 | Climate-Aware Alerts | ✅ |
| 13 | Community Missions | ✅ |
| 14 | Skill Marketplace | ✅ |
| 15 | Gamification | ✅ |
| 16 | Transparency Ledger | ✅ |
| 17 | Authority Dashboard | ✅ |
| 18 | SLA Escalation Engine | ✅ |
| 19 | Impact Dashboard | ✅ |
| 20 | Accessibility | ✅ |
| 21 | Offline Mode (PWA) | ✅ |
| 22 | Privacy Filter | 🔧 Architecture ready |

---

## 🎥 Demo Script

See [docs/demo-script.md](docs/demo-script.md) for the complete 5-minute hackathon demo walkthrough.

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes using conventional commits (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

<div align="center">
  <strong>Built for a Self-Healing City 🏙️</strong><br>
  <em>Where every citizen is a hero</em>
</div>
