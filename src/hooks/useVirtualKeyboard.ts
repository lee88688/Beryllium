import { useEffect, useState } from "react";

export default function useVirtualKeyboard() {
  const [boundingRect, setBoundingRect] = useState<DOMRect | undefined>();
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const isSupported = "virtualKeyboard" in navigator;

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
      navigator.virtualKeyboard.overlaysContent = true;

      return () => {
        navigator.virtualKeyboard.removeEventListener("geometrychange", fn);
        navigator.virtualKeyboard.overlaysContent = false;
      };
    }
  }, [isSupported]);

  return {
    isSupported,
    boundingRect,
    isKeyboardOpen,
  };
}
