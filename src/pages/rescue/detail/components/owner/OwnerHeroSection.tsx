import { RescueOwnerSummaryCard } from "../../../../../components/rescue";
import type { OwnerDetailVM } from "../../../../../domain/canonical/repository";
import type { PublicDetailVM } from "../../../../../domain/canonical/types";
import { getFundingCompareMetrics, getOwnerAnimalImage } from "../../detailViewModels";

export function OwnerHeroSection({
  ownerDetail,
  publicDetail,
  onCopy,
  onEditCover,
  onEditTitle,
}: {
  ownerDetail: OwnerDetailVM;
  publicDetail: PublicDetailVM;
  onCopy: () => void;
  onEditCover: () => void;
  onEditTitle: () => void;
}) {
  const fundingCompare = getFundingCompareMetrics({
    supportAmount: ownerDetail.ledger.supportedAmount,
    targetAmount: ownerDetail.ledger.targetAmount,
  });

  return (
    <RescueOwnerSummaryCard
      budgetLabel={ownerDetail.ledger.targetAmountLabel}
      coverImage={getOwnerAnimalImage(publicDetail)}
      expenseLabel={ownerDetail.ledger.confirmedExpenseAmountLabel}
      onCopy={onCopy}
      onEditCover={onEditCover}
      onEditTitle={onEditTitle}
      progressPercent={ownerDetail.progressPercent}
      publicCaseId={ownerDetail.publicCaseId}
      statusLabel={ownerDetail.statusLabel}
      supportLabel={ownerDetail.ledger.supportedAmountLabel}
      thirdLabel={fundingCompare.thirdLabel}
      thirdMode={fundingCompare.thirdMode}
      thirdValue={fundingCompare.thirdValue}
      title={ownerDetail.title}
    />
  );
}
