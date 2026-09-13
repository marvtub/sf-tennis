// @vitest-environment jsdom

import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { CourtLocation } from "@/types";
import { CourtPin } from "./CourtPin";

const location: CourtLocation = {
  id: "1",
  name: "Old name",
  lat: 37.77,
  lng: -122.42,
  address: "",
  hoursOfOperation: "",
  accessInfo: "",
  gettingThereInfo: "",
  imageUrl: null,
  courts: [],
  availabilityStatus: "available",
  totalSlotsToday: 1,
  totalSlotsWeek: 1,
};

afterEach(cleanup);

describe("CourtPin", () => {
  it("updates its accessible label when the court name changes", () => {
    const onClick = vi.fn();
    const { getByRole, rerender } = render(
      <CourtPin location={location} isSelected={false} onClick={onClick} />,
    );

    rerender(
      <CourtPin
        location={{ ...location, name: "New name" }}
        isSelected={false}
        onClick={onClick}
      />,
    );

    expect(getByRole("button").getAttribute("aria-label")).toBe(
      "New name: Available today",
    );
  });
});
