// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { CourtLocation } from "@/types";
import { CourtPanel } from "./CourtPanel";

const location: CourtLocation = {
  id: "alice-marble",
  name: "Alice Marble",
  lat: 37.801,
  lng: -122.42,
  address: "Greenwich Street",
  hoursOfOperation: "",
  accessInfo: "Free to use",
  gettingThereInfo: "Near the bus stop",
  imageUrl: null,
  courts: [],
  availabilityStatus: "available",
  totalSlotsToday: 2,
  totalSlotsWeek: 4,
};

afterEach(() => {
  cleanup();
});

function renderPanel(hoursOfOperation: string) {
  return renderToStaticMarkup(
    <CourtPanel
      location={{ ...location, hoursOfOperation }}
      travelTime={null}
      onClose={() => {}}
      originLat={37.77}
      originLng={-122.42}
    />,
  );
}

describe("CourtPanel", () => {
  it("omits the hours row when hours are unavailable", () => {
    const markup = renderPanel("");

    expect(markup).not.toContain("Hours:");
    expect(markup).toContain("Getting there:");
    expect(markup).toContain("Access:");
  });

  it("shows the hours row when hours are available", () => {
    const markup = renderPanel("8am–8pm");

    expect(markup).toContain("Hours:");
    expect(markup).toContain("8am–8pm");
  });

  it("exposes court details as a region named by the court heading", () => {
    render(
      <CourtPanel
        location={location}
        travelTime={null}
        onClose={vi.fn()}
        originLat={37.77}
        originLng={-122.42}
      />,
    );

    const panel = screen.getByRole("region", { name: "Alice Marble" });
    const heading = screen.getByRole("heading", { name: "Alice Marble" });

    expect(panel.getAttribute("aria-labelledby")).toBe(heading.id);
  });
});
