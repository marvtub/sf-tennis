// @vitest-environment jsdom

import { cleanup, fireEvent, render } from "@testing-library/react";
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
  it("refreshes its accessible name through the memo comparator", () => {
    const onClick = vi.fn();
    const { getByRole, queryByRole, rerender } = render(
      <CourtPin location={location} isSelected={false} onClick={onClick} />,
    );
    const originalButton = getByRole("button", {
      name: "Old name: Available today",
    });

    // Keep every compared prop stable except the name. This only updates if
    // the custom memo comparator accounts for the accessible-name input.
    rerender(
      <CourtPin
        location={{ ...location, name: "New name" }}
        isSelected={false}
        onClick={onClick}
      />,
    );

    const renamedButton = getByRole("button", {
      name: "New name: Available today",
    });
    expect(renamedButton).toBe(originalButton);
    expect(
      queryByRole("button", { name: "Old name: Available today" }),
    ).toBeNull();

    fireEvent.click(renamedButton);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("still refreshes the status-derived part of the accessible name", () => {
    const onClick = vi.fn();
    const { getByRole, queryByRole, rerender } = render(
      <CourtPin location={location} isSelected={false} onClick={onClick} />,
    );

    rerender(
      <CourtPin
        location={{ ...location, availabilityStatus: "full" }}
        isSelected={false}
        onClick={onClick}
      />,
    );

    expect(getByRole("button", { name: "Old name: Fully booked" })).toBeTruthy();
    expect(
      queryByRole("button", { name: "Old name: Available today" }),
    ).toBeNull();
  });
});
