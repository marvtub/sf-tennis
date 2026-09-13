// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ErrorBoundary } from "./ErrorBoundary";

function ThrowingChild(): never {
  throw new Error("render failed");
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("ErrorBoundary", () => {
  it.each([
    ["null", null, ""],
    ["zero", 0, "0"],
  ])("honors a supplied %s fallback", (_label, fallback, expectedText) => {
    const { container } = render(
      <ErrorBoundary fallback={fallback}>
        <ThrowingChild />
      </ErrorBoundary>,
    );

    expect(container.textContent).toBe(expectedText);
    expect(screen.queryByText("Something went wrong")).toBeNull();
  });

  it("renders the default fallback when none is supplied", () => {
    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Something went wrong")).toBeTruthy();
  });
});
