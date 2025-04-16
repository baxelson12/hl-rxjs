import type { Candle } from "@nktkas/hyperliquid";
import { vwap } from "indicatorts";
import { filter, map, type Observable } from "rxjs";

type VwapAnchor = "session" | "week" | "month" | "year";

const getFilterStartTime = (anchor: VwapAnchor) => {
  let filterStartTime = 0; // Default to beginning of epoch if needed, but session handles it

  if (anchor !== "session") {
    const now = new Date(); // Use current time for anchoring calculations
    const startDate = new Date(now); // Copy current date to modify

    switch (anchor) {
      case "week": {
        const dayOfWeek = startDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        // Calculate days to subtract to get to the previous Monday
        // If Sunday (0), subtract 6 days. If Monday (1), subtract 0. If Tuesday (2), subtract 1, etc.
        const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        startDate.setDate(startDate.getDate() - daysToSubtract);
        startDate.setHours(0, 0, 0, 0); // Set to midnight start of the day
        filterStartTime = startDate.getTime();
        break;
      }
      case "month": {
        // Set to the first day of the current month, midnight
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        filterStartTime = startDate.getTime();
        break;
      }
      case "year": {
        // Set to the first day of the current year (Month 0 = January), midnight
        startDate.setMonth(0, 1); // Set month to January, day to 1st
        startDate.setHours(0, 0, 0, 0);
        filterStartTime = startDate.getTime();
        break;
      }
      // case 'session': // No start time needed, handled below
    }
  }

  return filterStartTime;
};

export const createVwap = (candleSnapshot$: Observable<Candle[]>) => (anchor: VwapAnchor) => {
  const vwapSnapshot = candleSnapshot$.pipe(
    map((arr) =>
      anchor === "session" ? arr : arr.filter(({ T }) => T >= getFilterStartTime(anchor)),
    ),
    map((arr) =>
      arr.reduce(
        (acc, curr) => ({
          ...acc,
          c: [...acc.c, +curr.c],
          v: [...acc.v, +curr.v * +curr.c],
        }),
        { c: [], v: [] } as { c: number[]; v: number[] },
      ),
    ),
    map(({ c, v }) => vwap(c, v, { period: c.length })),
  );

  return {
    vwapSnapshot$: vwapSnapshot,
    vwapCurrent$: vwapSnapshot.pipe(
      map((arr) => arr.at(-1)),
      filter((v): v is number => !!v),
    ),
  };
};
