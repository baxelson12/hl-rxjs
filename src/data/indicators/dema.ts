import type { Candle } from "@nktkas/hyperliquid";
import { dema } from "indicatorts";
import { filter, map, type Observable } from "rxjs";
import { logLifecycle } from "../../utils/log-lifecycle";

export const createDema = (candleSnapshot$: Observable<Candle[]>) => (period: number) => {
  const demaSnapshot = candleSnapshot$.pipe(
    logLifecycle("demaSnapshot"),
    map((arr) => arr.map(({ c }) => +c)),
    map((arr) => dema(arr, { period })),
  );

  return {
    demaSnapshot$: demaSnapshot,
    demaCurrent$: demaSnapshot.pipe(
      logLifecycle("demaCurrent"),
      map((arr) => arr.at(-1)),
      filter((v): v is number => !!v),
    ),
  };
};
