import assert from "node:assert/strict";
import test from "node:test";
import {
  getDomainErrorCodes,
  isDomainErrorCode,
} from "./domainErrorCodes";

test("expense evidence required is treated as a non-fallback domain error", () => {
  assert.equal(isDomainErrorCode("EXPENSE_EVIDENCE_REQUIRED"), true);
  assert.ok(getDomainErrorCodes().includes("EXPENSE_EVIDENCE_REQUIRED"));
});
