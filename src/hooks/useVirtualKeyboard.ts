import { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { overlaysContentCountAtom } from "y/store/virtualKeyboard";

export default function useVirtualKeyboard() {
  const [boundingRect, setBoundingRect] = useState<DOMRect | undefined>();
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const isSupported = "virtualKeyboard" in navigator;
  // this atom is used for multiple calls
  const [, setOverlaysContentCount] = useAtom(overlaysContentCountAtom);

  useEffect(() => {
    if (isSupported) {
      const fn: EventListenerOrEventListenerObject = (e) => {
        const rect = (e.target as VirtualKeyboard).boundingRect;
        setBoundingRect(rect);
        if (rect.width) {
          setIsKeyboardOpen(true);
        } else {
          setIsKeyboardOpen(false);
        }
      };
      navigator.virtualKeyboard.addEventListener("geometrychange", fn);
      if (!navigator.virtualKeyboard.overlaysContent) {
        navigator.virtualKeyboard.overlaysContent = true;
      }
      setOverlaysContentCount((c) => c + 1);

      return () => {
        navigator.virtualKeyboard.removeEventListener("geometrychange", fn);
        setOverlaysContentCount((c) => {
          if (c <= 0) return c;
          const next = c - 1;
          if (next <= 0 && navigator.virtualKeyboard.overlaysContent) {
            navigator.virtualKeyboard.overlaysContent = false;
          }
          return next;
        });
      };
    }
  }, [isSupported, setOverlaysContentCount]);

  return {
    isSupported,
    boundingRect,
    isKeyboardOpen,
  };
}
