# Habit Tracker — API Contract & Architecture Specification

**Base URL:** `http://127.0.0.1:8000/api`  
**Frontend URL:** `http://localhost:5173`  
**Protocol:** RESTful over HTTP/HTTPS  
**Standard Payload Format:** JSON (`application/json`)  
**Character Encoding:** UTF-8  

---

## 1. Authentication & Security Architecture

### Strategy: Django REST Framework Token Authentication
- **Mechanism:** Secure HTTP Header `Authorization: Token <token_key>`.
- **Why Token-Based over Cookie-Based Session:**
  1. **Cross-Origin Decoupling:** Allows clean decoupling between modern client applications (Vite SPA on port 5173, mobile apps, Postman) and the backend API service (Django on port 8000) without fragile third-party cookie or `SameSite` cross-origin blocking.
  2. **CSRF Immunity:** Stateless token authentication is immune to Cross-Site Request Forgery (CSRF) attacks inherent in cookie-based browser workflows.
  3. **Multi-Platform Ready:** Supports web browsers, mobile clients, background automation, and developer CLI tools using a single consistent header.
- **Password Storage & Security:**
  - Passwords are **never stored in plain text**.
  - Uses Django's industry-standard cryptographic `PBKDF2PasswordHasher` with SHA-256 and 720,000 hashing iterations plus individual salt per user.
  - Enforces minimum 6-character length validation.

---

## 2. API Endpoints Specification

### 2.1 Authentication

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/signup` | Register a new user account | No |
| `POST` | `/api/auth/login` | Authenticate with email/password and receive token | No |
| `POST` | `/api/auth/logout` | Invalidate current authentication token on server | Yes |
| `GET` | `/api/auth/me` | Retrieve profile of the current authenticated user | Yes |

#### Request & Response Examples:

**Signup:**
```http
POST /api/auth/signup
Content-Type: application/json

{
  "firstName": "Asha",
  "lastName": "Sharma",
  "email": "asha@example.com",
  "password": "example-password"
}
```
*Status: `201 Created`*
```json
{
  "token": "9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b",
  "user": {
    "id": 1,
    "name": "Asha Sharma",
    "email": "asha@example.com",
    "joinedDate": "2026-10-30"
  }
}
```

**Login:**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "asha@example.com",
  "password": "example-password"
}
```
*Status: `200 OK`* (Returns token and user object)

**Logout:**
```http
POST /api/auth/logout
Authorization: Token <token_key>
```
*Status: `200 OK`*
```json
{
  "message": "Successfully logged out."
}
```

---

### 2.2 Habits Management

| Method | Endpoint | Query Parameters | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/habits` | `status=active\|archived\|all`<br>`date=YYYY-MM-DD`<br>`category=<name>` | List user habits with filtered status and date completions |
| `POST` | `/api/habits` | — | Create a new habit |
| `GET` | `/api/habits/:id` | — | Retrieve single habit details (Strict ownership enforced) |
| `PATCH`| `/api/habits/:id` | — | Partially update habit fields |
| `DELETE`| `/api/habits/:id` | `permanent=true` (optional) | Soft-delete to Trash (preserves history) or permanent |
| `POST` | `/api/habits/:id/archive` | — | Move habit to Archived status |
| `POST` | `/api/habits/:id/unarchive` | — | Restore habit to Active status |
| `GET` | `/api/habits/export/csv` | — | Export RFC 4180 CSV file of habits & completions |

#### What Happens to History on Habit Deletion?
- **Default Behavior (Soft-Delete / Move to Trash):**
  When a habit is deleted via `DELETE /api/habits/:id`, its status is updated to `TRASHED`. **100% of historical completion records and streak analytics are preserved**. The habit is moved out of active/archived views and into the Trash. The user can restore it at any time via `POST /api/trash/:id/restore` with full history intact.
- **Permanent Deletion:**
  When a habit is permanently purged from the Trash via `DELETE /api/trash/:id` or `DELETE /api/habits/:id?permanent=true`, associated completion records are cascaded via foreign key constraints (`models.CASCADE`), irreversibly deleting the habit and its records.

#### Habit Schema:
```json
{
  "id": 1,
  "name": "Daily 30-min Reading",
  "description": "Read non-fiction before bed",
  "startDate": "2026-10-01",
  "endDate": null,
  "goal": 1,
  "frequency": "DAILY",
  "color": "blue",
  "category": "Learning",
  "reminderTime": "21:30",
  "status": "ACTIVE",
  "labels": ["Learning", "Productivity"],
  "todayCompletions": 1,
  "created_at": "2026-10-01T08:00:00Z",
  "updated_at": "2026-10-30T10:15:00Z"
}
```

---

### 2.3 Completion Records & Streaks

| Method | Endpoint | Query Parameters | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/habits/:id/completions` | `from=YYYY-MM-DD`<br>`to=YYYY-MM-DD` | Get completion records for a habit within a date range |
| `GET` | `/api/completions` | — | Get all completions across all user habits (Calendar matrix) |
| `PUT` | `/api/habits/:id/completions/:date` | — | Mark/increment completion for a calendar date |
| `DELETE` | `/api/habits/:id/completions/:date` | — | Undo/decrement completion for a calendar date |

