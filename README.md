# Habit Tracker — Full-Stack Implementation

**Track Selected:** Full-Stack (React Frontend + Django REST Framework Backend)  
**Design Reference:** Habit Tracker Template (PDF Pages 1–9)  
**Frontend Stack:** React 19, Vite, React Router DOM v6, date-fns, Modern Responsive CSS  
**Backend Stack:** Python 3.14, Django 6.x, Django REST Framework, django-cors-headers  
**Database:** SQLite (default zero-configuration file `db.sqlite3`; optionally switchable to MySQL via environment variables)

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────┐           HTTP / REST           ┌──────────────────────────────────┐
│          React Frontend         │ ◄─────────────────────────────► │      Django REST Framework       │
│  (Vite + React 19 @ port 5173)  │   Authorization: Token <key>   │     (Python 3.14 @ port 8000)     │
└─────────────────────────────────┘                                 └────────────────┬─────────────────┘
                                                                                     │
                                                                           ORM / Unique Constraints
                                                                                     ▼
                                                                    ┌──────────────────────────────────┐
                                                                    │       SQLite / MySQL Engine      │
                                                                    │   UNIQUE (habit_id, date) idx    │
                                                                    └──────────────────────────────────┘
```

---

## 🚀 Features Implemented (Matching PDF Template & Spec)

### 1. Authentication & Security
- **Endpoints:** `POST /api/auth/signup`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`.
- Password hashing with PBKDF2 (plain text passwords are never stored).
- Token-based authentication via DRF `TokenAuthentication`.
- Full input validation and structured errors:
  ```json
  {
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "A user with this email already exists.",
      "details": { "email": ["A user with this email already exists."] }
    }
  }
  ```

### 2. Habit Lifecycle & Ownership Enforcement
- **Endpoints:** `GET /api/habits`, `POST /api/habits`, `GET /api/habits/:id`, `PATCH /api/habits/:id`, `DELETE /api/habits/:id`, `POST /api/habits/:id/archive`, `POST /api/habits/:id/unarchive`.
- **User Ownership Isolation:** All queries strictly filter by `user=request.user`. Users cannot view, modify, or delete habits belonging to other users.
- **Archiving:** Archived habits are excluded from the active dashboard list while remaining fully preserved for historical completion analysis.
- **Preserved History:** Editing habit titles, targets, or dates preserves historical completion records.

### 3. Completion Tracking & Duplicate Prevention
- **Endpoints:** `GET /api/habits/:id/completions`, `PUT /api/habits/:id/completions/:date`, `DELETE /api/habits/:id/completions/:date`.
- **Database Layer Protection:** Enforced via `unique_together = ('habit', 'date')` on the `Completion` model. It is mathematically impossible to produce duplicate records for the same habit and date.
- Idempotent `PUT` and completion undo via `DELETE`.

### 4. Dynamic Dashboard Statistics
- **Endpoint:** `GET /api/dashboard/stats?date=YYYY-MM-DD`.
- **Metrics derived from live data:**
  - `completedToday`: Habits reaching their daily goal.
  - `inProgress`: Habits with progress recorded today.
  - `overdue`: Active habits started prior to date with zero completions.
  - `total`: Total active habits for the user.
  - `streak`: Consecutive days of completed habits.
  - `habitScore`: Dynamically calculated completion rate (`completedToday / totalActive * 100`).

### 5. UI Features & Responsiveness
- **Floating Compact Calendar Popover:** Anchored directly to the date button, floating over the dashboard without pushing content down.
- **Ocean Teal & Emerald Theme:** Modern color palette with pastel card accents (Emerald, Rose, Amber, Azure).
- **Responsive Navigation Drawer:** Slides out with blurred backdrop on tablets and mobile phones (`< 960px`).

---

## 🛠️ Quick-Start Guide (Running Locally)

### 1. Backend Setup (Django)

```powershell
# Navigate to the server folder
cd "e:\project\infomatic technology\habit-tracker-take-home\server"

# Run database migrations (creates SQLite db.sqlite3)
venv\Scripts\python.exe manage.py migrate

# (Optional) Seed mock data from mock-data/habits.json
# Creates default demo user: tanay@example.com / password123
venv\Scripts\python.exe manage.py load_mock_data

# Start the Django API server (runs on http://localhost:8000)
venv\Scripts\python.exe manage.py runserver 8000
```

### 2. Frontend Setup (React Vite)

Open a second terminal window:

```powershell
# Navigate to client folder
cd "e:\project\infomatic technology\habit-tracker-take-home\client"

# Start the Vite development server
npm run dev
```

Open your browser at **`http://localhost:5173`**.

---

## 🧪 Running Automated Tests

### Backend Tests (Django)
Runs 6 automated integration tests covering signup/login validation, user ownership isolation, duplicate prevention at the database layer, archive filtering, and dynamic dashboard statistics:

```powershell
cd "e:\project\infomatic technology\habit-tracker-take-home\server"
venv\Scripts\python.exe manage.py test habits_api
```

### Frontend Tests (Node.js Test Runner)
Runs 5 unit tests for client-side business logic and acceptance criteria:

```powershell
cd "e:\project\infomatic technology\habit-tracker-take-home\client"
npm test
```

---

## 🗄️ Optional MySQL Configuration

The backend is built so it can seamlessly connect to MySQL without code changes. Set the following environment variables:

```powershell
$env:USE_MYSQL = "1"
$env:MYSQL_DATABASE = "habit_tracker"
$env:MYSQL_USER = "root"
$env:MYSQL_PASSWORD = "your_password"
$env:MYSQL_HOST = "127.0.0.1"
$env:MYSQL_PORT = "3306"
```
When `USE_MYSQL` is omitted or not set to `1`, Django automatically defaults to the zero-setup SQLite database.
