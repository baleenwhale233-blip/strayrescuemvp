import type { CanonicalCaseBundle, DiscoverCardVM } from "../types";
import { getPublicDetailVM } from "./getPublicDetailVM";

export function getDiscoverCardVM(bundle: CanonicalCaseBundle): DiscoverCardVM {
  const publicDetail = getPublicDetailVM(bundle);

  return {
    caseId: publicDetail.caseId,
    rescuerId: publicDetail.rescuerId,
    sourceKind: "seed",
    title: publicDetail.title,
    statusLabel: publicDetail.statusLabel,
    statusTone: publicDetail.statusTone,
    coverImageUrl: publicDetail.heroImageUrl,
    updatedAtLabel: publicDetail.updatedAtLabel,
    subtitle: publicDetail.locationText || publicDetail.summary,
    latestTimelineSummary: publicDetail.latestTimelineSummary,
    progressPercent: publicDetail.ledger.progressPercent,
    amountLabel: `${publicDetail.ledger.supportedAmountLabel} / ${publicDetail.ledger.targetAmountLabel}`,
  };
}
