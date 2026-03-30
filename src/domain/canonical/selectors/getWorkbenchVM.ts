import type {
  CanonicalCaseBundle,
  CanonicalRescuer,
  WorkbenchCaseCardVM,
  WorkbenchVM,
} from "../types.ts";
import { getPublicDetailVM } from "./getPublicDetailVM.ts";

function toWorkbenchCardVM(
  bundle: CanonicalCaseBundle,
  options?: { sourceKind?: "seed" | "local"; draftId?: string },
): WorkbenchCaseCardVM {
  const publicDetail = getPublicDetailVM(bundle);

  return {
    caseId: bundle.case.id,
    sourceKind: options?.sourceKind ?? "seed",
    title: bundle.case.animalName,
    statusLabel: bundle.case.currentStatusLabel,
    statusTone: publicDetail.statusTone,
    updatedAtLabel: publicDetail.updatedAtLabel,
    visibility: bundle.case.visibility,
    currentStatus: bundle.case.currentStatus,
    coverImageUrl: publicDetail.heroImageUrl,
    targetAmountLabel: `目标 ${publicDetail.ledger.targetAmountLabel} · 已支持 ${publicDetail.ledger.supportedAmountLabel} · 缺口 ${publicDetail.ledger.verifiedGapAmountLabel}`,
    draftId: options?.draftId,
  };
}

function sortCards(cards: WorkbenchCaseCardVM[]) {
  return [...cards].sort((left, right) =>
    right.updatedAtLabel.localeCompare(left.updatedAtLabel),
  );
}

export function getWorkbenchVM(input: {
  rescuer: CanonicalRescuer;
  cases: CanonicalCaseBundle[];
  includeAllCases?: boolean;
  getCaseMeta?: (
    bundle: CanonicalCaseBundle,
  ) => { sourceKind?: "seed" | "local"; draftId?: string };
}): WorkbenchVM {
  const ownedCases = input.includeAllCases
    ? input.cases
    : input.cases.filter((bundle) => bundle.rescuer.id === input.rescuer.id);

  const draftCases = ownedCases
    .filter((bundle) => bundle.case.visibility === "draft")
    .map((bundle) => toWorkbenchCardVM(bundle, input.getCaseMeta?.(bundle)));
  const archivedCases = ownedCases
    .filter((bundle) => bundle.case.visibility === "archived")
    .map((bundle) => toWorkbenchCardVM(bundle, input.getCaseMeta?.(bundle)));
  const activeCases = ownedCases
    .filter((bundle) => bundle.case.visibility === "published")
    .map((bundle) => toWorkbenchCardVM(bundle, input.getCaseMeta?.(bundle)));

  return {
    rescuer: {
      id: input.rescuer.id,
      name: input.rescuer.name,
      avatarUrl: input.rescuer.avatarUrl,
      verifiedLevel: input.rescuer.verifiedLevel,
    },
    counts: {
      active: activeCases.length,
      draft: draftCases.length,
      archived: archivedCases.length,
    },
    activeCases: sortCards(activeCases),
    draftCases: sortCards(draftCases),
    archivedCases: sortCards(archivedCases),
  };
}
