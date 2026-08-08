/**
 * AdaptiveInterviewEngine
 *
 * Decides interview flow, difficulty, follow-up behavior, and evaluation using the
 * candidate profile, curriculum context, and live conversation history.
 *
 * This service is responsible for interview intelligence. It does not call the LLM.
 * It decides what should happen next, and the LLM only produces natural language.
 */

const MAX_FOLLOW_UPS = 2;
const DIFFICULTY_LEVELS = ["Easy", "Intermediate", "Advanced", "Expert"];
const ANSWER_CLASSES = ["EXCELLENT", "GOOD", "PARTIAL", "WEAK", "INCORRECT"];

/**
 * Normalize numeric values into a bounded range.
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Create a small keyword bag from the current topic.
 * @param {string} topic
 * @returns {string[]}
 */
function extractTopicKeywords(topic = "") {
  return String(topic)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((word) => word.length > 3);
}

/**
 * Estimate whether the answer is likely relevant to the topic.
 * @param {string} answer
 * @param {string} topic
 * @returns {number}
 */
function estimateTopicCoverage(answer = "", topic = "") {
  const text = String(answer).toLowerCase();
  const keywords = extractTopicKeywords(topic);

  if (!keywords.length) {
    return Math.min(text.length / 80, 1) * 100;
  }

  const matches = keywords.filter((keyword) => text.includes(keyword)).length;
  return clamp((matches / Math.max(keywords.length, 1)) * 100, 0, 100);
}

/**
 * Evaluate a candidate answer and return a structured assessment.
 * @param {string} answer
 * @param {string} question
 * @param {object} session
 * @returns {{
 *   classification: string,
 *   confidenceScore: number,
 *   coverageScore: number,
 *   reasoningScore: number,
 *   communicationScore: number,
 *   reason: string
 * }}
 */
export function evaluateAnswer(answer = "", question = "", session = {}) {
  const cleaned = String(answer || "").trim();
  const questionText = String(question || "");
  const totalLength = cleaned.length;
  const coverageScore = estimateTopicCoverage(cleaned, questionText);

  if (!cleaned) {
    return {
      classification: "INCORRECT",
      confidenceScore: 10,
      coverageScore: 0,
      reasoningScore: 0,
      communicationScore: 20,
      reason: "No answer was provided yet.",
    };
  }

  const explicitUncertainty = /\b(i\s+(don\'t|do not|cannot|can't|do not)|not sure|no idea|no clue|unsure|i\s+am\s+not\s+sure|i\s+don\'t\s+remember|i\s+don\s*'?t\s+know)\b/i.test(cleaned);

  if (explicitUncertainty) {
    return {
      classification: "WEAK",
      confidenceScore: 25,
      coverageScore: 5,
      reasoningScore: 15,
      communicationScore: 30,
      reason: "The candidate explicitly admitted uncertainty and needs a simpler, more guided question on the same topic.",
    };
  }

  const containsEvidence = /(because|therefore|for example|such as|this means|since|if|when|while|however|therefore)/i.test(cleaned);
  const containsSpecifics = /\b(embedding|retrieval|prompt|llm|agent|vector|context|token|rag|model|api|security|mcp|tools|dataset|pipeline|evaluation)\b/i.test(cleaned);
  const seriousLength = totalLength > 180;
  const moderateLength = totalLength > 60;

  let classification = "WEAK";
  let confidenceScore = 25;
  let reasoningScore = 20;
  let communicationScore = 35;

  if (coverageScore >= 80 && seriousLength && containsEvidence) {
    classification = "EXCELLENT";
    confidenceScore = 92;
    reasoningScore = 94;
    communicationScore = 88;
  } else if (coverageScore >= 65 && (moderateLength || containsSpecifics)) {
    classification = "GOOD";
    confidenceScore = 78;
    reasoningScore = 76;
    communicationScore = 80;
  } else if (coverageScore >= 45 && (moderateLength || containsSpecifics || containsEvidence)) {
    classification = "PARTIAL";
    confidenceScore = 58;
    reasoningScore = 52;
    communicationScore = 60;
  } else if (coverageScore >= 25 && totalLength < 120) {
    classification = "WEAK";
    confidenceScore = 35;
    reasoningScore = 28;
    communicationScore = 45;
  } else {
    classification = "INCORRECT";
    confidenceScore = 18;
    reasoningScore = 15;
    communicationScore = 30;
  }

  const reasonMap = {
    EXCELLENT: "The answer shows solid understanding and relevant examples.",
    GOOD: "The answer is mostly correct with some room for deeper reasoning.",
    PARTIAL: "The answer is directionally correct but too shallow or incomplete.",
    WEAK: "The answer shows limited understanding of the concept.",
    INCORRECT: "The answer is not aligned with the topic and needs clarification.",
  };

  return {
    classification,
    confidenceScore,
    coverageScore: clamp(Math.round(coverageScore), 0, 100),
    reasoningScore,
    communicationScore,
    reason: reasonMap[classification] || "The answer needs follow-up evaluation.",
  };
}

