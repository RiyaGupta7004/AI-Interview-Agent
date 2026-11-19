import { afterEach, describe, expect, it, vi } from "vitest";

import api, { getApiErrorMessage } from "./api.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("API client", () => {
  it("sends JSON requests and unwraps the response body", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, sessionId: "session-id" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(api.post("/api/interview/start", { candidateId: "CAND-003" }))
      .resolves.toEqual({ data: { success: true, sessionId: "session-id" } });
    const [url, options] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("http://localhost:5000/api/interview/start");
    expect(options.method).toBe("POST");
    expect(options.headers).toEqual({ "Content-Type": "application/json" });
    expect(options.body).toBe(JSON.stringify({ candidateId: "CAND-003" }));
  });

  it("preserves safe API errors and reports network or malformed-response failures", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 413,
      json: async () => ({ message: "Answer too long." }),
    }));
    await expect(api.post("/api/interview/message", {}))
      .rejects.toMatchObject({ response: { status: 413 } });

    const error = await api.post("/api/interview/message", {}).catch((value) => value);
    expect(getApiErrorMessage(error)).toBe("Answer too long.");

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    await expect(api.get("/health")).rejects.toThrow("Unable to reach the interview service");

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => { throw new SyntaxError("invalid JSON"); },
    }));
    await expect(api.get("/health")).rejects.toThrow("invalid response");
  });
});
