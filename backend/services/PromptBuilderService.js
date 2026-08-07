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

/**
 * Build a compact summary of the most recent prior answers.
 * @param {Array<object>} previousConversation
 * @returns {string}
 */
function buildConversationSummary(previousConversation = []) {
  if (!Array.isArray(previousConversation) || previousConversation.length === 0) {
    return "No prior answers yet.";
  }

  const recentItems = previousConversation.slice(-4);

  return recentItems
    .map((entry) => {
      const role = entry?.role === "user" ? "Candidate" : "Interviewer";
      const content = normalizeText(entry?.content || entry?.text || entry?.message);
      return `${role}: ${content}`;
    })
    .join("\n");
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
    "Use the interview plan as the guide for topic coverage.",
    "If the candidate has already answered previous questions, ask follow-up questions based on those responses.",
    "Adapt your difficulty to the candidate profile: candidate name is " + name + ", role is " + role + ", years of experience is " + experienceText + ".",
    "Keep your responses short, professional, and easy to answer in a single message.",
    "Stay within the interview plan and avoid unrelated topics.",
    "Do not expose scoring, hidden evaluation criteria, or answer keys.",
    "If the candidate gives a weak answer, ask a targeted follow-up question instead of revealing the expected answer."
  ].join(" ");
}

/**
 * Build the developer prompt with interview-plan constraints.
 * @param {object} interviewPlan
 * @param {object} currentQuestion
 * @returns {string}
 */
function buildDeveloperPrompt(interviewPlan = {}, currentQuestion = {}) {
  const safePlan = Array.isArray(interviewPlan?.interviewPlan) ? interviewPlan.interviewPlan : [];
  const currentOrder = Number(currentQuestion?.order ?? currentQuestion?.step ?? 1);
  const currentTopic = normalizeText(currentQuestion?.topic || currentQuestion?.question || "the current topic");
  const planSummary = safePlan.length
    ? safePlan
        .slice(0, 8)
        .map((entry, index) => `${index + 1}. ${entry?.topic || entry?.moduleName || "Topic"}`)
        .join("; ")
    : "No explicit plan available.";

  return [
    "You are helping run a structured interview.",
    "Follow the interview plan strictly.",
    `The current question is #${currentOrder}: ${currentTopic}.`,
    `Interview plan topics: ${planSummary}`,
    "Ask only the current question unless the candidate's previous answer requires a very brief follow-up.",
    "Keep the flow coherent, professional, and concise.",
    "Do not provide the answer, hints, or a full rubric.",
    "Do not discuss the interview plan out loud unless the user asks directly."
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
function buildUserPrompt(interviewPlan = {}, currentQuestion = {}, previousConversation = [], candidateProfile = {}) {
  const candidateName = normalizeText(candidateProfile?.name || candidateProfile?.candidateName || "Candidate");
  const role = normalizeText(candidateProfile?.role || candidateProfile?.jobRole || "the target role");
  const experience = candidateProfile?.experience ?? candidateProfile?.yearsExperience ?? "relevant experience";
  const currentTopic = normalizeText(currentQuestion?.topic || currentQuestion?.question || "Current interview topic");
  const currentOrder = Number(currentQuestion?.order ?? currentQuestion?.step ?? 1);
  const conversationSummary = buildConversationSummary(previousConversation);

  return [
    `Candidate profile: ${candidateName}, ${role}, ${experience}.`,
    `Current question order: ${currentOrder}.`,
    `Current question: ${currentTopic}.`,
    `Interview plan context: ${Array.isArray(interviewPlan?.interviewPlan) ? interviewPlan.interviewPlan.map((entry) => entry?.topic || entry?.moduleName || "Topic").join(", ") : "N/A"}`,
    "Previous conversation:",
    conversationSummary,
    "Ask the next interview question clearly and concisely. If a follow-up is warranted, ask only one targeted follow-up question." 
  ].join("\n");
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
export function buildPrompt(interviewPlan = {}, currentQuestion = {}, previousConversation = [], candidateProfile = {}) {
  const systemPrompt = buildSystemPrompt(candidateProfile);
  const developerPrompt = buildDeveloperPrompt(interviewPlan, currentQuestion);
  const userPrompt = buildUserPrompt(interviewPlan, currentQuestion, previousConversation, candidateProfile);

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
