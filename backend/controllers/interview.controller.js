import {
  createSession,
  getSession,
  recordAnswer,
  endSession,
  clearSession,
  buildInterviewState,
} from "../services/SessionManagerService.js";
import { buildPrompt } from "../services/PromptBuilderService.js";
import { generateResponse, evaluateAnswerWithLLM } from "../services/openai.service.js";
import {
  processAnswer,
  evaluateAnswer,
} from "../services/AdaptiveInterviewEngine.js";
import { generateInterviewReport } from "../services/ReportGeneratorService.js";
import {
  getCurriculumContextForTopic,
  listCandidates,
} from "../services/InterviewPlannerService.js";

const MAX_ANSWER_LENGTH = 4000;
const SESSION_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const processingSessions = new Set();

function isValidSessionId(value) {
  return typeof value === "string" && SESSION_ID_PATTERN.test(value);
}

function isOpenAIConfigurationError(error) {
  return /OPENAI_(API_KEY|BASE_URL|MODEL)/.test(error?.message || "");
}

/**
 * Merge adaptive-engine state fields onto the live in-memory session.
 * @param {object} session
 * @param {object} engineState
 */
function applyEngineState(session, engineState = {}) {
  if (!session || !engineState) return;

  session.followUpCount = Number(engineState.followUpCount ?? session.followUpCount ?? 0);
  session.askedQuestions = Array.isArray(engineState.askedQuestions)
    ? [...engineState.askedQuestions]
    : Array.isArray(session.askedQuestions)
      ? session.askedQuestions
      : [];
  session.currentDifficulty = engineState.currentDifficulty || session.currentDifficulty || "Intermediate";
  session.currentTopicScore = Number(engineState.currentTopicScore ?? session.currentTopicScore ?? 0);
  session.weakTopics = Array.isArray(engineState.weakTopics)
    ? [...engineState.weakTopics]
    : Array.isArray(session.weakTopics)
      ? session.weakTopics
      : [];
  session.strongTopics = Array.isArray(engineState.strongTopics)
    ? [...engineState.strongTopics]
    : Array.isArray(session.strongTopics)
      ? session.strongTopics
      : [];
  session.currentTopic = engineState.currentTopic || session.currentTopic;
}

/**
 * Persist evaluation artifacts for the current topic onto the session.
 * @param {object} session
 * @param {object} currentQuestion
 * @param {object} decisionResult
 * @param {object} decision
 */
function recordTopicEvaluation(session, currentQuestion, decisionResult, decision) {
  const currentTopic = currentQuestion?.topic || session?.currentTopic;
  if (!currentTopic) return;

  const avgScore = Number(
    ((Number(decisionResult.evaluation?.confidenceScore || 0) +
      Number(decisionResult.evaluation?.coverageScore || 0) +
      Number(decisionResult.evaluation?.reasoningScore || 0)) /
      3).toFixed(2)
  );

  session.topicScores = {
    ...(session.topicScores || {}),
    [currentTopic]: avgScore,
  };

  session.evaluationHistory = Array.isArray(session.evaluationHistory)
    ? [...session.evaluationHistory, decisionResult.evaluation]
    : [decisionResult.evaluation];

  session.followUpHistory = Array.isArray(session.followUpHistory)
    ? [
        ...session.followUpHistory,
        {
          topic: currentTopic,
          action: decisionResult.action,
          difficulty: decision.difficulty,
          reason: decisionResult.reason,
        },
      ]
    : [
        {
          topic: currentTopic,
          action: decisionResult.action,
          difficulty: decision.difficulty,
          reason: decisionResult.reason,
        },
      ];

  session.currentDifficulty = decision.difficulty;
  session.currentTopicScore = avgScore;
}

/**
 * Resolve evaluation with LLM first, curriculum-aware heuristic fallback second.
 * @param {string} answer
 * @param {object} currentQuestion
 * @param {object} session
 * @param {object} curriculumContext
 * @returns {Promise<object>}
 */
async function resolveEvaluation(answer, currentQuestion, session, curriculumContext) {
  const heuristic = evaluateAnswer(
    answer,
    currentQuestion?.topic || "",
    session,
    curriculumContext
  );

  try {
    const llmEvaluation = await evaluateAnswerWithLLM({
      answer,
      topic: currentQuestion?.topic || curriculumContext?.title || "",
      objectives: curriculumContext?.objectives || [],
      tools: curriculumContext?.tools || [],
      difficulty: currentQuestion?.difficulty || session?.currentDifficulty || "Intermediate",
    });
    return llmEvaluation;
  } catch (error) {
    console.warn("Answer evaluation fallback used.", { code: error?.code || "EVALUATION_FAILED" });
    return heuristic;
  }
}

