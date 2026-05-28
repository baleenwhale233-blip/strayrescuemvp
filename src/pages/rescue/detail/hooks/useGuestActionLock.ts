import { useRef } from "react";

export function useGuestActionLock() {
  const guestActionLockRef = useRef(false);

  const runGuestActionWithLock = (action: () => void | Promise<unknown>) => {
    if (guestActionLockRef.current) {
      return;
    }

    guestActionLockRef.current = true;

    void Promise.resolve(action()).finally(() => {
      setTimeout(() => {
        guestActionLockRef.current = false;
      }, 300);
    });
  };

  return { runGuestActionWithLock };
}
