# RouteRescue – Smart Multi-Modal Journey Planner

A college-level full-stack travel-planning working model. It generates alternative multi-leg journeys using local sample data for 20 Indian cities. Transport schedules, fares, hotel prices and availability are **simulated**, not live booking data.

## Stack
- Frontend: React, Vite, JavaScript, React Router, Axios, CSS
- Backend: Node.js, Express, JWT, bcryptjs
- Storage: local JSON files (no external database)
- Routing: bounded graph path search with cheapest, fastest and balanced ranking

## Requirements
Install Node.js 20+ and npm. Open the `RouteRescue` folder in VS Code.

## Setup (Windows PowerShell)
1. Open terminal in `backend`:
   ```powershell
   npm install
   Copy-Item .env.example .env
   npm run seed
   npm run dev
   ```
2. Open a second terminal in `frontend`:
   ```powershell
   npm install
   Copy-Item .env.example .env
   npm run dev
   ```
3. Visit http://localhost:5173. Backend API: http://localhost:5000/api/health.

## Default admin development login
- Email: `admin@routerescue.local`
- Password: `Admin@123`
- Change these in `backend/.env` before reseeding if desired. The stored password is bcrypt-hashed. These are development-only credentials.

## User workflow
Register → log in → plan journey → compare alternatives → open itinerary details → save journey → view/replan/delete from history. Profile preferences and feedback are available after login. Admin users can manage cities, transport connections and hotels, view users, feedback and dashboard counts.

## Main API endpoints
- `POST /api/auth/register`, `POST /api/auth/login`
- `GET/PUT /api/users/me`, `GET /api/users/cities`
- `POST /api/journeys/plan`, `POST /api/journeys/save`, `GET /api/journeys/history`, `DELETE /api/journeys/:id`
- `POST /api/feedback`
- Admin (JWT + admin role): `GET /api/admin/dashboard`, `GET /api/admin/users`, `GET /api/admin/feedback`, `GET/POST/DELETE /api/admin/:resource`

## Data files
`backend/src/data/` contains `cities.json`, `transport.json`, `hotels.json`, `users.json`, `journeys.json`, `feedback.json`, and `requests.json`. Run `npm run seed` to reset sample data and recreate the development admin account (this resets users and saved data).

## Important notes and limitations
- No live transport, hotel, map, ticketing, payment, GPS or external APIs are used.
- The routing engine uses a time-dependent Dijkstra search of up to four legs and filters transfers using sample timetable times. Cross-midnight and date-specific timetable logic is simplified. Some city pairs have fewer than three feasible plans.
- JSON file persistence is suitable for a local single-process college demo, not concurrent production traffic.
- Cost values are per person unless explicitly labelled group total. Hotel recommendation is simulated.