/**
 * Adjust difficulty using performance.
 * @param {string} classification
 * @param {string} currentDifficulty
 * @returns {string}
 */
export function adjustDifficulty(classification = "PARTIAL", currentDifficulty = "Intermediate") {
  const index = DIFFICULTY_LEVELS.indexOf(currentDifficulty);
  const safeIndex = index >= 0 ? index : 1;

  if (classification === "EXCELLENT") {
    return DIFFICULTY_LEVELS[Math.min(safeIndex + 1, DIFFICULTY_LEVELS.length - 1)];
  }

  if (classification === "WEAK" || classification === "INCORRECT") {
    return DIFFICULTY_LEVELS[Math.max(safeIndex - 1, 0)];
  }

  return currentDifficulty;
}

/**
 * Determine the next interview action based on evaluation and session state.
 * @param {object} session
 * @param {object} evaluation
 * @returns {{
 *   action: string,
 *   reason: string,
 *   shouldMoveToNextTopic: boolean,
 *   shouldAskFollowUp: boolean,
 *   shouldFinish: boolean
 * }}
 */
export function determineNextAction(session = {}, evaluation = {}) {
  const followUpCount = Number(session?.followUpCount ?? 0);
  const topicScore = Number(session?.currentTopicScore ?? 0);
  const classification = evaluation?.classification || "PARTIAL";

  // Cap follow-ups for every classification so the interview cannot stall forever.
  if (followUpCount >= MAX_FOLLOW_UPS) {
    return {
      action: "moveToNextTopic",
      reason: "Follow-up limit reached for this topic; continuing to the next topic.",
      shouldMoveToNextTopic: true,
      shouldAskFollowUp: false,
      shouldFinish: false,
    };
  }

  if (classification === "INCORRECT") {
    return {
      action: "askFollowUp",
      reason: "The candidate needs a guided clarification without revealing the answer.",
      shouldMoveToNextTopic: false,
      shouldAskFollowUp: true,
      shouldFinish: false,
    };
  }

  if (classification === "WEAK") {
    return {
      action: "decreaseDifficulty",
      reason: "The candidate needs a simpler question to establish a baseline understanding.",
      shouldMoveToNextTopic: false,
      shouldAskFollowUp: true,
      shouldFinish: false,
    };
  }

  if (classification === "PARTIAL") {
    return {
      action: "askFollowUp",
      reason: "The answer is incomplete and needs a clarification question on the same topic.",
      shouldMoveToNextTopic: false,
      shouldAskFollowUp: true,
      shouldFinish: false,
    };
  }

  if (classification === "GOOD") {
    if (topicScore >= 70) {
      return {
        action: "moveToNextTopic",
        reason: "The candidate has demonstrated enough understanding to continue to the next topic.",
        shouldMoveToNextTopic: true,
        shouldAskFollowUp: false,
        shouldFinish: false,
      };
    }

    return {
      action: "askFollowUp",
      reason: "The candidate is solid but still needs one deeper probe before moving on.",
      shouldMoveToNextTopic: false,
      shouldAskFollowUp: true,
      shouldFinish: false,
    };
  }

  if (classification === "EXCELLENT") {
    if (topicScore >= 70) {
      return {
        action: "moveToNextTopic",
        reason: "The candidate has shown strong mastery and can progress to the next topic.",
        shouldMoveToNextTopic: true,
        shouldAskFollowUp: false,
        shouldFinish: false,
      };
    }

    return {
      action: "increaseDifficulty",
      reason: "The candidate is performing at a strong level; a more advanced question is appropriate.",
      shouldMoveToNextTopic: false,
      shouldAskFollowUp: true,
      shouldFinish: false,
    };
  }

  return {
    action: "stayOnCurrentTopic",
    reason: "Keep the candidate on the current topic to assess understanding before moving forward.",
    shouldMoveToNextTopic: false,
    shouldAskFollowUp: true,
    shouldFinish: false,
  };
}

