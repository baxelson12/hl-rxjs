import type { WalletClient, WebSocketTransport } from "@nktkas/hyperliquid";
import type { OrderDetails } from "./market-open";
import { from, retry } from "rxjs";
import { round } from "../utils/round";

export const createTakeprofit =
  (socketWalletClient: WalletClient<WebSocketTransport>) =>
  ({ assetId, isBuy, size, price }: OrderDetails) => {
    if (!price) {
      throw new Error(`Attempted to create stoploss with an undefined price.`);
    }

    return from(
      socketWalletClient.order({
        orders: [
          {
            a: assetId,
            b: isBuy,
            p: round(price, 1).toString(),
            s: round(size, 4).toString(),
            r: true,
            t: {
              trigger: { isMarket: true, triggerPx: round(price, 1).toString(), tpsl: "sl" },
            },
          },
        ],
        grouping: "na",
      }),
    ).pipe(retry({ count: 5, delay: 1000, resetOnSuccess: true }));
  };
