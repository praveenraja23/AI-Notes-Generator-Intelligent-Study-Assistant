# AI Notes Generator — Vertical Slice (Phase 1)

This is a **working end-to-end slice** of the full project: upload a PDF/DOCX/PPTX,
extract its text, and get an AI-generated summary back. No auth, database, or RAG yet —
those come in later phases once this loop is proven.

## What's included

- **Backend** (`/backend`): Spring Boot 3, Java 21
  - `DocumentExtractionService` — PDFBox for PDF, Apache POI for DOCX/PPTX
  - `GeminiService` — calls Gemini's `generateContent` REST endpoint
  - `NotesController` — `POST /api/notes/summarize` (multipart file + style param)
  - Global exception handler for clean JSON errors
- **Frontend** (`/frontend`): React 19 + Vite
  - Single page: file picker, style dropdown, summary display

## Prerequisites

- Java 21+, Maven 3.9+
- Node 18+
- A Gemini API key: https://aistudio.google.com/apikey

## Run the backend

```bash
cd backend
export GEMINI_API_KEY=your_key_here
mvn spring-boot:run
```

Backend runs on `http://localhost:8080`.

## Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

## Try it

Open `http://localhost:5173`, upload a PDF/DOCX/PPTX, pick a summary style, submit.

## What's NOT here yet (by design)

- Authentication / JWT / users
- Database persistence (MySQL)
- RAG chat with notes (ChromaDB + embeddings)
- Quizzes, flashcards, important questions
- Export, admin dashboard, notifications, analytics
- Docker, tests, CI/CD

These get built next, once this core loop is confirmed working end-to-end. Each phase
will be added as a runnable increment on top of this one.
