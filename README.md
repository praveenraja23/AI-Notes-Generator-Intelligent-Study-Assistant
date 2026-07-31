# AI Notes Generator — Phase 2: Auth + Persistence

Builds on Phase 1 (upload → extract → summarize). This phase adds:

- **User accounts**: register/login with JWT access + refresh tokens, BCrypt password hashing
- **Persistence**: uploaded documents and generated summaries are saved to MySQL, scoped to the owning user
- **Route protection**: `/api/notes/**` requires a valid access token; `/api/auth/**` is public
- **Frontend**: login/register screen, token stored in `localStorage`, automatic refresh-and-retry on expired access tokens, a "your documents" list

## What's included

- **Backend** (`/backend`)
  - `entity/` — `User`, `StudyDocument`, `Summary`, `Role`
  - `repository/` — Spring Data JPA repositories
  - `security/` — `JwtService`, `JwtAuthFilter`, `SecurityConfig`, `UserDetailsServiceImpl`
  - `service/AuthService` — register / login / refresh
  - `controller/AuthController` — `POST /api/auth/register`, `/login`, `/refresh`
  - `controller/NotesController` — `POST /api/notes/summarize` (now authenticated + persisted), `GET /api/notes/documents`
- **Frontend** (`/frontend`)
  - `src/api.js` — API client with token storage and auto-refresh
  - `src/components/AuthForm.jsx` — login/register UI
  - `src/App.jsx` — gated on auth, shows upload form + document history

## Prerequisites

- Java 21+, Maven 3.9+
- Node 18+
- MySQL running locally (or update `spring.datasource.url`)
- A Gemini API key: https://aistudio.google.com/apikey

## Run the backend

```bash
cd backend
export GEMINI_API_KEY=your_gemini_key
export JWT_SECRET=$(openssl rand -base64 32)   # any long random string works
export DB_USERNAME=root
export DB_PASSWORD=your_mysql_password
mvn spring-boot:run
```

The schema (`users`, `documents`, `summaries`) is created automatically on first run via
`spring.jpa.hibernate.ddl-auto=update`. Swap this for Flyway/Liquibase migrations before
production use.

Backend runs on `http://localhost:8080`.

## Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

## Try it

1. Open `http://localhost:5173`, register a new account.
2. Upload a PDF/DOCX/PPTX, pick a summary style, submit.
3. Refresh the page — you'll stay logged in and see the document in "Your documents".

## What's NOT here yet

- RAG chat with notes (ChromaDB + embeddings)
- Quizzes, flashcards, important questions
- Export, admin dashboard, notifications, analytics
- Email verification / forgot-password flow
- Docker, tests, CI/CD
- Rate limiting, audit logs, refresh token revocation/blacklisting

Each of these is a planned next increment.
