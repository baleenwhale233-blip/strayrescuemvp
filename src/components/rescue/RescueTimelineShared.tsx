import { Image, Text, View } from "@tarojs/components";
import Taro from "@tarojs/taro";
import linkArrowOrangeIcon from "../../assets/rescue-detail/link-arrow-orange-8.svg";
import { EmptyState, SurfaceCard } from "../ui";
import {
  RescueBudgetComparison,
  RescueEvidenceGrid,
  RescueRecordHeader,
  type RescueRecordKind,
} from "./RescueRecordShared";
import "./RescueTimelineShared.scss";

export type RescueTimelineSharedKind = RescueRecordKind;

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
  return stored && typeof stored === "object" ? (stored as RescueReadonlyRecordDetail) : undefined;
}

function getDotClass(kind: RescueTimelineSharedKind) {
  return `rescue-timeline__dot rescue-timeline__dot--${kind}`;
}

function canOpenReadonlyDetail(item: RescueTimelineSharedItem) {
  return (
    item.kind === "expense" || (item.kind === "status" && item.recordType === "progress_update")
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
      <EmptyState
        className="rescue-timeline__empty"
        description={emptyState.description}
        iconName="fileText"
        title={emptyState.title}
      />
    ) : null;
  }

  return (
    <View className="rescue-timeline">
      {items.map((item) => (
        <View key={item.id} className="rescue-timeline__item">
          <View className={getDotClass(item.kind)} />
          <SurfaceCard
            className={`rescue-timeline__card ${
              canOpenReadonlyDetail(item) ? "rescue-timeline__card--clickable" : ""
            }`}
            onTap={() => {
              if (canOpenReadonlyDetail(item)) {
                openReadonlyRecordDetail(item);
              }
            }}
          >
            <RescueRecordHeader
              badgeLabel={item.badgeLabel}
              kind={item.kind}
              statusLabel={item.kind === "status" ? item.statusLabel : undefined}
              timestamp={item.timestamp}
            />

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
              <RescueBudgetComparison
                currentLabel={item.budgetCurrentLabel}
                previousLabel={item.budgetPreviousLabel}
              />
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
              <RescueEvidenceGrid
                images={item.images}
                variant={item.kind === "expense" ? "timeline-expense" : "timeline"}
              />
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
          </SurfaceCard>
        </View>
      ))}
    </View>
  );
}
