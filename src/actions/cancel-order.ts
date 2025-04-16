import type { WalletClient, WebSocketTransport } from "@nktkas/hyperliquid";
import { from, retry } from "rxjs";

export const createCancelOrder =
  (socketWalletClient: WalletClient<WebSocketTransport>) =>
  ({ assetId, oid }: { assetId: number; oid: number }) =>
    from(
      socketWalletClient.cancel({
        cancels: [{ a: assetId, o: oid }],
      }),
    ).pipe(retry({ count: 5, delay: 1000, resetOnSuccess: true }));
