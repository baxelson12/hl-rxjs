import { type WsWebData2 } from "@nktkas/hyperliquid";
import { distinctUntilChanged, map, Observable, shareReplay } from "rxjs";

export const createClearinghouse = (accountData: Observable<WsWebData2>) => {
  const clearinghouseData = accountData.pipe(
    map(({ clearinghouseState }) => clearinghouseState),
    shareReplay(1),
  );
  const clearinghousePositions = clearinghouseData.pipe(
    map(({ assetPositions }) => assetPositions),
    distinctUntilChanged((prev, curr) => prev.length === curr.length),
    shareReplay(1),
  );
  const clearinghouseWithdrawable = clearinghouseData.pipe(
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
