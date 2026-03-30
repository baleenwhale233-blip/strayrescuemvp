import {
  adaptLocalDraftToCanonical,
  adaptRescueProjectDetailMockToCanonical,
} from "../adapters/mockToCanonical";
import { legacySampleBundle, legacyRescueProjectDetails } from "../fixtures/legacyRescueProjectDetails";
import type { CanonicalCaseBundle } from "../types";
import { listSavedDrafts } from "./draftRepository";

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
