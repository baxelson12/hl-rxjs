import {
  type WsUserFills,
  type EventClient,
  type WebSocketTransport,
  type WsWebData2,
} from "@nktkas/hyperliquid";
import { distinctUntilChanged, filter, map, Observable, share, switchMap } from "rxjs";
import { logLifecycle } from "../utils/log-lifecycle";

export const createOrder =
  (socketEventClient: EventClient<WebSocketTransport>) =>
  (accountData: Observable<WsWebData2>, accountUser: Observable<`0x${string}`>) => {
    const orderOrderFills = accountUser.pipe(
      logLifecycle("orderOrderFills"),
      switchMap(
        (user) =>
          new Observable<WsUserFills>((subscriber) => {
            const client = socketEventClient.userFills({ user }, (data) => subscriber.next(data));
          }),
      ),
      filter(({ isSnapshot }) => !isSnapshot),
      share({ resetOnRefCountZero: true }),
    );
    const orderOrders = accountData.pipe(
      logLifecycle("orderOrders"),
      map(({ openOrders }) => openOrders),
      distinctUntilChanged((prev, curr) => prev.length === curr.length),
    );
    const orderMidPrice = accountData.pipe(
      logLifecycle("orderMidPrice"),
      map(({ assetCtxs }) => assetCtxs[1]?.midPx && +assetCtxs[1].midPx),
      filter((v): v is number => !!v),
      distinctUntilChanged(),
    );

    return {
      orderOrderFills$: orderOrderFills,
      orderOrders$: orderOrders,
      orderMidPrice$: orderMidPrice,
    };
  };
