// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { CourtLocation } from "@/types";
import { CourtPanel } from "./CourtPanel";

const location: CourtLocation = {
  id: "alice-marble",
  name: "Alice Marble",
  lat: 37.801,
  lng: -122.42,
  address: "Greenwich Street",
  hoursOfOperation: "8am to 8pm",
  accessInfo: "Public",
  gettingThereInfo: "Near Hyde Street",
  imageUrl: null,
  courts: [],
  availabilityStatus: "available",
  totalSlotsToday: 2,
  totalSlotsWeek: 4,
};

afterEach(() => {
  cleanup();
});

describe("CourtPanel", () => {
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
