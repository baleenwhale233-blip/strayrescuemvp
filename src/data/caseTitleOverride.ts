import Taro from "@tarojs/taro";
import {
  getDraftByCaseId,
  getDraftById,
  type OwnerDetailVM,
  type RescueCreateDraft,
} from "../domain/canonical/repository";
import { getCaseStatusSubmissions } from "./statusUpdateSubmission";
import type { PublicDetailVM, WorkbenchCaseCardVM } from "../domain/canonical/types";

const CASE_TITLE_OVERRIDE_KEY = "case-title-overrides:v1";

type CaseTitleOverrideStore = {
  byCaseId: Record<string, string>;
  byDraftId: Record<string, string>;
  coverByCaseId: Record<string, string>;
  coverByDraftId: Record<string, string>;
};

function getEmptyStore(): CaseTitleOverrideStore {
  return {
    byCaseId: {},
    byDraftId: {},
    coverByCaseId: {},
    coverByDraftId: {},
  };
}

function readStore(): CaseTitleOverrideStore {
  const stored = Taro.getStorageSync(CASE_TITLE_OVERRIDE_KEY);
  if (!stored || typeof stored !== "object") {
    return getEmptyStore();
  }

  const candidate = stored as Partial<CaseTitleOverrideStore>;

  return {
    byCaseId:
      candidate.byCaseId && typeof candidate.byCaseId === "object"
        ? candidate.byCaseId
        : {},
    byDraftId:
      candidate.byDraftId && typeof candidate.byDraftId === "object"
        ? candidate.byDraftId
        : {},
    coverByCaseId:
      candidate.coverByCaseId && typeof candidate.coverByCaseId === "object"
        ? candidate.coverByCaseId
        : {},
    coverByDraftId:
      candidate.coverByDraftId && typeof candidate.coverByDraftId === "object"
        ? candidate.coverByDraftId
        : {},
  };
}

function writeStore(store: CaseTitleOverrideStore) {
  Taro.setStorageSync(CASE_TITLE_OVERRIDE_KEY, store);
}

export function saveCaseTitleOverride(input: {
  title: string;
  caseId?: string;
  draftId?: string;
}) {
  const title = input.title.trim();
  if (!title) {
    return;
  }

  const store = readStore();

  if (input.caseId) {
    store.byCaseId[input.caseId] = title;
  }

  if (input.draftId) {
    store.byDraftId[input.draftId] = title;
  }

  writeStore(store);
}

export function getCaseTitleOverride(input: {
  caseId?: string;
  draftId?: string;
}) {
  const store = readStore();

  return (
    (input.draftId ? store.byDraftId[input.draftId] : undefined) ||
    (input.caseId ? store.byCaseId[input.caseId] : undefined)
  );
}

export function saveCaseCoverOverride(input: {
  coverPath: string;
  caseId?: string;
  draftId?: string;
}) {
  const coverPath = input.coverPath.trim();
  if (!coverPath) {
    return;
  }

  const store = readStore();

  if (input.caseId) {
    store.coverByCaseId[input.caseId] = coverPath;
  }

  if (input.draftId) {
    store.coverByDraftId[input.draftId] = coverPath;
  }

  writeStore(store);
}

export function getCaseCoverOverride(input: {
  caseId?: string;
  draftId?: string;
}) {
  const store = readStore();

  return (
    (input.draftId ? store.coverByDraftId[input.draftId] : undefined) ||
    (input.caseId ? store.coverByCaseId[input.caseId] : undefined)
  );
}

export function applyTitleOverrideToDraft(
  draft: RescueCreateDraft | undefined,
  caseId?: string,
) {
  if (!draft) {
    return draft;
  }

  const title = getCaseTitleOverride({
    caseId,
    draftId: draft.id,
  });
  const coverPath = getCaseCoverOverride({
    caseId,
    draftId: draft.id,
  });

  if (!title && !coverPath) {
    return draft;
  }

  return {
    ...draft,
    name: title || draft.name,
    coverPath: coverPath || draft.coverPath,
  };
}

function getSavedDraftPresentation(input: { caseId?: string; draftId?: string }) {
  return (
    (input.caseId ? getDraftByCaseId(input.caseId) : undefined) ||
    (input.draftId ? getDraftById(input.draftId) : undefined)
  );
}

