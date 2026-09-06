import { describe, expect, it } from "vitest";
import { metadata as docsMetadata } from "./docs/page";
import { metadata as rootMetadata } from "./layout";
import { metadata as homeMetadata } from "./page";

describe("page metadata", () => {
  it("keeps canonical and alternate links scoped to their pages", () => {
    expect(rootMetadata.alternates).toBeUndefined();
    expect(homeMetadata.alternates).toEqual({
      canonical: "/",
      types: {
        "text/markdown": "/llms.txt",
      },
    });
    expect(docsMetadata.alternates).toEqual({
      canonical: "/docs",
      types: {
        "text/markdown": "/docs.md",
      },
    });
  });
});
