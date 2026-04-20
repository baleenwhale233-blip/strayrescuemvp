import { Button, Image, Input, PageMeta, Text, View } from "@tarojs/components";
import Taro, { useDidShow, useRouter, useShareAppMessage } from "@tarojs/taro";
import { useEffect, useRef, useState } from "react";
import { AppIcon } from "../../../components/AppIcon";
import { NavBar } from "../../../components/NavBar";
import {
  saveCaseCoverOverride,
  saveCaseTitleOverride,
} from "../../../domain/canonical/repository";
import {
  RescueOwnerOverview,
  RescueOwnerQuickActions,
  RescueOwnerSummaryCard,
  RescueOwnerTabs,
  RescueOwnerTimeline,
  type RescueOwnerTimelineItem,
} from "../../../components/RescueOwnerShared";
import {
  RescueTimelineList,
  type RescueTimelineSharedItem,
} from "../../../components/RescueTimelineShared";
import { SupportSheet } from "../../../components/SupportSheet";
import copyWhiteIcon from "../../../assets/rescue-detail/copy-white-12.svg";
import evidenceCompleteOrangeIcon from "../../../assets/rescue-detail/evidence-complete-orange-14.svg";
import infoMutedIcon from "../../../assets/rescue-detail/info-muted-13.svg";
import shareMutedIcon from "../../../assets/rescue-detail/share-muted-18.svg";
import summaryExpenseIcon from "../../../assets/rescue-detail/summary-expense-18.svg";
import summaryIncomeIcon from "../../../assets/rescue-detail/summary-income-17.svg";
import guestHeroCat from "../../../assets/detail/guest-hero-cat.png";
import rescuerAvatar from "../../../assets/detail/rescuer-avatar.png";
import ownerAnimalFallback from "../../../assets/rescue-detail/owner/animal-card-cat.png";
import {
  loadOwnerDetailVMByCaseId,
  loadPublicDetailVMByCaseId,
  loadSupportSheetDataByCaseId,
  updateRemoteCaseProfileByCaseId,
  type OwnerDetailVM,
} from "../../../domain/canonical/repository";
import { uploadCaseAssetImage } from "../../../domain/canonical/repository/cloudbaseClient";
import type {
  PublicDetailVM,
  PublicTimelineItemVM,
  SupportSheetData,
} from "../../../domain/canonical/types";
import "./index.scss";

type GuestTab = "overview" | "detail";
type DetailLoadStatus = "loading" | "ready" | "error";

