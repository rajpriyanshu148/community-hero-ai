# Community Hero AI — API Documentation

## Base URL
```
Development: http://localhost:5000/api/v1
Production:  https://api.community-hero.app/api/v1
```

## Authentication

All protected endpoints require the `Authorization` header or a valid `access_token` cookie.

```http
Authorization: Bearer <access_token>
```

---

## Auth Endpoints

### POST /auth/register
Register a new user account.

**Request:**
```json
{
  "name": "Raj Sharma",
  "email": "raj@example.com",
  "password": "SecurePass123!",
  "ward": "Ward 12"
}
```

**Response 201:**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": { "id": "uuid", "name": "Raj Sharma", "email": "...", "role": "CITIZEN", "trustScore": 50 },
    "accessToken": "eyJ..."
  }
}
```

---

### POST /auth/login
```json
{ "email": "raj@example.com", "password": "SecurePass123!" }
```

**Response 200:** Sets httpOnly `access_token` and `refresh_token` cookies.

---

### GET /auth/google
Redirects to Google OAuth. After auth, redirects to frontend with token.

---

### GET /auth/me
Returns current authenticated user.

---

## Issues Endpoints

### GET /issues
List issues with filtering and pagination.

**Query params:**
- `status` — SUBMITTED | AI_VERIFIED | COMMUNITY_VERIFIED | ASSIGNED | IN_PROGRESS | RESOLVED | CLOSED
- `category` — POTHOLE | WATER_LEAKAGE | GARBAGE | STREETLIGHT | SEWAGE | INFRASTRUCTURE | OTHER
- `severity` — LOW | MEDIUM | HIGH | CRITICAL
- `ward` — string
- `page` — number (default 1)
- `limit` — number (default 20, max 100)
- `sortBy` — civicScore | createdAt | upvotes
- `order` — asc | desc

**Response 200:**
```json
{
  "success": true,
  "data": {
    "issues": [...],
    "total": 150,
    "page": 1,
    "totalPages": 8
  }
}
```

---

### POST /issues
Report a new issue. Accepts `multipart/form-data`.

**Fields:**
- `title` — string
- `description` — string
- `category` — enum
- `severity` — enum (override AI suggestion)
- `lat` — float
- `lng` — float
- `address` — string
- `ward` — string
- `media` — file[] (images/video, max 10MB each)
- `aiAnalysis` — JSON string (from /ai/analyze)

---

### GET /issues/nearby
**Query:** `lat`, `lng`, `radius` (meters, default 500)

---

### GET /issues/heatmap
Returns all active issue coordinates with severity for map overlay.

---

### GET /issues/:id
Full issue detail including verifications, ledger, comments, AI analysis.

---

### PATCH /issues/:id/status
**Auth:** AUTHORITY or ADMIN

```json
{ "status": "IN_PROGRESS", "notes": "Team dispatched" }
```

---

### POST /issues/:id/upvote
Toggle upvote. Updates civic score.

---

### POST /issues/:id/comment
```json
{ "content": "This is dangerous for school children" }
```

---

## AI Endpoints

### POST /ai/analyze
Analyze uploaded media with Gemini Vision.

**Accepts:** `multipart/form-data` with `media` file OR `{ imageUrl: "..." }` JSON

**Response:**
```json
{
  "success": true,
  "data": {
    "issueType": "POTHOLE",
    "severity": "HIGH",
    "confidence": 0.87,
    "publicRisk": "HIGH",
    "department": "Roads & Infrastructure",
    "estimatedResolutionTime": "72 hours",
    "estimatedCost": "₹15,000-25,000",
    "reasoning": "Road surface damage exceeds 60% of lane width...",
    "tags": ["road", "vehicle-damage-risk", "school-zone"]
  }
}
```

---

### GET /ai/predictions
**Query:** `ward` — string

Returns active predictions for the ward.

---

## Verification Endpoints

### POST /verify
Submit a community verification.

```json
{
  "issueId": "uuid",
  "result": "EXISTS",
  "notes": "Confirmed, seen it this morning"
}
```

---

### GET /verify/pending
Returns verification requests near the current user.
**Query:** `lat`, `lng`, `radius` (default 500m)

---

## Dashboard Endpoints

### GET /dashboard/stats
System-wide statistics.

**Response:**
```json
{
  "data": {
    "totalIssues": 50000,
    "resolvedIssues": 43000,
    "resolutionRate": 0.86,
    "avgResolutionHours": 4.2,
    "activeIssues": 7000,
    "citizensEngaged": 12000,
    "volunteerHours": 8500,
    "wardHealthScores": [
      { "ward": "Ward 1", "score": 78, "topCategory": "POTHOLE" }
    ]
  }
}
```

---

### GET /dashboard/trends
Issue counts per day for last 30 days.

---

## Leaderboard Endpoints

### GET /leaderboard
Top 50 users by XP globally.

### GET /leaderboard/ward/:ward

### GET /leaderboard/weekly
This week's top heroes.

---

## Authority Endpoints (Auth: AUTHORITY | ADMIN)

### GET /authority/assigned
Issues assigned to the authority user's department.

### GET /authority/sla
SLA status breakdown: `{ onTrack: [], atRisk: [], breached: [] }`

### PATCH /authority/issues/:id/assign
```json
{ "authorityUserId": "uuid" }
```

---

## Admin Endpoints (Auth: ADMIN)

### GET /admin/users
Paginated user list. Query: `search`, `role`, `isBanned`, `page`, `limit`

### PATCH /admin/users/:id/ban
```json
{ "isBanned": true, "reason": "Repeated spam" }
```

### GET /admin/fraud
Fraud-flagged issues queue.

### PATCH /admin/fraud/:id/review
```json
{ "action": "APPROVE" | "REJECT", "notes": "..." }
```

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [{ "field": "email", "message": "Invalid email" }]
}
```

**Status codes:**
- `400` — Bad Request (validation error)
- `401` — Unauthorized (missing/invalid token)
- `403` — Forbidden (insufficient role)
- `404` — Not Found
- `409` — Conflict (duplicate)
- `429` — Rate Limited
- `500` — Internal Server Error
