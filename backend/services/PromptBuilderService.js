/**
 * PromptBuilderService
 *
 * Builds the structured prompts used by the interviewer without making any
 * external API calls. This service is intentionally limited to prompt assembly.
 */

/**
 * Normalize a value to a non-empty string.
 * @param {string | undefined | null} value
 * @returns {string}
 */
function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getTimeAwareGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Good morning! 👋";
  }

  if (hour < 18) {
    return "Good afternoon! 👋";
  }

  return "Good evening! 👋";
}

/**
 * Build a compact summary of prior conversation turns.
 * Keeps a short preface for older turns and includes recent turns in fuller detail.
 * @param {Array<object>} previousConversation
 * @returns {string}
 */
function buildConversationSummary(previousConversation = []) {
  if (!Array.isArray(previousConversation) || previousConversation.length === 0) {
    return "No prior answers yet.";
  }

  const MAX_RECENT = 16;
  const MAX_CHARS = 320;

  const formatTurn = (entry) => {
    const role = entry?.role === "user" ? "Candidate" : "Interviewer";
    let content = normalizeText(entry?.content || entry?.text || entry?.message);
    if (content.length > MAX_CHARS) {
      content = `${content.slice(0, MAX_CHARS - 1).trim()}…`;
    }
    return `${role}: ${content}`;
  };

  if (previousConversation.length <= MAX_RECENT) {
    return previousConversation.map(formatTurn).join("\n");
  }

  const olderCount = previousConversation.length - MAX_RECENT;
  const recentItems = previousConversation.slice(-MAX_RECENT);
  return [
    `Earlier interview context: ${olderCount} prior turns were exchanged before the recent window below. Keep continuity with themes already discussed.`,
    recentItems.map(formatTurn).join("\n"),
  ].join("\n");
}

/**
 * Build the interviewer system prompt.
 * @param {object} candidateProfile
 * @returns {string}
 */
function buildSystemPrompt(candidateProfile = {}) {
  const name = normalizeText(candidateProfile?.name || candidateProfile?.candidateName || "candidate");
  const role = normalizeText(candidateProfile?.role || candidateProfile?.jobRole || "the role");
  const experience = candidateProfile?.experience ?? candidateProfile?.yearsExperience ?? 0;
  const experienceText = Number.isFinite(experience) ? `${experience} years` : "relevant experience";

  return [
    "You are a professional AI interview interviewer.",
    "You must be encouraging, concise, and focused on conducting a structured technical interview.",
    "Ask ONE question at a time.",
    "Never reveal the answer or provide the solution directly.",
    "Never skip ahead in the interview flow.",
    "Never speak raw curriculum titles as if they were the interview question.",
    "Use the interview plan as the guide for topic coverage.",
    "If the candidate has already answered previous questions, ask follow-up questions based on those responses.",
    "Adapt your difficulty to the candidate profile: candidate name is " + name + ", role is " + role + ", years of experience is " + experienceText + ".",
    "Keep your responses short, professional, and easy to answer in a single message.",
    "Stay within the interview plan and avoid unrelated topics.",
    "Do not expose scoring, hidden evaluation criteria, or answer keys.",
    "If the candidate gives a weak answer, ask a targeted follow-up question instead of revealing the expected answer.",
    "Your job is to speak like a senior interviewer from a top engineering company, with calm probing and concise challenge.",
    "Never decide interview flow yourself. The interview engine decides the next move. Only generate the verbal question or follow-up." 
  ].join(" ");
}

/**
 * Build the developer prompt with interview-plan constraints.
 * @param {object} interviewPlan
 * @param {object} currentQuestion
 * @returns {string}
 */
