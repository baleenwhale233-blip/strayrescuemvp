/**
 * @deprecated
 * Compatibility layer only. Use canonical selectors/repository instead:
 * - `getPublicDetailVMByCaseId`
 * - `getOwnerDetailVMByCaseId`
 * - `getSupportSheetDataByCaseId`
 */

export type {
  PublicDetailVM as RescueGuestDetail,
  PublicTimelineItemVM as RescueTimelineEntry,
  StatusTone,
} from "../domain/canonical/types";

export type {
  OwnerDetailVM as RescueOwnerDetail,
} from "../domain/canonical/repository/localRepository";

export {
  getPublicDetailVMByCaseId as getGuestRescueDetail,
  getOwnerDetailVMByCaseId as getOwnerRescueDetail,
} from "../domain/canonical/repository/localRepository";
