import { describe, expect, it } from "vitest";

import { DOCS_MARKDOWN } from "../../lib/agent-readiness";
import { GET } from "./route";

describe("GET /docs.md", () => {
  it("serves the published documentation contract", async () => {
    const response = GET();

    expect(response.status).toBe(200);
    expect(await response.text()).toBe(DOCS_MARKDOWN);
    expect(response.headers.get("Content-Type")).toBe(
      "text/markdown; charset=utf-8",
    );
    expect(response.headers.get("Cache-Control")).toBe(
      "public, max-age=3600, s-maxage=86400",
    );
    expect(response.headers.get("Link")).toBe(
      '</docs>; rel="canonical"; type="text/html"',
    );
  });
});
