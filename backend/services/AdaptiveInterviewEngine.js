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
 * Create a small keyword bag from free text.
 * @param {string} text
 * @returns {string[]}
 */
function extractKeywords(text = "") {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((word) => word.length > 3);
}

/**
 * Create a small keyword bag from the current topic.
 * @param {string} topic
 * @returns {string[]}
 */
function extractTopicKeywords(topic = "") {
  return extractKeywords(topic);
}

/**
 * Estimate whether the answer is likely relevant to the topic and objectives.
 * @param {string} answer
 * @param {string} topic
 * @param {object} [curriculumContext]
 * @returns {number}
 */
function estimateTopicCoverage(answer = "", topic = "", curriculumContext = {}) {
  const text = String(answer).toLowerCase();
  const topicKeywords = extractTopicKeywords(topic);
  const objectiveKeywords = extractKeywords((curriculumContext?.objectives || []).join(" "));
  const toolKeywords = extractKeywords((curriculumContext?.tools || []).join(" "));
  const keywords = [...new Set([...topicKeywords, ...objectiveKeywords, ...toolKeywords])];

  if (!keywords.length) {
    return Math.min(text.length / 80, 1) * 100;
  }

  const matches = keywords.filter((keyword) => text.includes(keyword)).length;
  const coverage = (matches / Math.max(keywords.length, 1)) * 100;

  const objectives = Array.isArray(curriculumContext?.objectives) ? curriculumContext.objectives : [];
  let objectiveHits = 0;
  for (const objective of objectives) {
    const objectiveWords = extractKeywords(objective).slice(0, 4);
    if (objectiveWords.some((word) => text.includes(word))) {
      objectiveHits += 1;
    }
  }
  const objectiveBoost = objectives.length ? (objectiveHits / objectives.length) * 25 : 0;

  return clamp(coverage + objectiveBoost, 0, 100);
}

/**
 * Pull a short snippet from the candidate answer for follow-up grounding.
 * @param {string} answer
 * @param {number} maxLen
 * @returns {string}
 */
function extractAnswerSnippet(answer = "", maxLen = 90) {
  const cleaned = String(answer || "").replace(/\s+/g, " ").trim();
  if (!cleaned) {
    return "";
  }

  const clauseMatch = cleaned.match(
    /(?:because|for example|such as|this means|in practice|I would|we used)[^.!?]{8,120}/i
  );
  const snippet = (clauseMatch?.[0] || cleaned).trim();
  if (snippet.length <= maxLen) {
    return snippet;
  }
  return `${snippet.slice(0, Math.max(0, maxLen - 1)).trim()}…`;
}

/**
 * Evaluate a candidate answer and return a structured assessment.
 * @param {string} answer
 * @param {string} question
 * @param {object} session
 * @param {object} [curriculumContext]
 * @returns {object}
 */
