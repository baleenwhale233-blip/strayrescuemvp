export function createSubmissionGuard() {
  let isRunning = false;

  return {
    get isRunning() {
      return isRunning;
    },
    async run<T>(task: () => Promise<T>): Promise<T | undefined> {
      if (isRunning) {
        return undefined;
      }

      isRunning = true;
      try {
        return await task();
      } finally {
        isRunning = false;
      }
    },
  };
}
