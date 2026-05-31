import { Image, Text, View } from "@tarojs/components";
import { SegmentedTabs, StatusBadge, SurfaceCard } from "../ui";
import { RescueLedgerSummary } from "./RescueLedgerSummary";
import { RescueEvidenceGrid, RescueRecordHeader } from "./RescueRecordShared";
import {
  RescueTimelineList,
  type RescueReadonlyRecordDetail,
  type RescueTimelineSharedItem,
} from "./RescueTimelineShared";
import ownerActionBudgetIcon from "../../assets/rescue-detail/owner/action-budget.svg";
import ownerActionChevronIcon from "../../assets/rescue-detail/owner/action-chevron.svg";
import ownerActionChevronPrimaryIcon from "../../assets/rescue-detail/owner/action-chevron-primary.svg";
import ownerActionExpenseIcon from "../../assets/rescue-detail/owner/action-expense.svg";
import ownerActionIncomeIcon from "../../assets/rescue-detail/owner/action-income.svg";
import ownerActionUpdateIcon from "../../assets/rescue-detail/owner/action-update.svg";
import ownerCopyIcon from "../../assets/rescue-detail/owner/copy-muted.svg";
import ownerEditIcon from "../../assets/rescue-detail/owner/edit-muted.svg";
import summaryExpenseIcon from "../../assets/rescue-detail/summary-expense-18.svg";
import summaryIncomeIcon from "../../assets/rescue-detail/summary-income-17.svg";
import "./RescueOwnerShared.scss";

export type RescueOwnerTab = "overview" | "detail";
export type RescueOwnerMetricMode = "balance" | "gap";
export type RescueOwnerTimelineKind = "expense" | "status" | "budget" | "income";

export type RescueOwnerSummaryCardProps = {
  coverImage: string;
  title: string;
  statusLabel: string;
  publicCaseId: string;
  budgetLabel: string;
  progressPercent: number;
  advanceProgressPercent?: number;
  expenseLabel: string;
  supportLabel: string;
  thirdLabel: string;
  thirdValue: string;
  thirdMode: RescueOwnerMetricMode;
  onCopy?: () => void;
  onEditTitle?: () => void;
  onEditCover?: () => void;
};

export type RescueOwnerOverviewProps = {
  paragraphs: string[];
  expenseLabel: string;
  incomeLabel: string;
  latestStatus?: {
    statusLabel: string;
    timestamp: string;
    text: string;
    imageUrl?: string;
  };
};

export type RescueOwnerTimelineItem = {
  id: string;
  kind: RescueOwnerTimelineKind;
  badgeLabel: string;
  statusLabel?: string;
  timestamp: string;
  title: string;
  description?: string;
  amountLabel?: string;
  images?: string[];
  budgetPreviousLabel?: string;
  budgetCurrentLabel?: string;
};

export function RescueOwnerSummaryCard({
  coverImage,
  title,
  statusLabel,
  publicCaseId,
  budgetLabel,
  progressPercent,
  advanceProgressPercent,
  expenseLabel,
  supportLabel,
  thirdLabel,
  thirdValue,
  thirdMode,
  onCopy,
  onEditTitle,
  onEditCover,
}: RescueOwnerSummaryCardProps) {
  return (
    <SurfaceCard className="rescue-owner-card">
      <View className="rescue-owner-card__top">
        <View className="rescue-owner-card__cover-wrap" onTap={onEditCover}>
          <Image className="rescue-owner-card__cover" mode="aspectFill" src={coverImage} />
        </View>
        <View className="rescue-owner-card__copy">
          <View className="rescue-owner-card__title-row">
            <Text className="rescue-owner-card__title">{title}</Text>
            {onEditTitle ? (
              <View className="rescue-owner-card__icon-button" onTap={onEditTitle}>
                <Image
                  className="rescue-owner-card__copy-icon"
                  mode="aspectFit"
                  src={ownerEditIcon}
                />
              </View>
            ) : null}
            <StatusBadge className="rescue-owner-card__status" tone="brand">
              {statusLabel}
            </StatusBadge>
          </View>
          <View className="rescue-owner-card__id-row">
            <Text>ID: {publicCaseId}</Text>
            <View className="rescue-owner-card__icon-button" onTap={onCopy}>
              <Image
                className="rescue-owner-card__copy-icon"
                mode="aspectFit"
                src={ownerCopyIcon}
              />
            </View>
          </View>
        </View>
      </View>

      <RescueLedgerSummary
        className="rescue-owner-card__ledger"
        metrics={[
          {
            label: "已确认垫付",
            tone: "muted",
            value: expenseLabel,
          },
          {
            label: "已确认登记",
            tone: "brand",
            value: supportLabel,
          },
          {
            label: thirdLabel,
            tone: thirdMode === "balance" ? "success" : "danger",
            value: thirdValue,
          },
        ]}
        progressPercent={progressPercent}
        secondaryProgressPercent={advanceProgressPercent}
        targetAmountLabel={budgetLabel}
        variant="owner"
      />
    </SurfaceCard>
  );
}

