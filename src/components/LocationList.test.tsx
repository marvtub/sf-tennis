import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import type { CourtLocation, TravelTime } from "@/types";

const state = vi.hoisted(() => ({ search: "" }));

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");

  return {
    ...actual,
    useMemo: (factory: () => unknown) => factory(),
    useState: (initial: unknown) => [initial === "" ? state.search : initial, vi.fn()],
  };
});

import { LocationList } from "./LocationList";

const courts: CourtLocation[] = [
  {
    id: "available-court",
    name: "Available Court",
    lat: 37.77,
    lng: -122.42,
    address: "1 Tennis Way",
    hoursOfOperation: "",
    accessInfo: "",
    gettingThereInfo: "",
    imageUrl: null,
    courts: [],
    availabilityStatus: "available",
    totalSlotsToday: 2,
    totalSlotsWeek: 2,
  },
  {
    id: "later-court",
    name: "Later Court",
    lat: 37.78,
    lng: -122.43,
    address: "2 Tennis Way",
    hoursOfOperation: "",
    accessInfo: "",
    gettingThereInfo: "",
    imageUrl: null,
    courts: [],
    availabilityStatus: "later",
    totalSlotsToday: 0,
    totalSlotsWeek: 3,
  },
  {
    id: "full-court",
    name: "Full Court",
    lat: 37.79,
    lng: -122.44,
    address: "3 Tennis Way",
    hoursOfOperation: "",
    accessInfo: "",
    gettingThereInfo: "",
    imageUrl: null,
    courts: [],
    availabilityStatus: "full",
    totalSlotsToday: 0,
    totalSlotsWeek: 0,
  },
];

function renderList(selectedId: string | null = "later-court") {
  return renderToStaticMarkup(
    <LocationList
      courts={courts}
      travelTimes={new Map<string, TravelTime>()}
      onSelectCourt={() => {}}
      selectedId={selectedId}
    />,
  );
}

function getButtonAttributes(markup: string, label: string) {
  for (const match of markup.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)) {
    if (match[2].includes(label)) return match[1];
  }

  throw new Error(`Could not find button containing ${label}`);
}

describe("LocationList accessibility", () => {
  it("names the search and clear controls", () => {
    state.search = "Court";

    const markup = renderList();

    expect(markup).toContain('aria-label="Filter courts"');
    expect(markup).toContain('aria-label="Clear search"');
  });

  it("exposes the active sort and selected court states", () => {
    state.search = "";

    const markup = renderList();

    expect(getButtonAttributes(markup, "Distance")).toContain(
      'aria-pressed="true"',
    );
    expect(getButtonAttributes(markup, "A–Z Name")).toContain(
      'aria-pressed="false"',
    );
    expect(getButtonAttributes(markup, "Later Court")).toContain(
      'aria-pressed="true"',
    );
    expect(getButtonAttributes(markup, "Available Court")).toContain(
      'aria-pressed="false"',
    );
  });

  it("provides text for every availability status", () => {
    state.search = "";

    const markup = renderList();

    expect(markup).toContain("Available today");
    expect(markup).toContain("Available later this week");
    expect(markup).toContain("No availability this week");
  });
});
