# AI Interview Agent

Hackathon project that builds **the interviewer, not the interview**: an adaptive AI agent that runs personalized technical interviews from a candidate’s AI Cohort learning journey, then produces structured feedback.

## What it does

1. **Choose a candidate** from the cohort roster
2. **Plan** 8 curriculum-aligned topics from missions, skips, attempts, and signals
3. **Interview** with multi-turn chat, adaptive difficulty, and answer-grounded follow-ups
4. **Evaluate** answers against topic objectives (LLM + curriculum-aware heuristic fallback)
5. **Report** scores, strengths/weaknesses, hiring signal, and recommended learning path

## Tech stack

| Layer | Stack |
|---|---|
| Frontend | React (Vite), React Router, Tailwind CSS, Axios, Framer Motion |
| Backend | Node.js, Express, CORS, dotenv, OpenAI-compatible SDK |
| Data | `curriculum.json`, `candidates.json` (synthetic hackathon datasets) |

## Project structure

```
AI-Interview_Agent/
├── frontend/                 # React app (landing, interview, results)
├── backend/
│   ├── controllers/          # HTTP handlers
│   ├── routes/               # /health, /api/interview/*
│   ├── services/             # planner, session, adaptive engine, prompts, OpenAI, reports
│   └── data/                 # curriculum + candidates
├── docs/API.md               # HTTP API contract used by this repo
├── gemini-code-*.txt         # Problem statement
└── README.md
```

## Setup

Use Node.js 20 or newer.

```bash
# Backend
cd backend
npm install
cp .env.example .env
# Fill OPENAI_API_KEY, OPENAI_BASE_URL, OPENAI_MODEL

# Frontend
cd ../frontend
npm install
cp .env.example .env
# VITE_API_BASE_URL=http://localhost:5000
```

### Backend `.env`

```env
PORT=5000
OPENAI_API_KEY=...
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
CORS_ORIGINS=http://localhost:5173
API_RATE_LIMIT=120
```

Any OpenAI-compatible provider (OpenAI, Groq, etc.) works if it supports chat completions.

## Run

```bash
# Terminal 1
cd backend
npm run dev

# Terminal 2
cd frontend
npm run dev
```

- Frontend: http://localhost:5173  
- Backend: http://localhost:5000  
- Health: `GET /health`

## Test

```bash
# Backend unit and API integration tests (AI provider is mocked)
cd backend
npm test

# Frontend candidate-selection and interview/report flow tests
cd ../frontend
npm test

# Production frontend build
npm run build
```

The backend accepts JSON requests up to 16 KB and candidate answers up to 4,000 characters. Configure `CORS_ORIGINS` as a comma-separated allowlist and adjust `API_RATE_LIMIT` (requests per IP per minute) for the deployment. Active interview sessions are held in memory for up to 30 minutes and are removed after completion.

## API (summary)

Full contract: [`docs/API.md`](docs/API.md)

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/interview/candidates` | List candidates for selection |
| POST | `/api/interview/start` | Start session (`candidateId`) |
| POST | `/api/interview/message` | Send answer (`sessionId`, `message`) |
| POST | `/api/interview/end` | End session + report |
| GET | `/health` | Health check |

## Frontend routes

| Path | Page |
|---|---|
| `/` | Landing + candidate picker |
| `/interview` | Live interview chat |
| `/results` | Structured performance report |

## Problem-statement coverage

| Requirement | Status |
|---|---|
| Conversational multi-turn interview | Yes |
| Personalized from candidate journey | Yes (picker + planner) |
| ≥ 8 questions / ≥ 4 curriculum days | Yes (8-topic plan) |
| Follow-ups from prior answers | Yes (answer-snippet grounded) |
| Conversation context | Yes (recent window + earlier-turn preface) |
| Structured end feedback | Yes |
| HTTP interview API | Yes |

Out of scope (intentionally not built): voice, auth, persistent accounts, long-term history, mobile apps.

## Architecture (backend services)

- **InterviewPlannerService** — ranks curriculum days from candidate missions
- **SessionManagerService** — in-memory session lifecycle
- **AdaptiveInterviewEngine** — evaluation → action → difficulty / follow-up / next topic
- **PromptBuilderService** — interviewer prompts (no external calls)
- **openai.service** — question generation + LLM answer evaluation
- **ReportGeneratorService** — final structured report

## Notes

- Sessions are **in-memory** (fine for demo; lost on restart).
- If LLM evaluation fails, the engine falls back to a curriculum-objective heuristic so the interview can continue.
- README and API docs in this repo are the working contract; a separate external “Technical Specification” file was not included in the dataset.
