import {
  adaptLocalDraftToCanonical,
  adaptRescueProjectDetailMockToCanonical,
} from "../adapters/mockToCanonical.ts";
import { legacySampleBundle, legacyRescueProjectDetails } from "../fixtures/legacyRescueProjectDetails.ts";
import type { CanonicalCaseBundle } from "../types.ts";
import { listSavedDrafts } from "./draftRepository.ts";

export function getSeedBundles(): CanonicalCaseBundle[] {
  const legacyBundles = legacyRescueProjectDetails.map((detail, index) =>
    adaptRescueProjectDetailMockToCanonical(detail, index),
  );

  return [legacySampleBundle, ...legacyBundles];
}

export function getLocalBundles(): CanonicalCaseBundle[] {
  return listSavedDrafts().map((draft, index) =>
    adaptLocalDraftToCanonical(draft, index),
  );
}

export { legacyRescueProjectDetails };
