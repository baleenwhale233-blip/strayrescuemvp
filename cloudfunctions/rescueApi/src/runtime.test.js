const assert = require("node:assert/strict");
const test = require("node:test");

const {
  createRuntime,
  fail,
  getAssetFileID,
  hasAnyContactProfileInfo,
  hasOnlyCloudFileIDs,
  isCloudFileID,
  ok,
  sanitizeId,
} = require("./runtime");

test("runtime helpers preserve rescueApi envelope and validation behavior", () => {
  assert.deepEqual(ok({ value: 1 }), { ok: true, data: { value: 1 } });
  assert.deepEqual(fail("BAD_INPUT", "Nope"), {
    ok: false,
    error: "BAD_INPUT",
    message: "Nope",
  });
  assert.equal(sanitizeId("case:/ 001"), "case___001");
  assert.equal(isCloudFileID("cloud://env/path.png"), true);
  assert.equal(isCloudFileID("https://example.com/path.png"), false);
  assert.equal(hasOnlyCloudFileIDs(["cloud://a", "cloud://b"]), true);
  assert.equal(hasOnlyCloudFileIDs(["cloud://a", "/tmp/local.png"]), false);
  assert.equal(hasAnyContactProfileInfo({ wechatId: "wxid" }), true);
  assert.equal(hasAnyContactProfileInfo({ paymentQrUrl: "cloud://qr" }), true);
  assert.equal(hasAnyContactProfileInfo({}), false);
  assert.equal(
    getAssetFileID({
      originalUrl: "https://example.com/a.png",
      fileID: "cloud://env/file.png",
    }),
    "cloud://env/file.png",
  );
});

test("createRuntime preserves collection query and temp file URL behavior", async () => {
  const getCalls = [];
  const fakeDb = {
    collection(name) {
      return {
        where(where) {
          return {
            limit(limit) {
              return {
                async get() {
                  getCalls.push({ name, where, limit });
                  return { data: [{ id: "doc_1" }] };
                },
              };
            },
          };
        },
      };
    },
  };
  const fakeCloud = {
    getWXContext() {
      return { OPENID: "openid_1" };
    },
    async getTempFileURL({ fileList }) {
      return {
        fileList: fileList.map((fileID) => ({
          fileID,
          tempFileURL: `${fileID}?temp=1`,
        })),
      };
    },
  };
  const runtime = createRuntime({ cloud: fakeCloud, db: fakeDb });

  assert.equal(runtime.getOpenid({ openid: "fallback" }), "openid_1");
  assert.deepEqual(await runtime.queryCollection("cases", { caseId: "case_1" }, 3), [
    { id: "doc_1" },
  ]);
  assert.deepEqual(getCalls, [
    { name: "cases", where: { caseId: "case_1" }, limit: 3 },
  ]);
  assert.deepEqual(await runtime.getOne("cases", { caseId: "case_1" }), {
    id: "doc_1",
  });
  assert.deepEqual(
    await runtime.getTempFileURLMap(["cloud://env/a.png", "cloud://env/a.png", "/tmp/b.png"]),
    new Map([["cloud://env/a.png", "cloud://env/a.png?temp=1"]]),
  );
  assert.deepEqual(
    runtime.withTempFileURL(
      { fileID: "cloud://env/a.png" },
      new Map([["cloud://env/a.png", "https://temp/a.png"]]),
    ),
    {
      fileID: "cloud://env/a.png",
      _fileID: "cloud://env/a.png",
      _tempFileURL: "https://temp/a.png",
    },
  );
});
