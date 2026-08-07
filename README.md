# AI Interview Agent

Hackathon project foundation. This is a **scaffold only** — routes return dummy
JSON, pages are placeholders, and no AI logic is implemented yet.

## Tech Stack

**Frontend:** React (Vite), React Router, Tailwind CSS, Axios, Framer Motion
**Backend:** Node.js, Express, CORS, dotenv, OpenAI SDK (installed, not wired up), Nodemon

## Project Structure

```
ai-interview-agent/
│
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx
│   │   │   ├── InterviewPage.jsx
│   │   │   └── ResultsPage.jsx
│   │   ├── hooks/
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── context/
│   │   ├── utils/
│   │   ├── layouts/
│   │   ├── routes/
│   │   │   └── AppRoutes.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── .env.example
│   └── package.json
│
├── backend/
│   ├── controllers/
│   │   └── interview.controller.js
│   ├── routes/
│   │   ├── health.routes.js
│   │   └── interview.routes.js
│   ├── services/
│   │   └── openai.service.js
│   ├── prompts/
│   │   └── interviewPrompts.js
│   ├── middleware/
│   │   └── errorHandler.js
│   ├── utils/
│   │   └── logger.js
│   ├── data/
│   ├── config/
│   │   └── index.js
│   ├── server.js
│   ├── .env.example
│   └── package.json
│
└── README.md
```

## Installation

From the project root:

```bash
# Backend
cd backend
npm install
cp .env.example .env

# Frontend
cd ../frontend
npm install
cp .env.example .env
```

## Running the App

Open two terminals.

**Terminal 1 — Backend** (runs on http://localhost:5000)
```bash
cd backend
npm run dev
```

**Terminal 2 — Frontend** (runs on http://localhost:5173)
```bash
cd frontend
npm run dev
```

## Available Backend Routes (all return dummy JSON)

| Method | Route                     | Description                  |
|--------|---------------------------|-------------------------------|
| GET    | /health                   | Health check                  |
| POST   | /api/interview/start      | Start an interview session    |
| POST   | /api/interview/message    | Send a message in the session |
| POST   | /api/interview/end        | End the interview session     |

## Available Frontend Routes

| Path         | Page            |
|--------------|-----------------|
| /            | Landing Page    |
| /interview   | Interview Page  |
| /results     | Results Page    |

## Next Steps (Not Implemented Yet)

- Wire up `backend/services/openai.service.js` with real OpenAI calls
- Build out `backend/prompts/interviewPrompts.js`
- Connect frontend pages to backend via `frontend/src/services/api.js`
- Add styling, components, state management (context/hooks), and animations