function buildDeveloperPrompt(interviewPlan = {}, currentQuestion = {}, decision = {}) {
  const safePlan = Array.isArray(interviewPlan?.interviewPlan) ? interviewPlan.interviewPlan : [];
  const currentOrder = Number(currentQuestion?.order ?? currentQuestion?.step ?? 1);
  const currentTopic = normalizeText(currentQuestion?.topic || currentQuestion?.question || "the current topic");
  const difficulty = normalizeText(currentQuestion?.difficulty || currentQuestion?.currentDifficulty || "Intermediate");
  const evaluation = currentQuestion?.evaluation || decision?.evaluation || {};
  const suggestedQuestion = normalizeText(
    currentQuestion?.suggestedQuestion ||
      currentQuestion?.followUp ||
      currentQuestion?.question ||
      ""
  );
  const planSummary = safePlan.length
    ? safePlan
        .slice(0, 8)
        .map((entry, index) => `${index + 1}. ${entry?.topic || entry?.moduleName || "Topic"}`)
        .join("; ")
    : "No explicit plan available.";

  const evaluationText = [
    `classification=${evaluation.classification || "UNKNOWN"}`,
    `confidence=${evaluation.confidenceScore ?? "n/a"}`,
    `coverage=${evaluation.coverageScore ?? "n/a"}`,
    `reasoning=${evaluation.reasoningScore ?? "n/a"}`,
    `communication=${evaluation.communicationScore ?? "n/a"}`,
  ].join(", ");

  const objectives = Array.isArray(currentQuestion?.objectives)
    ? currentQuestion.objectives
    : Array.isArray(decision?.objectives)
      ? decision.objectives
      : [];
  const objectiveText = objectives.length
    ? objectives.slice(0, 4).map((item, index) => `${index + 1}. ${item}`).join(" ")
    : "Use the topic's expected technical understanding.";

  const decisionText = JSON.stringify({
    evaluation: evaluation.classification || "UNKNOWN",
    action: decision.action || "FOLLOW_UP",
    difficulty: decision.difficulty || difficulty,
    stayOnTopic: decision.stayOnTopic ?? true,
    reason: decision.reason || "Engine selected this follow-up based on the candidate answer.",
    nextTopicAllowed: Boolean(decision.nextTopicAllowed) || false,
  });

  return [
    "You are helping run a structured interview.",
    "Follow the interview plan strictly.",
    "You MUST follow the Decision object exactly.",
    "You MUST NOT invent interview flow.",
    "You MUST NOT change topic unless the Decision says moveToNextTopic.",
    "You MUST NOT skip ahead.",
    "Generate ONLY one interviewer message.",
    "Never use raw curriculum titles as the spoken question.",
    "Ask a natural interview question about the current topic.",
    "If a candidate answer snippet is provided in the suggested intent, reference it naturally.",
    suggestedQuestion
      ? `Suggested question intent to paraphrase naturally: ${suggestedQuestion}`
      : "Craft one clear spoken question for the current topic.",
    `The current question is #${currentOrder}: ${currentTopic}.`,
    `Current difficulty: ${difficulty}.`,
    `Curriculum objectives to probe (internal): ${objectiveText}`,
    `Decision object: ${decisionText}`,
    `Interview plan topics: ${planSummary}`,
    `Evaluation context: ${evaluationText}.`,
    "If the action is askFollowUp or decreaseDifficulty, ask a simpler clarifying question on the same topic.",
    "If the action is increaseDifficulty, ask a deeper or harder question on the same topic.",
    "If the action is moveToNextTopic, briefly acknowledge and ask the first natural question on the new topic.",
    "The engine decides move, follow-up, and difficulty. You only generate the natural-language interviewer message.",
    "Keep the flow coherent, professional, and concise.",
    "Do not provide the answer, hints, or a full rubric.",
    "Do not discuss the interview plan out loud unless the user asks directly.",
    "Keep the final interviewer message under 120 words."
  ].join(" ");
}

/**
 * Build the user prompt containing relevant context.
 * @param {object} interviewPlan
 * @param {object} currentQuestion
 * @param {Array<object>} previousConversation
 * @param {object} candidateProfile
 * @returns {string}
 */
