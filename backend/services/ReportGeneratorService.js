import { loadCurriculum, findCurriculumModule } from "./InterviewPlannerService.js";

function normalizeText(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function clamp(value, min, max) {
  return Math.min(Math.max(Number(value) || 0, min), max);
}

function average(values = []) {
  if (!Array.isArray(values) || values.length === 0) {
    return 0;
  }

  const total = values.reduce((sum, item) => sum + Number(item || 0), 0);
  return total / values.length;
}

function getOverallLevel(score = 0) {
  if (score >= 90) return "Expert";
  if (score >= 75) return "Advanced";
  if (score >= 55) return "Intermediate";
  return "Beginner";
}

function getHiringRecommendation(score = 0) {
  if (score >= 90) return "Outstanding Candidate";
  if (score >= 80) return "Strong Hire";
  if (score >= 65) return "Hire";
  if (score >= 55) return "Borderline";
  if (score >= 40) return "Needs Improvement";
  return "Not Ready";
}

function getTopicLevel(score = 0) {
  if (score >= 85) return "Expert";
  if (score >= 70) return "Strong";
  if (score >= 55) return "Solid";
  if (score >= 40) return "Developing";
  return "Needs Practice";
}

function buildTopicSummary(topic = "", score = 0, action = "") {
  if (!topic) {
    return "Continue practicing core fundamentals and revisit practical examples.";
  }

  const topicLabel = topic.trim();
  if (score >= 80) {
    return `${topicLabel} is a clear strength. Continue expanding into edge cases and production-grade reasoning.`;
  }

  if (score >= 60) {
    return `${topicLabel} is manageable but still needs deeper explanation and better trade-off analysis.`;
  }

  if (action && /follow-up|failed|weak|decrease/i.test(action)) {
    return `${topicLabel} needs stronger conceptual grounding. Follow-up questions exposed gaps that should be revisited with focused practice.`;
  }

  return `${topicLabel} showed weak depth in applied reasoning. Revisit fundamentals and work through concrete examples.`;
}

function findCurriculumMatch(topicName = "", curriculum = {}) {
  const days = Array.isArray(curriculum?.days) ? curriculum.days : [];
  if (!topicName || days.length === 0) {
    return null;
  }

  const normalizedTopic = normalizeText(topicName);
  const directMatch = days.find((entry) => normalizeText(entry?.title) === normalizedTopic);
  if (directMatch) {
    return directMatch;
  }

  const containsMatch = days.find((entry) => {
    const title = normalizeText(entry?.title || "");
    return title.includes(normalizedTopic) || normalizedTopic.includes(title);
  });

  if (containsMatch) {
    return containsMatch;
  }

  const keywordMatch = days.find((entry) => {
    const title = normalizeText(entry?.title || "");
    const topicParts = normalizedTopic.split(" ");
    return topicParts.some((part) => part && title.includes(part));
  });

  return keywordMatch || null;
}

function getDurationFromSession(session = {}) {
  const startedAt = session?.startedAt ? new Date(session.startedAt) : null;
  const endedAt = session?.endedAt ? new Date(session.endedAt) : new Date();

  if (!startedAt || Number.isNaN(startedAt.getTime())) {
    return "0m";
  }

  const diffMs = Math.max(0, endedAt.getTime() - startedAt.getTime());
  const totalSeconds = Math.round(diffMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) {
    return `${seconds}s`;
  }

  return `${minutes}m ${seconds}s`;
}

function getFollowUpTopics(session = {}) {
  const followUps = Array.isArray(session?.followUpHistory) ? session.followUpHistory : [];
  const topicScores = session?.topicScores || {};

  return followUps
    .map((entry) => ({
      topic: entry?.topic || "",
      action: entry?.action || "",
      reason: entry?.reason || "",
      score: Number(topicScores[entry?.topic] ?? 0),
    }))
    .filter((entry) => entry.topic)
    .sort((a, b) => a.score - b.score);
}

function buildRecommendations(session = {}, topicBreakdown = []) {
  const curriculum = loadCurriculum();
  const weakTopics = getFollowUpTopics(session)
    .filter((entry) => entry.score < 75 || /follow|weak|moveToNextTopic|decrease|ask/i.test(entry.action || ""))
    .map((entry) => entry.topic);

  const finalTopics = [...new Set([...weakTopics, ...(session?.weakAreas || [])])];

  const recommendations = finalTopics
    .map((topic) => {
      const matchedEntry = findCurriculumMatch(topic, curriculum);
      if (!matchedEntry) {
        return null;
      }

      const module = findCurriculumModule(curriculum, Number(matchedEntry.day)) || {
        title: "General AI Practice",
      };
      const topicScore = topicBreakdown.find((item) => item.topic === topic)?.score ?? 0;
      const actionText = getFollowUpTopics(session).find((entry) => entry.topic === topic)?.action || "follow-up";

      return {
        day: Number(matchedEntry.day),
        module: module.title || matchedEntry.title,
        topic,
        reason: actionText && /follow|weak|decrease|moveToNextTopic/i.test(actionText)
          ? `Candidate failed follow-up questions in ${topic}.`
          : `Candidate underperformed in ${topic} and needs targeted curriculum review.`,
      };
    })
    .filter(Boolean)
    .slice(0, 3);

  if (recommendations.length > 0) {
    return recommendations;
  }

  const fallbackTopics = Array.isArray(topicBreakdown) ? topicBreakdown : [];
  return fallbackTopics
    .filter((item) => Number(item.score) < 75)
    .slice(0, 3)
    .map((item) => {
      const matchedEntry = findCurriculumMatch(item.topic, curriculum);
      if (!matchedEntry) {
        return null;
      }

      const module = findCurriculumModule(curriculum, Number(matchedEntry.day)) || {
        title: "General AI Practice",
      };

      return {
        day: Number(matchedEntry.day),
        module: module.title || matchedEntry.title,
        topic: item.topic,
        reason: `Candidate underperformed in ${item.topic} and should review the related curriculum.`,
      };
    })
    .filter(Boolean);
}

export function generateInterviewReport(session = {}) {
  const curriculum = loadCurriculum();
  const plan = Array.isArray(session?.plan?.interviewPlan) ? session.plan.interviewPlan : [];
  const evaluationHistory = Array.isArray(session?.evaluationHistory) ? session.evaluationHistory : [];
  const followUpHistory = Array.isArray(session?.followUpHistory) ? session.followUpHistory : [];
  const topicScores = session?.topicScores || {};
  const candidate = session?.candidate || {};

  const hasEvaluations = evaluationHistory.length > 0;
  const technicalValues = evaluationHistory.map((entry) => Number(entry?.coverageScore || 0));
  const reasoningValues = evaluationHistory.map((entry) => Number(entry?.reasoningScore || 0));
  const communicationValues = evaluationHistory.map((entry) => Number(entry?.communicationScore || 0));
  const confidenceValues = evaluationHistory.map((entry) => Number(entry?.confidenceScore || 0));

  // Use real averages only — never invent placeholder scores when history is empty.
  const technical = hasEvaluations ? clamp(Math.round(average(technicalValues)), 0, 100) : 0;
  const reasoning = hasEvaluations ? clamp(Math.round(average(reasoningValues)), 0, 100) : 0;
  const communication = hasEvaluations ? clamp(Math.round(average(communicationValues)), 0, 100) : 0;
  const confidence = hasEvaluations ? clamp(Math.round(average(confidenceValues)), 0, 100) : 0;
  const overallScore = hasEvaluations
    ? clamp(Math.round((technical + reasoning + communication + confidence) / 4), 0, 100)
    : 0;
  const overallLevel = hasEvaluations ? getOverallLevel(overallScore) : "Insufficient Data";

  const answeredTopics = new Set(Object.keys(topicScores));
  const topicBreakdown = plan
    .map((entry) => {
      const topic = entry?.topic || "General Topic";
      if (!Object.prototype.hasOwnProperty.call(topicScores, topic)) {
        return null;
      }

      const score = clamp(Number(topicScores[topic]), 0, 100);
      const level = getTopicLevel(score);
      const summary = buildTopicSummary(
        topic,
        score,
        followUpHistory.find((item) => item?.topic === topic)?.action || ""
      );

      return {
        topic,
        score,
        level,
        summary,
      };
    })
    .filter(Boolean);

  // Prefer live interview signals over pre-interview mission history.
  const liveStrongTopics = Array.isArray(session?.strongTopics) ? session.strongTopics : [];
  const liveWeakTopics = Array.isArray(session?.weakTopics) ? session.weakTopics : [];

  const strengths =
    liveStrongTopics.length > 0
      ? liveStrongTopics.slice(0, 3)
      : topicBreakdown.filter((item) => item.score >= 70).slice(0, 3).map((item) => item.topic);

  const weaknesses =
    liveWeakTopics.length > 0
      ? liveWeakTopics.slice(0, 3)
      : topicBreakdown.filter((item) => item.score < 60).slice(0, 3).map((item) => item.topic);

  const recommendations = buildRecommendations(session, topicBreakdown);

  const strongestTopic = topicBreakdown.reduce((best, current) => {
    if (!best || current.score > best.score) {
      return current;
    }
    return best;
  }, topicBreakdown[0] || null);

  const weakestTopic = topicBreakdown.reduce((worst, current) => {
    if (!worst || current.score < worst.score) {
      return current;
    }
    return worst;
  }, topicBreakdown[0] || null);

  let summary = "Not enough answered topics were recorded to produce a detailed interview summary.";
  if (strongestTopic && weakestTopic && strongestTopic.topic === weakestTopic.topic) {
    summary = `Performance on ${strongestTopic.topic} was the clearest signal from this interview (score ${strongestTopic.score}).`;
  } else if (strongestTopic && weakestTopic) {
    summary = `Strongest area was ${strongestTopic.topic} (${strongestTopic.score}). Weakest area was ${weakestTopic.topic} (${weakestTopic.score}), which needs deeper practice.`;
  } else if (strongestTopic) {
    summary = `Performance on ${strongestTopic.topic} was the main signal from this interview (score ${strongestTopic.score}).`;
  }

  const unansweredCount = Math.max(plan.length - answeredTopics.size, 0);

  return {
    candidate: {
      id: session?.candidateId || candidate?.id || session?.candidateName || "unknown",
      name: session?.candidateName || candidate?.name || "Candidate",
      role: session?.role || candidate?.role || "AI Engineer",
      experience: session?.experience || candidate?.experience || "N/A",
    },
    interview: {
      completedQuestions: Array.isArray(session?.completedQuestions) ? session.completedQuestions.length : 0,
      duration: getDurationFromSession(session),
      overallLevel,
      overallScore,
      unansweredTopics: unansweredCount,
    },
    scores: {
      technical,
      reasoning,
      communication,
      confidence,
    },
    strengths,
    weaknesses,
    topicBreakdown,
    recommendations,
    hiringRecommendation: hasEvaluations ? getHiringRecommendation(overallScore) : "Insufficient Data",
    summary,
  };
}

export default {
  generateInterviewReport,
  getOverallLevel,
  getHiringRecommendation,
};