export function RescueOwnerQuickActions({
  onExpense,
  onStatus,
  onIncome,
  onBudget,
}: {
  onExpense: () => void;
  onStatus: () => void;
  onIncome: () => void;
  onBudget: () => void;
}) {
  return (
    <View className="rescue-owner-actions">
      <View className="rescue-owner-actions__primary" onTap={onExpense}>
        <View className="rescue-owner-actions__primary-main">
          <Image
            className="rescue-owner-actions__icon--primary"
            mode="aspectFit"
            src={ownerActionExpenseIcon}
          />
          <Text className="rescue-owner-actions__primary-label">记录票据</Text>
        </View>
        <Image
          className="rescue-owner-actions__chevron-primary"
          mode="aspectFit"
          src={ownerActionChevronPrimaryIcon}
        />
      </View>

      <View className="rescue-owner-actions__grid">
        <SurfaceCard className="rescue-owner-actions__card" onTap={onStatus}>
          <Image
            className="rescue-owner-actions__icon"
            mode="aspectFit"
            src={ownerActionUpdateIcon}
          />
          <Text className="rescue-owner-actions__card-title">更新进展</Text>
          <Text className="rescue-owner-actions__card-subtitle">添加照片和阶段信息</Text>
        </SurfaceCard>

        <SurfaceCard
          className="rescue-owner-actions__card rescue-owner-actions__card--purple"
          onTap={onIncome}
        >
          <Image
            className="rescue-owner-actions__icon"
            mode="aspectFit"
            src={ownerActionIncomeIcon}
          />
          <Text className="rescue-owner-actions__card-title">处理登记</Text>
          <Text className="rescue-owner-actions__card-subtitle">处理线下转账或外部登记</Text>
        </SurfaceCard>

        <SurfaceCard className="rescue-owner-actions__wide" onTap={onBudget}>
          <View className="rescue-owner-actions__wide-main">
            <View className="rescue-owner-actions__budget-wrap">
              <Image
                className="rescue-owner-actions__budget-icon"
                mode="aspectFit"
                src={ownerActionBudgetIcon}
              />
            </View>
            <Text className="rescue-owner-actions__card-title">追加预算</Text>
          </View>
          <Image
            className="rescue-owner-actions__chevron"
            mode="aspectFit"
            src={ownerActionChevronIcon}
          />
        </SurfaceCard>
      </View>
    </View>
  );
}

export function RescueOwnerTabs({
  activeTab,
  onChange,
}: {
  activeTab: RescueOwnerTab;
  onChange: (tab: RescueOwnerTab) => void;
}) {
  return (
    <SegmentedTabs
      className="rescue-owner-tabs"
      value={activeTab}
      items={[
        { label: "记录摘要", value: "overview" },
        { label: "记录详情", value: "detail" },
      ]}
      onChange={(value) => onChange(value as RescueOwnerTab)}
    />
  );
}

export function RescueOwnerOverview({
  paragraphs,
  expenseLabel,
  incomeLabel,
  latestStatus,
}: RescueOwnerOverviewProps) {
  return (
    <View className="rescue-owner-overview">
      <SurfaceCard className="rescue-owner-overview__about">
        <Text className="rescue-owner-overview__title">关于这条记录</Text>
        {paragraphs.map((paragraph) => (
          <Text key={paragraph} className="rescue-owner-overview__paragraph">
            {paragraph}
          </Text>
        ))}
      </SurfaceCard>

      <View className="rescue-owner-overview__metrics">
        <SurfaceCard className="rescue-owner-overview__metric">
          <View className="rescue-owner-overview__metric-icon rescue-owner-overview__metric-icon--expense">
            <Image
              className="rescue-owner-overview__metric-icon-image"
              mode="aspectFit"
              src={summaryExpenseIcon}
            />
          </View>
          <Text className="rescue-owner-overview__metric-label">总支出</Text>
          <Text className="rescue-owner-overview__metric-value rescue-owner-overview__metric-value--expense">
            {expenseLabel}
          </Text>
        </SurfaceCard>

        <SurfaceCard className="rescue-owner-overview__metric">
          <View className="rescue-owner-overview__metric-icon rescue-owner-overview__metric-icon--income">
            <Image
              className="rescue-owner-overview__metric-icon-image"
              mode="aspectFit"
              src={summaryIncomeIcon}
            />
          </View>
          <Text className="rescue-owner-overview__metric-label">总收入</Text>
          <Text className="rescue-owner-overview__metric-value rescue-owner-overview__metric-value--income">
            {incomeLabel}
          </Text>
        </SurfaceCard>
      </View>

      {latestStatus ? (
        <SurfaceCard className="rescue-owner-overview__latest">
          <RescueRecordHeader
            badgeLabel="最新进展"
            badgeTone="info"
            statusLabel={latestStatus.statusLabel}
            timestamp={latestStatus.timestamp}
          />
          <Text className="rescue-owner-overview__paragraph">{latestStatus.text}</Text>
          {latestStatus.imageUrl ? (
            <RescueEvidenceGrid images={[latestStatus.imageUrl]} variant="overview" />
          ) : null}
        </SurfaceCard>
      ) : null}
    </View>
  );
}

export function RescueOwnerTimeline({
  items,
  emptyState,
  onReadonlyRecordTap,
}: {
  items: RescueOwnerTimelineItem[];
  emptyState?: {
    title: string;
    description: string;
  };
  onReadonlyRecordTap?: (item: RescueReadonlyRecordDetail) => void;
}) {
  if (!items.length) {
    return <RescueTimelineList emptyState={emptyState} items={[]} />;
  }

  const sharedItems: RescueTimelineSharedItem[] = items.map((item) => ({
    ...item,
    kind: item.kind === "income" ? "support" : item.kind,
    images: item.images,
  }));

  return (
    <RescueTimelineList
      emptyState={emptyState}
      items={sharedItems}
      onReadonlyRecordTap={onReadonlyRecordTap}
    />
  );
}
