import type { PropsWithChildren } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import type { UserLocation } from "@/hooks/useUserLocation";

vi.mock("react-map-gl/mapbox", () => ({
  default: ({ children }: PropsWithChildren) => <div>{children}</div>,
  Marker: ({ children }: PropsWithChildren) => <div>{children}</div>,
  NavigationControl: () => null,
}));

import { MapView } from "./MapView";

function renderMap(userLocation: UserLocation) {
  return renderToStaticMarkup(
    <MapView
      courts={[]}
      selectedId={null}
      onSelectCourt={() => {}}
      travelTimes={new Map()}
      mapboxToken="test-token"
      userLocation={userLocation}
      city="sf"
    />,
  );
}

describe("MapView user location marker", () => {
  it("does not label fallback city coordinates as home", () => {
    const markup = renderMap({
      lat: 37.7749,
      lng: -122.4194,
      isDefault: true,
    });

    expect(markup).not.toContain('aria-label="Home"');
  });

  it("labels a resolved user location as home", () => {
    const markup = renderMap({
      lat: 37.78,
      lng: -122.42,
      isDefault: false,
    });

    expect(markup).toContain('aria-label="Home"');
  });
});
