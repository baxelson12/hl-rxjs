import type { Candle } from "@nktkas/hyperliquid";
import { atr } from "indicatorts";
import { filter, map, type Observable } from "rxjs";
import { logLifecycle } from "../../utils/log-lifecycle";

export const createAtr = (candleSnapshot$: Observable<Candle[]>) => (period: number) => {
  const atrSnapshot = candleSnapshot$.pipe(
    logLifecycle("atrSnapshot"),
    map((arr) =>
      arr.reduce(
        (acc, curr) => ({
          ...acc,
          h: [...acc.h, +curr.h],
          l: [...acc.l, +curr.l],
          c: [...acc.c, +curr.c],
        }),
        { h: [], l: [], c: [] } as { h: number[]; l: number[]; c: number[] },
      ),
    ),
    map(({ h, l, c }) => atr(h, l, c, { period }).atrLine),
  );

  return {
    atrSnapshot$: atrSnapshot,
    atrCurrent$: atrSnapshot.pipe(
      logLifecycle("atrCurrent"),
      map((arr) => arr.at(-1)),
      filter((v): v is number => !!v),
    ),
  };
};
