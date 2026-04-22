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
      contactHint: "复制微信号或保存二维码后，可在微信里联系记录维护者",
      directHint: "长按图片保存到相册，打开微信扫一扫查看联系信息",
      contactTip: "联系上记录维护者后，可继续沟通这条记录的情况。",
      directTip: "如已完成线下转账或其他方式记录，可回到页面登记一笔。",
    };
  }

  if (hasWechatId) {
    return {
      contactHint: "复制微信号后，可在微信里联系记录维护者",
      directHint: "当前未提供二维码，可先通过微信联系记录维护者确认方式。",
      contactTip: "联系上记录维护者后，可继续沟通这条记录的情况。",
      directTip: "沟通完成后，如已有线下转账或其他记录，可回到页面登记一笔。",
    };
  }

  if (hasPaymentQr) {
    return {
      contactHint: "当前未提供微信号，可先保存二维码后用微信扫一扫查看联系信息",
      directHint: "长按图片保存到相册，打开微信扫一扫查看联系信息",
      contactTip: "若需了解更多细节，可先扫码联系记录维护者。",
      directTip: "如已完成线下转账或其他方式记录，可回到页面登记一笔。",
    };
  }

  return {
    contactHint: "当前暂未提供联系信息，请稍后再试",
    directHint: "当前暂未提供二维码，可稍后再看",
    contactTip: "如果页面稍后刷新出联系信息，可再回来查看。",
    directTip: "完成记录后，可再回来登记一笔。",
  };
}
