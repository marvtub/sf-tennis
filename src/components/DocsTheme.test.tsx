// @vitest-environment jsdom

import { cleanup, render, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { DocsThemeProvider, DocsThemeToggle } from "./DocsTheme";

afterEach(cleanup);

describe("DocsTheme", () => {
  it("toggles the visible and accessible theme state", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <DocsThemeProvider>
        <DocsThemeToggle />
      </DocsThemeProvider>,
    );
    const wrapper = container.firstElementChild;
    const lightButton = within(container).getByRole("button", {
      name: "Switch to dark mode",
    });

    expect(wrapper).not.toBeNull();
    expect(wrapper?.classList.contains("dark")).toBe(false);
    expect(lightButton.textContent).toContain("Light");
    expect(lightButton.getAttribute("aria-pressed")).toBe("false");

    await user.click(lightButton);

    const darkButton = within(container).getByRole("button", {
      name: "Switch to light mode",
    });
    expect(wrapper?.classList.contains("dark")).toBe(true);
    expect(darkButton.textContent).toContain("Dark");
    expect(darkButton.getAttribute("aria-pressed")).toBe("true");
  });

  it("renders nothing without a theme provider", () => {
    const { container } = render(<DocsThemeToggle />);

    expect(container.firstChild).toBeNull();
  });
});
