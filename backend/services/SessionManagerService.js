import crypto from "node:crypto";

import { createInterviewPlan } from "./InterviewPlannerService.js";

const sessions = new Map();

/**
 * Build a safe interview state snapshot for a session.
 * @param {object} session
 * @returns {object}
 */
function buildInterviewState(session) {
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
    conversation: [],
    completedQuestions: [],
    completedTopics: [],
    evaluationHistory: [],
    topicScores: {},
    followUpHistory: [],
    currentDifficulty: "Intermediate",
    currentTopicScore: 0,
    startedAt: new Date().toISOString(),
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
  return sessions.get(sessionId);
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
  if (currentQuestion) {
    session.completedQuestions.push({
      question: currentQuestion.topic,
      order: currentQuestion.order,
      answeredAt: new Date().toISOString(),
    });
    session.completedTopics.push(currentQuestion.topic);
  }

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

  session.currentQuestionIndex = plan.length;
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

  return {
    summary: `Interview completed for ${session.candidateName}.`,
    strengths: [...(session.strengths || [])],
    weakAreas: [...(session.weakAreas || [])],
    completedTopics: [...(session.completedTopics || [])],
    interviewDuration,
    interviewState: buildInterviewState(session),
  };
}

export default {
  createSession,
  getSession,
  getCurrentQuestion,
  recordAnswer,
  endSession,
};
