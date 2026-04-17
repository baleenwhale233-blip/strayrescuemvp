import Taro from "@tarojs/taro";

const RESCUER_CONTACT_PROFILE_KEY = "rescuer-contact-profile:v1";

export type RescuerContactProfile = {
  wechatId: string;
  qrImagePath: string;
  note: string;
};

function normalizeProfile(input?: Partial<RescuerContactProfile>) {
  return {
    wechatId: input?.wechatId || "",
    qrImagePath: input?.qrImagePath || "",
    note: input?.note || "",
  };
}

export function getRescuerContactProfile() {
  const stored = Taro.getStorageSync(RESCUER_CONTACT_PROFILE_KEY);
  if (!stored || typeof stored !== "object") {
    return normalizeProfile();
  }

  return normalizeProfile(stored as Partial<RescuerContactProfile>);
}

export function saveRescuerContactProfile(profile: RescuerContactProfile) {
  Taro.setStorageSync(RESCUER_CONTACT_PROFILE_KEY, normalizeProfile(profile));
}

export function hasCompleteRescuerContactProfile() {
  const profile = getRescuerContactProfile();
  return Boolean(profile.wechatId.trim() && profile.qrImagePath);
}
