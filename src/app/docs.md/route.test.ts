import { describe, expect, it } from "vitest";

import { DOCS_MARKDOWN } from "../../lib/agent-readiness";
import { GET } from "./route";
import { DISCOVERY_CACHE_CONTROL } from "@/lib/agent-readiness";

describe("GET /docs.md", () => {
  it("serves the published documentation contract", async () => {
    const response = GET();

    expect(response.status).toBe(200);
    expect(await response.text()).toBe(DOCS_MARKDOWN);
    expect(response.headers.get("Content-Type")).toBe(
      "text/markdown; charset=utf-8",
    );
    expect(response.headers.get("Cache-Control")).toBe(
      DISCOVERY_CACHE_CONTROL,
    );
    expect(response.headers.get("Link")).toBe(
      '</docs>; rel="canonical"; type="text/html"',
    );
  });
});
