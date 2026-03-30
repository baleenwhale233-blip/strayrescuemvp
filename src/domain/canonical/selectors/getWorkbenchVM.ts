import type {
  CanonicalCaseBundle,
  CanonicalRescuer,
  WorkbenchCaseCardVM,
  WorkbenchVM,
} from "../types";
import { getPublicDetailVM } from "./getPublicDetailVM";

function toWorkbenchCardVM(bundle: CanonicalCaseBundle): WorkbenchCaseCardVM {
  const publicDetail = getPublicDetailVM(bundle);

  return {
    caseId: bundle.case.id,
    title: bundle.case.animalName,
    statusLabel: bundle.case.currentStatusLabel,
    statusTone: publicDetail.statusTone,
    updatedAtLabel: publicDetail.updatedAtLabel,
    visibility: bundle.case.visibility,
    currentStatus: bundle.case.currentStatus,
    coverImageUrl: publicDetail.heroImageUrl,
    targetAmountLabel: `目标 ${publicDetail.ledger.targetAmountLabel} · 已支持 ${publicDetail.ledger.supportedAmountLabel} · 缺口 ${publicDetail.ledger.verifiedGapAmountLabel}`,
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
}): WorkbenchVM {
  const ownedCases = input.cases.filter(
    (bundle) => bundle.rescuer.id === input.rescuer.id,
  );

  const draftCases = ownedCases
    .filter((bundle) => bundle.case.visibility === "draft")
    .map(toWorkbenchCardVM);
  const archivedCases = ownedCases
    .filter((bundle) => bundle.case.visibility === "archived")
    .map(toWorkbenchCardVM);
  const activeCases = ownedCases
    .filter((bundle) => bundle.case.visibility === "published")
    .map(toWorkbenchCardVM);

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
