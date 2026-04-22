import Taro from "@tarojs/taro";
import { useEffect, useMemo, useState } from "react";

type KeyboardHeightChangeEvent = {
  height?: number;
};

type TaroKeyboardApi = typeof Taro & {
  onKeyboardHeightChange?: (callback: (event: KeyboardHeightChangeEvent) => void) => void;
  offKeyboardHeightChange?: (callback?: (event: KeyboardHeightChangeEvent) => void) => void;
  getWindowInfo?: () => {
    safeArea?: {
      bottom: number;
    };
    screenHeight?: number;
  };
};

function getSafeAreaInsetBottom() {
  const taroKeyboardApi = Taro as TaroKeyboardApi;

  try {
    const windowInfo = taroKeyboardApi.getWindowInfo?.();
    if (windowInfo?.safeArea && typeof windowInfo.screenHeight === "number") {
      return Math.max(windowInfo.screenHeight - windowInfo.safeArea.bottom, 0);
    }
  } catch {
    // Ignore window info lookup failures and fall back to zero.
  }

  return 0;
}

export function useKeyboardBottomInset() {
  const [keyboardBottomInset, setKeyboardBottomInset] = useState(0);
  const safeAreaInsetBottom = useMemo(() => getSafeAreaInsetBottom(), []);

  useEffect(() => {
    const taroKeyboardApi = Taro as TaroKeyboardApi;

    if (!taroKeyboardApi.onKeyboardHeightChange) {
      return;
    }

    const handleKeyboardHeightChange = (event: KeyboardHeightChangeEvent) => {
      const nextHeight =
        typeof event?.height === "number"
          ? Math.max(event.height - safeAreaInsetBottom, 0)
          : 0;

      setKeyboardBottomInset(nextHeight);
    };

    taroKeyboardApi.onKeyboardHeightChange(handleKeyboardHeightChange);

    return () => {
      try {
        taroKeyboardApi.offKeyboardHeightChange?.(handleKeyboardHeightChange);
      } catch {
        taroKeyboardApi.offKeyboardHeightChange?.();
      }
    };
  }, [safeAreaInsetBottom]);

  return keyboardBottomInset;
}
