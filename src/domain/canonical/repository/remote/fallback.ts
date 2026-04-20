import { isDomainErrorCode } from "../domainErrorCodes";

type FallbackOptions = {
  canUseCloudBase: boolean;
  log?: (...args: unknown[]) => void;
};

export function getRemoteErrorCode(error: unknown) {
  return error instanceof Error ? error.message : "";
}

export function shouldFallbackToLocal(error: unknown) {
  return !isDomainErrorCode(getRemoteErrorCode(error));
}

export async function withRemoteFallback<T>(
  remote: () => Promise<T>,
  fallback: () => T,
  options: FallbackOptions,
): Promise<T> {
  if (!options.canUseCloudBase) {
    return fallback();
  }

  try {
    return await remote();
  } catch (error) {
    if (!shouldFallbackToLocal(error)) {
      throw error;
    }

    options.log?.("[remoteRepository] Falling back to local repository", error);
    return fallback();
  }
}

export async function writeRemoteOrFallback(
  remote: () => Promise<void>,
  options: FallbackOptions,
): Promise<boolean> {
  if (!options.canUseCloudBase) {
    return false;
  }

  try {
    await remote();
    return true;
  } catch (error) {
    if (!shouldFallbackToLocal(error)) {
      throw error;
    }

    options.log?.("[remoteRepository] Falling back to local write overlay", error);
    return false;
  }
}
