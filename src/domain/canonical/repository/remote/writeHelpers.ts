import type {
  RescueCreateDraft,
  RescueCreateDraftStatus,
} from "../draftRepository";

export function toRemoteDraftPayload(
  draft: RescueCreateDraft,
  status: RescueCreateDraftStatus,
  deps: {
    draftIdToCaseId: (draftId: string) => string;
  },
) {
  const caseId = deps.draftIdToCaseId(draft.id);

  return {
    caseId,
    publicCaseId: draft.publicCaseId,
    name: draft.name,
    animalName: draft.name,
    summary: draft.summary,
    initialSummary: draft.summary,
    species: draft.species,
    currentStatus:
      draft.currentStatus || (status === "published" ? "medical" : "draft"),
    currentStatusLabel:
      draft.currentStatusLabel || (status === "published" ? "医疗处理中" : "草稿中"),
    budget: draft.budget,
    targetAmount: draft.budget,
    coverFileID: draft.coverPath?.startsWith("cloud://") ? draft.coverPath : undefined,
    foundLocationText: draft.foundLocationText,
    createdAt: draft.createdAt,
  };
}

export function buildLocalManualSupportEntryInput(
  input: {
    supporterNameMasked?: string;
    amount: number;
    supportedAt: string;
    note?: string;
  },
  deps: {
    now: () => number;
  },
) {
  return {
    supporterUserId: `manual-supporter:${deps.now()}`,
    supporterNameMasked: input.supporterNameMasked || "线下记录",
    amount: input.amount,
    supportedAt: input.supportedAt,
    note: input.note,
    status: "confirmed" as const,
  };
}
