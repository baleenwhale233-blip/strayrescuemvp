import { Image, Text, View } from "@tarojs/components";
import { AppIcon } from "../AppIcon";
import { SegmentedTabs, StatusBadge, SurfaceCard } from "../ui";
import { RescueLedgerSummary } from "./RescueLedgerSummary";
import { RescueEvidenceGrid, RescueRecordHeader } from "./RescueRecordShared";
import {
  RescueTimelineList,
  type RescueReadonlyRecordDetail,
  type RescueTimelineSharedItem,
} from "./RescueTimelineShared";
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
                <AppIcon
                  className="rescue-owner-card__copy-icon"
                  name="pencil"
                  size={12}
                  variant="muted"
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
              <AppIcon
                className="rescue-owner-card__copy-icon"
                name="copy"
                size={12}
                variant="muted"
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
          <AppIcon
            className="rescue-owner-actions__icon--primary"
            name="receiptText"
            size={32}
            variant="inverse"
          />
          <Text className="rescue-owner-actions__primary-label">记录票据</Text>
        </View>
        <AppIcon
          className="rescue-owner-actions__chevron-primary"
          name="chevronRight"
          size={20}
          variant="inverse"
        />
      </View>

      <View className="rescue-owner-actions__grid">
        <SurfaceCard className="rescue-owner-actions__card" onTap={onStatus}>
          <AppIcon
            className="rescue-owner-actions__icon"
            name="trendingUp"
            size={32}
            variant="info"
          />
          <Text className="rescue-owner-actions__card-title">更新进展</Text>
          <Text className="rescue-owner-actions__card-subtitle">添加照片和阶段信息</Text>
        </SurfaceCard>

        <SurfaceCard
          className="rescue-owner-actions__card rescue-owner-actions__card--purple"
          onTap={onIncome}
        >
          <AppIcon
            className="rescue-owner-actions__icon"
            name="handHeart"
            size={32}
            variant="info"
          />
          <Text className="rescue-owner-actions__card-title">处理登记</Text>
          <Text className="rescue-owner-actions__card-subtitle">处理线下转账或外部登记</Text>
        </SurfaceCard>

        <SurfaceCard className="rescue-owner-actions__wide" onTap={onBudget}>
          <View className="rescue-owner-actions__wide-main">
            <View className="rescue-owner-actions__budget-wrap">
              <AppIcon
                className="rescue-owner-actions__budget-icon"
                name="walletCards"
                size={20}
                variant="warning"
              />
            </View>
            <Text className="rescue-owner-actions__card-title">追加预算</Text>
          </View>
          <AppIcon
            className="rescue-owner-actions__chevron"
            name="chevronRight"
            size={12}
            variant="muted"
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
            <AppIcon
              className="rescue-owner-overview__metric-icon-image"
              name="receiptText"
              size={16}
              variant="danger"
            />
          </View>
          <Text className="rescue-owner-overview__metric-label">总支出</Text>
          <Text className="rescue-owner-overview__metric-value rescue-owner-overview__metric-value--expense">
            {expenseLabel}
          </Text>
        </SurfaceCard>

        <SurfaceCard className="rescue-owner-overview__metric">
          <View className="rescue-owner-overview__metric-icon rescue-owner-overview__metric-icon--income">
            <AppIcon
              className="rescue-owner-overview__metric-icon-image"
              name="handHeart"
              size={16}
              variant="success"
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
