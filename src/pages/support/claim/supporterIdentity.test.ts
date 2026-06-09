import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeSupporterNameForSubmit, resolveDefaultSupporterName } from "./supporterIdentity";

test("support claim defaults to saved display name instead of contact wechat id", () => {
  const profile = {
    displayName: "Curjisk",
    openid: "openid_abcdef",
    wechatId: "wechat_supporter",
  };

  assert.equal(
    resolveDefaultSupporterName({
      localNickname: "本地昵称",
      profile,
    }),
    "Curjisk",
  );
});

test("support claim falls back through display name, local nickname, and openid suffix", () => {
  assert.equal(
    resolveDefaultSupporterName({
      localNickname: "本地昵称",
      profile: {
        displayName: "微信昵称",
        openid: "openid_abcdef",
      },
    }),
    "微信昵称",
  );

  assert.equal(
    resolveDefaultSupporterName({
      localNickname: "本地昵称",
      profile: {
        displayName: "",
        openid: "openid_abcdef",
      },
    }),
    "本地昵称",
  );

  assert.equal(
    resolveDefaultSupporterName({
      profile: {
        displayName: "",
        openid: "openid_abcdef",
      },
    }),
    "微信用户abcdef",
  );
});

test("support claim ignores legacy placeholder copy from local or remote profile", () => {
  assert.equal(
    resolveDefaultSupporterName({
      localNickname: "默认写入微信ID",
      profile: {
        displayName: "默认写入微信ID",
        openid: "openid_abcdef",
      },
    }),
    "微信用户abcdef",
  );
});

test("support claim never submits placeholder copy as supporter name", () => {
  assert.equal(normalizeSupporterNameForSubmit("  小鱼  "), "小鱼");
  assert.equal(normalizeSupporterNameForSubmit("默认写入微信ID"), undefined);
  assert.equal(normalizeSupporterNameForSubmit("   "), undefined);
});
