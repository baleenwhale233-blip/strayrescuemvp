import type { MyProfileVM } from "../../../domain/canonical/repository";

const ANONYMOUS_OPENID = "anonymous";
const LEGACY_DEFAULT_COPY = ["默认", "写入", "微信ID"].join("");

function cleanText(value?: string) {
  const nextValue = String(value || "").trim();
  return nextValue === LEGACY_DEFAULT_COPY ? "" : nextValue;
}

function getOpenidSupporterLabel(openid?: string) {
  const value = cleanText(openid);

  if (!value || value === ANONYMOUS_OPENID) {
    return "";
  }

  const suffix = value.slice(-6);
  return suffix ? `微信用户${suffix}` : "";
}

export function resolveDefaultSupporterName(input: {
  localNickname?: string;
  profile?: Pick<MyProfileVM, "displayName" | "openid">;
}) {
  return (
    cleanText(input.profile?.displayName) ||
    cleanText(input.localNickname) ||
    getOpenidSupporterLabel(input.profile?.openid)
  );
}

export function normalizeSupporterNameForSubmit(value: string) {
  return cleanText(value) || undefined;
}
