// @vitest-environment jsdom

import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { UserLocation } from "@/hooks/useUserLocation";
import { CITIES } from "@/lib/constants";
import type { CourtLocation } from "@/types";
import { MapView } from "./MapView";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("react-map-gl/mapbox", () => ({
  default: ({
    children,
    latitude,
    longitude,
  }: {
    children: ReactNode;
    latitude: number;
    longitude: number;
  }) => (
    <div data-testid="map" data-latitude={latitude} data-longitude={longitude}>
      {children}
    </div>
  ),
  Marker: ({ children }: { children: ReactNode }) => children,
  NavigationControl: () => null,
}));

describe("MapView location behavior", () => {
  let container: HTMLDivElement;
  let root: Root;
  const onSelectCourt = vi.fn();

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
  });

  async function renderWithLocation(
    userLocation: UserLocation,
    courts: CourtLocation[] = [],
  ) {
    await act(async () => {
      root.render(
        <MapView
          courts={courts}
          selectedId={null}
          onSelectCourt={onSelectCourt}
          travelTimes={new Map()}
          mapboxToken="test-token"
          userLocation={userLocation}
          city="sf"
        />,
      );
    });
  }

  function expectMapCenteredAt(latitude: number, longitude: number) {
    const map = container.querySelector('[data-testid="map"]');
    expect(map?.getAttribute("data-latitude")).toBe(String(latitude));
    expect(map?.getAttribute("data-longitude")).toBe(String(longitude));
  }

  it("recenters after each newly resolved location", async () => {
    await renderWithLocation({
      lat: CITIES.sf.lat,
      lng: CITIES.sf.lng,
      isDefault: true,
    });

    await renderWithLocation({ lat: 37.78, lng: -122.42, isDefault: false });
    expectMapCenteredAt(37.78, -122.42);

    await renderWithLocation({ lat: 37.79, lng: -122.41, isDefault: false });
    expectMapCenteredAt(37.79, -122.41);
  });

  it("shows Home only for a resolved user location", async () => {
    await renderWithLocation({
      lat: CITIES.sf.lat,
      lng: CITIES.sf.lng,
      isDefault: true,
    });
    expect(container.querySelector('[aria-label="Home"]')).toBeNull();

    await renderWithLocation({ lat: 37.78, lng: -122.42, isDefault: false });
    expect(container.querySelector('[aria-label="Home"]')).not.toBeNull();

    await renderWithLocation({
      lat: CITIES.sf.lat,
      lng: CITIES.sf.lng,
      isDefault: true,
    });
    expect(container.querySelector('[aria-label="Home"]')).toBeNull();
  });

  it("updates a court marker's accessible name when its name changes", async () => {
    const court: CourtLocation = {
      id: "court-1",
      name: "Old court name",
      lat: 37.78,
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
    const defaultLocation = {
      lat: CITIES.sf.lat,
      lng: CITIES.sf.lng,
      isDefault: true,
    };

    await renderWithLocation(defaultLocation, [court]);
    expect(
      container.querySelector('[aria-label="Old court name: Available today"]'),
    ).not.toBeNull();

    await renderWithLocation(defaultLocation, [
      { ...court, name: "Updated court name" },
    ]);
    expect(
      container.querySelector(
        '[aria-label="Updated court name: Available today"]',
      ),
    ).not.toBeNull();
  });
});
