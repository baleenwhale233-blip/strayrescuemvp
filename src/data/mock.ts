/**
 * @deprecated
 * Legacy compatibility surface. Page components should read from
 * `src/domain/canonical/repository/localRepository.ts` instead of importing mock data directly.
 */

export type {
  LegacyRescueProjectDetail as RescueProjectDetail,
  LegacyRescueProofCard as RescueProofCard,
  LegacyRescueTimelineEntry as RescueTimelineEntry,
  LegacyRescueTimelineTone as RescueTimelineTone,
  LegacyStatusTone as StatusTone,
} from "../domain/canonical/fixtures/legacyRescueProjectDetails";

export {
  legacyRescueProjectDetails as rescueProjectDetails,
} from "../domain/canonical/fixtures/legacyRescueProjectDetails";
