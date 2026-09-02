import { describe, expect, it } from "vitest";

import { GET } from "./route";
import { LLMS_TXT } from "../../lib/agent-readiness";

describe("GET /llms.txt", () => {
  it("serves the published agent guide with its cache policy", async () => {
    const response = GET();

    expect(await response.text()).toBe(LLMS_TXT);
    expect(response.headers.get("Content-Type")).toBe(
      "text/markdown; charset=utf-8",
    );
    expect(response.headers.get("Cache-Control")).toBe(
      "public, max-age=3600, s-maxage=86400",
    );
  });
});
