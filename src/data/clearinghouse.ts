import { type WsWebData2 } from "@nktkas/hyperliquid";
import { distinctUntilChanged, map, Observable, shareReplay } from "rxjs";
import { logLifecycle } from "../utils/log-lifecycle";

export const createClearinghouse = (accountData: Observable<WsWebData2>) => {
  const clearinghouseData = accountData.pipe(
    logLifecycle("clearinghouseData"),
    map(({ clearinghouseState }) => clearinghouseState),
    shareReplay(1),
  );
  const clearinghousePositions = clearinghouseData.pipe(
    logLifecycle("clearinghousePositions"),
    map(({ assetPositions }) => assetPositions),
    distinctUntilChanged((prev, curr) => prev.length === curr.length),
    shareReplay(1),
  );
  const clearinghouseWithdrawable = clearinghouseData.pipe(
    logLifecycle("clearinghouseWithdrawable"),
    map(({ withdrawable }) => +withdrawable),
    distinctUntilChanged(),
    shareReplay(1),
  );

  return {
    clearinghouseData$: clearinghouseData,
    clearinghousePositions$: clearinghousePositions,
    clearinghouseWithdrawable$: clearinghouseWithdrawable,
  };
};
