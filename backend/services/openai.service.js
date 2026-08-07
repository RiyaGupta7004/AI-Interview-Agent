import OpenAI from "openai";

const DEFAULT_MODEL = "gpt-4o-mini";

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
    const isConfigError = error instanceof Error && /OPENAI_(API_KEY|BASE_URL|MODEL)/.test(error.message);

    if (isConfigError) {
      console.error("OpenAI configuration error:", error.message);
      throw error;
    }

    console.error("OpenAI API request failed.");
    console.error("status code:", error?.status || error?.response?.status || "unknown");
    console.error("error code:", error?.code || error?.response?.data?.error?.code || "unknown");
    console.error("error message:", error?.message || "unknown");
    console.error("complete response body:", error?.response?.data || "no response body");
    console.error("full error object:", error);
    return createFallbackResponse(model);
  }
}

const openaiService = {
  generateResponse,
};

export default openaiService;
