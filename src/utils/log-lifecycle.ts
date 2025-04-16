import { tap, type MonoTypeOperatorFunction } from "rxjs";

/**
 * Generates a short, simple random alphanumeric ID.
 * Collision chance is very low for typical debugging scenarios.
 * @param length The desired length of the random part (default: 6)
 */
function generateSimpleRandomId(length = 6): string {
  return Math.random()
    .toString(36)
    .substring(2, 2 + length);
}

/**
 * Returns a tap operator that logs the lifecycle of an Observable subscription,
 * using a unique random ID generated for each specific subscription instance.
 * @param observableName A descriptive name for the observable source.
 */
function logLifecycle<T>(observableName: string): MonoTypeOperatorFunction<T> {
  // Generate the unique ID *once* when logLifecycle is called for this spot in the pipe.
  // This ID will be unique to this specific subscription instance.
  const instanceId = generateSimpleRandomId(8); // e.g., 'a3f8kdeux', 'k9m3p1z0'

  return tap<T>({
    // --- Callbacks using the SAME instanceId ---
    subscribe: () => {
      // Logged when the actual subscription occurs
      console.log(`[${observableName}-${instanceId}]::Subscribed`);
    },
    error: (err) => {
      console.error(`[${observableName}-${instanceId}]::Errored`, err);
    },
    complete: () => {
      console.log(`[${observableName}-${instanceId}]::Completed`);
    },
    finalize: () => {
      // Logged when subscription ends (complete, error, or unsubscribe)
      console.log(`[${observableName}-${instanceId}]::Finalized`);
    },
  });
}
