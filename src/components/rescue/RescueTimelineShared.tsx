import { Text, View } from "@tarojs/components";
import { AppIcon } from "../AppIcon";
import { EmptyState, SurfaceCard } from "../ui";
import {
  RescueBudgetComparison,
  RescueEvidenceGrid,
  RescueRecordHeader,
  type RescueRecordKind,
} from "./RescueRecordShared";
import { RescueStatusUpdateCard } from "./RescueStatusUpdateCard";
import "./RescueTimelineShared.scss";

export type RescueTimelineSharedKind = RescueRecordKind;

export type RescueTimelineSharedItem = {
  id: string;
  caseId?: string;
  editable?: boolean;
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

export type RescueReadonlyRecordDetail = RescueTimelineSharedItem;

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
  onReadonlyRecordTap,
}: {
  items: RescueTimelineSharedItem[];
  emptyState?: {
    title: string;
    description: string;
  };
  onReadonlyRecordTap?: (item: RescueReadonlyRecordDetail) => void;
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
      {items.map((item) => {
        const readonlyOpenable = Boolean(onReadonlyRecordTap && canOpenReadonlyDetail(item));
        const cardClassName = `rescue-timeline__card ${
          readonlyOpenable ? "rescue-timeline__card--clickable" : ""
        }`;
        const handleReadonlyTap = () => {
          if (readonlyOpenable && onReadonlyRecordTap) {
            onReadonlyRecordTap(item);
          }
        };

        return (
          <View key={item.id} className="rescue-timeline__item">
            <View className={getDotClass(item.kind)} />
            {item.kind === "status" ? (
              <RescueStatusUpdateCard
                actionLabel="查看更新"
                badgeLabel={item.badgeLabel}
                className={cardClassName}
                description={item.description}
                images={item.images}
                imageVariant="timeline"
                onTap={readonlyOpenable ? handleReadonlyTap : undefined}
                statusLabel={item.statusLabel}
                timestamp={item.timestamp}
                title={item.title}
              />
            ) : (
              <SurfaceCard
                className={cardClassName}
                onTap={readonlyOpenable ? handleReadonlyTap : undefined}
              >
                <RescueRecordHeader
                  badgeLabel={item.badgeLabel}
                  kind={item.kind}
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
                        <AppIcon
                          className="rescue-timeline__link-icon"
                          name="chevronRight"
                          size={12}
                          variant="brand"
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
              </SurfaceCard>
            )}
          </View>
        );
      })}
    </View>
  );
}
