declare global {
  interface VirtualKeyboard extends EventTarget {
    show: () => void;
    hide: () => void;
    boundingRect: DOMRect;
    overlaysContent: boolean;
  }

  interface Window {
    eruda: {
      init: () => void;
    };
  }

  interface Navigator {
    virtualKeyboard: VirtualKeyboard;
  }
}

export {};
