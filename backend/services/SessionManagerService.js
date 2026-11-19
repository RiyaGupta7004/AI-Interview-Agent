import crypto from "node:crypto";

import { createInterviewPlan } from "./InterviewPlannerService.js";

const sessions = new Map();
const SESSION_TTL_MS = 30 * 60 * 1000;
const MAX_ACTIVE_SESSIONS = 500;

function pruneExpiredSessions(now = Date.now()) {
  for (const [sessionId, session] of sessions) {
    if (now - Number(session.lastActivityAt || session.startedAt) > SESSION_TTL_MS) {
      sessions.delete(sessionId);
    }
  }
}

/**
 * Build a safe interview state snapshot for a session.
 * @param {object} session
 * @returns {object}
 */
export function buildInterviewState(session) {
  const totalQuestions = Array.isArray(session?.plan?.interviewPlan)
    ? session.plan.interviewPlan.length
    : 0;

  const currentQuestionIndex = Math.min(
    Number(session?.currentQuestionIndex ?? 0),
    Math.max(totalQuestions - 1, 0)
  );

  const progress = totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0;

  return {
    sessionId: session?.sessionId,
    candidateName: session?.candidateName,
    role: session?.role,
    currentQuestionIndex,
    totalQuestions,
    progress: Number(progress.toFixed(2)),
    completed: Boolean(session?.completed),
    completedTopics: [...(session?.completedTopics || [])],
  };
}

/**
 * Create a new in-memory interview session.
 * @param {string} candidateId
 * @returns {{ session: object, currentQuestion: object | null }}
 */
export function createSession(candidateId) {
  pruneExpiredSessions();
  if (sessions.size >= MAX_ACTIVE_SESSIONS) {
    const error = new Error("Interview capacity is temporarily full.");
    error.code = "SESSION_CAPACITY";
    throw error;
  }

  const plan = createInterviewPlan(candidateId);
  const sessionId = crypto.randomUUID();
  const interviewPlan = Array.isArray(plan?.interviewPlan) ? plan.interviewPlan : [];
  const currentQuestion = interviewPlan[0] || null;

  const session = {
    sessionId,
    candidateId: plan?.candidateId,
    candidateName: plan?.candidateName,
    role: plan?.role,
    experience: plan?.experience,
    strengths: Array.isArray(plan?.strengths) ? plan.strengths : [],
    weakAreas: Array.isArray(plan?.weakAreas) ? plan.weakAreas : [],
    skippedTopics: Array.isArray(plan?.skippedTopics) ? plan.skippedTopics : [],
    plan,
    currentQuestionIndex: 0,
    currentQuestion,
    conversation: [],
    completedQuestions: [],
    completedTopics: [],
    evaluationHistory: [],
    topicScores: {},
    followUpHistory: [],
    followUpCount: 0,
    askedQuestions: [],
    weakTopics: [],
    strongTopics: [],
    currentDifficulty: "Intermediate",
    currentTopicScore: 0,
    startedAt: new Date().toISOString(),
    lastActivityAt: Date.now(),
    completed: false,
    endedAt: null,
  };

  sessions.set(sessionId, session);

  return {
    session,
    currentQuestion,
  };
}

/**
 * Get an in-memory interview session by id.
 * @param {string} sessionId
 * @returns {object | undefined}
 */
export function getSession(sessionId) {
  pruneExpiredSessions();
  const session = sessions.get(sessionId);
  if (session) {
    session.lastActivityAt = Date.now();
  }
  return session;
}

/**
 * Get the next question to ask for the session.
 * @param {object} session
 * @returns {object | null}
 */
export function getCurrentQuestion(session) {
  if (!session || !Array.isArray(session?.plan?.interviewPlan)) {
    return null;
  }

  if (session.currentQuestion) {
    return session.currentQuestion;
  }

  const index = Number(session.currentQuestionIndex ?? 0);
  return session.plan.interviewPlan[index] || null;
}

/**
 * Advance the interview state after a candidate answer is recorded.
 * @param {string} sessionId
 * @param {string} message
 * @returns {{ session: object, nextQuestion: object | null, interviewState: object }}
 */
export function recordAnswer(sessionId, message, decision = null) {
  const session = getSession(sessionId);

  if (!session) {
    throw new Error("Interview session not found.");
  }

  const trimmedMessage = typeof message === "string" ? message.trim() : "";

  if (!trimmedMessage) {
    throw new Error("Candidate message is required.");
  }

  const currentQuestion = getCurrentQuestion(session);

  session.conversation.push({
    role: "user",
    content: trimmedMessage,
    timestamp: new Date().toISOString(),
  });

  const keepCurrentTopic = decision && ["stayOnCurrentTopic", "askFollowUp", "decreaseDifficulty", "increaseDifficulty"].includes(decision.action);
  const plan = Array.isArray(session?.plan?.interviewPlan) ? session.plan.interviewPlan : [];

  if (keepCurrentTopic) {
    const nextQuestion = decision?.nextQuestion || currentQuestion || null;
    session.currentQuestion = nextQuestion;
    return {
      session,
      nextQuestion,
      interviewState: buildInterviewState(session),
    };
  }

  // Mark the current topic complete only when advancing (not on follow-ups).
  if (currentQuestion) {
    session.completedQuestions.push({
      question: currentQuestion.topic,
      order: currentQuestion.order,
      answeredAt: new Date().toISOString(),
    });
    if (!session.completedTopics.includes(currentQuestion.topic)) {
      session.completedTopics.push(currentQuestion.topic);
    }
  }

  session.followUpCount = 0;

  const nextIndex = Number(session.currentQuestionIndex ?? 0) + 1;

  if (nextIndex < plan.length) {
    session.currentQuestionIndex = nextIndex;
    const nextQuestion = plan[nextIndex];
    session.currentQuestion = nextQuestion;
    return {
      session,
      nextQuestion,
      interviewState: buildInterviewState(session),
    };
  }

  session.currentQuestionIndex = Math.max(plan.length - 1, 0);
  session.completed = true;
  session.endedAt = new Date().toISOString();
  return {
    session,
    nextQuestion: null,
    interviewState: buildInterviewState(session),
  };
}

/**
 * End an active interview session.
 * @param {string} sessionId
 * @returns {object}
 */
export function endSession(sessionId) {
  const session = getSession(sessionId);

  if (!session) {
    throw new Error("Interview session not found.");
  }

  session.completed = true;
  session.endedAt = new Date().toISOString();

  const startedAt = new Date(session.startedAt);
  const endedAt = new Date(session.endedAt);
  const interviewDurationMs = Math.max(0, endedAt.getTime() - startedAt.getTime());
  const interviewDuration = `${Math.round(interviewDurationMs / 1000)}s`;

  const summary = {
    summary: `Interview completed for ${session.candidateName}.`,
    strengths: [...(session.strongTopics || session.strengths || [])],
    weakAreas: [...(session.weakTopics || session.weakAreas || [])],
    completedTopics: [...(session.completedTopics || [])],
    interviewDuration,
    interviewState: buildInterviewState(session),
  };

  // Keep completed sessions briefly for report generation, then drop to avoid leaks.
  // Callers that need the session object should read it before endSession deletes it.
  return summary;
}

/**
 * Remove a session from memory after the report has been generated.
 * @param {string} sessionId
 * @returns {boolean}
 */
export function clearSession(sessionId) {
  return sessions.delete(sessionId);
}

export default {
  createSession,
  getSession,
  getCurrentQuestion,
  recordAnswer,
  endSession,
  clearSession,
  buildInterviewState,
};
