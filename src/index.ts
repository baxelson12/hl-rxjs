import {
  HttpTransport,
  PublicClient,
  WebSocketTransport,
  EventClient,
  WalletClient,
  type EventCandleParameters,
  type CandleSnapshotParameters,
} from "@nktkas/hyperliquid";
import { createCandles } from "./data/candles";
import { createAccount } from "./data/account";
import { createClearinghouse } from "./data/clearinghouse";
import { createOrder } from "./data/orders";
import type { PrivateKeyAccount } from "viem";
import { createMarketOpen } from "./actions/market-open";
import { createStoploss } from "./actions/create-stoploss";
import { createCancelOrder } from "./actions/cancel-order";
import { createAtr } from "./data/indicators/atr";
import { createEma } from "./data/indicators/ema";
import { createRsi } from "./data/indicators/rsi";
import { createVwap } from "./data/indicators/vwap";
import { createTakeprofit } from "./actions/create-takeprofit";

interface HyperliquidRxjsConfig {
  wallet: PrivateKeyAccount;
  coin: EventCandleParameters["coin"];
  interval: EventCandleParameters["interval"];
  startTime: CandleSnapshotParameters["startTime"];
}

export class HyperliquidRxjs {
  /** Low-level access to socket events */
  public socketEventClient: EventClient<WebSocketTransport>;
  /** Low-level access to socket wallet data */
  public socketWalletClient: WalletClient<WebSocketTransport>;
  /** Low-level access to http public data */
  public httpPublicClient: PublicClient<HttpTransport>;

  /** Candle data for the configured coin */
  public candleData;
  /** Account data pertaining to the configured account */
  public accountData;
  /** Clearinghouse data pertaining to the configured account */
  public clearinghouseData;
  /** Order data pertaining to the configured account */
  public orderData;
  /** Actions to be performed based on market data */
  public actions;
  /** Indicators based on candle data */
  public indicators;

  constructor({ wallet, coin, interval, startTime }: HyperliquidRxjsConfig) {
    // Initializze clients / transports
    const socketTransport = new WebSocketTransport();
    const httpTransport = new HttpTransport();

    this.socketEventClient = new EventClient({ transport: socketTransport });
    this.socketWalletClient = new WalletClient({
      wallet,
      transport: socketTransport,
    });
    this.httpPublicClient = new PublicClient({ transport: httpTransport });

    this.candleData = createCandles(
      this.socketEventClient,
      this.httpPublicClient,
    )({ coin, interval, startTime });
    this.accountData = createAccount(this.socketEventClient)({
      user: wallet.address,
    });
    this.clearinghouseData = createClearinghouse(this.accountData.accountData$);
    this.orderData = createOrder(this.socketEventClient)(
      this.accountData.accountData$,
      this.accountData.accountUser$,
    );

    this.actions = {
      createMarketOrder$: createMarketOpen(this.socketWalletClient)(
        this.orderData.orderMidPrice$,
        this.orderData.orderOrderFills$,
      ),
      createMarketStop$: createStoploss(this.socketWalletClient),
      cancelOrder$: createCancelOrder(this.socketWalletClient),
      createTakeprofit$: createTakeprofit(this.socketWalletClient),
    };

    this.indicators = {
      atr: createAtr(this.candleData.candleSnapshot$),
      ema: createEma(this.candleData.candleSnapshot$),
      rsi: createRsi(this.candleData.candleSnapshot$),
      vwap: createVwap(this.candleData.candleSnapshot$),
    };
  }
}
