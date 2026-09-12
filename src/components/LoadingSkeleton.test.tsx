import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { LoadingSkeleton } from "./LoadingSkeleton";

describe("LoadingSkeleton", () => {
  it("announces the loading state and hides the decorative spinner", () => {
    const markup = renderToStaticMarkup(<LoadingSkeleton />);

    expect(markup).toContain('role="status"');
    expect(markup).toContain("Loading courts...");
    expect(markup).toMatch(/<div[^>]*aria-hidden="true"[^>]*><\/div>/);
  });
});
