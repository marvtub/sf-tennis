import {
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { describe, expect, it, vi } from "vitest";

import type { AvailabilityFilter } from "@/types";
import { CommandPalette } from "./CommandPalette";

vi.mock("react", async (importOriginal) => {
  const react = await importOriginal<typeof import("react")>();

  return {
    ...react,
    useCallback: <T,>(callback: T) => callback,
    useEffect: () => undefined,
    useMemo: <T,>(factory: () => T) => factory(),
    useRef: <T,>(initialValue: T) => ({ current: initialValue }),
    useState: <T,>(initialValue: T | (() => T)) => [
      typeof initialValue === "function"
        ? (initialValue as () => T)()
        : initialValue,
      vi.fn(),
    ],
  };
});

interface DesktopItem {
  id: string;
}

interface ElementProps {
  children?: ReactNode;
  items?: DesktopItem[];
  onSelect?: (item: DesktopItem) => void;
}

function findElement(
  node: ReactNode,
  predicate: (element: ReactElement<ElementProps>) => boolean,
): ReactElement<ElementProps> | undefined {
  if (Array.isArray(node)) {
    for (const child of node) {
      const match = findElement(child, predicate);
      if (match) return match;
    }
    return undefined;
  }

  if (!isValidElement<ElementProps>(node)) return undefined;
  if (predicate(node)) return node;
  return findElement(node.props.children, predicate);
}

describe("CommandPalette desktop date selection", () => {
  it("turns off the weekend filter when a specific date is selected", () => {
    const selectedDate = "2026-09-14";
    const filter: AvailabilityFilter = {
      date: null,
      weekendOnly: true,
      timeFrom: "12:00",
      timeTo: "17:00",
    };
    const onFilterChange = vi.fn();
    const palette = CommandPalette({
      courts: [],
      travelTimes: new Map(),
      sport: "tennis",
      city: "sf",
      filter,
      availableDates: [selectedDate],
      userLocationStatus: "idle",
      onSelectCourt: vi.fn(),
      onSportChange: vi.fn(),
      onCityChange: vi.fn(),
      onFilterChange,
      onRequestLocation: vi.fn(),
      onClose: vi.fn(),
    });

    const desktopItems = findElement(
      palette,
      (element) =>
        typeof element.type === "function" &&
        element.type.name === "DesktopItems",
    );
    const dateItem = desktopItems?.props.items?.find(
      (item) => item.id === `filter-${selectedDate}`,
    );

    expect(desktopItems).toBeDefined();
    expect(dateItem).toBeDefined();
    desktopItems?.props.onSelect?.(dateItem!);
    expect(onFilterChange).toHaveBeenCalledWith({
      date: selectedDate,
      weekendOnly: false,
      timeFrom: "12:00",
      timeTo: "17:00",
    });
  });
});
