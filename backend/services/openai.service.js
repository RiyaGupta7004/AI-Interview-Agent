import OpenAI from "openai";

const DEFAULT_MODEL = "gpt-4o-mini";
const MAX_INTERVIEWER_MESSAGE_LENGTH = 1200;

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const baseURL = process.env.OPENAI_BASE_URL?.trim();
  const model = process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is missing. Set the environment variable before starting the backend.");
  }

  if (!baseURL) {
    throw new Error("OPENAI_BASE_URL is missing. Set the environment variable before starting the backend.");
  }

  if (!model) {
    throw new Error("OPENAI_MODEL is missing. Set the environment variable before starting the backend.");
  }

  if (!globalThis.__aiInterviewOpenaiClient) {
    globalThis.__aiInterviewOpenaiClient = new OpenAI({
      apiKey,
      baseURL,
    });
  }

  return globalThis.__aiInterviewOpenaiClient;
}

/**
 * Build OpenAI chat messages from the prompt object.
 * Uses system + user only for broad OpenAI-compatible provider support (e.g. Groq).
 * @param {object} promptObject
 * @returns {Array<{ role: string, content: string }>} Chat messages.
 */
function buildMessages(promptObject = {}) {
  const systemPrompt = typeof promptObject?.systemPrompt === "string" ? promptObject.systemPrompt : "";
  const developerPrompt = typeof promptObject?.developerPrompt === "string" ? promptObject.developerPrompt : "";
  const userPrompt = typeof promptObject?.userPrompt === "string" ? promptObject.userPrompt : "";

  const systemContent = [
    systemPrompt || "You are a professional AI interview interviewer.",
    developerPrompt ? `\n\nInterview constraints:\n${developerPrompt}` : "",
  ]
    .join("")
    .trim();

  return [
    { role: "system", content: systemContent },
    { role: "user", content: userPrompt || "Ask the next interview question." },
  ];
}

/**
 * Generate a next-question response using an OpenAI-compatible model.
 *
 * @param {object} promptObject
 * @returns {Promise<{ message: string, usage: object, model: string, error?: boolean }>}
 */
export async function generateResponse(promptObject = {}) {
  const model = process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL;

  try {
    const client = getClient();
    const completion = await client.chat.completions.create({
      model,
      temperature: 0.7,
      max_tokens: 300,
      messages: buildMessages(promptObject),
    });

    const reply = completion?.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      const emptyError = new Error("The model returned an empty interview response.");
      emptyError.code = "EMPTY_MODEL_RESPONSE";
      throw emptyError;
    }
    if (reply.length > MAX_INTERVIEWER_MESSAGE_LENGTH) {
      const lengthError = new Error("The model response exceeded the allowed length.");
      lengthError.code = "MODEL_RESPONSE_TOO_LONG";
      throw lengthError;
    }

    const safeReply = reply.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "");

    return {
      message: safeReply,
      usage: completion?.usage || {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
      },
      model: completion?.model || model,
      error: false,
    };
  } catch (error) {
    const isConfigError = error instanceof Error && /OPENAI_(API_KEY|BASE_URL|MODEL)/.test(error.message);

    if (isConfigError) {
      throw error;
    }

    console.error("OpenAI API request failed.", {
      status: error?.status || error?.response?.status || "unknown",
      code: error?.code || error?.response?.data?.error?.code || "unknown",
    });

    const apiError = new Error(
      "The AI provider request failed."
    );
    apiError.code = error?.code || "OPENAI_REQUEST_FAILED";
    apiError.cause = error;
    throw apiError;
  }
}

/**
 * Parse a model JSON evaluation payload safely.
 * @param {string} raw
 * @returns {object|null}
 */
function parseEvaluationJson(raw = "") {
  const text = String(raw || "").trim();
  if (!text) return null;

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() || text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start < 0 || end <= start) return null;

  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    return null;
  }
}

/**
 * Evaluate a candidate answer against topic objectives using the LLM.
 * Falls back to throwing so callers can use the heuristic evaluator.
 * @param {object} params
 * @returns {Promise<object>}
 */
export async function evaluateAnswerWithLLM({
  answer = "",
  topic = "",
  objectives = [],
  tools = [],
  difficulty = "Intermediate",
} = {}) {
  const model = process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL;
  const client = getClient();

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.1,
    max_tokens: 350,
    messages: [
      {
        role: "system",
        content: [
          "You are a strict technical interview evaluator for an AI engineering cohort.",
          "Score the candidate answer against the topic and learning objectives.",
          "Return ONLY valid JSON with keys:",
          'classification (EXCELLENT|GOOD|PARTIAL|WEAK|INCORRECT),',
          "confidenceScore, coverageScore, reasoningScore, communicationScore (0-100 integers),",
          "reason (short string).",
          "Do not reveal the ideal answer. Do not wrap the JSON in markdown.",
        ].join(" "),
      },
      {
        role: "user",
        content: JSON.stringify(
          {
            topic,
            difficulty,
            objectives,
            tools,
            candidateAnswer: answer,
          },
          null,
          2
        ),
      },
    ],
  });

  const raw = completion?.choices?.[0]?.message?.content?.trim() || "";
  const parsed = parseEvaluationJson(raw);
  const allowed = new Set(["EXCELLENT", "GOOD", "PARTIAL", "WEAK", "INCORRECT"]);

  if (!parsed || !allowed.has(String(parsed.classification || "").toUpperCase())) {
    const err = new Error("LLM evaluation returned an invalid payload.");
    err.code = "INVALID_EVALUATION_PAYLOAD";
    throw err;
  }

  const clampScore = (value, fallback) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(100, Math.max(0, Math.round(n)));
  };

  return {
    classification: String(parsed.classification).toUpperCase(),
    confidenceScore: clampScore(parsed.confidenceScore, 50),
    coverageScore: clampScore(parsed.coverageScore, 50),
    reasoningScore: clampScore(parsed.reasoningScore, 50),
    communicationScore: clampScore(parsed.communicationScore, 50),
    reason: String(parsed.reason || "Evaluated against curriculum objectives.").slice(0, 280),
    source: "llm",
    usage: completion?.usage || null,
    model: completion?.model || model,
  };
}

const openaiService = {
  generateResponse,
  evaluateAnswerWithLLM,
};

export default openaiService;
