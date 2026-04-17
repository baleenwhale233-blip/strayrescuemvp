import { Image, Text, View } from "@tarojs/components";
import {
  RescueTimelineList,
  type RescueTimelineSharedItem,
} from "./RescueTimelineShared";
import ownerActionBudgetIcon from "../assets/rescue-detail/owner/action-budget.svg";
import ownerActionChevronIcon from "../assets/rescue-detail/owner/action-chevron.svg";
import ownerActionChevronPrimaryIcon from "../assets/rescue-detail/owner/action-chevron-primary.svg";
import ownerActionExpenseIcon from "../assets/rescue-detail/owner/action-expense.svg";
import ownerActionIncomeIcon from "../assets/rescue-detail/owner/action-income.svg";
import ownerActionUpdateIcon from "../assets/rescue-detail/owner/action-update.svg";
import ownerCopyIcon from "../assets/rescue-detail/owner/copy-muted.svg";
import ownerEditIcon from "../assets/rescue-detail/owner/edit-muted.svg";
import summaryExpenseIcon from "../assets/rescue-detail/summary-expense-18.svg";
import summaryIncomeIcon from "../assets/rescue-detail/summary-income-17.svg";
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
    imageUrl: string;
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
    <View className="rescue-owner-card theme-card">
      <View className="rescue-owner-card__top">
        <View className="rescue-owner-card__cover-wrap" onTap={onEditCover}>
          <Image className="rescue-owner-card__cover" mode="aspectFill" src={coverImage} />
        </View>
        <View className="rescue-owner-card__copy">
          <View className="rescue-owner-card__title-row">
            <Text className="rescue-owner-card__title">{title}</Text>
            {onEditTitle ? (
              <View className="rescue-owner-card__icon-button" onTap={onEditTitle}>
                <Image className="rescue-owner-card__copy-icon" mode="aspectFit" src={ownerEditIcon} />
              </View>
            ) : null}
            <Text className="rescue-owner-card__status">{statusLabel}</Text>
          </View>
          <View className="rescue-owner-card__id-row">
            <Text>ID: {publicCaseId}</Text>
            <View className="rescue-owner-card__icon-button" onTap={onCopy}>
              <Image className="rescue-owner-card__copy-icon" mode="aspectFit" src={ownerCopyIcon} />
            </View>
          </View>
        </View>
      </View>

      <View className="rescue-owner-card__ledger">
        <Text className="rescue-owner-card__budget">总预算 {budgetLabel}</Text>
        <View className="rescue-owner-card__progress">
          <View
            className="rescue-owner-card__progress-advance"
            style={{ width: `${Math.min(advanceProgressPercent ?? 0, 100)}%` }}
          />
          <View
            className="rescue-owner-card__progress-fill"
            style={{ width: `${Math.min(progressPercent, 100)}%` }}
          />
        </View>
        <View className="rescue-owner-card__metrics">
          <View className="rescue-owner-card__metric">
            <View className="rescue-owner-card__metric-label">
              <View className="rescue-owner-card__dot rescue-owner-card__dot--expense" />
              <Text>已确认垫付</Text>
            </View>
            <Text>{expenseLabel}</Text>
          </View>
          <View className="rescue-owner-card__metric">
            <View className="rescue-owner-card__metric-label">
              <View className="rescue-owner-card__dot rescue-owner-card__dot--support" />
              <Text>已确认支持</Text>
            </View>
            <Text>{supportLabel}</Text>
          </View>
          <View className="rescue-owner-card__metric">
            <View className="rescue-owner-card__metric-label">
              <View
                className={`rescue-owner-card__dot ${
                  thirdMode === "balance"
                    ? "rescue-owner-card__dot--balance"
                    : "rescue-owner-card__dot--gap"
                }`}
              />
              <Text>{thirdLabel}</Text>
            </View>
            <Text>{thirdValue}</Text>
          </View>
        </View>
      </View>
    </View>
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
          <Image className="rescue-owner-actions__icon--primary" mode="aspectFit" src={ownerActionExpenseIcon} />
          <Text className="rescue-owner-actions__primary-label">记一笔支出</Text>
        </View>
        <Image className="rescue-owner-actions__chevron-primary" mode="aspectFit" src={ownerActionChevronPrimaryIcon} />
      </View>

      <View className="rescue-owner-actions__grid">
        <View className="rescue-owner-actions__card theme-card" onTap={onStatus}>
          <Image className="rescue-owner-actions__icon" mode="aspectFit" src={ownerActionUpdateIcon} />
          <Text className="rescue-owner-actions__card-title">写进展更新</Text>
          <Text className="rescue-owner-actions__card-subtitle">添加照片及阶段状态</Text>
        </View>

        <View className="rescue-owner-actions__card rescue-owner-actions__card--purple theme-card" onTap={onIncome}>
          <Image className="rescue-owner-actions__icon" mode="aspectFit" src={ownerActionIncomeIcon} />
          <Text className="rescue-owner-actions__card-title">记场外收入</Text>
          <Text className="rescue-owner-actions__card-subtitle">审核支持者私下转账</Text>
        </View>

        <View className="rescue-owner-actions__wide theme-card" onTap={onBudget}>
          <View className="rescue-owner-actions__wide-main">
            <View className="rescue-owner-actions__budget-wrap">
              <Image className="rescue-owner-actions__budget-icon" mode="aspectFit" src={ownerActionBudgetIcon} />
            </View>
            <Text className="rescue-owner-actions__card-title">追加预算</Text>
          </View>
          <Image className="rescue-owner-actions__chevron" mode="aspectFit" src={ownerActionChevronIcon} />
        </View>
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
    <View className="rescue-owner-tabs">
      <View
        className={`rescue-owner-tabs__item ${
          activeTab === "overview" ? "rescue-owner-tabs__item--active" : ""
        }`}
        onTap={() => onChange("overview")}
      >
        <Text>救助摘要</Text>
      </View>
      <View
        className={`rescue-owner-tabs__item ${
          activeTab === "detail" ? "rescue-owner-tabs__item--active" : ""
        }`}
        onTap={() => onChange("detail")}
      >
        <Text>救助详情</Text>
      </View>
    </View>
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
      <View className="rescue-owner-overview__about theme-card">
        <Text className="rescue-owner-overview__title">关于我</Text>
        {paragraphs.map((paragraph) => (
          <Text key={paragraph} className="rescue-owner-overview__paragraph">
            {paragraph}
          </Text>
        ))}
      </View>

      <View className="rescue-owner-overview__metrics">
        <View className="rescue-owner-overview__metric theme-card">
          <View className="rescue-owner-overview__metric-icon rescue-owner-overview__metric-icon--expense">
            <Image className="rescue-owner-overview__metric-icon-image" mode="aspectFit" src={summaryExpenseIcon} />
          </View>
          <Text className="rescue-owner-overview__metric-label">总支出</Text>
          <Text className="rescue-owner-overview__metric-value rescue-owner-overview__metric-value--expense">
            {expenseLabel}
          </Text>
        </View>

        <View className="rescue-owner-overview__metric theme-card">
          <View className="rescue-owner-overview__metric-icon rescue-owner-overview__metric-icon--income">
            <Image className="rescue-owner-overview__metric-icon-image" mode="aspectFit" src={summaryIncomeIcon} />
          </View>
          <Text className="rescue-owner-overview__metric-label">总收入</Text>
          <Text className="rescue-owner-overview__metric-value rescue-owner-overview__metric-value--income">
            {incomeLabel}
          </Text>
        </View>
      </View>

      {latestStatus ? (
        <View className="rescue-owner-overview__latest theme-card">
          <View className="rescue-owner-overview__latest-header">
            <View className="rescue-owner-overview__latest-badges">
              <Text className="rescue-owner-overview__badge rescue-owner-overview__badge--status">
                最新状态
              </Text>
              <Text className="rescue-owner-overview__badge rescue-owner-overview__badge--case">
                {latestStatus.statusLabel}
              </Text>
            </View>
            <Text className="rescue-owner-overview__time">{latestStatus.timestamp}</Text>
          </View>
          <Text className="rescue-owner-overview__paragraph">{latestStatus.text}</Text>
          <View className="rescue-owner-overview__latest-image-wrap">
            <Image className="rescue-owner-overview__latest-image" mode="aspectFill" src={latestStatus.imageUrl} />
            <Text className="rescue-owner-overview__watermark">透明账本·严禁盗用</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

export function RescueOwnerTimeline({
  items,
  emptyState,
}: {
  items: RescueOwnerTimelineItem[];
  emptyState?: {
    title: string;
    description: string;
  };
}) {
  if (!items.length) {
    return (
      <RescueTimelineList
        emptyState={emptyState}
        items={[]}
      />
    );
  }

  const sharedItems: RescueTimelineSharedItem[] = items.map((item) => ({
    ...item,
    kind: item.kind === "income" ? "support" : item.kind,
    images: item.images,
  }));

  return <RescueTimelineList emptyState={emptyState} items={sharedItems} />;
}
