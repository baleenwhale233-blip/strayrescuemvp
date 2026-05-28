import {
  RescueTimelineList,
  type RescueTimelineSharedItem,
} from "../../../../components/RescueTimelineShared";
import type { PublicDetailVM } from "../../../../domain/canonical/types";
import {
  getTimelineAssetUrls,
  getTimelineKind,
  getTimelinePrimaryLabel,
  parseBudgetAdjustment,
} from "../detailViewModels";

export function GuestDetailTimeline({ detail }: { detail: PublicDetailVM }) {
  const timelineItems: RescueTimelineSharedItem[] = detail.timeline.map((item) => {
    const kind = getTimelineKind(item);
    const budgetAdjustment =
      item.type === "budget_adjustment" ? parseBudgetAdjustment(item) : undefined;

    return {
      id: item.id,
      caseId: detail.caseId,
      recordType: item.type === "case_created" ? undefined : item.type,
      recordId: item.id,
      kind: kind === "support" ? "support" : kind,
      badgeLabel: getTimelinePrimaryLabel(item),
      statusLabel: kind === "status" ? detail.statusLabel : undefined,
      timestamp: item.timestampLabel,
      title: item.type === "budget_adjustment" ? item.description || item.title : item.title,
      description: item.type === "budget_adjustment" ? undefined : item.description,
      amountLabel: item.amountLabel,
      images: getTimelineAssetUrls(item),
      budgetPreviousLabel: budgetAdjustment?.previousAmountLabel,
      budgetCurrentLabel: budgetAdjustment?.currentAmountLabel,
    };
  });

  return <RescueTimelineList items={timelineItems} />;
}
