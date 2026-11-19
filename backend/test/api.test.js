import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import http from "node:http";
import { gzipSync } from "node:zlib";

let appServer;
let providerServer;
let baseUrl;
let generationFailuresRemaining = 0;
let evaluationGate;
let onEvaluationStarted;
let createApp;

before(async () => {
  providerServer = http.createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const payload = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    const isEvaluation = payload.max_tokens === 350;

    if (isEvaluation) {
      onEvaluationStarted?.();
      if (evaluationGate) await evaluationGate;
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        id: "mock-evaluation",
        object: "chat.completion",
        model: "mock-model",
        choices: [{
          index: 0,
          message: {
            role: "assistant",
            content: JSON.stringify({
              classification: "GOOD",
              confidenceScore: 90,
              coverageScore: 90,
              reasoningScore: 90,
              communicationScore: 90,
              reason: "Relevant response with clear reasoning.",
            }),
          },
          finish_reason: "stop",
        }],
        usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 },
      }));
      return;
    }

    if (generationFailuresRemaining > 0) {
      generationFailuresRemaining -= 1;
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: { message: "provider internal detail must stay private" } }));
      return;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      id: "mock-interview",
      object: "chat.completion",
      model: "mock-model",
      choices: [{
        index: 0,
        message: { role: "assistant", content: "Could you explain how you would apply that in a real system?" },
        finish_reason: "stop",
      }],
      usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 },
    }));
  });
  await new Promise((resolve) => providerServer.listen(0, "127.0.0.1", resolve));
  const providerPort = providerServer.address().port;
  process.env.OPENAI_API_KEY = "test-key-not-a-real-credential";
  process.env.OPENAI_BASE_URL = `http://127.0.0.1:${providerPort}/v1`;
  process.env.OPENAI_MODEL = "mock-model";
  process.env.CORS_ORIGINS = "http://localhost:5173";

  ({ createApp } = await import("../app.js"));
  appServer = createApp().listen(0, "127.0.0.1");
  await new Promise((resolve) => appServer.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${appServer.address().port}`;
});

after(async () => {
  for (const server of [appServer, providerServer]) {
    if (server?.listening) {
      await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
  }
});

async function post(path, body) {
  return fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

test("health and candidate endpoints expose security headers and enforce allowed CORS", async () => {
  const health = await fetch(`${baseUrl}/health`, {
    headers: { Origin: "http://localhost:5173" },
  });
  assert.equal(health.status, 200);
  assert.equal(health.headers.get("x-content-type-options"), "nosniff");
  assert.equal(health.headers.get("access-control-allow-origin"), "http://localhost:5173");

  const candidates = await fetch(`${baseUrl}/api/interview/candidates`);
  const candidateData = await candidates.json();
  assert.equal(candidates.status, 200);
  assert.ok(candidateData.count > 0);
  assert.ok(candidateData.candidates.some((candidate) => candidate.id === "CAND-003"));

  const disallowed = await fetch(`${baseUrl}/health`, {
    headers: { Origin: "https://not-allowed.example" },
  });
  assert.equal(disallowed.headers.get("access-control-allow-origin"), null);
});

test("API validates input, bounds request size, and supports a safe retry after provider errors", async () => {
  assert.equal((await post("/api/interview/start", {})).status, 400);
  const unknownCandidate = await post("/api/interview/start", { candidateId: "UNKNOWN" });
  assert.equal(unknownCandidate.status, 404);
  assert.doesNotMatch(await unknownCandidate.text(), /UNKNOWN/);

  const oversized = await fetch(`${baseUrl}/api/interview/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ candidateId: "CAND-003", padding: "x".repeat(20_000) }),
  });
  assert.equal(oversized.status, 413);

  const compressed = await fetch(`${baseUrl}/api/interview/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Encoding": "gzip",
    },
    body: gzipSync(Buffer.from(JSON.stringify({ candidateId: "CAND-003" }))),
  });
  assert.equal(compressed.status, 415);

  const started = await (await post("/api/interview/start", { candidateId: "CAND-003" })).json();
  assert.equal(started.interviewState.totalQuestions, 8);
  assert.equal((await post("/api/interview/message", { sessionId: "invalid", message: "Hello" })).status, 400);

  const tooLongAnswer = await post("/api/interview/message", {
    sessionId: started.sessionId,
    message: "x".repeat(4001),
  });
  assert.equal(tooLongAnswer.status, 413);

  generationFailuresRemaining = 3;
  const failedTurn = await post("/api/interview/message", {
    sessionId: started.sessionId,
    message: "A considered answer.",
  });
  assert.equal(failedTurn.status, 502);
  assert.doesNotMatch(await failedTurn.text(), /provider internal detail/);

  const retriedTurn = await post("/api/interview/message", {
    sessionId: started.sessionId,
    message: "Retry with a considered answer.",
  });
  const retryResult = await retriedTurn.json();
  assert.equal(retriedTurn.status, 200);
  assert.equal(retryResult.interviewState.currentQuestionIndex, 1);

  const ended = await post("/api/interview/end", { sessionId: started.sessionId });
  assert.equal(ended.status, 200);
  assert.equal((await ended.json()).report.hiringRecommendation, "Outstanding Candidate");
});

test("session rejects a concurrent answer while an AI evaluation is in flight", async () => {
  const started = await (await post("/api/interview/start", { candidateId: "CAND-003" })).json();
  let releaseEvaluation;
  let markStarted;
  evaluationGate = new Promise((resolve) => { releaseEvaluation = resolve; });
  const evaluationStarted = new Promise((resolve) => { markStarted = resolve; });
  onEvaluationStarted = markStarted;

  const firstTurn = post("/api/interview/message", {
    sessionId: started.sessionId,
    message: "First answer.",
  });
  await evaluationStarted;
  const duplicate = await post("/api/interview/message", {
    sessionId: started.sessionId,
    message: "Duplicate answer.",
  });

  onEvaluationStarted = null;
  releaseEvaluation();
  evaluationGate = null;
  const firstTurnResponse = await firstTurn;
  assert.equal(duplicate.status, 409);
  assert.equal(firstTurnResponse.status, 200);

  const ended = await post("/api/interview/end", { sessionId: started.sessionId });
  assert.equal(ended.status, 200);
});

test("mocked AI responses preserve adaptive progression and produce the eight-topic report", async () => {
  const startResponse = await post("/api/interview/start", { candidateId: "CAND-003" });
  const started = await startResponse.json();
  assert.equal(startResponse.status, 200);
  assert.equal(started.interviewState.totalQuestions, 8);

  for (let answerNumber = 1; answerNumber <= 8; answerNumber += 1) {
    const response = await post("/api/interview/message", {
      sessionId: started.sessionId,
      message: `Answer ${answerNumber}: I would use retrieval because it improves relevance in practice.`,
    });
    const result = await response.json();
    assert.equal(response.status, 200);
    if (answerNumber < 8) {
      assert.equal(result.interviewState.currentQuestionIndex, answerNumber);
      assert.equal(result.decision.action, "moveToNextTopic");
    } else {
      assert.equal(result.interviewState.completed, true);
      assert.equal(result.report.interview.completedQuestions, 8);
      assert.equal(result.report.topicBreakdown.length, 8);
      assert.equal(result.report.candidate.id, "CAND-003");
    }
  }

  const expiredSession = await post("/api/interview/end", { sessionId: started.sessionId });
  assert.equal(expiredSession.status, 404);
});
