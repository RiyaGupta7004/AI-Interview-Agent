# AI Usage Log — PROMPTS.md

## AI Interview Agent

This file records the AI prompts used during development. AI was used for planning, architecture, code generation, debugging, testing, UX, and documentation. Generated code was reviewed and tested by the development team.

## AI Tools

- ChatGPT — architecture, planning, prompt engineering, debugging, QA
- GitHub Copilot — implementation, code generation, integration, debugging
- Groq — LLM inference through an OpenAI-compatible API

> The exact text of the earliest three prompts is not available in the preserved conversation context, so they are marked below rather than fabricated.

---

# Prompt 1 — Initial Project Generation

**Purpose:** Generate the initial React + Express AI Interview Agent project.

**Exact prompt:** You are a Staff Full-Stack Engineer and Hackathon Mentor.

I am building an AI Interview Agent for a 2-day hackathon.

IMPORTANT:
Do NOT build the entire application yet.
Your job is ONLY to create a clean, scalable project foundation.

## Tech Stack

Frontend
- React (Vite)
- React Router
- Tailwind CSS
- Axios
- Framer Motion

Backend
- Node.js
- Express
- CORS
- dotenv
- OpenAI SDK (install only, don't implement)
- Nodemon

## Project Structure

ai-interview-agent/
│
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── context/
│   │   ├── utils/
│   │   ├── layouts/
│   │   ├── routes/
│   │   └── App.jsx
│   │
│   └── package.json
│
├── backend/
│   ├── controllers/
│   ├── routes/
│   ├── services/
│   ├── prompts/
│   ├── middleware/
│   ├── utils/
│   ├── data/
│   ├── config/
│   ├── server.js
│   └── package.json
│
└── README.md

## Backend

Create Express server.

Configure:
- CORS
- express.json()
- dotenv
- health route

Create placeholder routes:

GET /health

POST /api/interview/start

POST /api/interview/message

POST /api/interview/end

Each route should return dummy JSON.

Do NOT implement AI.

## Frontend

Create routing only.

Pages:

/

/interview

/results

Each page should contain only a simple placeholder.

Example:

Landing Page

Interview Page

Results Page

No styling yet.

## Scripts

Setup npm scripts.

Frontend:

npm run dev

Backend:

npm run dev

## Return

1. Folder structure
2. Installation commands
3. Every file
4. Complete code
5. Run instructions

Do not skip any file.
Do not add features outside the scope.

---

# Prompt 2 — Initial Implementation

**Purpose:** Continue implementation of the generated frontend/backend scaffold.

**Exact prompt:**You are a senior Product Designer and React Frontend Engineer.

I already have a Vite + React + Tailwind project.

Your task is ONLY to build the frontend UI.

DO NOT implement backend logic.
DO NOT use OpenAI.
DO NOT create fake AI responses.
DO NOT modify backend files.

Create a beautiful, modern AI Interview Agent frontend.

Pages:

1. Landing Page (/)

Sections:
- Hero Section
- "Practice Real AI Interviews"
- Short description
- Features (Adaptive Questions, AI Feedback, Personalized Interview)
- Call-to-Action button: "Start Interview"
- Modern gradients
- Responsive
- Dark mode
- Smooth animations using Framer Motion

2. Interview Page (/interview)

Design like ChatGPT.

Include:
- Header
- Progress Bar (Question 1/8)
- Chat area
- AI message bubble
- User message bubble
- Input box
- Send button
- Typing indicator
- Sidebar showing:
  - Current Topic
  - Questions Remaining
  - Interview Status

Use mock data only.

3. Results Page (/results)

Include:

Overall Score

Strengths

Weaknesses

Communication Score

Technical Score

Recommendations

Display everything inside modern cards.

Design Requirements:

- Premium SaaS style
- Tailwind CSS
- Rounded corners
- Glassmorphism where appropriate
- Mobile responsive
- Desktop responsive
- Consistent spacing
- Reusable components
- Clean folder structure

Return complete React code only.

Do not touch backend.

---

# Switched from claude to copilot 

# Prompt 3 — Frontend / Project Implementation

**Purpose:** Continue implementation after the initial scaffold.

**Exact prompt:** You are a Senior Frontend Engineer and Product Designer.

You are working inside an EXISTING React + Vite + Tailwind + Framer Motion project.

IMPORTANT RULES

- ONLY modify frontend files.
- NEVER modify backend.
- NEVER touch Express.
- NEVER create API logic.
- NEVER implement OpenAI.
- NEVER create authentication.
- NEVER add a database.
- NEVER change project structure unless necessary.
- Keep the existing routing.

Your task is to replace the placeholder Interview Page with a beautiful, production-quality UI.

===========================================
DESIGN STYLE
===========================================

Modern SaaS

Minimal

Clean

Dark Theme

Rounded cards

Soft shadows

Professional

Looks similar to ChatGPT, Claude or Cursor.

Responsive.

===========================================
PAGE LAYOUT
===========================================

----------------------------------------------------
HEADER
----------------------------------------------------

Logo/Icon

Title:
AI Interview Agent

Subtitle:
Practice Technical Interviews with AI

Top Right:

Interview Status Badge
("In Progress")

----------------------------------------------------
MAIN CONTENT
----------------------------------------------------

Two-column layout on desktop.

Single-column on mobile.

LEFT (75%)

Chat Window

RIGHT (25%)

Interview Information Card

----------------------------------------------------
CHAT WINDOW
----------------------------------------------------

Large rounded card.

Scrollable.

Contains conversation.

Example conversation:

AI

"Welcome! Today we'll assess your understanding of Retrieval-Augmented Generation."

User

"Sounds good."

AI

"Can you explain what RAG is?"

User

"RAG retrieves relevant documents before generating a response."

AI

"Great answer. How is RAG different from fine-tuning?"

Create around 6–8 mock messages.

Alternate AI and User messages.

AI messages

- left aligned
- blue accent
- robot icon

User messages

- right aligned
- neutral color
- user avatar

Animate messages using Framer Motion.

----------------------------------------------------
BOTTOM INPUT
----------------------------------------------------

Sticky input area.

Large rounded input.

Placeholder:

"Type your answer..."

Send button.

Microphone icon (disabled).

Paperclip icon (disabled).

Typing indicator:

"AI is thinking..."

(show as mock animation)

----------------------------------------------------
SIDEBAR
----------------------------------------------------

Card 1

Interview Progress

Question

1 / 8

Progress Bar

Card 2

Current Topic

Retrieval-Augmented Generation

Difficulty

Intermediate

Estimated Time Left

18 min

Card 3

Skills Being Evaluated

✓ RAG

✓ Prompt Engineering

✓ Vector Databases

✓ AI Agents

Use badges.

----------------------------------------------------
EXTRA DETAILS
----------------------------------------------------

Nice spacing

Reusable React components

Tailwind only

Framer Motion animations

Clean folder structure

No inline CSS

Use Heroicons or Lucide icons if available.

===========================================
DO NOT
===========================================

Do NOT create backend.

Do NOT create API calls.

Do NOT create business logic.

Do NOT use OpenAI.

Do NOT change backend.

Everything should use mock data.

Return complete React code and update only the necessary frontend files.

---

# Prompt 4 — Interview Planner

```text
You are a Senior AI Engineer.

Modify BACKEND only.

Do NOT modify frontend.

Do NOT implement OpenAI API calls.

Your task is to create an InterviewPlannerService.

Create:

backend/services/InterviewPlannerService.js

Input:
- Candidate Profile
- Curriculum

The service should:
- Find the candidate by candidateId
- Analyze candidate strengths
- Analyze candidate weaknesses
- Identify relevant curriculum topics
- Generate an interview plan
- Generate exactly 8 interview topics

The service should expose:
createInterviewPlan(candidateId)

Use clean helper functions and JSDoc comments.

Do not modify routes or controllers.
```

---

# Prompt 5 — Prompt Builder

```text
You are a Senior AI Engineer.

IMPORTANT

Modify BACKEND only.
Do NOT modify frontend.
Do NOT implement OpenAI API calls.

Create:
backend/services/PromptBuilderService.js

Input:
- Interview Plan
- Current Question
- Previous Conversation
- Candidate Profile

Output:
- System Prompt
- Developer Prompt
- User Prompt

The system prompt should instruct the AI interviewer to:
- Be professional and encouraging
- Ask ONE question at a time
- Never reveal answers
- Ask follow-up questions based on previous responses
- Stay within the interview plan
- Adapt difficulty to the candidate
- Keep responses concise

Expose:
buildPrompt()

It should NOT call OpenAI.
Use clean helper functions and JSDoc comments.
Do not modify routes or controllers.
```

---

# Prompt 6 — Backend Interview Integration

```text
You are a Senior Backend Engineer.

Modify BACKEND only.
Do NOT modify frontend.
Do NOT implement streaming.
Do NOT add a database.
Do NOT refactor unrelated files.

Connect InterviewPlannerService and PromptBuilderService into the interview flow.

When an interview starts:
1. Receive candidateId.
2. Call InterviewPlannerService.createInterviewPlan(candidateId).
3. Store the plan in memory using sessionId.
4. Return sessionId, candidateName, role, currentQuestion and progress.

Use an in-memory Map.

When a message arrives:
- Retrieve the session.
- Retrieve the interview plan.
- Call PromptBuilderService.buildPrompt().
- Return a mock response containing sessionId, prompt, interviewState and nextQuestion.
- Do NOT call OpenAI.

When interview ends return:
summary, strengths, weakAreas, completedTopics and interviewDuration.

Create SessionManager if needed.
No database.
No OpenAI.
```

---

# Prompt 7 — LLM / Groq Integration

```text
You are a Senior AI Backend Engineer.

Modify BACKEND only.
Do NOT modify frontend.
Keep InterviewPlannerService, PromptBuilderService and SessionManager.
Do not rewrite existing code unless required.

Integrate the LLM into the existing interview flow.

Read:
OPENAI_API_KEY
OPENAI_BASE_URL
OPENAI_MODEL

Support OpenAI-compatible providers such as Groq.
Do NOT hardcode model names or URLs.

Implement OpenAIService.generateResponse(promptObject).

Input:
{
  systemPrompt,
  developerPrompt,
  userPrompt
}

Output:
{
  message,
  usage,
  model
}

The interviewer must:
- Ask ONE question at a time.
- Never reveal answers.
- Be encouraging and professional.
- Stay inside the interview plan.
- Ask follow-up questions naturally.
- Keep replies under 120 words.

When a candidate message arrives:
1. Retrieve session.
2. Build prompt.
3. Call OpenAIService.generateResponse().
4. Save conversation history.
5. Return AI response.

If the LLM fails, return a friendly fallback instead of crashing.

Use async/await, modular code, JSDoc and try/catch.
No frontend, database, authentication, streaming or unnecessary refactoring.
```

---

# Prompt 8 — Adaptive AI Interview Reasoning Engine

```text
You are a Principal AI Engineer designing the core intelligence of an adaptive AI Interview Agent.

The interviewer should behave like an experienced technical interviewer, not a generic chatbot.

Modify BACKEND only.
Do NOT modify frontend.
Do NOT rewrite:
- InterviewPlannerService
- PromptBuilderService
- OpenAIService
- SessionManager

Create:
services/AdaptiveInterviewEngine.js

The engine must decide:
- stayOnCurrentTopic
- moveToNextTopic
- askFollowUp
- increaseDifficulty
- decreaseDifficulty
- finishInterview

Never randomly jump between topics.

Evaluate each answer as:
EXCELLENT, GOOD, PARTIAL, WEAK or INCORRECT.

Estimate:
confidenceScore 0-100
coverageScore 0-100
reasoningScore 0-100
communicationScore 0-100

If EXCELLENT:
ask a harder question in the same topic.

If GOOD:
ask one deeper question.

If PARTIAL:
stay on the same topic and ask a clarification.

If WEAK:
ask an easier question.

If INCORRECT:
give a small hint and ask again without revealing the answer.

Move topics only when the current topic score is >=70 or maximum follow-ups (2) are reached.

Support:
Easy, Intermediate, Advanced, Expert.

Remember:
currentTopic
currentDifficulty
questionNumber
followUpCount
conversationHistory
weakTopics
strongTopics
difficulty
evaluationHistory
askedQuestions
completedTopics
remainingTopics
overallScore

The LLM must ONLY generate natural-language interviewer messages. The engine decides interview flow.
```

---

# Prompt 9 — Make Adaptive Engine the Source of Truth

```text
You are a Principal Backend Architect.

Do NOT modify frontend.

The AdaptiveInterviewEngine already exists.

Make it the SINGLE SOURCE OF TRUTH for interview flow.

Current bug:
The interviewer still jumps randomly between topics because the LLM is deciding what to ask next.

Required flow:

Candidate Answer
→ AdaptiveInterviewEngine.evaluateAnswer()
→ Decision
→ PromptBuilder
→ LLM writes ONLY the wording

The LLM must NEVER decide:
- next topic
- difficulty
- follow-up count
- interview progression

The engine should return:
{
  evaluation,
  nextAction,
  currentTopic,
  nextTopic,
  followUp,
  difficulty,
  transitionReason
}

nextAction:
FOLLOW_UP
NEXT_TOPIC
RETRY
END_INTERVIEW

The controller must load the session, evaluate the answer, receive the decision, pass the decision to PromptBuilder, then call the LLM.

PromptBuilder must tell the LLM:
- Follow the Decision object.
- Do not invent interview flow.
- Do not change topic.
- Do not skip ahead.
- Generate exactly one interviewer message.

Acceptance test:
Question: "What is RAG?"
Answer: "It retrieves documents."
Expected: PARTIAL, FOLLOW_UP, same topic, deeper question about embeddings.

Weak answers must simplify and remain on the same topic.
```

---

# Prompt 10 — Diagnose LLM Fallback

```text
You are a Senior AI Backend Engineer.

Do NOT modify functionality.

Diagnose why OpenAIService returns the fallback response.

Check:
1. OPENAI_API_KEY loaded: true/false
2. OPENAI_BASE_URL
3. OPENAI_MODEL
4. Model being called
5. API status code, error code, error message and response body
6. Do not swallow exceptions.

Explain exactly why the request failed.

Only add temporary debug logging.
```

---

# Prompt 11 — Fix Environment Initialization

```text
You are a Senior Node.js Engineer.

A configuration loading bug has been identified.

OpenAIService initializes before dotenv loads.
The client is created at module load time.
process.env is empty and the client becomes null.

Fix environment initialization.

Requirements:
1. Load dotenv before service imports.
2. Refactor OpenAIService to create the client lazily through getClient().
3. Validate OPENAI_API_KEY, OPENAI_BASE_URL and OPENAI_MODEL.
4. Do not cache a null client.
5. Keep architecture unchanged.
6. Remove temporary debug logging after verification.

Acceptance:
- Backend starts.
- Environment variables load.
- Groq client initializes.
- generateResponse() reaches the real API.
- Fallback occurs only when the API actually fails.

Do not modify frontend or interview logic.
```

---

# Prompt 12 — Frontend ↔ Backend Integration

```text
You are a Senior Full Stack Engineer.

The project contains:
- React frontend
- Express backend
- InterviewPlannerService
- AdaptiveInterviewEngine
- PromptBuilderService
- OpenAIService
- SessionManager

Do NOT rewrite backend architecture or frontend UI.

Replace ALL mock interview logic with backend API calls.

When Interview Page loads:
POST /api/interview/start
Send candidateId.
Receive sessionId and first AI question.
Store sessionId.
Display the returned AI message.

When user presses Send:
POST /api/interview/message
Send sessionId and candidateAnswer.
Receive AI response.
Append user and AI messages.
Update progress, topic, questions remaining and status.

When interview finishes navigate to /results.

Remove:
interviewQuestions
currentQuestionIndex
setTimeout
fake AI responses
mock progression

Frontend must never decide question number, next topic, difficulty, follow-up or interview completion.
```

---

# Prompt 13 — Diagnose Frontend Network Error

```text
You are a Senior Full Stack Debugging Engineer.

Do NOT add features or refactor.

Diagnose why the frontend displays "Network Error".

Check:
1. Backend server.
2. Frontend API base URL.
3. InterviewPage request to POST /api/interview/start.
4. Express route.
5. Controller.
6. CORS.
7. Backend JSON response.
8. Frontend response handling.

For failures report:
- URL
- Method
- Status code
- Response body
- Error message
- Exact file

Do not automatically fix anything.
```

---

# Prompt 14 — Interview Decision Engine

```text
You are a Principal AI Architect.

The backend is connected to the frontend and LLM.

The remaining problem is interview quality.

The LLM still decides the next interview question.
That is incorrect.

Implement an Interview Decision Engine.

Every candidate answer must produce a Decision object:

{
 evaluation,
 confidence,
 stayOnTopic,
 nextAction,
 difficulty,
 hint,
 reason
}

Rules:
- "I don't know", "I am not sure", "No idea" or very short answers = WEAK.
- Weak = stay on topic, reduce difficulty, ask ONE simpler question.
- PARTIAL = stay on topic and probe.
- GOOD = ask one deeper question.
- EXCELLENT = increase difficulty, then move to the next topic after an advanced question.

PromptBuilder must tell the LLM to follow the Decision object and never invent interview flow.

Acceptance:
Question: What are LangChain Agents?
Answer: I don't know.
Expected: stay on topic and ask a simpler AI-agent question, not a random project question.

Keep frontend unchanged.
```

---

# Prompt 15 — AI Interview Report

```text
You are a Principal Full-Stack Engineer and AI Architect.

The interview already works.

Backend contains:
- InterviewPlannerService
- AdaptiveInterviewEngine
- PromptBuilderService
- OpenAIService
- SessionManager

Frontend contains Interview Page, Chat Interface and Results Page.

Implement the Interview Report feature.

Create ReportGeneratorService.js.

Generate a report from:
- candidate profile
- conversation history
- interview plan
- evaluation history
- follow-up history
- topic performance

Return:
{
  candidate,
  interview,
  scores,
  strengths,
  weaknesses,
  topicBreakdown,
  recommendations,
  hiringRecommendation,
  summary
}

Scores:
technical
reasoning
communication
confidence

Recommendations MUST come from curriculum.json. Do not invent curriculum.

Hiring recommendation values:
Outstanding Candidate
Strong Hire
Hire
Borderline
Needs Improvement
Not Ready

Overall level:
Beginner
Intermediate
Advanced
Expert

Replace ResultsPage with a professional report dashboard containing:
- overall score
- score cards
- strengths
- weaknesses
- topic breakdown
- curriculum recommendations
- hiring recommendation
- summary
- Start New Interview
- Back to Home

Use backend data only.
Do not modify existing interview logic.
```

---

# Prompt 16 — Full QA / Pre-Release Audit

```text
You are a Principal QA Engineer and Senior Full Stack Reviewer.

The project is feature complete.

DO NOT ADD FEATURES.
DO NOT REFACTOR.
DO NOT IMPROVE UI.

Audit the entire project.

Check frontend:
- Landing page
- Interview page
- Results page
- Navigation
- Responsive layout
- Progress
- Sidebar
- Chat
- Auto scroll
- Loading
- Errors

Check backend:
- Routes
- Controllers
- Services
- Session Manager
- Planner
- Adaptive Engine
- Prompt Builder
- OpenAIService
- ReportGeneratorService

Verify the complete flow:
start → session → planner → adaptive engine → prompt builder → LLM → history → end → report.

Test weak, partial, excellent answers.
Test API endpoints.
Test missing API key, empty answer, long answer, rapid clicking, refresh, expired session, invalid candidate and unavailable backend.

Review performance, code smells, security and architecture.

Do not automatically modify code.

Return:
- overall health
- critical issues
- high priority
- medium priority
- low priority
- bugs
- performance issues
- security issues
- code smells
- hackathon readiness
- final verdict
```

---

# Prompt 17 — Diagnose Interview Network Failure

```text
You are a Senior Full Stack Debugging Engineer.

The application worked before the Interview Report feature was added.

Symptoms:
- Network Error
- Current Topic = Loading...
- Interview unavailable
- Question 1 of 1

Find the root cause only.

Check:
- backend startup
- POST /api/interview/start
- POST /api/interview/message
- POST /api/interview/end
- api.js
- InterviewPage.jsx
- Axios base URL
- endpoint paths
- controller
- planner
- adaptive engine
- prompt builder
- OpenAI
- ReportGeneratorService

Output:
ROOT CAUSE
FILE
LINE NUMBER
WHY IT FAILS
SAFE FIX

Do not automatically fix anything.
```

---

# Prompt 18 — Product Polish

```text
You are a Principal Product Engineer, Senior UX Designer, and AI Interview Platform Architect.

The project is feature complete.

Do NOT rewrite architecture.
Do NOT redesign the application.
Do NOT remove working features.

Improve:
- professional greeting
- interview flow
- topic ordering
- question progression
- chat auto-scroll
- loading experience
- synchronized status panel
- AI conversational style
- empty-answer handling
- error recovery
- responsive polish

Greeting should adapt to morning/afternoon/evening.

Start with candidate introduction and easy warm-up before advanced technical topics.

Question number increases only when moving to a new topic. Follow-ups remain under the same question number.

Frontend must display backend interview state rather than calculating progress locally.

Chat should automatically scroll to the newest message.

Disable Send while waiting and prevent duplicate requests.

Verify the complete interview and report flow.
```

---

# Prompt 19 — Chat Auto-Scroll Only

```text
You are a Senior React Engineer.

Fix ONLY the chat auto-scroll.

Whenever a new AI or user message is added, automatically scroll to the latest message.

Use React useRef and useEffect.
Use smooth scrolling.
Do not affect existing styling.
Do not modify backend.
Do not modify interview logic.

Explain which file was modified.
```

---

# Prompt 20 — Professional Greeting

```text
You are a Senior AI Product Engineer.

Modify ONLY the interview greeting.

Before technical questions, greet the candidate.

Example:

Good morning! 👋

Welcome to your AI Interview.

I'll ask you technical questions and adapt based on your answers.

Let's begin with a quick introduction.

First question:

"Could you briefly introduce yourself and tell me about your background or interest in AI?"

Only after the introduction should technical questions begin.

Do not modify other behavior.
```

---

# Prompt 21 — Question Counter

```text
Fix ONLY the interview progress.

The question counter should increase only when moving to a NEW topic.

Follow-up questions must stay under the same question number.

The frontend must display the backend interview state instead of calculating progress locally.

Do not modify any other feature.
```

---

# Prompt 22 — Final Stabilization

```text
You are a Senior Full Stack Debugging Engineer.

The application worked before the AI Interview Report feature was added.

After the latest changes:
- Landing page reverted to placeholder.
- Interview page shows Network Error.
- Current Topic = Loading...
- Interview unavailable.
- Question 1 of 1.

Restore the working application without removing existing features.

Find the first runtime error.
Fix backend failures caused by ReportGeneratorService or new services.
Restore LandingPage if overwritten.
Verify:
POST /api/interview/start
POST /api/interview/message
POST /api/interview/end

Ensure InterviewPage consumes the backend response correctly.

Do not remove:
- AdaptiveInterviewEngine
- Planner
- PromptBuilder
- ReportGenerator
- OpenAI integration

After fixing, verify:
- Landing page restored
- Interview starts
- AI responds
- Adaptive questioning works
- Interview finishes
- AI Report opens

List modified files and explain why.
```

---

# Development Notes

## Major AI-assisted milestones

1. Initial project scaffold
2. Interview UI
3. Backend services
4. Curriculum/candidate integration
5. Interview planning
6. Prompt construction
7. LLM integration
8. Adaptive reasoning
9. Frontend/backend integration
10. Personalized report
11. QA and debugging
12. UX stabilization

## Human contribution

The team:
- selected the problem and product direction
- chose the architecture and technologies
- reviewed AI-generated implementation
- integrated and tested generated code
- configured the LLM provider
- tested adaptive behavior
- identified UX problems
- validated fixes
- managed Git and project submission
- made final product decisions



---

# Final Cursor CLI Phase

After GitHub Copilot usage was exhausted, Cursor CLI was used for the final repository-level debugging pass.

## Cursor Prompt — Main Bug Fix Pass
**Purpose:** Find and fix the remaining interview progression, question-quality, feedback, and chat-scroll bugs.

```text
You are debugging an existing AI Interview Agent. DO NOT rewrite the project.

First inspect the relevant files and trace the interview flow. Then FIX the bugs below. Make minimal changes only.

CRITICAL BUGS:

1. QUESTION PROGRESS
The question/progress bar gets stuck and the interview does not reliably reach the results page.

The interview must have exactly 8 MAIN questions.
Follow-up questions do NOT increment the main question number.

Backend is the source of truth for:
- main question number
- follow-up count
- current topic
- total questions
- questions remaining
- interview status

2. BAD FIRST QUESTION
Do not display raw curriculum titles such as:
"Agentic Frameworks: LangChain Agents & Tool Use"

Start with a professional greeting and:
"Could you briefly introduce yourself and tell me about your experience with AI or software development?"

3. ADAPTIVE QUESTIONS
Weak → simpler same-topic follow-up.
Partial → probing same-topic follow-up.
Good → deeper question.
Excellent → harder question and eventually next topic.

AdaptiveInterviewEngine controls progression.
LLM only generates natural-language wording.

4. RESULTS / FEEDBACK
Trace:
final question → interview completion → /api/interview/end → ReportGeneratorService → ResultsPage

Make the report generate after 8 MAIN questions.

5. CHAT SCROLL
Inspect existing auto-scroll logic first. Fix it only if necessary.

Do not rewrite architecture, create a new project, add unnecessary dependencies, replace backend logic with mocks, or change unrelated files.

After editing, test:
Start → greeting → introduction → Q1 → follow-up → Q2 → ... → Q8 → completion → report → ResultsPage.

Finally report:
1. Root cause
2. Files changed
3. Fix applied
4. Tests performed
5. Remaining issues

FIND → FIX → TEST.
```

**Project use:** Final broad bug-fixing pass after Copilot was exhausted.

## Cursor Prompt — Interview Opening Fix
**Purpose:** Separate the introduction from the eight main curriculum questions.

```text
Fix the interview opening mismatch.

Flow:
Greeting → Introduction → Q1 → ... → Q8 → Results

Introduction must NOT count as a question or consume a topic.

After introduction, start the first curriculum question and correctly sync question number, topic, and progress.

Do not modify unrelated features.
```

**Project use:** Fixed the introduction/state mismatch.

## Cursor Prompt — AI Question Quality Fix
**Purpose:** Stop raw curriculum titles from appearing as questions.

```text
Fix AI question quality. Stop showing raw curriculum titles as questions. Generate natural, clear, context-aware interview questions with proper follow-ups based on the candidate's answer. Keep the existing adaptive logic and architecture unchanged.
```

**Project use:** Improved the quality and naturalness of interview questions.

---

# Tool Transition

GitHub Copilot was used for the main implementation and integration work. When the Copilot usage limit was exhausted, Cursor CLI was used for the final debugging and bug-fixing stage.

# Human Contribution

The development team selected the problem, made architecture/product decisions, reviewed AI-generated code, configured the project and LLM provider, tested features, identified bugs, selected fixes, managed Git, and validated the final application.

# Authenticity Note

The exact wording of the earliest prompts is not preserved in the available conversation history, so those entries are intentionally marked rather than fabricated. If the original AI-tool history is available, replace those placeholders with the exact original prompts.