#### Guarantee Against Duplicate Records:
- Strictly enforces calendar date formatting (`YYYY-MM-DD`). Timestamps are intentionally omitted to avoid timezone drift duplicates.
- The database enforces a `unique_together = ('habit', 'date')` constraint backed by a compound unique index.
- Calling `PUT /api/habits/:id/completions/:date` multiple times operates idempotently or increments the count column of the existing row; **it will never insert duplicate rows for the same habit and date**.

---

### 2.4 Dashboard & Dynamic Statistics

**Endpoint:** `GET /api/dashboard/stats?date=YYYY-MM-DD` (also supports `from` and `to` range)

#### Completion-Rate Denominator Definition:
The Habit Score and completion rate are calculated dynamically from actual completion database records:

$$\text{Denominator } (D) = \text{Count of Active Habits scheduled for the specified date}$$

$$\text{Numerator } (N) = \text{Count of Active Habits where } \text{completion count} \ge \text{target goal}$$

$$\text{Habit Score (\%)} = \begin{cases} \text{round}\left(\dfrac{N}{D} \times 100\right), & D > 0 \\ 0, & D = 0 \end{cases}$$

#### Metric Breakdown:
- `completedToday`: Count of active habits where daily completion count meets or exceeds the goal ($N$).
- `inProgress`: Count of active habits with partial progress ($0 < \text{count} < \text{goal}$).
- `overdue`: Count of active habits with 0 completions for the date.
- `total`: Total active habits scheduled for that day ($D$).
- `habitScore`: Integer percentage from $0\%$ to $100\%$.

#### Example Response:
```json
{
  "date": "2026-10-30",
  "completedToday": 3,
  "inProgress": 1,
  "overdue": 1,
  "total": 5,
  "habitScore": 60
}
```

---

### 2.5 Extended Modules (Full Specification)

#### Habit Challenges
- `GET /api/challenges` — List challenges with sprint progress.
- `POST /api/challenges` — Create sprint challenge (`title`, `description`, `category`, `durationDays`).
- `PATCH /api/challenges/:id` — Toggle completion or update sprint days (`isCompleted`).
- `DELETE /api/challenges/:id` — Delete challenge.

#### Pomodoro Focus Sessions
- `GET /api/pomodoro` — List focus sessions.
- `POST /api/pomodoro` — Log focus session (`habitId`, `habitTitle`, `durationMinutes`, `mode`).

#### Labels Management
- `GET /api/labels` — List tags with dynamic `habit_count`.
- `POST /api/labels` — Create tag (`name`, `color`).
- `DELETE /api/labels/:id` — Delete tag.

#### Trash & Restore
- `GET /api/trash` — List soft-deleted habits.
- `POST /api/trash/:id/restore` — Restore habit from trash.
- `DELETE /api/trash/:id` — Permanently delete habit.
- `DELETE /api/trash/empty` — Empty entire trash.

---

## 3. Standardized Error Handling

All error responses strictly adhere to the contract schema across the entire application:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Habit name is required.",
    "details": {
      "name": ["This field is required."]
    }
  }
}
```

### Standard HTTP Status Codes:

| Code | Error Code Constant | Usage |
| :---: | :--- | :--- |
| `200 OK` | — | Successful retrieval, update, or action. |
| `201 Created` | — | Successful creation of habit, user, completion, or challenge. |
| `400 Bad Request` | `VALIDATION_ERROR` | Missing required fields, invalid date formats, goal $< 1$. |
| `401 Unauthorized` | `UNAUTHORIZED` | Missing, malformed, or invalid auth token. |
| `403 Forbidden` | `FORBIDDEN` | Requesting an action not permitted. |
| `404 Not Found` | `NOT_FOUND` | Resource not found or owned by another user (tenant isolation). |
| `409 Conflict` | `CONFLICT` | Unique constraint conflict (e.g. duplicate email registration). |
| `500 Server Error` | `SERVER_ERROR` | Unexpected internal exception handled gracefully. |
