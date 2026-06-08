import assert from "node:assert/strict";
import test from "node:test";
import { isOwnerEditableTimelineRecord } from "./ownerTimelineEditability";

test("owner timeline only marks expense records as editable", () => {
  assert.equal(isOwnerEditableTimelineRecord("expense"), true);
  assert.equal(isOwnerEditableTimelineRecord("progress_update"), false);
  assert.equal(isOwnerEditableTimelineRecord("support"), false);
});
