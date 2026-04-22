const assert = require("node:assert/strict");
const test = require("node:test");

const { createProfileService } = require("./profile");

function createFakeDb() {
  const writes = [];

  return {
    writes,
    collection(name) {
      return {
        doc(id) {
          return {
            async set(payload) {
              writes.push({ name, id, payload });
            },
          };
        },
      };
    },
  };
}

test("profile service returns the same default profile payload for a new openid", async () => {
  const service = createProfileService({
    collections: {
      profiles: "user_profiles",
      assets: "evidence_assets",
    },
    db: createFakeDb(),
    getAssetFileID: () => undefined,
    getOne: async () => undefined,
    getTempFileURLMap: async () => new Map(),
    withTempFileURL: (doc) => doc,
  });

  assert.deepEqual(await service.getMyProfile("openid_1"), {
    ok: true,
    data: {
      profile: {
        openid: "openid_1",
        displayName: "",
        avatarUrl: "",
        wechatId: "",
        contactNote: "",
        avatarAssetId: undefined,
        paymentQrAssetId: undefined,
        paymentQrUrl: "",
        hasContactProfile: false,
      },
    },
  });
});

test("profile service rejects non-cloud profile asset file IDs without writing", async () => {
  const db = createFakeDb();
  const service = createProfileService({
    collections: {
      profiles: "user_profiles",
      assets: "evidence_assets",
    },
    db,
    getAssetFileID: () => undefined,
    getOne: async () => undefined,
    getTempFileURLMap: async () => new Map(),
    withTempFileURL: (doc) => doc,
  });

  assert.deepEqual(
    await service.updateMyProfile("openid_1", {
      avatarFileID: "/tmp/avatar.png",
    }),
    {
      ok: false,
      error: "INVALID_PROFILE_ASSET_FILE_ID",
      message: undefined,
    },
  );
  assert.deepEqual(db.writes, []);
});

test("profile service writes avatar and profile data for valid cloud file IDs", async () => {
  const db = createFakeDb();
  const getOneCalls = [];
  const service = createProfileService({
    collections: {
      profiles: "user_profiles",
      assets: "evidence_assets",
    },
    db,
    getAssetFileID: (doc) => doc?.fileID,
    getOne: async (name, where) => {
      getOneCalls.push({ name, where });
      const written = db.writes.find((item) => item.name === name);
      if (written && name === "user_profiles" && written.payload.data.openid === where.openid) {
        return written.payload.data;
      }
      if (name === "evidence_assets" && where.assetId === "profile_openid_1_avatar") {
        return {
          assetId: "profile_openid_1_avatar",
          fileID: "cloud://env/avatar.png",
        };
      }
      return undefined;
    },
    getTempFileURLMap: async () =>
      new Map([["cloud://env/avatar.png", "https://temp/avatar.png"]]),
    withTempFileURL: (doc, map) => ({
      ...doc,
      _fileID: doc.fileID,
      _tempFileURL: map.get(doc.fileID),
    }),
  });

  const result = await service.updateMyProfile("openid_1", {
    displayName: "阿青",
    avatarFileID: "cloud://env/avatar.png",
    wechatId: "aqing_rescue",
  });

  assert.equal(result.ok, true);
  assert.equal(result.data.profile.displayName, "阿青");
  assert.equal(result.data.profile.avatarUrl, "https://temp/avatar.png");
  assert.equal(result.data.profile.hasContactProfile, true);
  assert.deepEqual(db.writes.map((item) => [item.name, item.id]), [
    ["evidence_assets", "profile_openid_1_avatar"],
    ["user_profiles", "openid_1"],
  ]);
  assert.deepEqual(getOneCalls.slice(-1), [
    {
      name: "evidence_assets",
      where: { assetId: "profile_openid_1_avatar" },
    },
  ]);
});