function buildUserPrompt(interviewPlan = {}, currentQuestion = {}, previousConversation = [], candidateProfile = {}, decision = {}) {
  const candidateName = normalizeText(candidateProfile?.name || candidateProfile?.candidateName || "Candidate");
  const role = normalizeText(candidateProfile?.role || candidateProfile?.jobRole || "the target role");
  const experience = candidateProfile?.experience ?? candidateProfile?.yearsExperience ?? "relevant experience";
  const currentTopic = normalizeText(currentQuestion?.topic || currentQuestion?.question || "Current interview topic");
  const currentOrder = Number(currentQuestion?.order ?? currentQuestion?.step ?? 1);
  const difficulty = normalizeText(currentQuestion?.difficulty || currentQuestion?.currentDifficulty || "Intermediate");
  const reasonForNextQuestion = normalizeText(currentQuestion?.reason || "The engine selected this question based on the candidate's current performance and topic coverage.");
  const evaluation = currentQuestion?.evaluation || decision?.evaluation || {};
  const conversationSummary = buildConversationSummary(previousConversation);
  const candidateAnswer = normalizeText(currentQuestion?.candidateAnswer || "No previous candidate answer provided.");
  const suggestedQuestion = normalizeText(
    currentQuestion?.suggestedQuestion ||
      currentQuestion?.followUp ||
      ""
  );
  const decisionSummary = JSON.stringify({
    evaluation: evaluation.classification || "UNKNOWN",
    action: decision.action || "FOLLOW_UP",
    stayOnTopic: decision.stayOnTopic ?? true,
    difficulty: decision.difficulty || difficulty,
    reason: decision.reason || reasonForNextQuestion,
    nextTopicAllowed: Boolean(decision.nextTopicAllowed) || false,
  }, null, 2);

  if (!Array.isArray(previousConversation) || previousConversation.length === 0) {
    return [
      `${getTimeAwareGreeting()}`,
      "Welcome to your AI Interview.",
      "I'll ask you technical questions and adapt based on your answers.",
      "Let's begin with a quick introduction.",
      "First question: Could you briefly introduce yourself and tell me about your background, experience, or interest in AI and software development?",
      `Candidate profile: ${candidateName}, ${role}, ${experience}.`,
      `Interview plan context (internal only, do not read aloud as question titles): ${Array.isArray(interviewPlan?.interviewPlan) ? interviewPlan.interviewPlan.map((entry) => entry?.topic || entry?.moduleName || "Topic").join(", ") : "N/A"}`,
      "Interview rules:",
      "- Keep the greeting warm and natural.",
      "- Ask only the first introduction question.",
      "- Do not begin with technical questions.",
      "- Do not expose raw curriculum titles as the spoken question.",
      "- Stay professional and encouraging.",
      "- Keep the response under 120 words."
    ].join("\n");
  }

  return [
    `Candidate profile: ${candidateName}, ${role}, ${experience}.`,
    `Current topic: ${currentTopic}.`,
    `Current difficulty: ${difficulty}.`,
    `Current question order: ${currentOrder}.`,
    `Previous question: ${normalizeText(currentQuestion?.previousQuestion || "N/A") || "N/A"}.`,
    `Candidate answer: ${candidateAnswer}.`,
    `Evaluation: classification=${evaluation.classification || "UNKNOWN"}, confidence=${evaluation.confidenceScore ?? "n/a"}, coverage=${evaluation.coverageScore ?? "n/a"}, reasoning=${evaluation.reasoningScore ?? "n/a"}, communication=${evaluation.communicationScore ?? "n/a"}.`,
    `Reason for next question: ${reasonForNextQuestion}.`,
    `Suggested question intent: ${suggestedQuestion || "Ask one natural question for the current topic and Decision action."}.`,
    Array.isArray(currentQuestion?.objectives) && currentQuestion.objectives.length
      ? `Curriculum objectives to probe (internal): ${currentQuestion.objectives.slice(0, 4).join(" | ")}.`
      : "",
    `Decision object: ${decisionSummary}`,
    `Interview plan context (internal only): ${Array.isArray(interviewPlan?.interviewPlan) ? interviewPlan.interviewPlan.map((entry) => entry?.topic || entry?.moduleName || "Topic").join(", ") : "N/A"}`,
    "Conversation summary:",
    conversationSummary,
    "Interview rules:",
    "- You MUST follow the Decision object exactly.",
    "- You MUST NOT invent interview flow.",
    "- You MUST NOT change topic unless Decision.action is moveToNextTopic.",
    "- You MUST NOT skip ahead.",
    "- Reference the candidate's previous answer when asking a follow-up.",
    "- Use the full conversation summary for continuity, not only the latest turn.",
    "- Paraphrase the suggested question intent naturally; do not paste curriculum titles as questions.",
    "- Ask only one question at a time.",
    "- Never reveal answers or give hints that solve the problem.",
    "- Be encouraging and concise.",
    "- Stay within the topic and interview plan.",
    "- Use a professional, senior-interviewer tone.",
    "- Keep the next response under 120 words.",
    "Generate only the next interviewer message, not the interview flow decision."
  ].filter(Boolean).join("\n");
}

/**
 * Build a complete prompt payload for the interviewer.
 *
 * @param {object} interviewPlan Interview plan object.
 * @param {object} currentQuestion Current question object.
 * @param {Array<object>} previousConversation Conversation history.
 * @param {object} candidateProfile Candidate profile.
 * @returns {{
 *   systemPrompt: string,
 *   developerPrompt: string,
 *   userPrompt: string
 * }}
 */
export function buildPrompt(interviewPlan = {}, currentQuestion = {}, previousConversation = [], candidateProfile = {}, decision = {}) {
  const systemPrompt = buildSystemPrompt(candidateProfile);
  const developerPrompt = buildDeveloperPrompt(interviewPlan, currentQuestion, decision);
  const userPrompt = buildUserPrompt(interviewPlan, currentQuestion, previousConversation, candidateProfile, decision);

  return {
    systemPrompt,
    developerPrompt,
    userPrompt,
  };
}

export default {
  buildPrompt,
  buildSystemPrompt,
  buildDeveloperPrompt,
  buildUserPrompt,
  buildConversationSummary,
};
