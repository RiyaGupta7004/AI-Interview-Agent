import { loadCurriculum, findCurriculumModule } from "./InterviewPlannerService.js";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function average(values = []) {
  if (!Array.isArray(values) || values.length === 0) {
    return 0;
  }

  const total = values.reduce((sum, value) => sum + Number(value || 0), 0);
  return total / values.length;
}

function getLevel(score = 0) {
  if (score >= 85) return "Exceptional";
  if (score >= 75) return "Strong";
  if (score >= 60) return "Solid";
  if (score >= 45) return "Developing";
  return "Needs Practice";
}

function getHiringRecommendation(score = 0) {
  if (score >= 85) return "Suitable for: Mid-level AI Engineer";
  if (score >= 70) return "Suitable for: Junior AI Engineer";
  if (score >= 55) return "Suitable for: Applied AI Engineer";
  return "Needs More Practice";
}

function buildReasonForTopic(topic = "", score = 0) {
  if (!topic) return "Continue building fundamentals and revisit the practical examples.";

  if (score >= 85) {
    return `Strong grasp of ${topic}. Continue with production-grade implementation and edge cases.`;
  }

  if (score >= 70) {
    return `Solid baseline in ${topic}. Add more depth around trade-offs and real-world usage.`;
  }

  if (score >= 50) {
    return `${topic} needs stronger reasoning and more concrete examples before moving to advanced work.`;
  }

  return `${topic} showed weak depth. Review the fundamentals and practice with a few applied examples.`;
}

export function generateInterviewReport(session = {}) {
  const curriculum = loadCurriculum();
  const plan = Array.isArray(session?.plan?.interviewPlan) ? session.plan.interviewPlan : [];
  const evaluationHistory = Array.isArray(session?.evaluationHistory) ? session.evaluationHistory : [];
  const topicScores = session?.topicScores || {};

  const hasEvaluations = evaluationHistory.length > 0;
  const technicalValues = evaluationHistory.map((entry) => Number(entry?.coverageScore || 0));
  const reasoningValues = evaluationHistory.map((entry) => Number(entry?.reasoningScore || 0));
  const communicationValues = evaluationHistory.map((entry) => Number(entry?.communicationScore || 0));
  const confidenceValues = evaluationHistory.map((entry) => Number(entry?.confidenceScore || 0));

  const technicalScore = hasEvaluations ? clamp(Math.round(average(technicalValues)), 0, 100) : 0;
  const reasoningScore = hasEvaluations ? clamp(Math.round(average(reasoningValues)), 0, 100) : 0;
  const communicationScore = hasEvaluations ? clamp(Math.round(average(communicationValues)), 0, 100) : 0;
  const confidenceScore = hasEvaluations ? clamp(Math.round(average(confidenceValues)), 0, 100) : 0;

  const overallScore = hasEvaluations
    ? clamp(
        Math.round((technicalScore + reasoningScore + communicationScore + confidenceScore) / 4),
        0,
        100
      )
    : 0;

  const topicBreakdown = plan
    .map((entry) => {
      const topicKey = entry?.topic || "Topic";
      if (!Object.prototype.hasOwnProperty.call(topicScores, topicKey)) {
        return null;
      }

      const score = clamp(Math.round(Number(topicScores[topicKey])), 0, 100);

      return {
        topic: topicKey,
        score,
        level: getLevel(score),
        notes: buildReasonForTopic(topicKey, score),
      };
    })
    .filter(Boolean);

  const recommendedCurriculum = topicBreakdown
    .filter((item) => item.score < 75)
    .slice(0, 3)
    .map((item) => {
      const targetTopic = item.topic;
      const match = plan.find((entry) => (entry?.topic || "") === targetTopic) || {};
      const day = Number(match.day || 0);
      const module = findCurriculumModule(curriculum, day)?.title || "Core AI Practice";

      return {
        day,
        module,
        reason: `Need stronger ${targetTopic.toLowerCase()} reasoning and applied examples before advancing.`,
      };
    })
    .filter((item) => item.day > 0);

  const liveStrongTopics = Array.isArray(session?.strongTopics) ? session.strongTopics : [];
  const liveWeakTopics = Array.isArray(session?.weakTopics) ? session.weakTopics : [];

  const finalStrengths =
    liveStrongTopics.length > 0
      ? liveStrongTopics.slice(0, 3)
      : topicBreakdown.filter((item) => item.score >= 75).slice(0, 3).map((item) => item.topic);

  const finalWeaknesses =
    liveWeakTopics.length > 0
      ? liveWeakTopics.slice(0, 3)
      : topicBreakdown.filter((item) => item.score < 60).slice(0, 3).map((item) => item.topic);

  const overallLevel = hasEvaluations ? getLevel(overallScore) : "Insufficient Data";
  const summary = hasEvaluations
    ? `${session?.candidateName || "Candidate"} demonstrated ${overallLevel.toLowerCase()} interview performance across the covered topics. ${finalStrengths.length ? `Strength: ${finalStrengths[0]}.` : ""} ${finalWeaknesses.length ? `Needs work: ${finalWeaknesses[0]}.` : ""}`.trim()
    : "Not enough evaluation data was collected to produce a reliable interview summary.";

  return {
    overallLevel,
    overallScore,
    technicalScore,
    reasoningScore,
    communicationScore,
    confidenceScore,
    strengths: finalStrengths,
    weaknesses: finalWeaknesses,
    topicBreakdown,
    recommendedCurriculum,
    hiringRecommendation: hasEvaluations ? getHiringRecommendation(overallScore) : "Insufficient Data",
    summary,
  };
}

export default {
  generateInterviewReport,
  getLevel,
  getHiringRecommendation,
};
