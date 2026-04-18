import type { SupportSheetData } from "./types";

type ContactProfileLike = {
  wechatId?: string | null;
  paymentQrAssetId?: string | null;
  paymentQrUrl?: string | null;
  qrImagePath?: string | null;
};

function hasText(value?: string | null) {
  return typeof value === "string" && value.trim().length > 0;
}

export function hasAnyContactProfileInfo(input?: ContactProfileLike) {
  return Boolean(
    hasText(input?.wechatId) ||
      hasText(input?.paymentQrAssetId) ||
      hasText(input?.paymentQrUrl) ||
      hasText(input?.qrImagePath),
  );
}

export function buildSupportSheetCopy(input: {
  wechatId?: string;
  paymentQrUrl?: string;
}): Pick<
  SupportSheetData,
  "contactHint" | "directHint" | "contactTip" | "directTip"
> {
  const hasWechatId = hasText(input.wechatId);
  const hasPaymentQr = hasText(input.paymentQrUrl);

  if (hasWechatId && hasPaymentQr) {
    return {
      contactHint: "复制微信号或保存二维码后，打开微信添加救助人",
      directHint: "长按图片保存到相册，打开微信/支付宝扫码转账",
      contactTip: "添加救助人后，可通过微信直接沟通救助细节。",
      directTip: "支持完成后，请回到页面点击“我已支持”以登记支持记录。",
    };
  }

  if (hasWechatId) {
    return {
      contactHint: "复制微信号后，打开微信添加救助人",
      directHint: "当前未提供收款码，请先通过微信联系救助人确认支持方式。",
      contactTip: "添加救助人后，可通过微信直接沟通救助细节。",
      directTip: "沟通后若已支持，请回到页面点击“我已支持”登记支持记录。",
    };
  }

  if (hasPaymentQr) {
    return {
      contactHint: "当前未提供微信号，可先保存二维码后用微信扫一扫联系救助人",
      directHint: "长按图片保存到相册，打开微信/支付宝扫码转账",
      contactTip: "若需了解更多细节，可先通过扫码后的会话与救助人联系。",
      directTip: "支持完成后，请回到页面点击“我已支持”以登记支持记录。",
    };
  }

  return {
    contactHint: "当前暂未提供联系方式，请稍后再试",
    directHint: "当前暂未提供收款方式，请先联系救助人",
    contactTip: "如页面稍后刷新出联系方式，可再回来继续支持。",
    directTip: "联系上救助人并完成支持后，再回来登记支持记录。",
  };
}
