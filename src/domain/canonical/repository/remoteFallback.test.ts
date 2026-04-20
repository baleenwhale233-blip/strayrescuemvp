import assert from "node:assert/strict";
import test from "node:test";

import {
  getRemoteErrorCode,
  shouldFallbackToLocal,
  withRemoteFallback,
  writeRemoteOrFallback,
} from "./remote/fallback";

test("remote fallback extracts error codes from thrown Errors", () => {
  assert.equal(getRemoteErrorCode(new Error("FORBIDDEN")), "FORBIDDEN");
  assert.equal(getRemoteErrorCode("FORBIDDEN"), "");
});

test("remote fallback does not swallow domain errors", async () => {
  await assert.rejects(
    withRemoteFallback(
      async () => {
        throw new Error("EXPENSE_EVIDENCE_REQUIRED");
      },
      () => "fallback",
      { canUseCloudBase: true },
    ),
    /EXPENSE_EVIDENCE_REQUIRED/,
  );
  assert.equal(shouldFallbackToLocal(new Error("EXPENSE_EVIDENCE_REQUIRED")), false);
});

test("remote fallback returns fallback value for infrastructure-style errors", async () => {
  const value = await withRemoteFallback(
    async () => {
      throw new Error("CLOUDBASE_EMPTY_RESPONSE");
    },
    () => "fallback",
    {
      canUseCloudBase: true,
      log: () => undefined,
    },
  );

  assert.equal(value, "fallback");
  assert.equal(shouldFallbackToLocal(new Error("CLOUDBASE_EMPTY_RESPONSE")), true);
});

test("remote write fallback returns false only for fallback-worthy failures", async () => {
  assert.equal(
    await writeRemoteOrFallback(
      async () => undefined,
      {
        canUseCloudBase: true,
      },
    ),
    true,
  );
  assert.equal(
    await writeRemoteOrFallback(
      async () => {
        throw new Error("CLOUDBASE_NOT_CONFIGURED");
      },
      {
        canUseCloudBase: true,
        log: () => undefined,
      },
    ),
    false,
  );
  await assert.rejects(
    writeRemoteOrFallback(
      async () => {
        throw new Error("FORBIDDEN");
      },
      {
        canUseCloudBase: true,
      },
    ),
    /FORBIDDEN/,
  );
});
