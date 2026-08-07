import OpenAI from "openai";

const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || undefined;

const client = OPENAI_API_KEY
  ? new OpenAI({
      apiKey: OPENAI_API_KEY,
      baseURL: OPENAI_BASE_URL,
    })
  : null;

/**
 * Create a safe fallback response when the LLM is unavailable.
 * @param {string} model
 * @returns {{ message: string, usage: object, model: string, error: boolean }}
 */
function createFallbackResponse(model = DEFAULT_MODEL) {
  return {
    message: "Sorry, I'm having trouble generating the next interview question. Please try again.",
    usage: {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
    },
    model,
    error: false,
  };
}

/**
 * Build OpenAI chat messages from the prompt object.
 * @param {object} promptObject
 * @returns {Array<{ role: string, content: string }>} Chat messages.
 */
function buildMessages(promptObject = {}) {
  const systemPrompt = typeof promptObject?.systemPrompt === "string" ? promptObject.systemPrompt : "";
  const developerPrompt = typeof promptObject?.developerPrompt === "string" ? promptObject.developerPrompt : "";
  const userPrompt = typeof promptObject?.userPrompt === "string" ? promptObject.userPrompt : "";

  return [
    { role: "system", content: systemPrompt || "You are a professional AI interview interviewer." },
    { role: "developer", content: developerPrompt || "Ask one concise, relevant interview question at a time." },
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
  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;

  if (!client) {
    return createFallbackResponse(model);
  }

  try {
    const completion = await client.chat.completions.create({
      model,
      temperature: 0.7,
      max_tokens: 300,
      messages: buildMessages(promptObject),
    });

    const reply = completion?.choices?.[0]?.message?.content?.trim();

    return {
      message: reply || "Could you tell me a bit more?",
      usage: completion?.usage || {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
      },
      model: completion?.model || model,
      error: false,
    };
  } catch (error) {
    return createFallbackResponse(model);
  }
}

const openaiService = {
  generateResponse,
};

export default openaiService;
