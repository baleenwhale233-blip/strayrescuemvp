import type { PublicDetailVM } from "../../../domain/canonical/types";

export function getSharePath(detail?: PublicDetailVM, caseId?: string) {
  const targetCaseId = detail?.caseId || caseId || "";
  return `/pages/rescue/detail/index?id=${targetCaseId}`;
}
