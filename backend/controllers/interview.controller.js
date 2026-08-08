import {
  createSession,
  getSession,
  recordAnswer,
  endSession,
  buildInterviewState,
} from "../services/SessionManagerService.js";
import { buildPrompt } from "../services/PromptBuilderService.js";
import { generateResponse } from "../services/openai.service.js";
import { processAnswer } from "../services/AdaptiveInterviewEngine.js";
import { generateInterviewReport } from "../services/ReportGeneratorService.js";

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
 * Start an interview session for the requested candidate.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const startInterview = async (req, res) => {
  try {
    const { candidateId } = req.body || {};

    if (!candidateId) {
      return res.status(400).json({
        success: false,
        message: "candidateId is required.",
      });
    }

    const { session, currentQuestion } = createSession(candidateId);
    const interviewState = buildInterviewState(session);

    const prompt = buildPrompt(
      session.plan,
      {
        ...(currentQuestion || {}),
        topic: currentQuestion?.topic,
        difficulty: currentQuestion?.difficulty || "Intermediate",
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
    return res.status(400).json({
      success: false,
      message: error.message || "Unable to start interview.",
    });
  }
};

/**
 * Build the next prompt and generate the interviewer's response.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const sendMessage = async (req, res) => {
  try {
    const { sessionId, message } = req.body || {};

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: "sessionId is required.",
      });
    }

    const session = getSession(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Interview session not found.",
      });
    }

    const currentQuestion =
      session?.plan?.interviewPlan?.[session.currentQuestionIndex] || null;
    const decisionResult = processAnswer(session, currentQuestion, message || "");
    applyEngineState(session, decisionResult.state);

    const decision = {
      evaluation: decisionResult.evaluation,
      action: decisionResult.action,
      reason: decisionResult.reason,
      difficulty: decisionResult.state?.currentDifficulty || currentQuestion?.difficulty || "Intermediate",
      nextQuestion: decisionResult.nextQuestion,
      finishInterview: Boolean(decisionResult.finishInterview),
      stayOnTopic: decisionResult.action !== "moveToNextTopic",
      nextTopicAllowed: decisionResult.action === "moveToNextTopic",
    };

    const currentTopic = currentQuestion?.topic || session?.currentTopic;
    if (currentTopic) {
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

    const { nextQuestion, interviewState } = recordAnswer(sessionId, message || "", decision);

    // Keep live session follow-up count in sync after recordAnswer resets on topic move.
    if (decision.action === "moveToNextTopic") {
      session.followUpCount = 0;
    }

    if (!nextQuestion || interviewState?.completed || decision.finishInterview) {
      const summary = endSession(sessionId);
      const report = generateInterviewReport(session);
      return res.status(200).json({
        success: true,
        message: "Thank you. The interview is complete.",
        summary,
        report,
        interviewState: buildInterviewState(session),
        nextQuestion: null,
        error: false,
      });
    }

    const finalNextQuestion = {
      ...(nextQuestion || currentQuestion || {}),
      decision,
      evaluation: decisionResult.evaluation,
      reason: decisionResult.reason,
      previousQuestion: currentQuestion?.topic || "N/A",
      candidateAnswer: message || "",
      followUp: decisionResult.nextQuestion?.followUp || nextQuestion?.followUp || "",
      suggestedQuestion:
        decisionResult.nextQuestion?.followUp ||
        nextQuestion?.followUp ||
        nextQuestion?.topic ||
        "",
    };

    const prompt = buildPrompt(
      session.plan,
      finalNextQuestion,
      session.conversation,
      {
        name: session.candidateName,
        role: session.role,
        experience: session.experience,
      },
      decision
    );

    const response = await generateResponse(prompt);
    const aiMessage = response?.message || "Could you tell me a bit more about that?";

    session.conversation.push({
      role: "assistant",
      content: aiMessage,
      timestamp: new Date().toISOString(),
    });

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
    return res.status(200).json({
      success: false,
      message: "Sorry, I'm having trouble generating the next interview question. Please try again.",
      error: true,
    });
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

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: "sessionId is required.",
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

    return res.status(200).json({
      success: true,
      ...summary,
      report,
      interviewState: buildInterviewState(session),
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Unable to end interview.",
    });
  }
};