function getPreferredTitle(input: {
  caseId?: string;
  draftId?: string;
  fallback?: string;
  draftName?: string;
}) {
  return (
    getCaseTitleOverride({ caseId: input.caseId, draftId: input.draftId }) ||
    input.draftName ||
    input.fallback
  );
}

function getPreferredCover(input: {
  caseId?: string;
  draftId?: string;
  fallback?: string;
  draftCoverPath?: string;
}) {
  return (
    getCaseCoverOverride({ caseId: input.caseId, draftId: input.draftId }) ||
    input.draftCoverPath ||
    input.fallback
  );
}

export function applyTitleOverrideToOwnerDetail(
  detail: OwnerDetailVM | undefined,
) {
  if (!detail) {
    return detail;
  }

  const savedDraft = getSavedDraftPresentation({
    caseId: detail.caseId,
    draftId: detail.draftId,
  });
  const submissions = getCaseStatusSubmissions(detail.caseId);
  const latestStatus = submissions[0];
  const title = getPreferredTitle({
    caseId: detail.caseId,
    draftId: detail.draftId,
    fallback: detail.title,
    draftName: savedDraft?.name,
  });
  const coverImage = getPreferredCover({
    caseId: detail.caseId,
    draftId: detail.draftId,
    fallback: detail.coverImage,
    draftCoverPath: savedDraft?.coverPath,
  });

  if (
    !title &&
    !coverImage &&
    !savedDraft?.currentStatusLabel &&
    !latestStatus
  ) {
    return detail;
  }

  return {
    ...detail,
    title: title || detail.title,
    coverImage: coverImage || detail.coverImage,
    statusLabel: latestStatus?.statusLabel || savedDraft?.currentStatusLabel || detail.statusLabel,
    state: latestStatus?.statusLabel || savedDraft?.currentStatusLabel || detail.state,
  };
}

export function applyTitleOverrideToPublicDetail(
  detail: PublicDetailVM | undefined,
  draftId?: string,
) {
  if (!detail) {
    return detail;
  }

  const savedDraft = getSavedDraftPresentation({
    caseId: detail.caseId,
    draftId,
  });
  const submissions = getCaseStatusSubmissions(detail.caseId);
  const latestStatus = submissions[0];
  const title = getPreferredTitle({
    caseId: detail.caseId,
    draftId,
    fallback: detail.title,
    draftName: savedDraft?.name,
  });
  const heroImageUrl = getPreferredCover({
    caseId: detail.caseId,
    draftId,
    fallback: detail.heroImageUrl,
    draftCoverPath: savedDraft?.coverPath,
  });

  if (
    !title &&
    !heroImageUrl &&
    !savedDraft?.currentStatusLabel &&
    !latestStatus
  ) {
    return detail;
  }

  return {
    ...detail,
    title: title || detail.title,
    heroImageUrl: heroImageUrl || detail.heroImageUrl,
    statusLabel: latestStatus?.statusLabel || savedDraft?.currentStatusLabel || detail.statusLabel,
    updatedAtLabel: latestStatus?.timestampLabel || detail.updatedAtLabel,
  };
}

export function applyTitleOverrideToWorkbenchCard(card: WorkbenchCaseCardVM) {
  const savedDraft = getSavedDraftPresentation({
    caseId: card.caseId,
    draftId: card.draftId,
  });
  const submissions = getCaseStatusSubmissions(card.caseId);
  const latestStatus = submissions[0];
  const title = getPreferredTitle({
    caseId: card.caseId,
    draftId: card.draftId,
    fallback: card.title,
    draftName: savedDraft?.name,
  });
  const coverImageUrl = getPreferredCover({
    caseId: card.caseId,
    draftId: card.draftId,
    fallback: card.coverImageUrl,
    draftCoverPath: savedDraft?.coverPath,
  });

  if (
    !title &&
    !coverImageUrl &&
    !savedDraft?.currentStatusLabel &&
    !savedDraft?.currentStatus &&
    !latestStatus
  ) {
    return card;
  }

  return {
    ...card,
    title: title || card.title,
    coverImageUrl: coverImageUrl || card.coverImageUrl,
    statusLabel: latestStatus?.statusLabel || savedDraft?.currentStatusLabel || card.statusLabel,
    currentStatus: savedDraft?.currentStatus || card.currentStatus,
    updatedAtLabel: latestStatus?.timestampLabel || card.updatedAtLabel,
  };
}
