import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CURRICULUM_PATH = path.resolve(__dirname, "../data/curriculum.json");
const CANDIDATES_PATH = path.resolve(__dirname, "../data/candidates.json");

/**
 * Load the curriculum JSON file.
 * @returns {object} Parsed curriculum dataset.
 */
export function loadCurriculum() {
  try {
    const raw = fs.readFileSync(CURRICULUM_PATH, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`Unable to load curriculum data: ${error.message}`);
  }
}

/**
 * Load candidate roster JSON file.
 * @returns {object} Parsed candidates dataset.
 */
export function loadCandidates() {
  try {
    const raw = fs.readFileSync(CANDIDATES_PATH, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`Unable to load candidate data: ${error.message}`);
  }
}

/**
 * Find a candidate record by id.
 * @param {string} candidateId Candidate identifier.
 * @param {object} [candidatesData] Optional in-memory dataset.
 * @returns {object} Candidate record.
 */
export function findCandidate(candidateId, candidatesData = loadCandidates()) {
  const list = Array.isArray(candidatesData?.candidates) ? candidatesData.candidates : [];
  const candidate = list.find((item) => item?.member?.id === candidateId);

  if (!candidate) {
    throw new Error(`Candidate with id "${candidateId}" was not found.`);
  }

  return candidate;
}

/**
 * Find the curriculum day record for a given day number.
 * @param {object} curriculum Curriculum dataset.
 * @param {number} day Day number.
 * @returns {object|null} Matching day record.
 */
export function findCurriculumDay(curriculum, day) {
  const days = Array.isArray(curriculum?.days) ? curriculum.days : [];
  return days.find((entry) => Number(entry.day) === Number(day)) || null;
}

/**
 * Find the module that contains the supplied day number.
 * @param {object} curriculum Curriculum dataset.
 * @param {number} day Day number.
 * @returns {object|null} Matching module record.
 */
export function findCurriculumModule(curriculum, day) {
  const modules = Array.isArray(curriculum?.modules) ? curriculum.modules : [];
  return modules.find((entry) => Array.isArray(entry.days) && entry.days.includes(Number(day))) || null;
}

/**
 * Normalize text for loose topic matching.
 * @param {string} value
 * @returns {string}
 */
