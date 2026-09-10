import type { ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { TravelTime } from "@/types";
import { TravelBadge, TravelBadgeMini } from "./TravelBadge";

const travelTime: TravelTime = {
  locationId: "court-1",
  walking: { durationMinutes: 12, distanceMeters: 900 },
  driving: { durationMinutes: 7, distanceMeters: 3_200 },
  transitUrl: "https://example.com/unused",
};

function renderBadge(time: TravelTime = travelTime) {
  return renderToStaticMarkup(
    <TravelBadge
      travelTime={time}
      originLat={37.7749}
      originLng={-122.4194}
      destLat={-33.8688}
      destLng={151.2093}
    />,
  );
}

describe("TravelBadge", () => {
  it("links every available travel mode to the selected route", () => {
    const markup = renderBadge();
    const route =
      "https://www.google.com/maps/dir/?api=1&amp;origin=37.7749,-122.4194&amp;destination=-33.8688,151.2093&amp;travelmode=";

    expect(markup).toContain(`href="${route}walking"`);
    expect(markup).toContain(`href="${route}driving"`);
    expect(markup).toContain(`href="${route}transit"`);
    expect(markup.match(/target="_blank"/g)).toHaveLength(3);
    expect(markup.match(/rel="noopener noreferrer"/g)).toHaveLength(3);
    expect(markup).toContain("🚶 12 min →");
    expect(markup).toContain("🚗 7 min →");
    expect(markup).toContain("🚌 Transit →");
  });

  it("hides unavailable walking and driving choices but keeps transit", () => {
    const markup = renderBadge({
      ...travelTime,
      walking: null,
      driving: null,
    });

    expect(markup).not.toContain("travelmode=walking");
    expect(markup).not.toContain("travelmode=driving");
    expect(markup).toContain("travelmode=transit");
    expect(markup.match(/target="_blank"/g)).toHaveLength(1);
    expect(markup.match(/rel="noopener noreferrer"/g)).toHaveLength(1);
  });
});

describe("TravelBadgeMini", () => {
  type MiniProps = { travelTime: TravelTime | undefined };
  const mini = TravelBadgeMini as unknown as {
    type: ComponentType<MiniProps>;
    compare: (previous: MiniProps, next: MiniProps) => boolean;
  };

  function renderMini(time: TravelTime | undefined) {
    return renderToStaticMarkup(<mini.type travelTime={time} />);
  }

  it("renders nothing without a walking estimate", () => {
    expect(renderMini(undefined)).toBe("");
    expect(renderMini({ ...travelTime, walking: null })).toBe("");
  });

  it("updates when the walking duration changes", () => {
    const updatedTravelTime: TravelTime = {
      ...travelTime,
      walking: { ...travelTime.walking!, durationMinutes: 18 },
    };

    expect(renderMini(travelTime)).toContain("🚶 12m");
    expect(
      mini.compare(
        { travelTime },
        { travelTime: updatedTravelTime },
      ),
    ).toBe(false);
    expect(renderMini(updatedTravelTime)).toContain("🚶 18m");
  });
});
