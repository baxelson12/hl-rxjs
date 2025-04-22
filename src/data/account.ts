import {
  type WsWebData2,
  type EventClient,
  type EventWebData2Parameters,
  type WebSocketTransport,
} from "@nktkas/hyperliquid";
import { distinctUntilChanged, map, Observable, share } from "rxjs";
import { logLifecycle } from "../utils/log-lifecycle";

export const createAccount =
  (socketEventClient: EventClient<WebSocketTransport>) => (conf: EventWebData2Parameters) => {
    // Internal state

    // Exported data
    const accountData = new Observable<WsWebData2>((subscriber) => {
      const client = socketEventClient.webData2(conf, (data) => subscriber.next(data));
    }).pipe(logLifecycle("accountData"), share({ resetOnRefCountZero: true }));
    const accountUser = accountData.pipe(
      logLifecycle("accountUser"),
      map(({ user }) => user),
      distinctUntilChanged(),
    );

    return {
      accountData$: accountData,
      accountUser$: accountUser,
    };
  };
