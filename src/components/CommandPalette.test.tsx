// @vitest-environment jsdom

import { cleanup, render, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { CourtLocation } from "@/types";
import { CommandPalette, getCommandKeyboardAction } from "./CommandPalette";

const courts: CourtLocation[] = [
  {
    id: "alice-marble",
    name: "Alice Marble",
    lat: 37.801,
    lng: -122.42,
    address: "Greenwich Street",
    hoursOfOperation: "",
    accessInfo: "",
    gettingThereInfo: "",
    imageUrl: null,
    courts: [],
    availabilityStatus: "available",
    totalSlotsToday: 2,
    totalSlotsWeek: 4,
  },
  {
    id: "alta-plaza",
    name: "Alta Plaza",
    lat: 37.791,
    lng: -122.438,
    address: "Steiner Street",
    hoursOfOperation: "",
    accessInfo: "",
    gettingThereInfo: "",
    imageUrl: null,
    courts: [],
    availabilityStatus: "later",
    totalSlotsToday: 0,
    totalSlotsWeek: 3,
  },
];

function setDesktop(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((media: string) => ({
    matches,
    media,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

function renderPalette() {
  const callbacks = {
    onSelectCourt: vi.fn(),
    onSportChange: vi.fn(),
    onCityChange: vi.fn(),
    onFilterChange: vi.fn(),
    onRequestLocation: vi.fn(),
    onClose: vi.fn(),
  };
  const view = render(
    <CommandPalette
      courts={courts}
      travelTimes={new Map()}
      sport="tennis"
      city="sf"
      filter={{
        date: null,
        weekendOnly: false,
        timeFrom: null,
        timeTo: null,
      }}
      availableDates={[]}
      userLocationStatus="idle"
      {...callbacks}
    />,
  );

  return { ...view, callbacks };
}

beforeEach(() => {
  Object.defineProperty(Element.prototype, "scrollIntoView", {
    configurable: true,
    value: vi.fn(),
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("CommandPalette keyboard handling", () => {
  it("leaves arrow and Enter events on result buttons to the focused button", () => {
    for (const key of ["ArrowDown", "ArrowUp", "Enter"]) {
      expect(
        getCommandKeyboardAction({
          key,
          isDesktop: true,
          isCommandScope: true,
          isNativeButton: true,
          hasItems: true,
        }),
      ).toBeNull();
    }
  });

  it("moves the desktop search selection and invokes the selected court", async () => {
    setDesktop(true);
    const user = userEvent.setup();
    const { container, callbacks } = renderPalette();
    const input = within(container).getByRole("textbox");

    await waitFor(() => expect(document.activeElement).toBe(input));
    await user.keyboard("{ArrowDown}{Enter}");

    expect(callbacks.onSelectCourt).toHaveBeenCalledOnce();
    expect(callbacks.onSelectCourt).toHaveBeenCalledWith("alta-plaza");
    expect(callbacks.onClose).toHaveBeenCalledOnce();
  });

  it("keeps focus and highlight together for arrow then Enter on a desktop result", async () => {
    setDesktop(true);
    const user = userEvent.setup();
    const { container, callbacks } = renderPalette();
    const resultButtons = Array.from(
      container.querySelectorAll<HTMLButtonElement>("button[data-idx]"),
    ).filter((button) =>
      courts.some((court) => button.textContent?.includes(court.name)),
    );
    const [firstResult, secondResult] = resultButtons;

    firstResult.focus();
    await waitFor(() => expect(firstResult.className).toContain("bg-blue-50"));
    await user.keyboard("{ArrowDown}");

    expect(document.activeElement).toBe(firstResult);
    expect(firstResult.className).toContain("bg-blue-50");
    expect(secondResult.className).not.toContain("bg-blue-50");

    await user.keyboard("{Enter}");
    expect(callbacks.onSelectCourt).toHaveBeenCalledOnce();
    expect(callbacks.onSelectCourt).toHaveBeenCalledWith("alice-marble");
    expect(callbacks.onClose).toHaveBeenCalledOnce();
  });

  it("lets Enter invoke the focused mobile result callback", async () => {
    setDesktop(false);
    const user = userEvent.setup();
    const { container, callbacks } = renderPalette();
    const mobileContent = container.querySelector<HTMLElement>(
      ".sm\\:hidden.flex-1.overflow-y-auto",
    );
    expect(mobileContent).not.toBeNull();
    const firstResult = within(mobileContent!).getByRole("button", {
      name: /Alice Marble/,
    });

    firstResult.focus();
    await user.keyboard("{Enter}");

    expect(callbacks.onSelectCourt).toHaveBeenCalledOnce();
    expect(callbacks.onSelectCourt).toHaveBeenCalledWith("alice-marble");
    expect(callbacks.onClose).toHaveBeenCalledOnce();
  });

  it("lets Enter invoke a focused mobile city without selecting a hidden court", async () => {
    setDesktop(false);
    const user = userEvent.setup();
    const { container, callbacks } = renderPalette();
    const mobileContent = container.querySelector<HTMLElement>(
      ".sm\\:hidden.flex-1.overflow-y-auto",
    );
    expect(mobileContent).not.toBeNull();

    await user.click(within(container).getByRole("button", { name: /SF/ }));
    const mountainView = within(mobileContent!).getByRole("button", {
      name: /Mountain View/,
    });
    mountainView.focus();
    await user.keyboard("{Enter}");

    expect(callbacks.onCityChange).toHaveBeenCalledOnce();
    expect(callbacks.onCityChange).toHaveBeenCalledWith("mountain-view");
    expect(callbacks.onSelectCourt).not.toHaveBeenCalled();
    expect(callbacks.onClose).not.toHaveBeenCalled();
  });

  it("lets a focused desktop setting retain Arrow then native Enter", async () => {
    setDesktop(true);
    const user = userEvent.setup();
    const { container, callbacks } = renderPalette();
    const mountainView = Array.from(
      container.querySelectorAll<HTMLButtonElement>("button[data-idx]"),
    ).find((button) => button.textContent?.includes("Mountain View"));
    expect(mountainView).toBeDefined();

    mountainView!.focus();
    await user.keyboard("{ArrowDown}{Enter}");

    expect(callbacks.onCityChange).toHaveBeenCalledOnce();
    expect(callbacks.onCityChange).toHaveBeenCalledWith("mountain-view");
    expect(callbacks.onSelectCourt).not.toHaveBeenCalled();
    expect(callbacks.onClose).not.toHaveBeenCalled();
  });

  it("clears Weekend when a desktop date button is activated", async () => {
    setDesktop(true);
    const user = userEvent.setup();
    const onFilterChange = vi.fn();
    const { container } = render(
      <CommandPalette
        courts={courts}
        travelTimes={new Map()}
        sport="tennis"
        city="sf"
        filter={{
          date: null,
          weekendOnly: true,
          timeFrom: "12:00",
          timeTo: "17:00",
        }}
        availableDates={["2026-09-14"]}
        userLocationStatus="idle"
        onSelectCourt={vi.fn()}
        onSportChange={vi.fn()}
        onCityChange={vi.fn()}
        onFilterChange={onFilterChange}
        onRequestLocation={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    const dateButton = Array.from(
      container.querySelectorAll<HTMLButtonElement>("button[data-idx]"),
    ).find((button) => button.textContent?.includes("Mon, Sep 14"));
    expect(dateButton).toBeDefined();

    await user.click(dateButton!);

    expect(onFilterChange).toHaveBeenCalledWith({
      date: "2026-09-14",
      weekendOnly: false,
      timeFrom: "12:00",
      timeTo: "17:00",
    });
  });
});
