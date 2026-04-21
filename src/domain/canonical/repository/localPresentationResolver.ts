import type {
  CanonicalCaseBundle,
  HomepageCaseCardVM,
  PublicDetailVM,
  WorkbenchCaseCardVM,
} from "../types";
import type { OwnerDetailVM } from "./canonicalReadRepositoryCore";
import { getDraftByCaseId, getDraftById, type RescueCreateDraft } from "./draftRepository";
import { caseIdToDraftId } from "./localRepositoryCore";
import {
  finalizeHomepageCaseCardPresentationCore,
  finalizeOwnerDetailPresentationCore,
  finalizePublicDetailPresentationCore,
  finalizeWorkbenchCaseCardPresentationCore,
  resolveBundlePresentationCore,
  resolvePresentedDraftCore,
  type LocalPresentationSnapshot,
} from "./localPresentationCore";
import {
  getCaseBudgetAdjustments,
  getCaseExpenseSubmissions,
  getCaseStatusSubmissions,
  readCaseTitleOverrideStore,
} from "./localPresentationStorage";

type CasePresentationInput = {
  caseId?: string;
  draftId?: string;
  fallback?: string;
  draftValue?: string;
};

type LocalPresentationOptions = {
  applyLocalOverlays?: boolean;
};

function getCaseTitleOverride(input: {
  caseId?: string;
  draftId?: string;
}) {
  const store = readCaseTitleOverrideStore();

  return (
    (input.draftId ? store.byDraftId[input.draftId] : undefined) ||
    (input.caseId ? store.byCaseId[input.caseId] : undefined)
  );
}

function getCaseCoverOverride(input: {
  caseId?: string;
  draftId?: string;
}) {
  const store = readCaseTitleOverrideStore();

  return (
    (input.draftId ? store.coverByDraftId[input.draftId] : undefined) ||
    (input.caseId ? store.coverByCaseId[input.caseId] : undefined)
  );
}

function getSavedDraftPresentation(input: { caseId?: string; draftId?: string }) {
  return (
    (input.caseId ? getDraftByCaseId(input.caseId) : undefined) ||
    (input.draftId ? getDraftById(input.draftId) : undefined)
  );
}

function resolvePresentedValue(input: CasePresentationInput & { readOverride: (input: {
  caseId?: string;
  draftId?: string;
}) => string | undefined }) {
  return (
    input.readOverride({ caseId: input.caseId, draftId: input.draftId }) ||
    input.draftValue ||
    input.fallback
  );
}

function getOverlayDraftId(bundle: CanonicalCaseBundle) {
  return bundle.sourceKind === "local" ? caseIdToDraftId(bundle.case.id) : undefined;
}

export function resolvePresentedTitle(input: CasePresentationInput) {
  return resolvePresentedValue({
    ...input,
    readOverride: getCaseTitleOverride,
  });
}

export function resolvePresentedCover(input: CasePresentationInput) {
  return resolvePresentedValue({
    ...input,
    readOverride: getCaseCoverOverride,
  });
}

function buildLocalPresentationSnapshot(input: {
  caseId: string;
  draftId?: string;
  draft?: RescueCreateDraft;
  applyLocalOverlays?: boolean;
}): LocalPresentationSnapshot {
  return {
    caseId: input.caseId,
    draftId: input.draftId,
    draft: input.draft,
    applyLocalOverlays: input.applyLocalOverlays,
    titleOverride: getCaseTitleOverride({
      caseId: input.caseId,
      draftId: input.draftId,
    }),
    coverOverride: getCaseCoverOverride({
      caseId: input.caseId,
      draftId: input.draftId,
    }),
    statusSubmissions: getCaseStatusSubmissions(input.caseId),
    expenseSubmissions: getCaseExpenseSubmissions(input.caseId),
    budgetAdjustments: getCaseBudgetAdjustments(input.caseId),
  };
}

export function resolvePresentedDraft(
  draft: RescueCreateDraft | undefined,
  caseId?: string,
  options: LocalPresentationOptions = {},
): RescueCreateDraft | undefined {
  if (!draft) {
    return draft;
  }

  if (options.applyLocalOverlays === false) {
    return draft;
  }

  return resolvePresentedDraftCore(
    draft,
    buildLocalPresentationSnapshot({
      caseId: caseId || "",
      draftId: draft.id,
      draft,
      applyLocalOverlays: options.applyLocalOverlays,
    }),
  );
}

export function resolveBundlePresentation(
  bundle: CanonicalCaseBundle,
  options: LocalPresentationOptions = {},
) {
  const caseId = bundle.case.id;
  const draftId = getOverlayDraftId(bundle);
  const savedDraft = getSavedDraftPresentation({ caseId, draftId });

  return resolveBundlePresentationCore(
    bundle,
    buildLocalPresentationSnapshot({
      caseId,
      draftId,
      draft: savedDraft,
      applyLocalOverlays: options.applyLocalOverlays,
    }),
  );
}

export function finalizePublicDetailPresentation(
  detail: PublicDetailVM | undefined,
  input?: { caseId?: string } & LocalPresentationOptions,
): PublicDetailVM | undefined {
  if (!detail) {
    return detail;
  }

  return finalizePublicDetailPresentationCore(
    detail,
    buildLocalPresentationSnapshot({
      caseId: input?.caseId || detail.caseId,
      applyLocalOverlays: input?.applyLocalOverlays,
    }),
  );
}

export function finalizeOwnerDetailPresentation(
  detail: OwnerDetailVM | undefined,
  options: LocalPresentationOptions = {},
): OwnerDetailVM | undefined {
  if (!detail) {
    return detail;
  }

  return finalizeOwnerDetailPresentationCore(
    detail,
    buildLocalPresentationSnapshot({
      caseId: detail.caseId,
      applyLocalOverlays: options.applyLocalOverlays,
    }),
  );
}

export function finalizeHomepageCaseCardPresentation(
  card: HomepageCaseCardVM,
  input: { caseId?: string } & LocalPresentationOptions,
): HomepageCaseCardVM {
  return finalizeHomepageCaseCardPresentationCore(
    card,
    buildLocalPresentationSnapshot({
      caseId: input.caseId || card.caseId,
      applyLocalOverlays: input.applyLocalOverlays,
    }),
  );
}

export function finalizeWorkbenchCaseCardPresentation(
  card: WorkbenchCaseCardVM,
  input: { caseId?: string } & LocalPresentationOptions,
): WorkbenchCaseCardVM {
  return finalizeWorkbenchCaseCardPresentationCore(
    card,
    buildLocalPresentationSnapshot({
      caseId: input.caseId || card.caseId,
      applyLocalOverlays: input.applyLocalOverlays,
    }),
  );
}
