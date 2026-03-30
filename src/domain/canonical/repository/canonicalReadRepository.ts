import {
  getCanonicalBundleByCaseIdFromBundles,
  getDiscoverCardVMsFromBundles,
  getOwnerDetailVMByCaseIdFromBundles,
  getPublicDetailVMByCaseIdFromBundles,
  getSupportSheetDataByCaseIdFromBundles,
  getWorkbenchVMFromBundles,
  type OwnerDetailVM,
} from "./canonicalReadRepositoryCore.ts";
import { getSeedBundles, getLocalBundles } from "./legacyCompat.ts";

export type { OwnerDetailVM } from "./canonicalReadRepositoryCore.ts";

export function getCanonicalBundles() {
  return [...getSeedBundles(), ...getLocalBundles()];
}

export function getCanonicalBundleByCaseId(caseId?: string) {
  return getCanonicalBundleByCaseIdFromBundles(getCanonicalBundles(), caseId);
}

export function getDiscoverCardVMs() {
  return getDiscoverCardVMsFromBundles(getCanonicalBundles());
}

export function getPublicDetailVMByCaseId(caseId?: string) {
  return getPublicDetailVMByCaseIdFromBundles(getCanonicalBundles(), caseId);
}

export function getSupportSheetDataByCaseId(caseId?: string) {
  return getSupportSheetDataByCaseIdFromBundles(getCanonicalBundles(), caseId);
}

export function getOwnerDetailVMByCaseId(caseId?: string): OwnerDetailVM | undefined {
  return getOwnerDetailVMByCaseIdFromBundles(getCanonicalBundles(), caseId);
}

export function getWorkbenchVMForCurrentUser() {
  return getWorkbenchVMFromBundles(getCanonicalBundles());
}
