// @vitest-environment jsdom

import { cleanup, render, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FilterBar } from "./FilterBar";

const emptyFilter = { date: null, timeFrom: null, timeTo: null };

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("FilterBar accessibility", () => {
  it.each([
    ["mobile", 390],
    ["desktop", 1440],
  ])(
    "keeps labels associated and IDs unique with simultaneous %s instances",
    (_viewport, width) => {
      Object.defineProperty(window, "innerWidth", {
        configurable: true,
        value: width,
      });

      const view = render(
        <>
          <FilterBar
            filter={emptyFilter}
            onChange={() => {}}
            availableDates={[]}
          />
          <FilterBar
            filter={emptyFilter}
            onChange={() => {}}
            availableDates={[]}
          />
        </>,
      );
      const queries = within(view.container);
      const controls = queries.getAllByRole("combobox");
      const labels = Array.from(view.container.querySelectorAll("label"));

      expect(controls).toHaveLength(6);
      expect(new Set(controls.map((control) => control.id)).size).toBe(6);
      expect(controls.every((control) => control.id.length > 0)).toBe(true);
      expect(
        controls.every((control) =>
          labels.some((label) => label.htmlFor === control.id),
        ),
      ).toBe(true);
      expect(queries.getAllByRole("combobox", { name: "Day" })).toHaveLength(2);
      expect(
        queries.getAllByRole("combobox", { name: "Start time" }),
      ).toHaveLength(2);
      expect(queries.getAllByRole("combobox", { name: "End time" })).toHaveLength(
        2,
      );
    },
  );

  it("changes the intended filter through its accessible name", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const view = render(
      <FilterBar
        filter={emptyFilter}
        onChange={onChange}
        availableDates={["2026-11-02"]}
      />,
    );

    await user.selectOptions(
      within(view.container).getByRole("combobox", { name: "Start time" }),
      "09:30",
    );

    expect(onChange).toHaveBeenCalledWith({
      date: null,
      timeFrom: "09:30",
      timeTo: null,
    });
  });
});

describe("FilterBar date labels", () => {
  it("labels the next Los Angeles calendar date as Tomorrow after fall-back", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-01T07:30:00.000Z"));

    const view = render(
      <FilterBar
        filter={emptyFilter}
        onChange={() => {}}
        availableDates={["2026-11-02"]}
      />,
    );

    expect(
      within(view.container)
        .getByRole("combobox", { name: "Day" })
        .querySelector('option[value="2026-11-02"]')?.textContent,
    ).toBe("Tomorrow");
  });
});
