const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

async function request(method, path, body) {
  let response;
  try {
    response = await fetch(new URL(path, baseURL), {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error("Unable to reach the interview service. Check your connection and try again.");
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("The interview service returned an invalid response.");
  }

  if (!response.ok) {
    const error = new Error(
      typeof data?.message === "string"
        ? data.message
        : `The interview service returned status ${response.status}.`
    );
    error.response = { data, status: response.status };
    throw error;
  }

  return { data };
}

const api = {
  get: (path) => request("GET", path),
  post: (path, body) => request("POST", path, body),
};

/**
 * Extract a readable error message from an Axios/network failure.
 * @param {unknown} error
 * @param {string} fallback
 * @returns {string}
 */
export function getApiErrorMessage(error, fallback = "Something went wrong.") {
  if (typeof error?.response?.data?.message === "string") {
    return error.response.data.message;
  }
  return typeof error?.message === "string" ? error.message : fallback;
}

export default api;
