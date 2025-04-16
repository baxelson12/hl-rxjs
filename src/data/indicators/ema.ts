import type { Candle } from "@nktkas/hyperliquid";
import { ema } from "indicatorts";
import { filter, map, type Observable } from "rxjs";

export const createEma = (candleSnapshot$: Observable<Candle[]>) => (period: number) => {
  const emaSnapshot = candleSnapshot$.pipe(
    map((arr) => arr.map(({ c }) => +c)),
    map((arr) => ema(arr, { period })),
  );

  return {
    emaSnapshot$: emaSnapshot,
    emaCurrent$: emaSnapshot.pipe(
      map((arr) => arr.at(-1)),
      filter((v): v is number => !!v),
    ),
  };
};
