import { tap, type MonoTypeOperatorFunction } from "rxjs";
import { logger } from "simple-logger";

// Shared state: A record to store active subscription counts per observable name.
const activeSubscriptionCounts: Record<string, number> = {};

/**
 * Returns a tap operator that logs the lifecycle of an Observable subscription,
 * maintaining and displaying the count of currently active subscriptions for that name.
 * @param observableName A descriptive name for the observable source.
 */
export function logLifecycle<T>(observableName: string): MonoTypeOperatorFunction<T> {
  const log = logger({
    namespace: "HL-RxJS",
    logLevel: (process.env.LOG_LEVEL as any) ?? "INFO",
    showTimestamp: process.env.DEV === "true",
  });
  return tap<T>({
    subscribe: () => {
      // Increment count for this observableName *before* logging
      activeSubscriptionCounts[observableName] =
        (activeSubscriptionCounts[observableName] || 0) + 1;
      const currentCount = activeSubscriptionCounts[observableName];
      // Log the count *after* incrementing
      log.debug(`::${observableName}-${currentCount}:: Subscribed`);
    },
    error: (err) => {
      // Log the error. The count at this moment might be useful context.
      // The actual decrement happens in finalize.
      const currentCount = activeSubscriptionCounts[observableName] || 0;
      log.error(`::${observableName}-${currentCount}:: Errored: `, err);
    },
    complete: () => {
      // Log completion. The count at this moment might be useful context.
      // The actual decrement happens in finalize.
      const currentCount = activeSubscriptionCounts[observableName] || 0;
      log.debug(`::${observableName}-${currentCount}:: Completed`);
    },
    finalize: () => {
      // Finalize runs *after* error or complete, or on unsubscribe.
      // Log the count *before* decrementing to show the count when it ended.
      const countBeforeDecrement = activeSubscriptionCounts[observableName] || 0;
      log.debug(`::${observableName}-${countBeforeDecrement}:: Finalized`);

      // Decrement the count safely (ensuring it doesn't go below 0)
      activeSubscriptionCounts[observableName] = Math.max(
        0,
        (activeSubscriptionCounts[observableName] || 0) - 1,
      );

      if (activeSubscriptionCounts[observableName] === 0) {
        delete activeSubscriptionCounts[observableName];
      }
    },
  });
}
