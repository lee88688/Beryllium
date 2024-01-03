import { useEffect, useRef } from "react";

export default function useScreenWakeLock() {
  const wakeLockRef = useRef<WakeLockSentinel>();

  useEffect(() => {
    const requestWakeLock = async () => {
      wakeLockRef.current = await navigator.wakeLock?.request?.("screen");
    };

    const visibilitychange = () => {
      if (document.visibilityState === "visible") {
        void requestWakeLock();
      }
    };
    document.addEventListener("visibilitychange", visibilitychange);
    void requestWakeLock();

    return () => {
      document.removeEventListener("visibilitychange", visibilitychange);
      void wakeLockRef.current?.release?.();
    };
  }, []);
}
