import { createSession, getSession, recordAnswer, endSession } from "../services/SessionManagerService.js";
import { buildPrompt } from "../services/PromptBuilderService.js";
import { generateResponse } from "../services/openai.service.js";
import { processAnswer } from "../services/AdaptiveInterviewEngine.js";
import { generateInterviewReport } from "../services/ReportGeneratorService.js";

/**
 * Start an interview session for the requested candidate.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const startInterview = (req, res) => {
  try {
    const { candidateId } = req.body || {};

    if (!candidateId) {
      return res.status(400).json({
        success: false,
        message: "candidateId is required.",
      });
    }

    const { session, currentQuestion } = createSession(candidateId);

    return res.status(200).json({
      success: true,
      sessionId: session.sessionId,
      candidateName: session.candidateName,
      role: session.role,
      currentQuestion: currentQuestion,
      progress: {
        current: 1,
        total: Array.isArray(session.plan?.interviewPlan) ? session.plan.interviewPlan.length : 0,
      },
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

    const currentQuestion = getSession(sessionId)?.plan?.interviewPlan?.[getSession(sessionId).currentQuestionIndex] || null;
    const decisionResult = processAnswer(session, currentQuestion, message || "");
    const decision = {
      evaluation: decisionResult.evaluation,
      action: decisionResult.action,
      reason: decisionResult.reason,
      difficulty: decisionResult.state?.currentDifficulty || currentQuestion?.difficulty || "Intermediate",
      nextQuestion: decisionResult.nextQuestion,
      finishInterview: Boolean(decisionResult.finishInterview),
      stayOnTopic: decisionResult.action !== "moveToNextTopic",
    };

    const currentTopic = currentQuestion?.topic || session?.currentTopic;
    if (currentTopic) {
      const avgScore = Number(
        ((Number(decisionResult.evaluation?.confidenceScore || 0) + Number(decisionResult.evaluation?.coverageScore || 0) + Number(decisionResult.evaluation?.reasoningScore || 0)) / 3).toFixed(2)
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

    if (!nextQuestion) {
      const summary = endSession(sessionId);
      const report = generateInterviewReport(session);
      return res.status(200).json({
        success: true,
        message: "Thank you. The interview is complete.",
        summary,
        report,
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
      interviewState,
      nextQuestion: finalNextQuestion,
      decision,
      error: false,
    });
  } catch (error) {
    return res.status(200).json({
      success: false,
      message: "Sorry, I'm having trouble generating the next interview question. Please try again.",
      error: false,
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
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Unable to end interview.",
    });
  }
};
