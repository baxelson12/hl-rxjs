import type { Candle } from "@nktkas/hyperliquid";
import { ema } from "indicatorts";
import { filter, map, tap, type Observable } from "rxjs";
import { logLifecycle } from "../../utils/log-lifecycle";

export const createEma = (candleSnapshot$: Observable<Candle[]>) => (period: number) => {
  const emaSnapshot = candleSnapshot$.pipe(
    logLifecycle("emaSnapshot"),
    map((arr) => arr.map(({ c }) => +c)),
    map((arr) => ema(arr, { period })),
  );

  return {
    emaSnapshot$: emaSnapshot,
    emaCurrent$: emaSnapshot.pipe(
      logLifecycle("emaCurrent"),
      map((arr) => arr.at(-1)),
      filter((v): v is number => !!v),
    ),
  };
};