/**
 * List candidates available for interview selection.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const getCandidates = (req, res) => {
  try {
    const candidates = listCandidates();
    return res.status(200).json({
      success: true,
      candidates,
      count: candidates.length,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to load candidates.",
    });
  }
};

/**
 * Start an interview session for the requested candidate.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const startInterview = async (req, res) => {
  let createdSessionId;
  try {
    const { candidateId } = req.body || {};

    if (typeof candidateId !== "string" || !candidateId.trim() || candidateId.length > 80) {
      return res.status(400).json({
        success: false,
        message: "A valid candidateId is required.",
      });
    }

    const { session, currentQuestion } = createSession(candidateId.trim());
    createdSessionId = session.sessionId;
    const interviewState = buildInterviewState(session);
    const curriculumContext = getCurriculumContextForTopic(
      currentQuestion?.topic,
      currentQuestion?.day
    );

    const prompt = buildPrompt(
      session.plan,
      {
        ...(currentQuestion || {}),
        topic: currentQuestion?.topic,
        difficulty: currentQuestion?.difficulty || "Intermediate",
        objectives: curriculumContext.objectives,
        tools: curriculumContext.tools,
      },
      [],
      {
        name: session.candidateName,
        role: session.role,
        experience: session.experience,
      },
      {
        action: "askFollowUp",
        stayOnTopic: true,
        difficulty: currentQuestion?.difficulty || "Intermediate",
        reason: "Opening the interview with a warm greeting and introduction question.",
        objectives: curriculumContext.objectives,
      }
    );

    const response = await generateResponse(prompt);
    const aiMessage =
      response?.message ||
      `Hello ${session.candidateName || "there"}! Welcome to your AI interview. Could you briefly introduce yourself and tell me about your background?`;

    session.conversation.push({
      role: "assistant",
      content: aiMessage,
      timestamp: new Date().toISOString(),
    });

    return res.status(200).json({
      success: true,
      sessionId: session.sessionId,
      candidateId: session.candidateId,
      candidateName: session.candidateName,
      role: session.role,
      message: aiMessage,
      currentQuestion: currentQuestion,
      interviewState,
      progress: {
        current: Math.max(1, Number(interviewState.currentQuestionIndex || 0) + 1),
        total: Array.isArray(session.plan?.interviewPlan) ? session.plan.interviewPlan.length : 0,
      },
      usage: response?.usage || {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
      },
      model: response?.model || process.env.OPENAI_MODEL || "unknown",
    });
  } catch (error) {
    if (createdSessionId) clearSession(createdSessionId);
    const status = error?.code === "SESSION_CAPACITY"
      ? 503
      : /Candidate with id/.test(error?.message || "")
        ? 404
        : isOpenAIConfigurationError(error)
          ? 503
          : createdSessionId
            ? 502
            : 500;
    return res.status(status).json({
      success: false,
      message: status === 404
        ? "The selected candidate was not found."
        : status === 503
          ? "Interview service is temporarily unavailable."
          : status === 502
            ? "Unable to start the interview right now. Please try again."
            : "Unable to start the interview.",
      error: true,
    });
  }
};

/**
 * Build the next prompt and generate the interviewer's response.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const sendMessage = async (req, res) => {
  let lockedSessionId;
  try {
    const { sessionId, message, candidateAnswer } = req.body || {};

    if (!isValidSessionId(sessionId)) {
      return res.status(400).json({
        success: false,
        message: "A valid sessionId is required.",
        error: true,
      });
    }

    const trimmedMessage =
      typeof (message ?? candidateAnswer) === "string"
        ? String(message ?? candidateAnswer).trim()
        : "";
    if (!trimmedMessage) {
      return res.status(400).json({
        success: false,
        message: "Candidate message is required.",
        error: true,
      });
    }

    if (trimmedMessage.length > MAX_ANSWER_LENGTH) {
      return res.status(413).json({
        success: false,
        message: `Candidate message must be ${MAX_ANSWER_LENGTH} characters or fewer.`,
        error: true,
      });
    }

    const session = getSession(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Interview session not found.",
        error: true,
      });
    }

    if (session.completed) {
      return res.status(409).json({
        success: false,
        message: "This interview session has already ended.",
        error: true,
      });
    }

    if (processingSessions.has(sessionId)) {
      return res.status(409).json({
        success: false,
        message: "A response is already being processed for this interview.",
        error: true,
      });
    }
    processingSessions.add(sessionId);
    lockedSessionId = sessionId;

    const currentQuestion =
      session?.plan?.interviewPlan?.[session.currentQuestionIndex] || null;
    const curriculumContext = getCurriculumContextForTopic(
      currentQuestion?.topic,
      currentQuestion?.day
    );

    const evaluation = await resolveEvaluation(
      trimmedMessage,
      currentQuestion,
      session,
      curriculumContext
    );

    const decisionResult = processAnswer(
      session,
      currentQuestion,
      trimmedMessage,
      evaluation,
      curriculumContext
    );

    const decision = {
      evaluation: decisionResult.evaluation,
      action: decisionResult.action,
      reason: decisionResult.reason,
      difficulty:
        decisionResult.state?.currentDifficulty || currentQuestion?.difficulty || "Intermediate",
      nextQuestion: decisionResult.nextQuestion,
      finishInterview: Boolean(decisionResult.finishInterview),
      stayOnTopic: decisionResult.action !== "moveToNextTopic",
      nextTopicAllowed: decisionResult.action === "moveToNextTopic",
      objectives: curriculumContext.objectives,
    };

    const rollbackSnapshot = {
      followUpCount: session.followUpCount,
      askedQuestions: [...(session.askedQuestions || [])],
      currentDifficulty: session.currentDifficulty,
      currentTopicScore: session.currentTopicScore,
      weakTopics: [...(session.weakTopics || [])],
      strongTopics: [...(session.strongTopics || [])],
      currentTopic: session.currentTopic,
      topicScores: { ...(session.topicScores || {}) },
      evaluationHistory: [...(session.evaluationHistory || [])],
      followUpHistory: [...(session.followUpHistory || [])],
      conversationLength: session.conversation.length,
      currentQuestionIndex: session.currentQuestionIndex,
      completedQuestions: [...(session.completedQuestions || [])],
      completedTopics: [...(session.completedTopics || [])],
      completed: session.completed,
      endedAt: session.endedAt,
      currentQuestion: session.currentQuestion,
    };

    applyEngineState(session, decisionResult.state);
    recordTopicEvaluation(session, currentQuestion, decisionResult, decision);

    const shouldFinish =
      Boolean(decision.finishInterview) ||
      (decisionResult.nextQuestion === null && decision.action === "moveToNextTopic");

    if (shouldFinish) {
      recordAnswer(sessionId, trimmedMessage, decision);
      const summary = endSession(sessionId);
      const report = generateInterviewReport(session);
      const interviewState = buildInterviewState(session);
      clearSession(sessionId);

      return res.status(200).json({
        success: true,
        message: "Thank you. The interview is complete.",
        summary,
        report,
        interviewState,
        nextQuestion: null,
        error: false,
      });
    }

    const nextCurriculumContext = getCurriculumContextForTopic(
      decisionResult.nextQuestion?.topic || currentQuestion?.topic,
      decisionResult.nextQuestion?.day || currentQuestion?.day
    );

    const previewNextQuestion = {
      ...(decisionResult.nextQuestion || currentQuestion || {}),
      decision,
      evaluation: decisionResult.evaluation,
      reason: decisionResult.reason,
      previousQuestion: currentQuestion?.topic || "N/A",
      candidateAnswer: trimmedMessage,
      followUp: decisionResult.nextQuestion?.followUp || "",
      suggestedQuestion:
        decisionResult.nextQuestion?.followUp ||
        decisionResult.nextQuestion?.topic ||
        currentQuestion?.topic ||
        "",
      objectives: nextCurriculumContext.objectives,
      tools: nextCurriculumContext.tools,
    };

    const conversationForPrompt = [
      ...session.conversation,
      {
        role: "user",
        content: trimmedMessage,
        timestamp: new Date().toISOString(),
      },
    ];

    const prompt = buildPrompt(
      session.plan,
      previewNextQuestion,
      conversationForPrompt,
      {
        name: session.candidateName,
        role: session.role,
        experience: session.experience,
      },
      decision
    );

    let response;
    try {
      response = await generateResponse(prompt);
    } catch (llmError) {
      Object.assign(session, {
        followUpCount: rollbackSnapshot.followUpCount,
        askedQuestions: rollbackSnapshot.askedQuestions,
        currentDifficulty: rollbackSnapshot.currentDifficulty,
        currentTopicScore: rollbackSnapshot.currentTopicScore,
        weakTopics: rollbackSnapshot.weakTopics,
        strongTopics: rollbackSnapshot.strongTopics,
        currentTopic: rollbackSnapshot.currentTopic,
        topicScores: rollbackSnapshot.topicScores,
        evaluationHistory: rollbackSnapshot.evaluationHistory,
        followUpHistory: rollbackSnapshot.followUpHistory,
        currentQuestionIndex: rollbackSnapshot.currentQuestionIndex,
        completedQuestions: rollbackSnapshot.completedQuestions,
        completedTopics: rollbackSnapshot.completedTopics,
        completed: rollbackSnapshot.completed,
        endedAt: rollbackSnapshot.endedAt,
        currentQuestion: rollbackSnapshot.currentQuestion,
      });
      session.conversation.length = rollbackSnapshot.conversationLength;

      return res.status(502).json({
        success: false,
        message: "Unable to generate the next interview question. Please try again.",
        error: true,
      });
    }

    const { nextQuestion, interviewState } = recordAnswer(sessionId, trimmedMessage, decision);

    if (decision.action === "moveToNextTopic") {
      session.followUpCount = 0;
    }

    if (!nextQuestion || interviewState?.completed) {
      const summary = endSession(sessionId);
      const report = generateInterviewReport(session);
      clearSession(sessionId);

      return res.status(200).json({
        success: true,
        message: "Thank you. The interview is complete.",
        summary,
        report,
        interviewState: buildInterviewState({ ...session, completed: true }),
        nextQuestion: null,
        error: false,
      });
    }

    const aiMessage = response.message;
    session.conversation.push({
      role: "assistant",
      content: aiMessage,
      timestamp: new Date().toISOString(),
    });

    const finalNextQuestion = {
      ...(nextQuestion || currentQuestion || {}),
      decision,
      evaluation: decisionResult.evaluation,
      reason: decisionResult.reason,
      previousQuestion: currentQuestion?.topic || "N/A",
      candidateAnswer: trimmedMessage,
      followUp: decisionResult.nextQuestion?.followUp || nextQuestion?.followUp || "",
      suggestedQuestion:
        decisionResult.nextQuestion?.followUp ||
        nextQuestion?.followUp ||
        nextQuestion?.topic ||
        "",
      objectives: nextCurriculumContext.objectives,
      tools: nextCurriculumContext.tools,
    };

    return res.status(200).json({
      success: true,
      sessionId,
      message: aiMessage,
      usage: response?.usage || {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
      },
      model: response?.model || process.env.OPENAI_MODEL || "unknown",
      interviewState: buildInterviewState(session),
      nextQuestion: finalNextQuestion,
      decision,
      error: false,
    });
  } catch (error) {
    console.error("Interview message processing failed.", { code: error?.code || "INTERVIEW_ERROR" });
    return res.status(500).json({
      success: false,
      message: "Unable to process that response. Please try again.",
      error: true,
    });
  } finally {
    if (lockedSessionId) processingSessions.delete(lockedSessionId);
  }
};

/**
 * End the active interview session and return summary details.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const endInterview = (req, res) => {
  try {
    const { sessionId } = req.body || {};

    if (!isValidSessionId(sessionId)) {
      return res.status(400).json({
        success: false,
        message: "A valid sessionId is required.",
      });
    }

    if (processingSessions.has(sessionId)) {
      return res.status(409).json({
        success: false,
        message: "Wait for the current response to finish before ending the interview.",
      });
    }

    const session = getSession(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Interview session not found.",
      });
    }

    const summary = endSession(sessionId);
    const report = generateInterviewReport(session);
    const interviewState = buildInterviewState(session);
    clearSession(sessionId);

    return res.status(200).json({
      success: true,
      ...summary,
      report,
      interviewState,
    });
  } catch (error) {
    console.error("Interview end failed.", { code: error?.code || "INTERVIEW_END_ERROR" });
    return res.status(400).json({
      success: false,
      message: "Unable to end interview.",
    });
  }
};
