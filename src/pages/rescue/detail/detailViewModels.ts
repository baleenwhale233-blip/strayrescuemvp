import type { RescueOwnerTimelineItem } from "../../../components/rescue";
import guestHeroCat from "../../../assets/detail/guest-hero-cat.png";
import rescuerAvatar from "../../../assets/detail/rescuer-avatar.png";
import ownerAnimalFallback from "../../../assets/rescue-detail/owner/animal-card-cat.png";
import type { PublicDetailVM, PublicTimelineItemVM } from "../../../domain/canonical/types";
import { isOwnerEditableTimelineRecord } from "./ownerTimelineEditability";

export function getFundingStatusText(detail: PublicDetailVM) {
  const confirmedExpenseAmount = detail.ledger.confirmedExpenseAmount;
  const confirmedSupportAmount = detail.ledger.supportedAmount;

  if (confirmedSupportAmount >= confirmedExpenseAmount) {
    return "当前垫付已覆盖";
  }

  if (confirmedExpenseAmount - confirmedSupportAmount <= 2000) {
    return "即将筹满";
  }

  return "‼️ 当前垫付较多";
}

export function formatSignedAmount(amountLabel: string, sign: "+" | "-") {
  const normalized = amountLabel.replace(/\s+/g, "");
  const unsigned = normalized.replace(/^[-+]/, "");

  return `${sign}${unsigned}`;
}

export function getSummaryParagraphs(detail: PublicDetailVM) {
  const normalizedSummary = detail.summary.replace(/\s+/g, " ").trim();
  const sentenceMatches = normalizedSummary.match(/[^。！？]+[。！？]?/g) || [];
  const introSentences = sentenceMatches
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .filter((sentence) => !sentence.includes("预算"));
  const introParagraph = introSentences.join("").trim() || "当前这条记录的情况介绍待补充。";

  return [introParagraph, `当前总预算为${detail.ledger.targetAmountLabel}。`];
}

export function getLatestOverviewItem(detail: PublicDetailVM) {
  return (
    detail.timeline.find((item) => item.type === "progress_update") ??
    detail.timeline.find((item) => item.type === "case_created") ??
    detail.timeline[0]
  );
}

export function getTimelineKind(item: PublicTimelineItemVM) {
  switch (item.type) {
    case "expense":
      return "expense";
    case "support":
      return "support";
    case "budget_adjustment":
      return "budget";
    default:
      return "status";
  }
}

export function getTimelinePrimaryLabel(item: PublicTimelineItemVM) {
  switch (item.type) {
    case "expense":
      return "支出记录";
    case "support":
      return "场外收入";
    case "budget_adjustment":
      return "预算调整";
    default:
      return "状态更新";
  }
}

export function parseBudgetAdjustment(item: PublicTimelineItemVM) {
  const matched = item.title.match(/预算从\s*(¥[\d,]+)\s*调整到\s*(¥[\d,]+)/);

  if (!matched) {
    return undefined;
  }

  return {
    previousAmountLabel: matched[1],
    currentAmountLabel: matched[2],
  };
}

export function getHeroImage(detail: PublicDetailVM) {
  return detail.heroImageUrl || guestHeroCat;
}

export function getOwnerAnimalImage(detail: PublicDetailVM) {
  return detail.heroImageUrl || ownerAnimalFallback;
}

export function getRescuerAvatar(detail: PublicDetailVM) {
  return detail.rescuer.avatarUrl || rescuerAvatar;
}

export function getLatestOverviewImage(detail: PublicDetailVM, item?: PublicTimelineItemVM) {
  return item?.assetUrls[0] || detail.heroImageUrl;
}

export function getTimelineAssetUrls(item: PublicTimelineItemVM) {
  if (item.assetUrls.length) {
    return item.assetUrls.slice(0, 9);
  }

  return [];
}

export function getFundingCompareMetrics(input: { expenseAmount: number; supportAmount: number }) {
  const diff = input.expenseAmount - input.supportAmount;

  return {
    thirdLabel: diff > 0 ? "缺口" : "结余",
    thirdValue: `¥${Math.abs(diff).toLocaleString("zh-CN")}`,
    thirdMode: diff > 0 ? ("gap" as const) : ("balance" as const),
  };
}

export function getShareTitle(detail?: PublicDetailVM) {
  if (!detail) {
    return "猫咪透明记录档案";
  }

  return `${detail.title}当前${detail.statusLabel}，看看这份透明记录档案`;
}

export function getSharePath(detail?: PublicDetailVM, caseId?: string) {
  const targetCaseId = detail?.caseId || caseId || "";
  return `/pages/rescue/detail/index?id=${targetCaseId}&mode=guest`;
}

export function getOwnerOverviewProps(detail: PublicDetailVM) {
  const paragraphs = getSummaryParagraphs(detail);
  const latestItem = getLatestOverviewItem(detail);
  const overviewImage = getLatestOverviewImage(detail, latestItem);

  return {
    paragraphs,
    expenseLabel: formatSignedAmount(detail.ledger.confirmedExpenseAmountLabel, "-"),
    incomeLabel: formatSignedAmount(detail.ledger.supportedAmountLabel, "+"),
    latestStatus: latestItem
      ? {
          statusLabel: detail.statusLabel,
          timestamp: latestItem.timestampLabel,
          text: latestItem.description || latestItem.title,
          imageUrl: overviewImage,
        }
      : undefined,
  };
}

export function toOwnerTimelineItems(detail: PublicDetailVM): RescueOwnerTimelineItem[] {
  return detail.timeline.map((item) => {
    const rawKind = getTimelineKind(item);
    const kind: RescueOwnerTimelineItem["kind"] = rawKind === "support" ? "income" : rawKind;
    const budgetAdjustment =
      item.type === "budget_adjustment" ? parseBudgetAdjustment(item) : undefined;

    return {
      id: item.id,
      caseId: detail.caseId,
      editable: isOwnerEditableTimelineRecord(item.type),
      recordType: item.type === "case_created" ? undefined : item.type,
      recordId: item.id,
      kind,
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
}
