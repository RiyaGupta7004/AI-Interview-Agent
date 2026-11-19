import assert from "node:assert/strict";
import test from "node:test";

import { processAnswer } from "../services/AdaptiveInterviewEngine.js";
import {
  createInterviewPlan,
  listCandidates,
} from "../services/InterviewPlannerService.js";
import { generateInterviewReport } from "../services/ReportGeneratorService.js";
import {
  buildInterviewState,
  clearSession,
  createSession,
  endSession,
  getSession,
  recordAnswer,
} from "../services/SessionManagerService.js";
import { createRateLimiter } from "../middleware/rateLimiter.js";

test("candidate roster and plan keep eight curriculum-aligned topics", () => {
  const candidates = listCandidates();
  const plan = createInterviewPlan("CAND-003");

  assert.ok(candidates.length > 0);
  assert.ok(candidates.some((candidate) => candidate.id === "CAND-003"));
  assert.equal(plan.candidateId, "CAND-003");
  assert.equal(plan.interviewPlan.length, 8);
  assert.ok(plan.interviewPlan.every((entry) => entry.day > 0 && entry.topic));
});

test("session lifecycle holds a follow-up on its topic, advances, then ends", () => {
  const { session } = createSession("CAND-003");
  const firstTopic = session.currentQuestion.topic;

  const followUp = recordAnswer(session.sessionId, "An initial answer.", {
    action: "askFollowUp",
    nextQuestion: { ...session.currentQuestion, followUp: "Why?" },
  });
  assert.equal(followUp.nextQuestion.topic, firstTopic);
  assert.equal(followUp.interviewState.currentQuestionIndex, 0);

  const advanced = recordAnswer(session.sessionId, "A stronger answer.", {
    action: "moveToNextTopic",
  });
  assert.equal(advanced.interviewState.currentQuestionIndex, 1);
  assert.equal(advanced.interviewState.completedTopics[0], firstTopic);
  assert.equal(buildInterviewState(session).totalQuestions, 8);

  const summary = endSession(session.sessionId);
  assert.equal(session.completed, true);
  assert.match(summary.summary, /Interview completed/);
  assert.equal(clearSession(session.sessionId), true);
  assert.equal(getSession(session.sessionId), undefined);
});

test("adaptive decisions ask an answer-grounded follow-up and honor its limit", () => {
  const { session } = createSession("CAND-003");
  const question = session.currentQuestion;
  const weak = {
    classification: "PARTIAL",
    confidenceScore: 55,
    coverageScore: 45,
    reasoningScore: 50,
    communicationScore: 65,
  };
  const first = processAnswer(
    session,
    question,
    "I used retrieval because it reduced repeated searches.",
    weak,
    { title: question.topic, objectives: [], tools: [] }
  );
  assert.equal(first.action, "askFollowUp");
  assert.equal(first.nextQuestion.topic, question.topic);
  assert.match(first.nextQuestion.followUp, /because it reduced repeated searches/i);

  Object.assign(session, first.state);
  const second = processAnswer(session, question, "I would measure relevance.", weak);
  Object.assign(session, second.state);
  const third = processAnswer(session, question, "The same topic.", weak);
  assert.equal(third.action, "moveToNextTopic");
  assert.notEqual(third.nextQuestion.topic, question.topic);
});

test("report generation handles partial sessions without invented scores", () => {
  const report = generateInterviewReport({
    candidateId: "CAND-003",
    candidateName: "Candidate",
    plan: { interviewPlan: [{ topic: "Embeddings", day: 7 }] },
    evaluationHistory: [],
    topicScores: {},
  });

  assert.equal(report.interview.overallScore, 0);
  assert.equal(report.interview.overallLevel, "Insufficient Data");
  assert.equal(report.hiringRecommendation, "Insufficient Data");
  assert.deepEqual(report.topicBreakdown, []);
});

test("rate limiter returns 429 with Retry-After after the configured limit", () => {
  let time = 10_000;
  const limiter = createRateLimiter({ limit: 1, windowMs: 1000, now: () => time });
  let nextCalls = 0;
  let responseStatus;
  const headers = {};
  const response = {
    setHeader(name, value) { headers[name] = value; },
    status(value) { responseStatus = value; return this; },
    json(value) { this.body = value; return this; },
  };
  const request = { ip: "127.0.0.1", socket: {} };

  limiter(request, response, () => { nextCalls += 1; });
  limiter(request, response, () => { nextCalls += 1; });
  assert.equal(nextCalls, 1);
  assert.equal(responseStatus, 429);
  assert.equal(headers["Retry-After"], "1");

  time += 1000;
  limiter(request, response, () => { nextCalls += 1; });
  assert.equal(nextCalls, 2);
});
