import type { Candle } from "@nktkas/hyperliquid";
import { rsi } from "indicatorts";
import { filter, map, type Observable } from "rxjs";

export const createRsi = (candleSnapshot$: Observable<Candle[]>) => (period: number) => {
  const rsiSnapshot = candleSnapshot$.pipe(
    map((arr) => arr.map(({ c }) => +c)),
    map((arr) => rsi(arr, { period })),
  );

  return {
    rsiSnapshot$: rsiSnapshot,
    rsiCurrent$: rsiSnapshot.pipe(
      map((arr) => arr.at(-1)),
      filter((v): v is number => !!v),
    ),
  };
};