/**
 * Generate a context-aware follow-up question.
 * @param {string} classification
 * @param {string} topic
 * @param {string} currentDifficulty
 * @returns {string}
 */
export function buildFollowUpQuestion(classification = "PARTIAL", topic = "", currentDifficulty = "Intermediate") {
  const topicText = String(topic || "this topic");

  if (classification === "INCORRECT") {
    return `Think about how the model gets external knowledge. Try again and explain your reasoning in simpler terms.`;
  }

  if (classification === "WEAK") {
    return `Let’s simplify this: what is the core idea behind ${topicText.toLowerCase()}?`;
  }

  if (classification === "PARTIAL") {
    return `You mentioned ${topicText.toLowerCase()}. Can you explain the key mechanism or concept behind it in more detail?`;
  }

  if (classification === "GOOD") {
    return `Why does ${topicText.toLowerCase()} matter in a production system, and what tradeoff should an engineer consider?`;
  }

  if (classification === "EXCELLENT") {
    if (currentDifficulty === "Advanced" || currentDifficulty === "Expert") {
      return `How would you design a production-grade version of ${topicText.toLowerCase()} while balancing latency, quality, and cost?`;
    }

    return `How would you design a stronger real-world implementation of ${topicText.toLowerCase()} in a production environment?`;
  }

  return `Can you explain your understanding of ${topicText.toLowerCase()} in one concise example?`;
}

/**
 * Move to the next unasked topic in the interview plan.
 * @param {object} session
 * @returns {object | null}
 */
export function moveToNextTopic(session = {}) {
  const plan = Array.isArray(session?.plan?.interviewPlan) ? session.plan.interviewPlan : [];
  const asked = new Set(Array.isArray(session?.askedQuestions) ? session.askedQuestions : []);

  const nextTopic = plan.find((item) => !asked.has(item?.topic));
  return nextTopic || null;
}

/**
 * Add a question to the asked list and compute the next state.
 * @param {object} session
 * @param {string} topic
 */
export function markQuestionAsked(session = {}, topic = "") {
  const asked = new Set(Array.isArray(session?.askedQuestions) ? session.askedQuestions : []);

  if (topic) {
    asked.add(topic);
  }

  session.askedQuestions = [...asked];
}

/**
 * Update session memory with evaluation results and derived metrics.
 * @param {object} session
 * @param {object} evaluation
 * @param {object} currentQuestion
 * @param {number} questionNumber
 * @returns {object}
 */
export function updateSessionMemory(session = {}, evaluation = {}, currentQuestion = {}, questionNumber = 1) {
  const classification = evaluation?.classification || "PARTIAL";
  const nextDifficulty = adjustDifficulty(classification, session?.currentDifficulty || "Intermediate");
  const overallScore = Number(
    ((Number(evaluation?.confidenceScore || 0) + Number(evaluation?.coverageScore || 0) + Number(evaluation?.reasoningScore || 0)) / 3).toFixed(2)
  );

  const sessionState = {
    ...session,
    currentTopic: currentQuestion?.topic || session?.currentTopic || "Current topic",
    currentDifficulty: nextDifficulty,
    questionNumber: Number(questionNumber || session?.questionNumber || 1),
    followUpCount: Number(session?.followUpCount || 0),
    evaluationHistory: Array.isArray(session?.evaluationHistory) ? [...session.evaluationHistory, evaluation] : [evaluation],
    conversationHistory: Array.isArray(session?.conversationHistory) ? [...session.conversationHistory] : [],
    weakTopics: Array.isArray(session?.weakTopics) ? [...session.weakTopics] : [],
    strongTopics: Array.isArray(session?.strongTopics) ? [...session.strongTopics] : [],
    difficulty: nextDifficulty,
    overallScore,
    currentTopicScore: overallScore,
  };

  if (classification === "WEAK" || classification === "INCORRECT") {
    const currentTopic = currentQuestion?.topic || session?.currentTopic;
    if (currentTopic && !sessionState.weakTopics.includes(currentTopic)) {
      sessionState.weakTopics.push(currentTopic);
    }
  }

  if (classification === "GOOD" || classification === "EXCELLENT") {
    const currentTopic = currentQuestion?.topic || session?.currentTopic;
    if (currentTopic && !sessionState.strongTopics.includes(currentTopic)) {
      sessionState.strongTopics.push(currentTopic);
    }
  }

  return sessionState;
}

