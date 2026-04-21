const {
  fail,
  hasAnyContactProfileInfo,
  isCloudFileID,
  nowIso,
  ok,
  sanitizeId,
} = require("../runtime");

function toProfilePayload(profile, avatarAsset, paymentQrAsset) {
  const avatarUrl =
    avatarAsset?._tempFileURL ||
    avatarAsset?.fileID ||
    avatarAsset?.originalUrl ||
    profile.avatarUrl ||
    "";
  const paymentQrUrl =
    paymentQrAsset?._tempFileURL ||
    paymentQrAsset?.fileID ||
    paymentQrAsset?.originalUrl ||
    "";

  return {
    openid: profile.openid || profile._openid || profile.userId || profile._id,
    displayName: profile.displayName || profile.name || "",
    avatarUrl,
    wechatId: profile.wechatId || "",
    contactNote: profile.contactNote || "",
    avatarAssetId: profile.avatarAssetId,
    paymentQrAssetId: profile.paymentQrAssetId,
    paymentQrUrl,
    hasContactProfile: hasAnyContactProfileInfo({
      wechatId: profile.wechatId,
      paymentQrAssetId: profile.paymentQrAssetId,
      paymentQrUrl,
    }),
  };
}

function pickStringField(input, key, fallback = "") {
  if (Object.prototype.hasOwnProperty.call(input || {}, key)) {
    return String(input?.[key] || "").trim();
  }

  return String(fallback || "").trim();
}

function createProfileService({
  collections,
  db,
  getAssetFileID,
  getOne,
  getTempFileURLMap,
  withTempFileURL,
}) {
  async function getProfileByOpenid(openid) {
    return (
      (await getOne(collections.profiles, {
        openid,
      })) ||
      (await getOne(collections.profiles, {
        _id: openid,
      }))
    );
  }

  async function getMyProfile(openid) {
    const profile = await getProfileByOpenid(openid);

    if (!profile) {
      return ok({
        profile: toProfilePayload({
          openid,
          displayName: "",
          avatarUrl: "",
          verifiedLevel: "wechat",
          joinedAt: nowIso(),
        }),
      });
    }

    const avatarAsset = profile.avatarAssetId
      ? await getOne(collections.assets, {
          assetId: profile.avatarAssetId,
        })
      : undefined;
    const paymentQrAsset = profile.paymentQrAssetId
      ? await getOne(collections.assets, {
          assetId: profile.paymentQrAssetId,
        })
      : undefined;
    const tempFileURLMap = await getTempFileURLMap([
      getAssetFileID(avatarAsset),
      getAssetFileID(paymentQrAsset),
    ]);

    return ok({
      profile: toProfilePayload(
        profile,
        avatarAsset ? withTempFileURL(avatarAsset, tempFileURLMap) : undefined,
        paymentQrAsset ? withTempFileURL(paymentQrAsset, tempFileURLMap) : undefined,
      ),
    });
  }

  async function updateMyProfile(openid, input) {
    const existing = await getProfileByOpenid(openid);
    const timestamp = nowIso();
    const displayName = pickStringField(
      input,
      "displayName",
      existing?.displayName || existing?.name,
    );
    const avatarUrl = pickStringField(input, "avatarUrl", existing?.avatarUrl);
    const avatarFileID = String(input?.avatarFileID || "").trim();
    const wechatId = pickStringField(input, "wechatId", existing?.wechatId);
    const contactNote = pickStringField(input, "contactNote", existing?.contactNote);
    const paymentQrFileID = String(input?.paymentQrFileID || "").trim();
    let avatarAssetId = existing?.avatarAssetId;
    let paymentQrAssetId = existing?.paymentQrAssetId;

    if (avatarFileID) {
      if (!isCloudFileID(avatarFileID)) {
        return fail("INVALID_PROFILE_ASSET_FILE_ID");
      }

      avatarAssetId = `profile_${sanitizeId(openid)}_avatar`;
      await db.collection(collections.assets).doc(avatarAssetId).set({
        data: {
          assetId: avatarAssetId,
          fileID: avatarFileID,
          kind: "avatar",
          visibility: "public",
          uploadedByOpenid: openid,
          createdAt: existing?.createdAt || timestamp,
          updatedAt: timestamp,
        },
      });
    }

    if (paymentQrFileID) {
      if (!isCloudFileID(paymentQrFileID)) {
        return fail("INVALID_PROFILE_ASSET_FILE_ID");
      }

      paymentQrAssetId = `profile_${sanitizeId(openid)}_payment_qr`;
      await db.collection(collections.assets).doc(paymentQrAssetId).set({
        data: {
          assetId: paymentQrAssetId,
          fileID: paymentQrFileID,
          kind: "payment_qr",
          visibility: "private",
          uploadedByOpenid: openid,
          createdAt: existing?.createdAt || timestamp,
          updatedAt: timestamp,
        },
      });
    }

    const profile = {
      openid,
      displayName,
      name: displayName || existing?.name || "当前用户",
      avatarUrl,
      avatarAssetId,
      verifiedLevel: existing?.verifiedLevel || "wechat",
      joinedAt: existing?.joinedAt || existing?.createdAt || timestamp,
      createdAt: existing?.createdAt || timestamp,
      updatedAt: timestamp,
      wechatId,
      contactNote,
      paymentQrAssetId,
      stats: existing?.stats || {
        publishedCaseCount: 0,
        verifiedReceiptCount: 0,
      },
    };

    await db.collection(collections.profiles).doc(openid).set({
      data: profile,
    });

    return getMyProfile(openid);
  }

  return {
    getMyProfile,
    getProfileByOpenid,
    updateMyProfile,
  };
}

module.exports = {
  createProfileService,
  pickStringField,
  toProfilePayload,
};
