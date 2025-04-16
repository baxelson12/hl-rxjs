import type { WalletClient, WebSocketTransport, WsUserFills } from "@nktkas/hyperliquid";
import { first, from, map, switchMap, type Observable } from "rxjs";
import { round } from "../utils/round";

export interface OrderDetails {
  assetId: number;
  isBuy: boolean;
  size: number;
  price?: number;
}

export const createMarketOpen =
  (socketWalletClient: WalletClient<WebSocketTransport>) =>
  (orderMidPrice: Observable<number>, orderOrderFills: Observable<WsUserFills>) =>
  ({ assetId, isBuy, size }: Omit<OrderDetails, "price">) =>
    orderMidPrice.pipe(
      first(),
      switchMap((price) =>
        from(
          socketWalletClient.order({
            orders: [
              {
                a: assetId,
                b: isBuy,
                p: round(price, 1).toString(),
                s: round(size, 4).toString(),
                r: false,
                t: { limit: { tif: "Gtc" } },
              },
            ],
            grouping: "na",
          }),
        ),
      ),
      switchMap((res) =>
        orderOrderFills.pipe(
          map(({ fills }) => {
            const status = res.response.data.statuses[0];
            if (status && "resting" in status) {
              return fills.find(({ oid }) => oid === status.resting.oid);
            } else if (status && "filled" in status) {
              return fills.find(({ oid }) => oid === status.filled.oid);
            } else {
              throw new Error("Failed to find the confirmed OID in market order.");
            }
          }),
        ),
      ),
      first((fill) => !!fill),
    );