function getFundingStatusText(detail: PublicDetailVM) {
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

function formatSignedAmount(amountLabel: string, sign: "+" | "-") {
  const normalized = amountLabel.replace(/\s+/g, "");
  const unsigned = normalized.replace(/^[-+]/, "");

  return `${sign}${unsigned}`;
}

function getSummaryParagraphs(detail: PublicDetailVM) {
  const normalizedSummary = detail.summary.replace(/\s+/g, " ").trim();
  const sentenceMatches = normalizedSummary.match(/[^。！？]+[。！？]?/g) || [];
  const introSentences = sentenceMatches
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .filter((sentence) => !sentence.includes("预算"));
  const introParagraph = introSentences.join("").trim() || "当前这条记录的情况介绍待补充。";

  return [introParagraph, `当前总预算为${detail.ledger.targetAmountLabel}。`];
}

function getLatestOverviewItem(detail: PublicDetailVM) {
  return (
    detail.timeline.find((item) => item.type === "progress_update") ??
    detail.timeline.find((item) => item.type === "case_created") ??
    detail.timeline[0]
  );
}

function getTimelineKind(item: PublicTimelineItemVM) {
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

function getTimelinePrimaryLabel(item: PublicTimelineItemVM) {
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

function parseBudgetAdjustment(item: PublicTimelineItemVM) {
  const matched = item.title.match(/预算从\s*(¥[\d,]+)\s*调整到\s*(¥[\d,]+)/);

  if (!matched) {
    return undefined;
  }

  return {
    previousAmountLabel: matched[1],
    currentAmountLabel: matched[2],
  };
}

function getHeroImage(detail: PublicDetailVM) {
  return detail.heroImageUrl || guestHeroCat;
}

function getOwnerAnimalImage(detail: PublicDetailVM) {
  return detail.heroImageUrl || ownerAnimalFallback;
}

function getRescuerAvatar(detail: PublicDetailVM) {
  return detail.rescuer.avatarUrl || rescuerAvatar;
}

function getLatestOverviewImage(detail: PublicDetailVM, item?: PublicTimelineItemVM) {
  return item?.assetUrls[0] || detail.heroImageUrl;
}

function getTimelineAssetUrls(item: PublicTimelineItemVM) {
  if (item.assetUrls.length) {
    return item.assetUrls.slice(0, 9);
  }

  return [];
}

function getFundingCompareMetrics(input: {
  expenseAmount: number;
  supportAmount: number;
}) {
  const diff = input.expenseAmount - input.supportAmount;
  const base = Math.max(input.expenseAmount, input.supportAmount, 1);

  return {
    advanceProgressPercent: (input.expenseAmount / base) * 100,
    supportProgressPercent: (input.supportAmount / base) * 100,
    thirdLabel: diff > 0 ? "缺口" : "结余",
    thirdValue: `¥${Math.abs(diff).toLocaleString("zh-CN")}`,
    thirdMode: diff > 0 ? "gap" as const : "balance" as const,
  };
}

function getShareTitle(detail?: PublicDetailVM) {
  if (!detail) {
    return "猫咪透明记录档案";
  }

  return `${detail.title}当前${detail.statusLabel}，看看这份透明记录档案`;
}

function getSharePath(detail?: PublicDetailVM, caseId?: string) {
  const targetCaseId = detail?.caseId || caseId || "";
  return `/pages/rescue/detail/index?id=${targetCaseId}&mode=guest`;
}

function getOwnerOverviewProps(detail: PublicDetailVM) {
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

function toOwnerTimelineItems(detail: PublicDetailVM): RescueOwnerTimelineItem[] {
  return detail.timeline.map((item) => {
    const rawKind = getTimelineKind(item);
    const kind: RescueOwnerTimelineItem["kind"] =
      rawKind === "support" ? "income" : rawKind;
    const budgetAdjustment =
      item.type === "budget_adjustment" ? parseBudgetAdjustment(item) : undefined;

    return {
      id: item.id,
      caseId: detail.caseId,
      recordType: item.type === "case_created" ? undefined : item.type,
      recordId: item.id,
      kind,
      badgeLabel: getTimelinePrimaryLabel(item),
      statusLabel: kind === "status" ? detail.statusLabel : undefined,
      timestamp: item.timestampLabel,
      title:
        item.type === "budget_adjustment"
          ? item.description || item.title
          : item.title,
      description:
        item.type === "budget_adjustment" ? undefined : item.description,
      amountLabel: item.amountLabel,
      images: getTimelineAssetUrls(item),
      budgetPreviousLabel: budgetAdjustment?.previousAmountLabel,
      budgetCurrentLabel: budgetAdjustment?.currentAmountLabel,
    };
  });
}

function GuestOverview({
  detail,
}: {
  detail: PublicDetailVM;
}) {
  const paragraphs = getSummaryParagraphs(detail);
  const latestItem = getLatestOverviewItem(detail);
  const overviewImage = getLatestOverviewImage(detail, latestItem);

  return (
    <View className="guest-tab-content">
      <View className="guest-section-card theme-card">
        <Text className="guest-section-card__eyebrow">关于我</Text>
        <View className="guest-section-card__paragraphs">
          {paragraphs.map((paragraph) => (
            <Text key={paragraph} className="guest-section-card__paragraph">
              {paragraph}
            </Text>
          ))}
        </View>
      </View>

      <View className="guest-overview-metrics">
        <View className="guest-metric-card theme-card">
          <View className="guest-metric-card__icon guest-metric-card__icon--expense">
            <Image className="guest-metric-card__icon-image" mode="aspectFit" src={summaryExpenseIcon} />
          </View>
          <Text className="guest-metric-card__label">总支出</Text>
          <Text className="guest-metric-card__value guest-metric-card__value--expense">
            {formatSignedAmount(detail.ledger.confirmedExpenseAmountLabel, "-")}
          </Text>
        </View>

        <View className="guest-metric-card theme-card">
          <View className="guest-metric-card__icon guest-metric-card__icon--income">
            <Image className="guest-metric-card__icon-image" mode="aspectFit" src={summaryIncomeIcon} />
          </View>
          <Text className="guest-metric-card__label">总收入</Text>
          <Text className="guest-metric-card__value guest-metric-card__value--income">
            {formatSignedAmount(detail.ledger.supportedAmountLabel, "+")}
          </Text>
        </View>
      </View>

      {latestItem ? (
        <View className="guest-section-card theme-card">
          <View className="guest-section-card__header">
            <View className="guest-section-card__badges">
              <View className="guest-section-card__badge guest-section-card__badge--status">
                <Text>最新状态</Text>
              </View>
              <View className="guest-section-card__badge guest-section-card__badge--case">
                <Text>{detail.statusLabel}</Text>
              </View>
            </View>
            <Text className="guest-section-card__time">{latestItem.timestampLabel}</Text>
          </View>

          <Text className="guest-section-card__paragraph">
            {latestItem.description || latestItem.title}
          </Text>

          {overviewImage ? (
            <View className="guest-section-card__hero-image-wrap">
              <Image
                className="guest-section-card__hero-image"
                mode="aspectFill"
                src={overviewImage}
              />
              <Text className="guest-section-card__watermark">透明账本·严禁盗用</Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function GuestDetailTimeline({
  detail,
}: {
  detail: PublicDetailVM;
}) {
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
      title:
        item.type === "budget_adjustment" ? item.description || item.title : item.title,
      description:
        item.type === "budget_adjustment" ? undefined : item.description,
      amountLabel: item.amountLabel,
      images: getTimelineAssetUrls(item),
      budgetPreviousLabel: budgetAdjustment?.previousAmountLabel,
      budgetCurrentLabel: budgetAdjustment?.currentAmountLabel,
    };
  });

  return <RescueTimelineList items={timelineItems} />;
}

function DetailPageState({
  title,
  description,
  actionText,
  onAction,
  loading = false,
}: {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  loading?: boolean;
}) {
  return (
    <View className="detail-state">
      <NavBar showBack title="记录明细" />
      <View className="detail-state__content">
        <View className={`detail-state__icon ${loading ? "detail-state__icon--loading" : ""}`}>
          <AppIcon name={loading ? "sparkles" : "fileText"} size={24} />
        </View>
        <Text className="detail-state__title">{title}</Text>
        <Text className="detail-state__description">{description}</Text>
        {actionText && onAction ? (
          <View className="detail-state__action theme-button-primary" onTap={onAction}>
            <Text>{actionText}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function RenameSheet({
  initialValue,
  onClose,
  onSave,
}: {
  initialValue: string;
  onClose: () => void;
  onSave: (value: string) => void;
}) {
  const [value, setValue] = useState(initialValue);

  return (
    <View className="detail-rename-sheet__overlay" onTap={onClose}>
      <View
        className="detail-rename-sheet"
        onTap={(event) => event.stopPropagation()}
      >
        <View className="detail-rename-sheet__handle">
          <View className="detail-rename-sheet__handle-bar" />
        </View>

        <Text className="detail-rename-sheet__title">修改代号</Text>

        <View className="detail-rename-sheet__field">
          <Text className="detail-rename-sheet__label">小家伙的代号</Text>
          <View className="detail-rename-sheet__input-card">
            <Input
              className="detail-rename-sheet__input"
              maxlength={24}
              placeholder="如：车祸三花 / 纸箱里的橘猫"
              value={value}
              onInput={(event) => setValue(event.detail.value)}
            />
          </View>
        </View>

        <View
          className="theme-button-primary detail-rename-sheet__button"
          onTap={() => onSave(value)}
        >
          <Text>保存代号</Text>
        </View>
      </View>
    </View>
  );
}

function GuestDetail({
  detail,
  onSupport,
  onClaim,
}: {
  detail: PublicDetailVM;
  onSupport: () => void;
  onClaim: () => void;
}) {
  const [activeTab, setActiveTab] = useState<GuestTab>("overview");

  return (
    <View className="detail-page detail-page--guest">
      <NavBar showBack title="记录明细" />

      <View className="guest-hero">
        <Image className="guest-hero__image" mode="aspectFill" src={getHeroImage(detail)} />
        <View className="guest-hero__mask" />
        <View className="guest-hero__content">
          <View className="guest-hero__status">
            <View className="guest-hero__status-icon">
              <Text className="guest-hero__status-emoji">🏥</Text>
            </View>
            <Text className="guest-hero__status-text">{detail.statusLabel}</Text>
          </View>
          <Text className="guest-hero__title">{detail.title}</Text>
          <View className="guest-hero__id-row">
            <Text className="guest-hero__id">ID: {detail.publicCaseId}</Text>
            <View
              className="guest-hero__copy"
              onTap={() => {
                Taro.setClipboardData({ data: detail.publicCaseId });
              }}
            >
              <Image className="guest-hero__copy-icon" mode="aspectFit" src={copyWhiteIcon} />
            </View>
          </View>
          <View className="guest-hero__evidence">
            <Image
              className="guest-hero__evidence-icon"
              mode="aspectFit"
              src={evidenceCompleteOrangeIcon}
            />
            <Text>证据链完整</Text>
          </View>
        </View>
      </View>

      <View className="detail-page__body">
        <View className="detail-card theme-card">
          <View className="detail-card__head">
            <Text className="detail-card__title">记录资金状态</Text>
            <Image className="detail-card__info-icon" mode="aspectFit" src={infoMutedIcon} />
          </View>

          <View className="detail-card__budget-row">
            <Text className="detail-card__budget-text">总预算 {detail.ledger.targetAmountLabel}</Text>
          </View>

          <View className="detail-card__progress">
            <View
              className="detail-card__progress-fill"
              style={{ width: `${Math.min(detail.ledger.progressPercent, 100)}%` }}
            />
          </View>

          <View className="detail-card__metric">
            <View className="detail-card__metric-label">
              <View className="detail-card__metric-dot detail-card__metric-dot--slate" />
              <Text>当前垫付</Text>
            </View>
            <Text className="detail-card__metric-value">
              {detail.ledger.confirmedExpenseAmountLabel}
            </Text>
          </View>
          <View className="detail-card__metric">
            <View className="detail-card__metric-label">
              <View className="detail-card__metric-dot detail-card__metric-dot--brand" />
              <Text>已确认登记</Text>
            </View>
            <Text className="detail-card__metric-value detail-card__metric-value--brand">
              {detail.ledger.supportedAmountLabel}
            </Text>
          </View>
          <View className="detail-card__metric">
            <View className="detail-card__metric-label">
              <View className="detail-card__metric-dot detail-card__metric-dot--danger" />
              <Text>当前差额</Text>
            </View>
            <Text className="detail-card__metric-value detail-card__metric-value--danger">
              {detail.ledger.verifiedGapAmountLabel}
            </Text>
          </View>

          <View className="detail-card__notice">
            <Text>{getFundingStatusText(detail)}</Text>
          </View>
        </View>

        <View className="rescuer-card theme-card">
          <Image className="rescuer-card__avatar" mode="aspectFill" src={getRescuerAvatar(detail)} />
          <View className="rescuer-card__body">
            <Text className="rescuer-card__name">{detail.rescuer.name}</Text>
            <Text className="rescuer-card__meta">
              已建立 {detail.rescuer.stats.publishedCaseCount} 份记录档案 ·{" "}
              {detail.rescuer.stats.verifiedReceiptCount} 张真实凭证
            </Text>
          </View>
          {detail.rescuer.profileEntryEnabled ? (
            <View
              className="rescuer-card__link"
              onTap={() =>
                Taro.navigateTo({
                  url: `/pages/rescuer/home/index?rescuerId=${detail.rescuer.id}&caseId=${detail.caseId}`,
                })
              }
            >
              <Text>查看主页</Text>
            </View>
          ) : null}
        </View>

        <View className="detail-tabs">
          <View
            className={`detail-tabs__item ${
              activeTab === "overview" ? "detail-tabs__item--active" : ""
            }`}
            onTap={() => setActiveTab("overview")}
          >
            <Text>记录摘要</Text>
          </View>
          <View
            className={`detail-tabs__item ${
              activeTab === "detail" ? "detail-tabs__item--active" : ""
            }`}
            onTap={() => setActiveTab("detail")}
          >
            <Text>记录详情</Text>
          </View>
        </View>

        {activeTab === "overview" ? (
          <GuestOverview detail={detail} />
        ) : (
          <GuestDetailTimeline detail={detail} />
        )}
      </View>

      <View className="guest-bottom-bar">
        <View className="guest-bottom-bar__inner">
          <Button
            className="guest-bottom-bar__share"
            openType="share"
          >
            <Image className="guest-bottom-bar__share-icon-image" mode="aspectFit" src={shareMutedIcon} />
            <Text className="guest-bottom-bar__share-text">分享</Text>
          </Button>
          <Button className="guest-bottom-bar__ghost" onTap={onClaim}>
            <Text>登记一笔</Text>
          </Button>
          <Button className="guest-bottom-bar__cta theme-button-primary" onTap={onSupport}>
            <Text>查看联系方式</Text>
          </Button>
        </View>
      </View>
    </View>
  );
}

function OwnerDetail({
  ownerDetail,
  publicDetail,
  initialTab,
  onRenameTitle,
  onChangeCover,
}: {
  ownerDetail: OwnerDetailVM;
  publicDetail: PublicDetailVM;
  initialTab: GuestTab;
  onRenameTitle: (value: string) => void;
  onChangeCover: () => void;
}) {
  const [activeTab, setActiveTab] = useState<GuestTab>(initialTab);
  const [editingTitle, setEditingTitle] = useState(false);
  const [finishDragX, setFinishDragX] = useState(0);
  const [finishDragging, setFinishDragging] = useState(false);
  const finishStartXRef = useRef(0);
  const finishMaxX = 198;
  const finishThreshold = 148;

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const goToManage = () => {
    Taro.navigateTo({
      url: `/pages/support/review/index?id=${ownerDetail.caseId}`,
    });
  };

  const resetFinishSlider = () => {
    setFinishDragging(false);
    setFinishDragX(0);
  };

  const handleFinishTouchStart = (event: any) => {
    finishStartXRef.current = event.touches?.[0]?.clientX || 0;
    setFinishDragging(true);
  };

  const handleFinishTouchMove = (event: any) => {
    if (!finishDragging) {
      return;
    }

    const currentX = event.touches?.[0]?.clientX || finishStartXRef.current;
    const deltaX = Math.max(0, currentX - finishStartXRef.current);
    setFinishDragX(Math.min(deltaX, finishMaxX));
  };

  const handleFinishTouchEnd = async () => {
    if (finishDragX < finishThreshold) {
      resetFinishSlider();
      return;
    }

    const result = await Taro.showModal({
      title: "结束记录？",
      content: "请确认这条记录已经完成、已结案，或确实需要关闭。",
      confirmText: "确认结束",
      cancelText: "再等等",
    });

    resetFinishSlider();

    if (!result.confirm) {
      return;
    }

    Taro.showToast({
      title: "结束记录链路待接入",
      icon: "none",
    });
  };
  const fundingCompare = getFundingCompareMetrics({
    expenseAmount: ownerDetail.ledger.confirmedExpenseAmount,
    supportAmount: ownerDetail.ledger.supportedAmount,
  });

  return (
    <View className="detail-page detail-page--owner">
      <NavBar showBack title="记录管理" />

      <RescueOwnerSummaryCard
        budgetLabel={ownerDetail.ledger.targetAmountLabel}
        coverImage={getOwnerAnimalImage(publicDetail)}
        advanceProgressPercent={fundingCompare.advanceProgressPercent}
        expenseLabel={ownerDetail.ledger.confirmedExpenseAmountLabel}
        onCopy={() => {
          Taro.setClipboardData({ data: ownerDetail.publicCaseId });
        }}
        onEditCover={onChangeCover}
        onEditTitle={() => setEditingTitle(true)}
        progressPercent={fundingCompare.supportProgressPercent}
        publicCaseId={ownerDetail.publicCaseId}
        statusLabel={ownerDetail.statusLabel}
        supportLabel={ownerDetail.ledger.supportedAmountLabel}
        thirdLabel={fundingCompare.thirdLabel}
        thirdMode={fundingCompare.thirdMode}
        thirdValue={fundingCompare.thirdValue}
        title={ownerDetail.title}
      />

      <RescueOwnerQuickActions
        onBudget={() =>
          Taro.navigateTo({
            url: `/pages/rescue/budget-update/index?caseId=${ownerDetail.caseId}`,
          })
        }
        onExpense={() =>
          Taro.navigateTo({
            url: `/pages/rescue/expense/index?caseId=${ownerDetail.caseId}`,
          })
        }
        onIncome={goToManage}
        onStatus={() =>
          Taro.navigateTo({
            url: `/pages/rescue/progress-update/index?caseId=${ownerDetail.caseId}`,
          })
        }
      />

      <RescueOwnerTabs activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "overview" ? (
        <View className="owner-tab-content">
          <RescueOwnerOverview {...getOwnerOverviewProps(publicDetail)} />
        </View>
      ) : (
        <View className="owner-tab-content owner-tab-content--timeline">
          <RescueOwnerTimeline items={toOwnerTimelineItems(publicDetail)} />
        </View>
      )}

      <View className="owner-finish">
        <View className="owner-finish__row">
          <Button className="owner-finish__share" openType="share">
            <Image className="owner-finish__share-icon" mode="aspectFit" src={shareMutedIcon} />
            <Text className="owner-finish__share-text">分享</Text>
          </Button>
          <View className="owner-finish__swipe">
            <View
              className="owner-finish__handle"
              style={{ transform: `translateX(${finishDragX}px)` }}
              onTouchStart={handleFinishTouchStart}
              onTouchMove={handleFinishTouchMove}
              onTouchEnd={handleFinishTouchEnd}
              onTouchCancel={resetFinishSlider}
            >
              <Text>›</Text>
            </View>
            <Text
              className="owner-finish__swipe-text"
              style={{ opacity: Math.max(0.35, 1 - finishDragX / finishThreshold) }}
            >
              右滑结束记录
            </Text>
          </View>
        </View>
        <Text className="owner-finish__hint">
          确认这条记录已完成或已结案时，请滑动结束项目
        </Text>
      </View>

      {editingTitle ? (
        <RenameSheet
          initialValue={ownerDetail.title}
          onClose={() => setEditingTitle(false)}
          onSave={(value) => {
            onRenameTitle(value);
            setEditingTitle(false);
          }}
        />
      ) : null}
    </View>
  );
}

export default function RescueDetailPage() {
  const router = useRouter();
  const [supportOpen, setSupportOpen] = useState(false);
  const [reloadSeed, setReloadSeed] = useState(0);
  const [detailStatus, setDetailStatus] = useState<DetailLoadStatus>("loading");
  const [publicDetail, setPublicDetail] = useState<PublicDetailVM | undefined>();
  const [ownerDetail, setOwnerDetail] = useState<OwnerDetailVM | undefined>();
  const [supportData, setSupportData] = useState<SupportSheetData | undefined>();
  const guestActionLockRef = useRef(false);
  const mode = router.params?.mode === "guest" ? "guest" : "owner";
  const initialOwnerTab = router.params?.tab === "detail" ? "detail" : "overview";
  const caseId = router.params?.id;

  useShareAppMessage(() => ({
    title: getShareTitle(publicDetail),
    path: getSharePath(publicDetail, caseId),
    imageUrl: publicDetail?.heroImageUrl || guestHeroCat,
  }));

  const handleRenameTitle = async (value: string) => {
    const nextTitle = value.trim();
    if (!nextTitle) {
      Taro.showToast({
        title: "请先填写代号",
        icon: "none",
      });
      return;
    }

    try {
      Taro.showLoading({ title: "保存中" });
      const didSyncRemote = await updateRemoteCaseProfileByCaseId(caseId, {
        animalName: nextTitle,
      });

      if (!didSyncRemote) {
        saveCaseTitleOverride({
          title: nextTitle,
          caseId,
          draftId: ownerDetail?.draftId,
        });
      }

      setOwnerDetail((current) =>
        current
          ? {
              ...current,
              title: nextTitle,
            }
          : current,
      );
      setPublicDetail((current) =>
        current
          ? {
              ...current,
              title: nextTitle,
            }
          : current,
      );
      Taro.hideLoading();
    } catch {
      Taro.hideLoading();
      Taro.showToast({
        title: "代号更新失败",
        icon: "none",
      });
      return;
    }

    Taro.showToast({
      title: "已更新代号",
      icon: "none",
    });
  };

  const handleChangeCover = async () => {
    try {
      const action = await Taro.showActionSheet({
        itemList: ["拍照", "上传图片"],
      });

      const result = await Taro.chooseImage({
        count: 1,
        sizeType: ["compressed"],
        sourceType: action.tapIndex === 0 ? ["camera"] : ["album"],
      });

      const nextPath = result.tempFilePaths?.[0];
      if (!nextPath) {
        return;
      }
      Taro.showLoading({ title: "上传中" });
      const uploaded = await uploadCaseAssetImage(caseId || "unknown-case", nextPath, "case-covers");
      const coverFileID =
        uploaded && !uploaded.isLocalFallback ? uploaded.fileID : undefined;
      const didSyncRemote = coverFileID
        ? await updateRemoteCaseProfileByCaseId(caseId, { coverFileID })
        : false;

      setOwnerDetail((current) =>
        current
          ? {
              ...current,
              coverImage: nextPath,
            }
          : current,
      );
      setPublicDetail((current) =>
        current
          ? {
              ...current,
              heroImageUrl: nextPath,
            }
          : current,
      );
      if (!didSyncRemote) {
        saveCaseCoverOverride({
          coverPath: nextPath,
          caseId,
          draftId: ownerDetail?.draftId,
        });
      }
      Taro.hideLoading();

      Taro.showToast({
        title: "已更新头像",
        icon: "none",
      });
    } catch (error) {
      Taro.hideLoading();
      if (error instanceof Error && error.message === "CASE_ASSET_UPLOAD_FAILED") {
        Taro.showToast({
          title: "头像上传失败",
          icon: "none",
        });
      }
    }
  };

  const loadDetailPage = () => {
    setDetailStatus("loading");
    setReloadSeed((value) => value + 1);

    return Promise.all([
      loadPublicDetailVMByCaseId(caseId),
      mode === "owner" ? loadOwnerDetailVMByCaseId(caseId) : Promise.resolve(undefined),
      loadSupportSheetDataByCaseId(caseId),
    ])
      .then(([nextPublicDetail, nextOwnerDetail, nextSupportData]) => {
        setPublicDetail(nextPublicDetail);
        setOwnerDetail(nextOwnerDetail);
        setSupportData(nextSupportData);
        setDetailStatus(nextPublicDetail ? "ready" : "error");
      })
      .catch(() => {
        setDetailStatus("error");
        Taro.showToast({
          title: "详情加载失败",
          icon: "none",
        });
      });
  };

  const runGuestActionWithLock = (action: () => void | Promise<unknown>) => {
    if (guestActionLockRef.current) {
      return;
    }

    guestActionLockRef.current = true;

    void Promise.resolve(action()).finally(() => {
      setTimeout(() => {
        guestActionLockRef.current = false;
      }, 300);
    });
  };

  useDidShow(() => {
    loadDetailPage();
  });

  if (detailStatus === "loading") {
    return (
      <View key={reloadSeed} className="page-shell detail-page-shell">
        <DetailPageState
          loading
          title="正在加载记录明细"
          description="正在整理头图、资金状态和最新进展，请稍等片刻。"
        />
      </View>
    );
  }

  if (detailStatus === "error" || !publicDetail) {
    return (
      <View key={reloadSeed} className="page-shell detail-page-shell">
        <DetailPageState
          title="记录明细加载失败"
          description="当前没能拿到这条记录的明细，你可以稍后重试一次。"
          actionText="重新加载"
          onAction={loadDetailPage}
        />
      </View>
    );
  }

  return (
    <View key={reloadSeed} className="page-shell detail-page-shell">
      <PageMeta pageStyle={supportOpen ? "overflow: hidden;" : "overflow: visible;"} />
      {mode === "guest" ? (
        <GuestDetail
          detail={publicDetail}
          onSupport={() =>
            runGuestActionWithLock(() => {
              if (supportOpen) {
                return;
              }

              setSupportOpen(true);
            })
          }
          onClaim={() =>
            runGuestActionWithLock(() =>
              Taro.navigateTo({
                url: `/pages/support/claim/index?id=${publicDetail.caseId}`,
              })
            )
          }
        />
      ) : ownerDetail ? (
        <OwnerDetail
          initialTab={initialOwnerTab}
          onChangeCover={handleChangeCover}
          onRenameTitle={handleRenameTitle}
          ownerDetail={ownerDetail}
          publicDetail={publicDetail}
        />
      ) : null}

      {supportData ? (
        <SupportSheet
          visible={supportOpen}
          support={supportData}
          onClose={() => setSupportOpen(false)}
        />
      ) : null}
    </View>
  );
}
