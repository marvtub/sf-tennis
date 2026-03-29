import type { CourtLocation, AvailabilityFilter } from "@/types";

/**
 * Apply availability filters to court locations.
 * Filters the available slots on each court, then recomputes availability status.
 */
export function applyFilter(
  courts: CourtLocation[],
  filter: AvailabilityFilter
): CourtLocation[] {
  const hasFilter = filter.date || filter.timeFrom || filter.timeTo;
  if (!hasFilter) return courts;

  return courts.map((loc) => {
    const filteredCourts = loc.courts.map((court) => {
      const filteredSlots = court.availableSlots.filter((slot) => {
        if (filter.date && slot.date !== filter.date) return false;
        if (filter.timeFrom && slot.time < filter.timeFrom) return false;
        if (filter.timeTo && slot.time > filter.timeTo) return false;
        return true;
      });

      return { ...court, availableSlots: filteredSlots };
    });

    const todayStr = new Date().toLocaleDateString("en-CA", {
      timeZone: "America/Los_Angeles",
    });

    const totalSlotsToday = filteredCourts.reduce(
      (sum, c) =>
        sum + c.availableSlots.filter((s) => s.date === todayStr).length,
      0
    );
    const totalSlotsWeek = filteredCourts.reduce(
      (sum, c) => sum + c.availableSlots.length,
      0
    );

    let availabilityStatus: "available" | "later" | "full";
    if (totalSlotsToday > 0) availabilityStatus = "available";
    else if (totalSlotsWeek > 0) availabilityStatus = "later";
    else availabilityStatus = "full";

    return {
      ...loc,
      courts: filteredCourts,
      totalSlotsToday,
      totalSlotsWeek,
      availabilityStatus,
    };
  });
}

/** Get all unique dates from courts data */
export function getAvailableDates(courts: CourtLocation[]): string[] {
  const dates = new Set<string>();
  for (const loc of courts) {
    for (const court of loc.courts) {
      for (const slot of court.availableSlots) {
        dates.add(slot.date);
      }
    }
  }
  return Array.from(dates).sort();
}
