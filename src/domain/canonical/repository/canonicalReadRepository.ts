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
import { getSeedBundles, getLocalBundles } from "./bundleSources";
import {
  finalizeHomepageCaseCardPresentation,
  finalizeOwnerDetailPresentation,
  finalizePublicDetailPresentation,
  finalizeWorkbenchCaseCardPresentation,
  resolveBundlePresentation,
} from "./localPresentation";

export type { OwnerDetailVM } from "./canonicalReadRepositoryCore";
export type { HomepageCaseCardVM } from "../types";

export function getCanonicalBundles() {
  const bundleMap = new Map<string, ReturnType<typeof getSeedBundles>[number]>();

  getSeedBundles().forEach((bundle) => {
    bundleMap.set(bundle.case.id, bundle);
  });

  getLocalBundles().forEach((bundle) => {
    bundleMap.set(bundle.case.id, bundle);
  });

  return [...bundleMap.values()];
}

function getResolvedCanonicalBundles() {
  return getCanonicalBundles().map((bundle) => resolveBundlePresentation(bundle));
}

export function getCanonicalBundleByCaseId(caseId?: string) {
  return getCanonicalBundleByCaseIdFromBundles(getResolvedCanonicalBundles(), caseId);
}

export function getCaseByPublicIdExact(input?: string) {
  return getCaseByPublicIdExactFromBundles(getResolvedCanonicalBundles(), input);
}

export function getDiscoverCardVMs() {
  return getDiscoverCardVMsFromBundles(getResolvedCanonicalBundles());
}

export function getHomepageEligibleCases() {
  return getHomepageEligibleCasesFromBundles(getResolvedCanonicalBundles());
}

export function getHomepageCaseCardVMs(): HomepageCaseCardVM[] {
  return getHomepageCaseCardVMsFromBundles(getResolvedCanonicalBundles()).map((card) =>
    finalizeHomepageCaseCardPresentation(card, { caseId: card.caseId }),
  );
}

export function getPublicDetailVMByCaseId(caseId?: string) {
  return finalizePublicDetailPresentation(
    getPublicDetailVMByCaseIdFromBundles(getResolvedCanonicalBundles(), caseId),
    { caseId },
  );
}

export function getSupportSheetDataByCaseId(caseId?: string) {
  return getSupportSheetDataByCaseIdFromBundles(getResolvedCanonicalBundles(), caseId);
}

export function getSupportThreadsByCaseId(caseId?: string) {
  return getSupportThreadsByCaseIdFromBundles(getResolvedCanonicalBundles(), caseId);
}

export function getMySupportThreadByCaseId(
  caseId: string | undefined,
  supporterUserId: string,
) {
  return getMySupportThreadByCaseIdFromBundles(
    getResolvedCanonicalBundles(),
    caseId,
    supporterUserId,
  );
}

export function getOwnerDetailVMByCaseId(caseId?: string): OwnerDetailVM | undefined {
  return finalizeOwnerDetailPresentation(
    getOwnerDetailVMByCaseIdFromBundles(getResolvedCanonicalBundles(), caseId),
  );
}

export function getWorkbenchVMForCurrentUser() {
  const resolved = getWorkbenchVMFromBundles(getResolvedCanonicalBundles());
  if (!resolved) {
    return undefined;
  }

  return {
    ...resolved,
    activeCases: resolved.activeCases.map((card) =>
      finalizeWorkbenchCaseCardPresentation(card, { caseId: card.caseId }),
    ),
    draftCases: resolved.draftCases.map((card) =>
      finalizeWorkbenchCaseCardPresentation(card, { caseId: card.caseId }),
    ),
    archivedCases: resolved.archivedCases.map((card) =>
      finalizeWorkbenchCaseCardPresentation(card, { caseId: card.caseId }),
    ),
  };
}