/**
 * Decide the next interview action and the next question.
 * @param {object} session
 * @param {object} currentQuestion
 * @param {string} candidateAnswer
 * @returns {{
 *   evaluation: object,
 *   action: string,
 *   nextQuestion: object | null,
 *   reason: string,
 *   state: object,
 *   finishInterview: boolean
 * }}
 */
export function processAnswer(session = {}, currentQuestion = {}, candidateAnswer = "") {
  const evaluation = evaluateAnswer(candidateAnswer, currentQuestion?.topic || "", session);
  const updatedSession = updateSessionMemory(session, evaluation, currentQuestion, session?.questionNumber || 1);
  const decision = determineNextAction(updatedSession, evaluation);

  if (decision.action === "moveToNextTopic") {
    const nextTopic = moveToNextTopic(updatedSession);
    updatedSession.currentTopic = nextTopic?.topic || updatedSession.currentTopic;
    updatedSession.followUpCount = 0;
    markQuestionAsked(updatedSession, nextTopic?.topic || currentQuestion?.topic);

    return {
      evaluation,
      action: "moveToNextTopic",
      nextQuestion: nextTopic || null,
      reason: decision.reason,
      state: updatedSession,
      finishInterview: false,
    };
  }

  if (decision.action === "decreaseDifficulty") {
    updatedSession.currentDifficulty = "Easy";
    updatedSession.followUpCount += 1;
    markQuestionAsked(updatedSession, currentQuestion?.topic);

    return {
      evaluation,
      action: "decreaseDifficulty",
      nextQuestion: {
        ...currentQuestion,
        topic: currentQuestion?.topic,
        difficulty: "Easy",
      },
      reason: decision.reason,
      state: updatedSession,
      finishInterview: false,
    };
  }

  if (decision.action === "increaseDifficulty") {
    updatedSession.currentDifficulty = "Advanced";
    updatedSession.followUpCount += 1;
    markQuestionAsked(updatedSession, currentQuestion?.topic);

    return {
      evaluation,
      action: "increaseDifficulty",
      nextQuestion: {
        ...currentQuestion,
        topic: currentQuestion?.topic,
        difficulty: "Advanced",
      },
      reason: decision.reason,
      state: updatedSession,
      finishInterview: false,
    };
  }

  if (decision.action === "askFollowUp") {
    updatedSession.followUpCount += 1;
    markQuestionAsked(updatedSession, currentQuestion?.topic);

    return {
      evaluation,
      action: "askFollowUp",
      nextQuestion: {
        ...currentQuestion,
        topic: currentQuestion?.topic,
        difficulty: updatedSession.currentDifficulty,
        followUp: buildFollowUpQuestion(
          evaluation.classification,
          currentQuestion?.topic || "this topic",
          updatedSession.currentDifficulty
        ),
      },
      reason: decision.reason,
      state: updatedSession,
      finishInterview: false,
    };
  }

  return {
    evaluation,
    action: "stayOnCurrentTopic",
    nextQuestion: currentQuestion,
    reason: decision.reason,
    state: updatedSession,
    finishInterview: false,
  };
}

export default {
  evaluateAnswer,
  adjustDifficulty,
  determineNextAction,
  buildFollowUpQuestion,
  moveToNextTopic,
  updateSessionMemory,
  processAnswer,
  MAX_FOLLOW_UPS,
  DIFFICULTY_LEVELS,
  ANSWER_CLASSES,
};