function normalizeTopicKey(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Resolve curriculum day context (objectives/tools) for a plan topic.
 * @param {string} topic
 * @param {number} [day]
 * @returns {{ day: number|null, title: string, objectives: string[], tools: string[], moduleName: string }}
 */
export function getCurriculumContextForTopic(topic = "", day = null) {
  const curriculum = loadCurriculum();
  let dayEntry = day != null ? findCurriculumDay(curriculum, day) : null;

  if (!dayEntry && topic) {
    const normalizedTopic = normalizeTopicKey(topic);
    const days = Array.isArray(curriculum?.days) ? curriculum.days : [];
    dayEntry =
      days.find((entry) => normalizeTopicKey(entry?.title) === normalizedTopic) ||
      days.find((entry) => {
        const title = normalizeTopicKey(entry?.title || "");
        return title.includes(normalizedTopic) || normalizedTopic.includes(title);
      }) ||
      null;
  }

  const module = dayEntry ? findCurriculumModule(curriculum, dayEntry.day) : null;

  return {
    day: dayEntry?.day ?? (day != null ? Number(day) : null),
    title: dayEntry?.title || topic || "",
    objectives: Array.isArray(dayEntry?.objectives) ? dayEntry.objectives : [],
    tools: Array.isArray(dayEntry?.tools) ? dayEntry.tools : [],
    moduleName: module?.title || "",
  };
}

/**
 * List candidates available for interview selection.
 * @returns {Array<object>}
 */
export function listCandidates() {
  const data = loadCandidates();
  const list = Array.isArray(data?.candidates) ? data.candidates : [];

  return list.map((entry) => {
    const member = entry?.member || {};
    const missions = Array.isArray(entry?.missions) ? entry.missions : [];
    const skipped = missions.filter((mission) => mission?.skipped).length;
    const passed = missions.filter((mission) => mission?.passed === true).length;

    return {
      id: member.id,
      name: member.name,
      role: member.jobRole,
      experience: member.yearsExperience,
      education: member.education,
      status: member.status,
      missionsCompleted: Number(entry?.signals?.missionsCompleted ?? passed),
      missionsFirstTry: Number(entry?.signals?.missionsFirstTry ?? 0),
      commitDays: Number(entry?.signals?.commitDays ?? 0),
      skippedTopics: skipped,
      missionCount: missions.length,
    };
  });
}

/**
 * Calculate strengths from missions with strong completion patterns.
 * @param {object} candidate Candidate record.
 * @returns {string[]} Strength topic titles.
 */
export function calculateStrengths(candidate) {
  const missions = Array.isArray(candidate?.missions) ? candidate.missions : [];

  const strongTopics = missions
    .filter((mission) => mission?.passed === true && !mission?.skipped)
    .filter((mission) => (mission.attempts ?? 0) <= 2)
    .map((mission) => mission.title)
    .slice(0, 4);

  return [...new Set(strongTopics)];
}

/**
 * Calculate weak areas from skipped, failed, or repeatedly attempted missions.
 * @param {object} candidate Candidate record.
 * @returns {string[]} Weak area topic titles.
 */
export function calculateWeaknesses(candidate) {
  const missions = Array.isArray(candidate?.missions) ? candidate.missions : [];

  const weakTopics = missions
    .filter((mission) => mission?.skipped || mission?.passed === false || (mission?.attempts ?? 0) > 2)
    .map((mission) => mission.title)
    .slice(0, 4);

  return [...new Set(weakTopics)];
}

/**
 * Determine the interview difficulty for a day based on module depth.
 * @param {object} curriculum Curriculum dataset.
 * @param {number} day Day number.
 * @returns {string} Difficulty label.
 */
export function determineDifficulty(curriculum, day) {
  const module = findCurriculumModule(curriculum, day);
  const moduleNumber = Number(module?.n ?? 0);

  if (moduleNumber >= 6) {
    return "Advanced";
  }

  if (moduleNumber >= 4) {
    return "Intermediate";
  }

  return "Foundational";
}

/**
 * Build a ranked list of curriculum topics for interview selection.
 * @param {object} candidate Candidate record.
 * @param {object} curriculum Curriculum dataset.
 * @returns {Array<object>} Ranked curriculum items.
 */
export function buildInterviewPlan(candidate, curriculum) {
  const allDays = Array.isArray(curriculum?.days) ? curriculum.days : [];
  const missionsByDay = new Map(
    (candidate?.missions || []).map((mission) => [Number(mission.day), mission])
  );

  const weaknesses = calculateWeaknesses(candidate);

  const rankedTopics = allDays
    .map((dayEntry) => {
      const day = Number(dayEntry.day);
      const mission = missionsByDay.get(day) || null;
      const module = findCurriculumModule(curriculum, day);
      const moduleNumber = Number(module?.n ?? 0);
      const isCompleted = mission?.passed === true;
      const isSkipped = mission?.skipped === true;
      const isFailed = mission?.passed === false;
      const attempts = Number(mission?.attempts ?? 0);
      const isWeakArea = weaknesses.includes(dayEntry.title);
      const isAdvanced = moduleNumber >= 5;
      const isRecent = day >= 20;

      let score = 0;
      score += isCompleted ? 100 : 0;
      score += attempts > 1 ? 30 : 0;
      score += isAdvanced ? 20 : 0;
      score += isWeakArea ? 25 : 0;
      score += isRecent ? 10 : 0;
      score += isSkipped ? 5 : 0;
      score += isFailed ? 15 : 0;

      return {
        day,
        title: dayEntry.title,
        moduleNumber: moduleNumber,
        moduleName: module?.title || "General AI Practice",
        isCompleted,
        isSkipped,
        isFailed,
        attempts,
        isWeakArea,
        difficulty: determineDifficulty(curriculum, day),
        score,
        reason: "",
      };
    })
    .filter((topic) => topic.title)
    .sort((a, b) => b.score - a.score || a.day - b.day);

  const selected = [];
  const seen = new Set();

  for (const topic of rankedTopics) {
    if (seen.has(topic.title)) {
      continue;
    }

    seen.add(topic.title);
    selected.push(topic);

    if (selected.length === 8) {
      break;
    }
  }

  while (selected.length < 8) {
    const fallback = rankedTopics.find((topic) => !seen.has(topic.title));
    if (!fallback) {
      break;
    }

    seen.add(fallback.title);
    selected.push(fallback);
  }

  return selected.map((topic, index) => {
    const mission = (candidate?.missions || []).find((entry) => Number(entry.day) === Number(topic.day));

    let reason = "Candidate has relevant experience in this area.";

    if (mission?.skipped) {
      reason = "Candidate skipped this area; keep the discussion conceptual and high-level.";
    } else if (mission?.passed === false || topic.isWeakArea) {
      reason = "Candidate shows a gap in this topic and should revisit the fundamentals.";
    } else if ((mission?.attempts ?? 0) > 1) {
      reason = "Candidate required multiple attempts and would benefit from deeper review.";
    } else if (topic.isAdvanced) {
      reason = "This is an advanced topic that aligns with the candidate's current role and experience.";
    } else if (topic.isCompleted && topic.isRecent) {
      reason = "Candidate recently completed a related area and is ready for a deeper discussion.";
    }

    return {
      order: index + 1,
      moduleNumber: topic.moduleNumber,
      moduleName: topic.moduleName,
      topic: topic.title,
      day: topic.day,
      difficulty: topic.difficulty,
      reason,
    };
  });
}

/**
 * Build the final interview plan for the requested candidate.
 * @param {string} candidateId Candidate identifier.
 * @returns {object} Interview plan payload.
 */
export function createInterviewPlan(candidateId) {
  const curriculum = loadCurriculum();
  const candidatesData = loadCandidates();
  const candidateRecord = findCandidate(candidateId, candidatesData);
  const candidate = candidateRecord.member || candidateRecord;
  const missions = Array.isArray(candidateRecord.missions) ? candidateRecord.missions : [];

  const strengths = calculateStrengths(candidateRecord);
  const weakAreas = calculateWeaknesses(candidateRecord);
  const skippedTopics = missions
    .filter((mission) => mission?.skipped)
    .map((mission) => mission.title)
    .filter(Boolean);

  const interviewPlan = buildInterviewPlan(candidateRecord, curriculum).slice(0, 8);

  return {
    candidateId: candidate.id,
    candidateName: candidate.name,
    role: candidate.jobRole,
    experience: candidate.yearsExperience,
    strengths,
    weakAreas,
    skippedTopics,
    interviewPlan,
  };
}

export default {
  loadCurriculum,
  loadCandidates,
  findCandidate,
  findCurriculumDay,
  findCurriculumModule,
  getCurriculumContextForTopic,
  listCandidates,
  calculateStrengths,
  calculateWeaknesses,
  determineDifficulty,
  buildInterviewPlan,
  createInterviewPlan,
};
