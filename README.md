# Fieldnotes — Habit Tracker

A personal habit tracker built with **Spring Boot** (Java 21) and **React + TypeScript**.
100% free to run — everything lives on your laptop, no cloud services, no paid accounts.

---

## Tech stack

| Layer      | Choice                                    |
|------------|--------------------------------------------|
| Backend    | Java 21, Spring Boot 3.3, Spring Security, Spring Data JPA |
| Auth       | JWT (jjwt)                                 |
| Database   | H2 (embedded, file-based — `backend/data/habittracker.mv.db`) |
| API docs   | springdoc-openapi (Swagger UI)             |
| Frontend   | React 18, TypeScript, Vite, react-router   |
| Build      | Maven (backend), npm (frontend)            |

No Docker, no Postgres server, no hosting account needed. The H2 database is just a file
that gets created automatically the first time you run the app.

---

## Prerequisites (all free)

1. **Java 21 (JDK)** — [Eclipse Temurin](https://adoptium.net/) is a good free distribution.
   Check with: `java -version`
2. **Maven** — usually bundled with your IDE (IntelliJ / VS Code), or install standalone.
   Check with: `mvn -version`
3. **Node.js 18+** (includes npm) — [nodejs.org](https://nodejs.org/)
   Check with: `node -v`

An IDE isn't required, but **IntelliJ IDEA Community Edition** (free) is a great fit for the
backend, and **VS Code** (free) works well for both.

---

## 1. Run the backend

```bash
cd backend
mvn spring-boot:run
```

First run will download dependencies (needs internet just this once) and create
`backend/data/habittracker.mv.db` automatically.

- API base URL: `http://localhost:8080/api`
- Swagger UI (interactive API docs): `http://localhost:8080/swagger-ui.html`
- H2 console (peek at raw tables if curious): `http://localhost:8080/h2-console`
  - JDBC URL: `jdbc:h2:file:./data/habittracker`
  - Username: `sa`, Password: *(blank)*

## 2. Run the frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

- App runs at: `http://localhost:5173`
- It's already wired to talk to the backend at `http://localhost:8080`

Open `http://localhost:5173`, register an account, and start adding habits.

---

## What's included

- **Auth**: register/login with JWT, passwords hashed with BCrypt
- **Habit CRUD**: create, edit, soft-delete habits
- **Flexible scheduling**: daily, weekdays-only, specific days of the week, or "X times per week"
- **One-tap check-in** (and undo, in case you misclick)
- **Streaks**: current streak + longest streak, computed correctly per frequency type
  (e.g. a "weekdays only" habit doesn't break its streak over the weekend)
- **30-day completion rate**
- **Mini heatmap** per habit (13-week "growth row") showing your consistency at a glance

## Project structure

```
habit-tracker/
├── backend/                 Spring Boot API
│   └── src/main/java/com/habittracker/
│       ├── config/          Security + OpenAPI config
│       ├── controller/      REST endpoints
│       ├── dto/             Request/response objects
│       ├── exception/       Global error handling
│       ├── model/           JPA entities
│       ├── repository/      Spring Data repositories
│       ├── security/        JWT filter, token util, user details
│       └── service/         Business logic (habits, auth, streak calculation)
└── frontend/                React + TypeScript UI
    └── src/
        ├── api/              Fetch wrapper for the backend
        ├── components/       HabitCard, Heatmap, NewHabitModal
        ├── context/          Auth state
        ├── pages/            Login, Register, Dashboard
        └── types.ts
```

## Next steps / ideas to extend it (all still free)

- Add **daily email/desktop reminders** using Spring Scheduler (no paid service needed for local use)
- Add **charts** for weekly/monthly trends (recharts, free npm package)
- Deploy for free later using **Render** or **Railway** free tiers, and swap H2 for a
  free-tier Postgres instance, if you ever want it accessible outside your laptop
- Add habit **categories/tags**
- Export data to CSV

---

Built as a portfolio project — feel free to push this to a public GitHub repo once it's working locally.
