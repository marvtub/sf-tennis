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
    const { container } = render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>,
    );

    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain("Something went wrong");
    expect(alert.textContent).toContain("render failed");
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
    expect(container.querySelector('[aria-hidden="true"]')?.textContent).toBe(
      "😵",
    );
  });
});
