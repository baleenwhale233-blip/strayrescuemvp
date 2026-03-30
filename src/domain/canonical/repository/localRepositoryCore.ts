import type {
  RescueCreateEntryTone,
  RescueCreateTimelineEntry,
} from "./localDraftPersistence.ts";

export type BundleSourceKind = "seed" | "local";

export type OwnerDetailActionKey =
  | "receipt"
  | "update"
  | "income"
  | "budget"
  | "copy";

export function getSourceKindByRescuerId(
  rescuerId: string,
): BundleSourceKind {
  return rescuerId.startsWith("local_rescuer_") ? "local" : "seed";
}

export function draftIdToCaseId(draftId: string) {
  return draftId.replace("custom-project", "case");
}

export function caseIdToDraftId(caseId: string) {
  return caseId.startsWith("case-")
    ? caseId.replace("case-", "custom-project-")
    : caseId;
}

export function toOwnerActionTimelineEntry(input: {
  action: Exclude<OwnerDetailActionKey, "copy">;
  title: string;
  description: string;
  amount?: number;
  imageUrls?: string[];
  previousTargetAmount?: number;
  currentTargetAmount?: number;
  timestampLabel: string;
}): RescueCreateTimelineEntry {
  const labelMap: Record<Exclude<OwnerDetailActionKey, "copy">, string> = {
    receipt: "支出记录",
    update: "状态更新",
    income: "场外收入",
    budget: "预算调整",
  };

  const toneMap: Record<
    Exclude<OwnerDetailActionKey, "copy">,
    RescueCreateEntryTone
  > = {
    receipt: "expense",
    update: "status",
    income: "income",
    budget: "budget",
  };

  return {
    id: `entry-${Date.now()}`,
    tone: toneMap[input.action],
    label: labelMap[input.action],
    title: input.title,
    description: input.description,
    timestamp: input.timestampLabel,
    amount: input.amount,
    images: input.imageUrls,
    budgetPrevious: input.previousTargetAmount,
    budgetCurrent: input.currentTargetAmount,
  };
}
