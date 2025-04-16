import {
  HttpTransport,
  PublicClient,
  type Candle,
  type CandleSnapshotParameters,
  type EventCandleParameters,
  type EventClient,
  type WebSocketTransport,
} from "@nktkas/hyperliquid";
import {
  BehaviorSubject,
  filter,
  map,
  Observable,
  pairwise,
  shareReplay,
  Subject,
  takeUntil,
} from "rxjs";
import { logLifecycle } from "../utils/log-lifecycle";

export const createCandles =
  (
    socketEventClient: EventClient<WebSocketTransport>,
    httpPublicClient: PublicClient<HttpTransport>,
  ) =>
  ({ coin, interval, startTime }: EventCandleParameters & CandleSnapshotParameters) => {
    // Internal state
    const _dispose = new Subject<void>();
    // Exported data
    const candleCurrent = new Observable<Candle>((subscriber) => {
      const client = socketEventClient.candle({ coin, interval }, (data) => subscriber.next(data));
    }).pipe(logLifecycle("candleCurrent"), shareReplay({ bufferSize: 1, refCount: true }));
    const candleSnapshot = new BehaviorSubject<Candle[]>([]);
    const candleClosed = candleCurrent.pipe(
      logLifecycle("candleClosed"),
      pairwise(),
      filter(([prev, curr]) => prev.T !== curr.T),
      map(([prev]) => prev),
      shareReplay({ bufferSize: 1, refCount: true }),
    );

    // Load initial dataset
    httpPublicClient
      .candleSnapshot({ coin, interval, startTime })
      .then((arr) => candleSnapshot.next(arr));
    // Monitor incoming candles and keep snapshot up to date
    candleCurrent
      .pipe(
        map((candle) => ({
          candle,
          snapshot: candleSnapshot.getValue(),
          snapshotLastItem: candleSnapshot.getValue().at(-1),
        })),
        filter(
          (
            o,
          ): o is {
            candle: Candle;
            snapshot: Candle[];
            snapshotLastItem: Candle;
          } => !!o.snapshot.length && !!o.snapshotLastItem,
        ),
        takeUntil(_dispose),
      )
      .subscribe(({ candle, snapshot, snapshotLastItem }) => {
        const len = snapshot.length;
        if (snapshotLastItem.T === candle.T) {
          // Candle has not yet closed
          candleSnapshot.next([...snapshot.slice(0, -1), candle]);
        } else {
          // Candle has closed
          candleSnapshot.next([...snapshot, candle].slice(-len));
        }
      });

    return {
      candleCurrent$: candleCurrent,
      candleSnapshot$: candleSnapshot.pipe(logLifecycle("candleSnapshot")),
      candleClosed$: candleClosed,
      // Cleanup
      dispose: () => _dispose.next(),
    };
  };
