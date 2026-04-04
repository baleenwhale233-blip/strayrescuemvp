import type {
  CanonicalCaseBundle,
  DiscoverCardVM,
  HomepageCaseCardVM,
} from "../types";
import {
  getCaseEvidenceLevel,
  getFundingStatusSummary,
  getHomepageEligibility,
  getLastPublicActivityAt,
  getLatestStatusSummary,
  getPublicCaseId,
  getRecommendationReason,
} from "../modeling";
import { getPublicDetailVM } from "./getPublicDetailVM";

function formatDateLabel(isoDateTime: string) {
  const date = new Date(isoDateTime);

  if (Number.isNaN(date.getTime())) {
    return isoDateTime;
  }

  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");

  return `${month}-${day} ${hours}:${minutes}`;
}

export function getHomepageCaseCardVM(
  bundle: CanonicalCaseBundle,
): HomepageCaseCardVM {
  const publicDetail = getPublicDetailVM(bundle);
  const homepageEligibility = getHomepageEligibility(bundle);
  const latestStatusSummary = getLatestStatusSummary(bundle);
  const recommendationReason = getRecommendationReason(bundle);

  return {
    caseId: publicDetail.caseId,
    publicCaseId: getPublicCaseId(bundle.case),
    rescuerId: publicDetail.rescuerId,
    sourceKind: bundle.sourceKind,
    title: publicDetail.title,
    statusLabel: publicDetail.statusLabel,
    statusTone: publicDetail.statusTone,
    coverImageUrl: publicDetail.heroImageUrl,
    updatedAtLabel: formatDateLabel(getLastPublicActivityAt(bundle)),
    latestStatusSummary,
    fundingStatusSummary: getFundingStatusSummary(bundle),
    recommendationReason,
    evidenceLevel: getCaseEvidenceLevel(bundle),
    homepageEligibilityStatus: homepageEligibility.status,
    homepageEligibilityReason: homepageEligibility.reason,
    progressPercent: publicDetail.ledger.progressPercent,
    amountLabel: `${publicDetail.ledger.supportedAmountLabel} / ${publicDetail.ledger.targetAmountLabel}`,
  };
}

export function getDiscoverCardVM(bundle: CanonicalCaseBundle): DiscoverCardVM {
  const homepageCard = getHomepageCaseCardVM(bundle);
  const publicDetail = getPublicDetailVM(bundle);

  return {
    caseId: homepageCard.caseId,
    publicCaseId: homepageCard.publicCaseId,
    rescuerId: homepageCard.rescuerId,
    sourceKind: homepageCard.sourceKind,
    title: homepageCard.title,
    statusLabel: homepageCard.statusLabel,
    statusTone: homepageCard.statusTone,
    coverImageUrl: homepageCard.coverImageUrl,
    updatedAtLabel: homepageCard.updatedAtLabel,
    subtitle: publicDetail.locationText || publicDetail.summary,
    latestTimelineSummary: homepageCard.latestStatusSummary,
    progressPercent: homepageCard.progressPercent,
    amountLabel: homepageCard.amountLabel,
  };
}
