import { afterEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

async function expectHealthResponse(expectedRuntime: "node" | "edge") {
  const response = await GET();
  const body = await response.json();

  expect(response.status).toBe(200);
  expect(body).toEqual({
    status: "ok",
    timestamp: expect.any(String),
    runtime: expectedRuntime,
  });
  expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp);
}

describe("GET /api/health", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reports the complete health contract in the Node runtime", async () => {
    expect(globalThis).not.toHaveProperty("EdgeRuntime");

    await expectHealthResponse("node");
  });

  it("reports the complete health contract in the Edge runtime", async () => {
    vi.stubGlobal("EdgeRuntime", "edge-runtime");

    await expectHealthResponse("edge");
  });
});
