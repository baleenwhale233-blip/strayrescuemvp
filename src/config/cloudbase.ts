export type BackendMode = "cloudbase" | "local";

export const cloudbaseConfig = {
  envId: "cloud1-9gl5sric0e5b386b",
  functionName: "rescueApi",
  backendMode: "cloudbase" as BackendMode,
};

export function shouldUseCloudBase() {
  return cloudbaseConfig.backendMode === "cloudbase" && Boolean(cloudbaseConfig.envId);
}