export function evaluateAnswer(answer = "", question = "", session = {}, curriculumContext = {}) {
  const cleaned = String(answer || "").trim();
  const questionText = String(question || curriculumContext?.title || "");
  const totalLength = cleaned.length;
  const coverageScore = estimateTopicCoverage(cleaned, questionText, curriculumContext);

  if (!cleaned) {
    return {
      classification: "INCORRECT",
      confidenceScore: 10,
      coverageScore: 0,
      reasoningScore: 0,
      communicationScore: 20,
      reason: "No answer was provided yet.",
      source: "heuristic",
    };
  }

  const explicitUncertainty =
    /\b(i\s+(don\'t|do not|cannot|can't)|not sure|no idea|no clue|unsure|i\s+am\s+not\s+sure|i\s+don\'t\s+remember|i\s+don\s*'?t\s+know)\b/i.test(
      cleaned
    );

  if (explicitUncertainty) {
    return {
      classification: "WEAK",
      confidenceScore: 25,
      coverageScore: 5,
      reasoningScore: 15,
      communicationScore: 30,
      reason:
        "The candidate explicitly admitted uncertainty and needs a simpler, more guided question on the same topic.",
      source: "heuristic",
    };
  }

  const containsEvidence =
    /(because|therefore|for example|such as|this means|in practice|trade-?off|since|however|compared to)/i.test(
      cleaned
    );
  const containsSpecifics =
    /\b(embedding|retrieval|prompt|llm|agent|vector|context|token|rag|model|api|security|mcp|tools|dataset|pipeline|evaluation|latency|chunk|orchestration)\b/i.test(
      cleaned
    );
  const objectiveAligned = coverageScore >= 55;
  const seriousLength = totalLength > 180;
  const moderateLength = totalLength > 60;

  let classification = "WEAK";
  let confidenceScore = 25;
  let reasoningScore = 20;
  let communicationScore = 35;

  if (coverageScore >= 75 && seriousLength && containsEvidence && objectiveAligned) {
    classification = "EXCELLENT";
    confidenceScore = 92;
    reasoningScore = 94;
    communicationScore = 88;
  } else if (
    coverageScore >= 55 &&
    (moderateLength || containsSpecifics) &&
    (containsEvidence || objectiveAligned)
  ) {
    classification = "GOOD";
    confidenceScore = 78;
    reasoningScore = 76;
    communicationScore = 80;
  } else if (coverageScore >= 35 && (moderateLength || containsSpecifics || containsEvidence)) {
    classification = "PARTIAL";
    confidenceScore = 58;
    reasoningScore = 52;
    communicationScore = 60;
  } else if (coverageScore >= 20 && totalLength < 120) {
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

  const objectiveHint =
    Array.isArray(curriculumContext?.objectives) && curriculumContext.objectives.length
      ? ` Checked against curriculum objectives for ${curriculumContext.title || questionText}.`
      : "";

  const reasonMap = {
    EXCELLENT: `The answer shows solid understanding with relevant reasoning.${objectiveHint}`,
    GOOD: `The answer is mostly aligned with the topic and objectives, with room for deeper reasoning.${objectiveHint}`,
    PARTIAL: `The answer is directionally related but incomplete against the expected learning objectives.${objectiveHint}`,
    WEAK: `The answer shows limited understanding of the concept and objectives.${objectiveHint}`,
    INCORRECT: `The answer is not aligned with the topic/objectives and needs clarification.${objectiveHint}`,
  };

  return {
    classification,
    confidenceScore,
    coverageScore: clamp(Math.round(coverageScore), 0, 100),
    reasoningScore,
    communicationScore,
    reason: reasonMap[classification] || "The answer needs follow-up evaluation.",
    source: "heuristic",
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
 * @returns {object}
 */
export function determineNextAction(session = {}, evaluation = {}) {
  const followUpCount = Number(session?.followUpCount ?? 0);
  const topicScore = Number(session?.currentTopicScore ?? 0);
  const classification = evaluation?.classification || "PARTIAL";

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
 * Generate a context-aware follow-up question grounded in the candidate's answer.
 * @param {string} classification
 * @param {string} topic
 * @param {string} currentDifficulty
 * @param {string} [candidateAnswer]
 * @returns {string}
 */
export function buildFollowUpQuestion(
  classification = "PARTIAL",
  topic = "",
  currentDifficulty = "Intermediate",
  candidateAnswer = ""
) {
  const topicText = String(topic || "this topic");
  const snippet = extractAnswerSnippet(candidateAnswer);
  const referenced = snippet ? `"${snippet}"` : topicText.toLowerCase();

  if (classification === "INCORRECT") {
    return snippet
      ? `You said ${referenced}. Let's reset: what is the core problem ${topicText.toLowerCase()} is meant to solve?`
      : `Let's reset on ${topicText.toLowerCase()}. What core problem is this concept meant to solve?`;
  }

  if (classification === "WEAK") {
    return snippet
      ? `You mentioned ${referenced}. Can you define the core idea behind ${topicText.toLowerCase()} in simpler terms?`
      : `Let's simplify this: what is the core idea behind ${topicText.toLowerCase()}?`;
  }

  if (classification === "PARTIAL") {
    return snippet
      ? `You said ${referenced}. Can you go one level deeper on the key mechanism and why it matters?`
      : `You touched on ${topicText.toLowerCase()}. Can you explain the key mechanism in more detail?`;
  }

  if (classification === "GOOD") {
    return snippet
      ? `Building on ${referenced}: what tradeoff would you watch for when using this in production?`
      : `Why does ${topicText.toLowerCase()} matter in a production system, and what tradeoff should an engineer consider?`;
  }

  if (classification === "EXCELLENT") {
    if (currentDifficulty === "Advanced" || currentDifficulty === "Expert") {
      return snippet
        ? `Strong point about ${referenced}. How would you harden this design for latency, quality, and cost at production scale?`
        : `How would you design a production-grade version of ${topicText.toLowerCase()} while balancing latency, quality, and cost?`;
    }

    return snippet
      ? `You noted ${referenced}. How would you extend that into a stronger real-world implementation?`
      : `How would you design a stronger real-world implementation of ${topicText.toLowerCase()} in a production environment?`;
  }

  return snippet
    ? `You mentioned ${referenced}. Can you explain that with one concrete example?`
    : `Can you explain your understanding of ${topicText.toLowerCase()} in one concise example?`;
}

/**
 * Move to the next unasked topic in the interview plan.
 * @param {object} session
 * @param {object} [currentQuestion]
 * @returns {object | null}
 */
export function moveToNextTopic(session = {}, currentQuestion = null) {
  const plan = Array.isArray(session?.plan?.interviewPlan) ? session.plan.interviewPlan : [];
  if (plan.length === 0) {
    return null;
  }

  const asked = new Set(Array.isArray(session?.askedQuestions) ? session.askedQuestions : []);
  const currentTopic = currentQuestion?.topic || session?.currentTopic || "";
  if (currentTopic) {
    asked.add(currentTopic);
  }

  const currentIndex = Number(session?.currentQuestionIndex ?? 0);
  const fromIndex = Number.isFinite(currentIndex) ? currentIndex + 1 : 0;

  for (let i = fromIndex; i < plan.length; i += 1) {
    const item = plan[i];
    if (item?.topic && !asked.has(item.topic)) {
      return item;
    }
    if (item?.topic) {
      return item;
    }
  }

  return null;
}

/**
 * Add a question to the asked list.
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
    (
      (Number(evaluation?.confidenceScore || 0) +
        Number(evaluation?.coverageScore || 0) +
        Number(evaluation?.reasoningScore || 0)) /
      3
    ).toFixed(2)
  );

  const sessionState = {
    ...session,
    currentTopic: currentQuestion?.topic || session?.currentTopic || "Current topic",
    currentDifficulty: nextDifficulty,
    questionNumber: Number(questionNumber || session?.questionNumber || 1),
    followUpCount: Number(session?.followUpCount || 0),
    evaluationHistory: Array.isArray(session?.evaluationHistory)
      ? [...session.evaluationHistory, evaluation]
      : [evaluation],
    conversationHistory: Array.isArray(session?.conversationHistory)
      ? [...session.conversationHistory]
      : [],
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
 * @param {object|null} [evaluationOverride]
 * @param {object} [curriculumContext]
 * @returns {object}
 */
export function processAnswer(
  session = {},
  currentQuestion = {},
  candidateAnswer = "",
  evaluationOverride = null,
  curriculumContext = {}
) {
  const evaluation =
    evaluationOverride ||
    evaluateAnswer(candidateAnswer, currentQuestion?.topic || "", session, curriculumContext);
  const updatedSession = updateSessionMemory(
    session,
    evaluation,
    currentQuestion,
    session?.questionNumber || 1
  );
  const decision = determineNextAction(updatedSession, evaluation);

  const makeFollowUp = (difficulty = updatedSession.currentDifficulty) =>
    buildFollowUpQuestion(
      evaluation.classification,
      currentQuestion?.topic || "this topic",
      difficulty,
      candidateAnswer
    );

  if (decision.action === "moveToNextTopic") {
    markQuestionAsked(updatedSession, currentQuestion?.topic);
    const nextTopic = moveToNextTopic(updatedSession, currentQuestion);
    updatedSession.currentTopic = nextTopic?.topic || updatedSession.currentTopic;
    updatedSession.followUpCount = 0;

    if (nextTopic?.topic) {
      markQuestionAsked(updatedSession, nextTopic.topic);
    }

    return {
      evaluation,
      action: "moveToNextTopic",
      nextQuestion: nextTopic || null,
      reason: decision.reason,
      state: updatedSession,
      finishInterview: !nextTopic,
    };
  }

  if (decision.action === "decreaseDifficulty") {
    const nextDifficulty = adjustDifficulty(evaluation.classification, updatedSession.currentDifficulty);
    updatedSession.currentDifficulty = nextDifficulty;
    updatedSession.followUpCount += 1;
    markQuestionAsked(updatedSession, currentQuestion?.topic);

    return {
      evaluation,
      action: "decreaseDifficulty",
      nextQuestion: {
        ...currentQuestion,
        topic: currentQuestion?.topic,
        difficulty: nextDifficulty,
        followUp: makeFollowUp(nextDifficulty),
      },
      reason: decision.reason,
      state: updatedSession,
      finishInterview: false,
    };
  }

  if (decision.action === "increaseDifficulty") {
    const nextDifficulty = adjustDifficulty(evaluation.classification, updatedSession.currentDifficulty);
    updatedSession.currentDifficulty = nextDifficulty;
    updatedSession.followUpCount += 1;
    markQuestionAsked(updatedSession, currentQuestion?.topic);

    return {
      evaluation,
      action: "increaseDifficulty",
      nextQuestion: {
        ...currentQuestion,
        topic: currentQuestion?.topic,
        difficulty: nextDifficulty,
        followUp: makeFollowUp(nextDifficulty),
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
        followUp: makeFollowUp(),
      },
      reason: decision.reason,
      state: updatedSession,
      finishInterview: false,
    };
  }

  return {
    evaluation,
    action: "stayOnCurrentTopic",
    nextQuestion: {
      ...currentQuestion,
      followUp: makeFollowUp(),
    },
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
