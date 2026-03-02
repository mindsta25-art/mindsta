import { useEffect, useRef, useState, useCallback } from "react";

interface UseIdleTimerOptions {
  /** Minutes of inactivity before showing warning (default: 10) */
  idleMinutes?: number;
  /** Minutes from warning to auto-logout (default: 2) */
  warningMinutes?: number;
  /** Called when session should be ended */
  onLogout: () => void;
  /** Whether the timer should be active (e.g. only when logged in) */
  enabled?: boolean;
}

export function useIdleTimer({
  idleMinutes = 10,
  warningMinutes = 2,
  onLogout,
  enabled = true,
}: UseIdleTimerOptions) {
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(warningMinutes * 60);

  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAllTimers = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
  }, []);

  const startCountdown = useCallback(() => {
    const totalSeconds = warningMinutes * 60;
    setCountdown(totalSeconds);

    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    warningTimerRef.current = setTimeout(() => {
      onLogout();
    }, totalSeconds * 1000);
  }, [warningMinutes, onLogout]);

  const resetTimer = useCallback(() => {
    if (!enabled) return;
    clearAllTimers();
    setShowWarning(false);

    idleTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      startCountdown();
    }, idleMinutes * 60 * 1000);
  }, [enabled, idleMinutes, clearAllTimers, startCountdown]);

  const continueSession = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    if (!enabled) {
      clearAllTimers();
      setShowWarning(false);
      return;
    }

    const events = ["mousemove", "keydown", "mousedown", "touchstart", "scroll", "click"];

    const handleActivity = () => resetTimer();

    events.forEach((event) => window.addEventListener(event, handleActivity, { passive: true }));

    resetTimer();

    return () => {
      events.forEach((event) => window.removeEventListener(event, handleActivity));
      clearAllTimers();
    };
  }, [enabled, resetTimer, clearAllTimers]);

  return { showWarning, countdown, continueSession };
}
