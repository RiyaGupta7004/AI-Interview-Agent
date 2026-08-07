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
  const strengths = Array.isArray(session?.strengths) ? session.strengths : [];
  const weaknesses = Array.isArray(session?.weakAreas) ? session.weakAreas : [];
  const topicScores = session?.topicScores || {};

  const technicalValues = evaluationHistory.map((entry) => Number(entry?.coverageScore || 0));
  const reasoningValues = evaluationHistory.map((entry) => Number(entry?.reasoningScore || 0));
  const communicationValues = evaluationHistory.map((entry) => Number(entry?.communicationScore || 0));
  const confidenceValues = evaluationHistory.map((entry) => Number(entry?.confidenceScore || 0));

  const technicalScore = clamp(Math.round(average(technicalValues) || 72), 0, 100);
  const reasoningScore = clamp(Math.round(average(reasoningValues) || 68), 0, 100);
  const communicationScore = clamp(Math.round(average(communicationValues) || 70), 0, 100);
  const confidenceScore = clamp(Math.round(average(confidenceValues) || 74), 0, 100);

  const overallScore = clamp(
    Math.round((technicalScore + reasoningScore + communicationScore + confidenceScore) / 4),
    0,
    100
  );

  const topicBreakdown = plan.map((entry) => {
    const topicKey = entry?.topic || "Topic";
    const score = Number(topicScores[topicKey] ?? Math.max(35, clamp((technicalScore + reasoningScore) / 2 - (entry?.order || 1) * 3, 0, 100)));

    return {
      topic: topicKey,
      score: clamp(Math.round(score), 0, 100),
      level: getLevel(score),
      notes: buildReasonForTopic(topicKey, score),
    };
  });

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

  const finalStrengths = Array.isArray(strengths) && strengths.length > 0
    ? strengths
    : topicBreakdown.filter((item) => item.score >= 75).slice(0, 3).map((item) => item.topic);

  const finalWeaknesses = Array.isArray(weaknesses) && weaknesses.length > 0
    ? weaknesses
    : topicBreakdown.filter((item) => item.score < 60).slice(0, 3).map((item) => item.topic);

  const overallLevel = getLevel(overallScore);
  const summary = `${session?.candidateName || "Candidate"} demonstrated ${overallLevel.toLowerCase()} interview performance across the core AI curriculum. The candidate showed ${finalStrengths.length ? finalStrengths[0] : "strong fundamentals"} as a key area of strength, while ${finalWeaknesses.length ? finalWeaknesses[0] : "remaining gaps"} should be reinforced with targeted practice before a final hiring decision.`;

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
    recommendedCurriculum: recommendedCurriculum.length > 0
      ? recommendedCurriculum
      : [
          {
            day: 12,
            module: "LLM Core, Prompting & Fine-Tuning",
            reason: "Prompt engineering responses lacked depth and practical reasoning.",
          },
        ],
    hiringRecommendation: getHiringRecommendation(overallScore),
    summary,
  };
}

export default {
  generateInterviewReport,
  getLevel,
  getHiringRecommendation,
};
