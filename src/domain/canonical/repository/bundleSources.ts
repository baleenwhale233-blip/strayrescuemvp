import {
  adaptLocalDraftToCanonical,
  adaptRescueProjectDetailMockToCanonical,
} from "../adapters/mockToCanonical";
import { legacySampleBundle, legacyRescueProjectDetails } from "../fixtures/legacyRescueProjectDetails";
import type { CanonicalCaseBundle } from "../types";
import { getSavedDrafts } from "./localDraftPersistence";

export function getSeedBundles(): CanonicalCaseBundle[] {
  const legacyBundles = legacyRescueProjectDetails.map((detail, index) =>
    adaptRescueProjectDetailMockToCanonical(detail, index),
  );

  return [legacySampleBundle, ...legacyBundles];
}

export function getLocalBundles(): CanonicalCaseBundle[] {
  return getSavedDrafts().map((draft, index) =>
    adaptLocalDraftToCanonical(draft, index),
  );
}
