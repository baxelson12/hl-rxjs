import { tap, type MonoTypeOperatorFunction } from "rxjs";

let simpleIdCounter = 0;

function generateSequentialId(prefix = "ID"): string {
  simpleIdCounter++;
  return `${prefix}-${simpleIdCounter}`;
}

/**
 * Returns a tap operator that logs the lifecycle of an Observable subscription.
 * @param observableName A descriptive name for the observable source.
 */
export function logLifecycle<T>(observableName: string): MonoTypeOperatorFunction<T> {
  const subId = generateSequentialId(observableName);

  // tap<T> correctly infers the type T from the source observable
  // when used inside pipe(). Explicitly returning MonoTypeOperatorFunction<T>
  // ensures the function signature is correct for TypeScript inference.
  return tap<T>({
    // You can explicitly type tap<T>(...) for clarity if needed
    subscribe: () => console.log(`[Sub START ${subId}] // ${observableName}`),
    // Optional: Log next value if needed (be careful with large objects)
    // next: (value) => console.log(`[Sub NEXT ${subId}] Value:`, value),
    error: (err) => console.error(`[Sub ERROR ${subId}] // ${observableName}`, err),
    complete: () => console.log(`[Sub COMPLETE ${subId}] // ${observableName}`),
    // Finalize is called for complete, error, OR unsubscribe
    finalize: () => console.log(`[Sub FINALIZE ${subId}] // ${observableName}`),
  });
}
