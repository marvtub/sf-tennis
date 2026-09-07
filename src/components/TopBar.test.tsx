import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { UserLocationStatus } from "@/hooks/useUserLocation";
import { TopBar } from "./TopBar";

function renderLocationButton(status: UserLocationStatus) {
  const markup = renderToStaticMarkup(
    <TopBar
      loading={false}
      hasData={true}
      fetchedAt={null}
      viewMode="map"
      sport="tennis"
      city="san-francisco"
      courtCount={1}
      userLocationStatus={status}
      onRefresh={() => {}}
      onRequestLocation={() => {}}
      onToggleView={() => {}}
      onShowSearch={() => {}}
    />,
  );
  const label =
    status === "requesting"
      ? "Locating…"
      : status === "resolved"
        ? "My location"
        : status === "denied"
          ? "Location blocked"
          : status === "unsupported"
            ? "Location unavailable"
            : "Use my location";

  return markup.match(
    new RegExp(`<button[^>]*aria-label="${label}"[^>]*>`),
  )?.[0];
}

describe("TopBar location control", () => {
  const disabledAttribute = /\sdisabled(?:=""|(?=\s|>))/;

  it.each(["requesting", "unsupported"] satisfies UserLocationStatus[])(
    "disables location requests while the status is %s",
    (status) => {
      expect(renderLocationButton(status)).toMatch(disabledAttribute);
    },
  );

  it.each([
    "idle",
    "fallback",
    "denied",
    "resolved",
  ] satisfies UserLocationStatus[])(
    "allows location requests while the status is %s",
    (status) => {
      expect(renderLocationButton(status)).not.toMatch(disabledAttribute);
    },
  );
});
