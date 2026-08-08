# AI Interview Agent — API Contract

This document describes the HTTP API implemented by this repository.
No separate external Technical Specification file was present in the project dataset, so this is the source of truth for request/response shapes used by the frontend and backend.

Base URL (local): `http://localhost:5000`

---

## `GET /health`

Health check.

**Response `200`**
```json
{
  "status": "ok"
}
```

---

## `GET /api/interview/candidates`

List candidates available for interview selection.

**Response `200`**
```json
{
  "success": true,
  "count": 20,
  "candidates": [
    {
      "id": "CAND-003",
      "name": "Emily Chen",
      "role": "AI Engineer",
      "experience": 6,
      "education": "MS Artificial Intelligence",
      "status": "COMPLETED",
      "missionsCompleted": 31,
      "missionsFirstTry": 30,
      "commitDays": 31,
      "skippedTopics": 0,
      "missionCount": 10
    }
  ]
}
```

---

## `POST /api/interview/start`

Start a personalized interview session.

**Request**
```json
{
  "candidateId": "CAND-003"
}
```

**Response `200`**
```json
{
  "success": true,
  "sessionId": "uuid",
  "candidateId": "CAND-003",
  "candidateName": "Emily Chen",
  "role": "AI Engineer",
  "message": "Opening interviewer message...",
  "currentQuestion": {
    "order": 1,
    "topic": "...",
    "day": 21,
    "difficulty": "Advanced",
    "reason": "..."
  },
  "interviewState": {
    "sessionId": "uuid",
    "candidateName": "Emily Chen",
    "role": "AI Engineer",
    "currentQuestionIndex": 0,
    "totalQuestions": 8,
    "progress": 12.5,
    "completed": false,
    "completedTopics": []
  },
  "progress": {
    "current": 1,
    "total": 8
  },
  "usage": {
    "prompt_tokens": 0,
    "completion_tokens": 0,
    "total_tokens": 0
  },
  "model": "gpt-4o-mini"
}
```

**Errors**
- `400` — missing/invalid `candidateId`
- `503` — OpenAI configuration missing

---

## `POST /api/interview/message`

Send a candidate answer and receive the next interviewer turn (or completion payload).

**Request** (either `message` or `candidateAnswer` is accepted)
```json
{
  "sessionId": "uuid",
  "message": "Candidate answer text"
}
```

**Response `200` (continuing)**
```json
{
  "success": true,
  "sessionId": "uuid",
  "message": "Next interviewer question...",
  "interviewState": { "...": "..." },
  "nextQuestion": {
    "topic": "...",
    "difficulty": "Intermediate",
    "followUp": "Suggested follow-up intent...",
    "candidateAnswer": "...",
    "evaluation": {
      "classification": "PARTIAL",
      "confidenceScore": 58,
      "coverageScore": 60,
      "reasoningScore": 52,
      "communicationScore": 60,
      "reason": "...",
      "source": "llm"
    },
    "objectives": ["..."],
    "tools": ["..."]
  },
  "decision": {
    "action": "askFollowUp",
    "difficulty": "Intermediate",
    "finishInterview": false,
    "stayOnTopic": true,
    "nextTopicAllowed": false,
    "reason": "..."
  },
  "usage": { "prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0 },
  "model": "gpt-4o-mini",
  "error": false
}
```

**Response `200` (interview complete)**
```json
{
  "success": true,
  "message": "Thank you. The interview is complete.",
  "summary": { "...": "..." },
  "report": {
    "candidate": { "id": "...", "name": "...", "role": "...", "experience": "..." },
    "interview": {
      "completedQuestions": 8,
      "duration": "12m 4s",
      "overallLevel": "Intermediate",
      "overallScore": 68
    },
    "scores": {
      "technical": 70,
      "reasoning": 65,
      "communication": 72,
      "confidence": 66
    },
    "strengths": ["..."],
    "weaknesses": ["..."],
    "topicBreakdown": [
      { "topic": "...", "score": 62, "level": "Solid", "summary": "..." }
    ],
    "recommendations": [
      { "day": 12, "module": "...", "topic": "...", "reason": "..." }
    ],
    "hiringRecommendation": "Hire",
    "summary": "..."
  },
  "interviewState": { "completed": true },
  "nextQuestion": null,
  "error": false
}
```

**Errors**
- `400` — missing `sessionId` / empty message
- `404` — unknown session
- `409` — session already completed
- `502` — interviewer LLM generation failed (turn rolled back; client may retry)
- `500` — unexpected server error

---

## `POST /api/interview/end`

Force-end an active session and return the report.

**Request**
```json
{
  "sessionId": "uuid"
}
```

**Response `200`**
```json
{
  "success": true,
  "summary": "Interview completed for Emily Chen.",
  "strengths": ["..."],
  "weakAreas": ["..."],
  "completedTopics": ["..."],
  "interviewDuration": "320s",
  "report": { "...": "..." },
  "interviewState": { "completed": true }
}
```

**Errors**
- `400` — missing `sessionId`
- `404` — unknown session

---

## Frontend wiring

1. Landing loads `GET /api/interview/candidates`, user selects a candidate
2. Navigate to `/interview` with `{ candidateId }`
3. Interview page calls `POST /api/interview/start`
4. Each send calls `POST /api/interview/message`
5. On completion payload (`report` / no `nextQuestion`), navigate to `/results` with report state

Compatibility notes:
- Message body accepts `message` (primary) or `candidateAnswer` (alias from earlier prompts)
- Evaluation `source` is `"llm"` or `"heuristic"`
