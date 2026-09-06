import { describe, expect, it } from "vitest";

import { GET } from "./route";
import { LLMS_TXT } from "../../lib/agent-readiness";

describe("GET /llm.txt", () => {
  it("serves the agent guide as an alias of the canonical route", async () => {
    const response = GET();

    expect(response.status).toBe(200);
    expect(await response.text()).toBe(LLMS_TXT);
    expect(response.headers.get("Content-Type")).toBe(
      "text/markdown; charset=utf-8",
    );
    expect(response.headers.get("Cache-Control")).toBe(
      "public, max-age=3600, s-maxage=86400",
    );
    expect(response.headers.get("Link")).toBe(
      '</llms.txt>; rel="canonical"; type="text/markdown"',
    );
  });
});
