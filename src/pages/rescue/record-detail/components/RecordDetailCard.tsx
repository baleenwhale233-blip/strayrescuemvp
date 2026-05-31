import { Text, View } from "@tarojs/components";
import {
  RescueBudgetComparison,
  RescueEvidenceGrid,
  RescueRecordHeader,
  type RescueReadonlyRecordDetail,
} from "../../../../components/rescue";
import { SurfaceCard } from "../../../../components/ui";
import "./RecordDetailCard.scss";

export type RecordDetailExpenseItem = string | { amountLabel?: string; description: string };

export function RecordDetailCard({
  expenseItems,
  record,
  onImageTap,
}: {
  expenseItems: RecordDetailExpenseItem[];
  record: RescueReadonlyRecordDetail;
  onImageTap: (current: string) => void;
}) {
  return (
    <SurfaceCard className="record-detail-page__card">
      <RescueRecordHeader
        badgeLabel={record.badgeLabel}
        kind={record.kind}
        statusLabel={record.statusLabel}
        timestamp={record.timestamp}
      />

      <Text className="record-detail-page__title">{record.title}</Text>

      {record.description ? (
        <Text className="record-detail-page__description">{record.description}</Text>
      ) : null}

      {record.kind === "expense" ? (
        <View className="record-detail-page__expense-lines">
          {expenseItems.map((item, index) => (
            <View
              key={`${typeof item === "string" ? item : item.description}-${index}`}
              className="record-detail-page__expense-line"
            >
              <Text className="record-detail-page__expense-index">
                支出 {String(index + 1).padStart(2, "0")}
              </Text>
              <Text className="record-detail-page__expense-title">
                {typeof item === "string" ? item : item.description}
              </Text>
              {typeof item !== "string" && item.amountLabel ? (
                <Text className="record-detail-page__expense-index">{item.amountLabel}</Text>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}

      {record.amountLabel ? (
        <View className="record-detail-page__row">
          <Text className="record-detail-page__label">金额</Text>
          <Text className="record-detail-page__amount">{record.amountLabel}</Text>
        </View>
      ) : null}

      {record.budgetPreviousLabel && record.budgetCurrentLabel ? (
        <RescueBudgetComparison
          currentLabel={record.budgetCurrentLabel}
          previousLabel={record.budgetPreviousLabel}
        />
      ) : null}

      {record.images?.length ? (
        <RescueEvidenceGrid images={record.images} variant="detail" onImageTap={onImageTap} />
      ) : null}
    </SurfaceCard>
  );
}
