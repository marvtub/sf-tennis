// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";

import type { UserLocationStatus } from "@/hooks/useUserLocation";
import { TopBar } from "./TopBar";

const defaultProps = {
  loading: false,
  hasData: true,
  fetchedAt: null,
  viewMode: "map" as const,
  sport: "tennis" as const,
  city: "san-francisco" as const,
  courtCount: 1,
  userLocationStatus: "idle" as const,
  onRefresh: () => {},
  onRequestLocation: () => {},
  onToggleView: () => {},
  onShowSearch: () => {},
};

function renderLocationButton(status: UserLocationStatus) {
  const markup = renderToStaticMarkup(
    <TopBar
      {...defaultProps}
      userLocationStatus={status}
    />,
  );
  const label =
    status === "requesting"
      ? "Locating…"
      : status === "resolved"
        ? "My location"
        : status === "denied"
          ? "Location blocked"
          : status === "unsupported"
            ? "Location unavailable"
            : "Use my location";

  return markup.match(
    new RegExp(`<button[^>]*aria-label="${label}"[^>]*>`),
  )?.[0];
}

afterEach(() => {
  cleanup();
});

describe("TopBar location control", () => {
  const disabledAttribute = /\sdisabled(?:=""|(?=\s|>))/;

  it.each(["requesting", "unsupported"] satisfies UserLocationStatus[])(
    "disables location requests while the status is %s",
    (status) => {
      expect(renderLocationButton(status)).toMatch(disabledAttribute);
    },
  );

  it.each([
    "idle",
    "fallback",
    "denied",
    "resolved",
  ] satisfies UserLocationStatus[])(
    "allows location requests while the status is %s",
    (status) => {
      expect(renderLocationButton(status)).not.toMatch(disabledAttribute);
    },
  );
});

describe("TopBar menu", () => {
  it("reports its disclosure state and closes on Escape", async () => {
    const user = userEvent.setup();
    render(<TopBar {...defaultProps} />);
    const menuButton = screen.getByRole("button", { name: "Menu" });

    expect(menuButton.getAttribute("aria-expanded")).toBe("false");
    const menuId = menuButton.getAttribute("aria-controls");
    expect(menuId).toBeTruthy();
    expect(document.getElementById(menuId!)).toBeNull();

    await user.click(menuButton);

    expect(menuButton.getAttribute("aria-expanded")).toBe("true");
    const menu = document.getElementById(menuId!);
    expect(menu).not.toBeNull();
    within(menu!).getByRole("link", { name: "Docs" }).focus();

    await user.keyboard("{Escape}");

    expect(menuButton.getAttribute("aria-expanded")).toBe("false");
    expect(document.getElementById(menuId!)).toBeNull();
    expect(document.activeElement).toBe(menuButton);
  });
});
