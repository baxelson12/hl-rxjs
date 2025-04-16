import type { Candle } from "@nktkas/hyperliquid";
import { rsi } from "indicatorts";
import { filter, map, type Observable } from "rxjs";
import { logLifecycle } from "../../utils/log-lifecycle";

export const createRsi = (candleSnapshot$: Observable<Candle[]>) => (period: number) => {
  const rsiSnapshot = candleSnapshot$.pipe(
    logLifecycle("rsiSnapshot"),
    map((arr) => arr.map(({ c }) => +c)),
    map((arr) => rsi(arr, { period })),
  );

  return {
    rsiSnapshot$: rsiSnapshot,
    rsiCurrent$: rsiSnapshot.pipe(
      logLifecycle("rsiCurrent"),
      map((arr) => arr.at(-1)),
      filter((v): v is number => !!v),
    ),
  };
};
