import { Image, Text, View } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { AppIcon } from "./AppIcon";
import linkArrowOrangeIcon from "../assets/rescue-detail/link-arrow-orange-8.svg";
import "./RescueTimelineShared.scss";

export type RescueTimelineSharedKind = "expense" | "status" | "budget" | "support";

export type RescueTimelineSharedItem = {
  id: string;
  caseId?: string;
  recordType?: "expense" | "progress_update" | "budget_adjustment" | "support";
  recordId?: string;
  kind: RescueTimelineSharedKind;
  badgeLabel: string;
  statusLabel?: string;
  timestamp: string;
  title: string;
  description?: string;
  amountLabel?: string;
  expenseItems?: Array<{
    description: string;
    amountLabel?: string;
  }>;
  images?: string[];
  budgetPreviousLabel?: string;
  budgetCurrentLabel?: string;
};

const RECORD_DETAIL_STORAGE_KEY = "rescue-readonly-record-detail";

export type RescueReadonlyRecordDetail = RescueTimelineSharedItem;

function openReadonlyRecordDetail(item: RescueTimelineSharedItem) {
  Taro.setStorageSync(RECORD_DETAIL_STORAGE_KEY, item);
  const recordType = item.recordType || (item.kind === "status" ? "progress_update" : item.kind);
  const query = [
    `id=${encodeURIComponent(item.recordId || item.id)}`,
    `kind=${item.kind}`,
    `recordType=${recordType}`,
    item.caseId ? `caseId=${encodeURIComponent(item.caseId)}` : "",
  ]
    .filter(Boolean)
    .join("&");

  Taro.navigateTo({
    url: `/pages/rescue/record-detail/index?${query}`,
  });
}

export function getStoredReadonlyRecordDetail() {
  const stored = Taro.getStorageSync(RECORD_DETAIL_STORAGE_KEY);
  return stored && typeof stored === "object"
    ? (stored as RescueReadonlyRecordDetail)
    : undefined;
}

function getBadgeClass(kind: RescueTimelineSharedKind) {
  return `rescue-timeline__badge rescue-timeline__badge--${kind}`;
}

function getDotClass(kind: RescueTimelineSharedKind) {
  return `rescue-timeline__dot rescue-timeline__dot--${kind}`;
}

function canOpenReadonlyDetail(item: RescueTimelineSharedItem) {
  return (
    item.kind === "expense" ||
    (item.kind === "status" && item.recordType === "progress_update")
  );
}

export function RescueTimelineList({
  items,
  emptyState,
}: {
  items: RescueTimelineSharedItem[];
  emptyState?: {
    title: string;
    description: string;
  };
}) {
  if (!items.length) {
    return emptyState ? (
      <View className="rescue-timeline__empty theme-card">
        <View className="rescue-timeline__empty-icon">
          <AppIcon name="fileText" size={24} />
        </View>
        <Text className="rescue-timeline__empty-title">{emptyState.title}</Text>
        <Text className="rescue-timeline__empty-copy">{emptyState.description}</Text>
      </View>
    ) : null;
  }

  return (
    <View className="rescue-timeline">
      {items.map((item) => (
        <View key={item.id} className="rescue-timeline__item">
          <View className={getDotClass(item.kind)} />
          <View
            className={`rescue-timeline__card theme-card ${
              canOpenReadonlyDetail(item) ? "rescue-timeline__card--clickable" : ""
            }`}
            onTap={() => {
              if (canOpenReadonlyDetail(item)) {
                openReadonlyRecordDetail(item);
              }
            }}
          >
            <View className="rescue-timeline__header">
              <View className="rescue-timeline__badges">
                <View className={getBadgeClass(item.kind)}>
                  <Text>{item.badgeLabel}</Text>
                </View>
                {item.kind === "status" && item.statusLabel ? (
                  <View className="rescue-timeline__badge rescue-timeline__badge--case">
                    <Text>{item.statusLabel}</Text>
                  </View>
                ) : null}
              </View>
              <Text className="rescue-timeline__time">{item.timestamp}</Text>
            </View>

            {item.kind !== "support" ? (
              <Text className="rescue-timeline__title">{item.title}</Text>
            ) : null}

            {item.description && item.kind !== "support" && item.kind !== "expense" ? (
              <Text className="rescue-timeline__description">{item.description}</Text>
            ) : null}

            {item.kind === "support" ? (
              <View className="rescue-timeline__support-row">
                <View className="rescue-timeline__support-copy">
                  <Text className="rescue-timeline__support-title">{item.title}</Text>
                  {item.description ? (
                    <Text className="rescue-timeline__support-note">{item.description}</Text>
                  ) : null}
                </View>
                {item.amountLabel ? (
                  <Text className="rescue-timeline__support-amount">{item.amountLabel}</Text>
                ) : null}
              </View>
            ) : null}

            {item.budgetPreviousLabel && item.budgetCurrentLabel ? (
              <View className="rescue-timeline__budget-panel">
                <View className="rescue-timeline__budget-column">
                  <Text className="rescue-timeline__budget-label">原预算总计</Text>
                  <Text className="rescue-timeline__budget-value rescue-timeline__budget-value--muted">
                    {item.budgetPreviousLabel}
                  </Text>
                </View>
                <View className="rescue-timeline__budget-column">
                  <Text className="rescue-timeline__budget-label">现预算总计</Text>
                  <Text className="rescue-timeline__budget-value rescue-timeline__budget-value--budget">
                    {item.budgetCurrentLabel}
                  </Text>
                </View>
              </View>
            ) : null}

            {item.amountLabel && item.kind !== "support" ? (
              <View className="rescue-timeline__amount-row">
                <Text className="rescue-timeline__amount">{item.amountLabel}</Text>
                {item.kind === "expense" ? (
                  <View className="rescue-timeline__link-wrap">
                    <Text className="rescue-timeline__link">查看详情</Text>
                    <Image
                      className="rescue-timeline__link-icon"
                      mode="aspectFit"
                      src={linkArrowOrangeIcon}
                    />
                  </View>
                ) : null}
              </View>
            ) : null}

            {item.images?.length ? (
              <View
                className={`rescue-timeline__images ${
                  item.images.length === 1 ? "rescue-timeline__images--single" : ""
                }`}
              >
                {item.images.map((src) => (
                  <View key={src} className="rescue-timeline__image-wrap">
                    <Image className="rescue-timeline__image" mode="aspectFill" src={src} />
                    <Text className="rescue-timeline__watermark">透明账本·严禁盗用</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {item.kind === "status" ? (
              <View className="rescue-timeline__readonly-link">
                <Text className="rescue-timeline__link">查看更新</Text>
                <Image
                  className="rescue-timeline__link-icon"
                  mode="aspectFit"
                  src={linkArrowOrangeIcon}
                />
              </View>
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );
}
