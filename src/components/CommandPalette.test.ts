import { describe, expect, it } from "vitest";

import { getCommandKeyboardAction } from "./CommandPalette";

const desktopSearch = {
  isDesktop: true,
  isCommandScope: true,
  isNativeButton: false,
  hasItems: true,
};

describe("CommandPalette keyboard handling", () => {
  it("leaves mobile Enter events to the focused control", () => {
    expect(
      getCommandKeyboardAction({
        ...desktopSearch,
        key: "Enter",
        isDesktop: false,
        isNativeButton: true,
      }),
    ).toBeNull();
  });

  it("leaves Enter events on desktop buttons to native activation", () => {
    expect(
      getCommandKeyboardAction({
        ...desktopSearch,
        key: "Enter",
        isNativeButton: true,
      }),
    ).toBeNull();
  });

  it("selects the highlighted item when Enter comes from desktop search", () => {
    expect(
      getCommandKeyboardAction({ ...desktopSearch, key: "Enter" }),
    ).toBe("select");
  });

  it("ignores command navigation outside the desktop search and list", () => {
    expect(
      getCommandKeyboardAction({
        ...desktopSearch,
        key: "ArrowDown",
        isCommandScope: false,
      }),
    ).toBeNull();
  });

  it("keeps Escape available throughout the palette", () => {
    expect(
      getCommandKeyboardAction({
        ...desktopSearch,
        key: "Escape",
        isDesktop: false,
        isCommandScope: false,
      }),
    ).toBe("close");
  });
});
