import { useEffect, useRef } from 'react';

/**
 * Calls onIdle after `timeoutMs` of no mouse/keyboard/touch/scroll activity.
 * Any activity resets the timer. Only runs while `enabled` is true, so it's
 * safe to mount this even when the user isn't logged in yet.
 */
export function useIdleTimer(onIdle: () => void, timeoutMs: number, enabled: boolean) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    function reset() {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(onIdle, timeoutMs);
    }

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, reset));
    reset(); // start the clock immediately on mount

    return () => {
      events.forEach(e => window.removeEventListener(e, reset));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, timeoutMs, onIdle]);
}