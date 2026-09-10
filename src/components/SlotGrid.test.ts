import { isValidElement, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import type { Court } from "@/types";

const storedSelection = vi.hoisted(() => ({ value: "2026-09-07" }));

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");

  return {
    ...actual,
    useEffect: vi.fn(),
    useMemo: (factory: () => unknown) => factory(),
    useState: () => [storedSelection.value, vi.fn()],
  };
});

import { getEffectiveDate, SlotGrid } from "./SlotGrid";

interface ElementProps {
  "aria-pressed"?: boolean;
  children?: ReactNode;
  className?: string;
}

function getText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(getText).join("");
  }
  if (isValidElement<ElementProps>(node)) {
    return getText(node.props.children);
  }
  return "";
}

function hasClass(node: ReactNode, className: string): boolean {
  if (Array.isArray(node)) {
    return node.some((child) => hasClass(child, className));
  }
  if (!isValidElement<ElementProps>(node)) {
    return false;
  }
  return (
    node.props.className?.includes(className) === true ||
    hasClass(node.props.children, className)
  );
}

function getDateButtonPressedStates(node: ReactNode): Array<boolean | undefined> {
  if (Array.isArray(node)) {
    return node.flatMap(getDateButtonPressedStates);
  }
  if (!isValidElement<ElementProps>(node)) {
    return [];
  }
  if (node.type === "button") {
    return [node.props["aria-pressed"]];
  }
  return getDateButtonPressedStates(node.props.children);
}

describe("getEffectiveDate", () => {
  it("uses the first available date when the stored selection is stale", () => {
    expect(getEffectiveDate("2026-09-07", ["2026-09-08"])).toBe(
      "2026-09-08"
    );
  });

  it("preserves a selection that is still available", () => {
    expect(
      getEffectiveDate("2026-09-08", ["2026-09-08", "2026-09-09"])
    ).toBe("2026-09-08");
  });
});

describe("SlotGrid", () => {
  it("renders newly available slots immediately when the stored selection is stale", () => {
    const courts: Court[] = [
      {
        id: "court-1",
        courtNumber: "1",
        sportId: "tennis",
        priceCentsPerHour: 0,
        allowedDurations: [60],
        reservationWindowDays: 7,
        releaseTime: "08:00:00",
        availableSlots: [
          {
            datetime: "2026-09-08 09:00:00",
            date: "2026-09-08",
            time: "09:00",
          },
        ],
        bookingUrl: "https://example.com/book",
      },
    ];

    const rendered = SlotGrid({ courts });
    const text = getText(rendered);

    expect(hasClass(rendered, "bg-blue-600 text-white")).toBe(true);
    expect(text).toContain("09:00");
    expect(text).not.toContain("No slots");
  });

  it("exposes which date controls the displayed slots", () => {
    const courts: Court[] = [
      {
        id: "court-1",
        courtNumber: "1",
        sportId: "tennis",
        priceCentsPerHour: 0,
        allowedDurations: [60],
        reservationWindowDays: 7,
        releaseTime: "08:00:00",
        availableSlots: [
          {
            datetime: "2026-09-08 09:00:00",
            date: "2026-09-08",
            time: "09:00",
          },
          {
            datetime: "2026-09-09 10:00:00",
            date: "2026-09-09",
            time: "10:00",
          },
        ],
        bookingUrl: "https://example.com/book",
      },
    ];

    storedSelection.value = "2026-09-08";
    expect(getDateButtonPressedStates(SlotGrid({ courts }))).toEqual([
      true,
      false,
    ]);

    storedSelection.value = "2026-09-09";
    expect(getDateButtonPressedStates(SlotGrid({ courts }))).toEqual([
      false,
      true,
    ]);
  });
});
