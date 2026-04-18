import assert from "node:assert/strict";
import test from "node:test";
import {
  buildSupportSheetCopy,
  hasAnyContactProfileInfo,
} from "../contactProfileSemantics";

test("contact completeness accepts wechat-only or qr-only profiles", () => {
  assert.equal(hasAnyContactProfileInfo({ wechatId: "rescue_wechat" }), true);
  assert.equal(
    hasAnyContactProfileInfo({ paymentQrAssetId: "asset_payment_qr_001" }),
    true,
  );
  assert.equal(
    hasAnyContactProfileInfo({
      paymentQrUrl: "https://example.com/assets/payment-qr.png",
    }),
    true,
  );
  assert.equal(hasAnyContactProfileInfo({}), false);
});

test("support sheet copy reflects when only one contact channel is available", () => {
  const wechatOnlyCopy = buildSupportSheetCopy({
    wechatId: "rescue_wechat",
    paymentQrUrl: "",
  });
  const qrOnlyCopy = buildSupportSheetCopy({
    wechatId: "",
    paymentQrUrl: "https://example.com/assets/payment-qr.png",
  });

  assert.match(wechatOnlyCopy.directHint, /未提供二维码/);
  assert.match(qrOnlyCopy.contactHint, /未提供微信号/);
});
