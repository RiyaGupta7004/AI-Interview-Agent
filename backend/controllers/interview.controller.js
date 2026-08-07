import { createSession, getSession, recordAnswer, endSession } from "../services/SessionManagerService.js";
import { buildPrompt } from "../services/PromptBuilderService.js";
import { generateResponse } from "../services/openai.service.js";

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

    const { nextQuestion, interviewState } = recordAnswer(sessionId, message || "");

    if (!nextQuestion) {
      const summary = endSession(sessionId);
      return res.status(200).json({
        success: true,
        message: "Thank you. The interview is complete.",
        summary,
        error: false,
      });
    }

    const prompt = buildPrompt(
      session.plan,
      nextQuestion,
      session.conversation,
      {
        name: session.candidateName,
        role: session.role,
        experience: session.experience,
      }
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
      nextQuestion,
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

    const summary = endSession(sessionId);

    return res.status(200).json({
      success: true,
      ...summary,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Unable to end interview.",
    });
  }
};
