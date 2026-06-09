import assert from "node:assert/strict";
import test from "node:test";
import { getSharePath } from "./detailSharePath";
import { isOwnerEditableTimelineRecord } from "./ownerTimelineEditability";

test("owner timeline only marks expense records as editable", () => {
  assert.equal(isOwnerEditableTimelineRecord("expense"), true);
  assert.equal(isOwnerEditableTimelineRecord("progress_update"), false);
  assert.equal(isOwnerEditableTimelineRecord("support"), false);
});

test("share path leaves detail mode automatic so owners can land in owner view", () => {
  assert.equal(getSharePath(undefined, "case_001"), "/pages/rescue/detail/index?id=case_001");
});
