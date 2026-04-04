import {
  getCaseByPublicIdExactFromBundles,
  getCanonicalBundleByCaseIdFromBundles,
  getDiscoverCardVMsFromBundles,
  getHomepageCaseCardVMsFromBundles,
  getHomepageEligibleCasesFromBundles,
  getMySupportThreadByCaseIdFromBundles,
  getOwnerDetailVMByCaseIdFromBundles,
  getPublicDetailVMByCaseIdFromBundles,
  getSupportThreadsByCaseIdFromBundles,
  getSupportSheetDataByCaseIdFromBundles,
  getWorkbenchVMFromBundles,
  type OwnerDetailVM,
} from "./canonicalReadRepositoryCore";
import type { HomepageCaseCardVM } from "../types";
import { getSeedBundles, getLocalBundles } from "./legacyCompat";

export type { OwnerDetailVM } from "./canonicalReadRepositoryCore";
export type { HomepageCaseCardVM } from "../types";

export function getCanonicalBundles() {
  return [...getSeedBundles(), ...getLocalBundles()];
}

export function getCanonicalBundleByCaseId(caseId?: string) {
  return getCanonicalBundleByCaseIdFromBundles(getCanonicalBundles(), caseId);
}

export function getCaseByPublicIdExact(input?: string) {
  return getCaseByPublicIdExactFromBundles(getCanonicalBundles(), input);
}

export function getDiscoverCardVMs() {
  return getDiscoverCardVMsFromBundles(getCanonicalBundles());
}

export function getHomepageEligibleCases() {
  return getHomepageEligibleCasesFromBundles(getCanonicalBundles());
}

export function getHomepageCaseCardVMs(): HomepageCaseCardVM[] {
  return getHomepageCaseCardVMsFromBundles(getCanonicalBundles());
}

export function getPublicDetailVMByCaseId(caseId?: string) {
  return getPublicDetailVMByCaseIdFromBundles(getCanonicalBundles(), caseId);
}

export function getSupportSheetDataByCaseId(caseId?: string) {
  return getSupportSheetDataByCaseIdFromBundles(getCanonicalBundles(), caseId);
}

export function getSupportThreadsByCaseId(caseId?: string) {
  return getSupportThreadsByCaseIdFromBundles(getCanonicalBundles(), caseId);
}

export function getMySupportThreadByCaseId(
  caseId: string | undefined,
  supporterUserId: string,
) {
  return getMySupportThreadByCaseIdFromBundles(
    getCanonicalBundles(),
    caseId,
    supporterUserId,
  );
}

export function getOwnerDetailVMByCaseId(caseId?: string): OwnerDetailVM | undefined {
  return getOwnerDetailVMByCaseIdFromBundles(getCanonicalBundles(), caseId);
}

export function getWorkbenchVMForCurrentUser() {
  return getWorkbenchVMFromBundles(getCanonicalBundles());
}
