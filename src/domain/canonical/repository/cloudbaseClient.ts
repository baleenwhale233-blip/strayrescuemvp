import Taro from "@tarojs/taro";
import { cloudbaseConfig, shouldUseCloudBase } from "../../../config/cloudbase";

type RescueApiEnvelope<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: string;
      message?: string;
    };

let initializedEnvId: string | undefined;

export function initCloudBase() {
  if (!shouldUseCloudBase()) {
    return false;
  }

  if (!Taro.cloud) {
    return false;
  }

  if (initializedEnvId === cloudbaseConfig.envId) {
    return true;
  }

  Taro.cloud.init({
    env: cloudbaseConfig.envId,
    traceUser: true,
  });
  initializedEnvId = cloudbaseConfig.envId;

  return true;
}

export function canUseCloudBase() {
  return initCloudBase();
}

export async function callRescueApi<T>(
  action: string,
  input?: Record<string, unknown>,
): Promise<T> {
  if (!initCloudBase()) {
    throw new Error("CLOUDBASE_NOT_CONFIGURED");
  }

  const response = await Taro.cloud.callFunction({
    name: cloudbaseConfig.functionName,
    data: {
      action,
      input: input ?? {},
    },
  });
  const result = response.result as RescueApiEnvelope<T> | undefined;

  if (!result) {
    throw new Error("CLOUDBASE_EMPTY_RESPONSE");
  }

  if (!result.ok) {
    throw new Error(result.error || "CLOUDBASE_API_ERROR");
  }

  return result.data;
}

function getFileExtension(filePath: string) {
  const cleanPath = filePath.split("?")[0] ?? filePath;
  const matched = cleanPath.match(/\.([a-zA-Z0-9]+)$/);

  return matched?.[1] ? `.${matched[1].toLowerCase()}` : ".jpg";
}

export async function uploadSupportProofImage(caseId: string, filePath: string) {
  if (!initCloudBase()) {
    return {
      fileID: filePath,
      isLocalFallback: true,
    };
  }

  const extension = getFileExtension(filePath);
  const safeCaseId = caseId.replace(/[^a-zA-Z0-9_-]/g, "_");
  const cloudPath = `support-proofs/${safeCaseId}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}${extension}`;

  try {
    const result = await Taro.cloud.uploadFile({
      cloudPath,
      filePath,
    });

    return {
      fileID: result.fileID,
      isLocalFallback: false,
    };
  } catch (error) {
    console.warn("[cloudbaseClient] Falling back to local proof image", error);

    return {
      fileID: filePath,
      isLocalFallback: true,
    };
  }
}
