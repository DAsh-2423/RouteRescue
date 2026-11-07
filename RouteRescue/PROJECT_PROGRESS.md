# RouteRescue project progress

## Implemented
- [x] React + Vite frontend and Express REST backend
- [x] JSON data storage and seeded 20-city transport/hotel network
- [x] Registration, bcrypt password hashing, JWT login, protected routes and admin role checks
- [x] Profile editing and travel preferences
- [x] Multi-mode journey planner and bounded graph path generation
- [x] Cheapest, fastest and balanced route rankings
- [x] Transfer feasibility checks and multiple distinct alternatives
- [x] Overnight accommodation selection and hotel suggestions
- [x] Per-person and group cost calculations
- [x] Itinerary details, journey save/history/delete/replan
- [x] Admin dashboard and sample city/connection/hotel management
- [x] User listing, feedback submission and admin feedback view
- [x] Responsive UI and setup documentation

## Verification status
- Frontend production build completes.
- API checks passed for registration, duplicate registration, login, wrong password, same-city rejection, Mumbai–Pune plan generation, cost totals, save, history, delete, feedback, and admin authorization.
- Cheapest, fastest and balanced badges are assigned from different sample routes when the network allows it.

## Known limitations
- All transport and accommodation data is simulated.
- Route search is limited to four legs. Some city pairs have only one or two feasible plans.
- Connection times wrap past midnight, but the planner does not build a real multi-day calendar.
- Hotel prices in the sample data are treated as per person per night.
- JSON storage is intended for a single local development process.
