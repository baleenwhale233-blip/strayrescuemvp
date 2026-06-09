import { Text, View } from "@tarojs/components";
import { SurfaceCard } from "../../../../components/ui";
import type { CaseRecordDetailVM } from "../../../../domain/canonical/repository";
import { getExpenseRevisionIndexLabel, getOrderedExpenseRevisions } from "../revisionHistory";
import "./RecordDetailRevisionHistory.scss";

type ExpenseRevision = NonNullable<CaseRecordDetailVM["revisionHistory"]>[number];

export function RecordDetailRevisionHistory({ revisions }: { revisions?: ExpenseRevision[] }) {
  if (!revisions?.length) {
    return null;
  }

  const orderedRevisions = getOrderedExpenseRevisions(revisions);

  return (
    <SurfaceCard className="record-detail-page__revision-card">
      <Text className="record-detail-page__revision-heading">修改记录</Text>
      <Text className="record-detail-page__revision-description">
        每次修改都会保留原值与新值，方便之后查档。
      </Text>

      <View className="record-detail-page__revision-list">
        {orderedRevisions.map((revision, index) => (
          <View key={revision.revisionId || index} className="record-detail-page__revision-item">
            <View className="record-detail-page__revision-meta">
              <Text className="record-detail-page__revision-time">{revision.editedAtLabel}</Text>
              <Text className="record-detail-page__revision-index">
                {getExpenseRevisionIndexLabel(index)}
              </Text>
            </View>

            <Text className="record-detail-page__revision-title">
              {revision.previous.summary || "原支出"} {"->"} {revision.next.summary || "新支出"}
            </Text>

            <View className="record-detail-page__revision-amounts">
              <Text className="record-detail-page__revision-amount">
                原 {revision.previous.amountLabel || "未记录"}
              </Text>
              <Text className="record-detail-page__revision-arrow">{"->"}</Text>
              <Text className="record-detail-page__revision-amount record-detail-page__revision-amount--next">
                新 {revision.next.amountLabel || "未记录"}
              </Text>
            </View>

            {revision.reason ? (
              <Text className="record-detail-page__revision-reason">{revision.reason}</Text>
            ) : null}
          </View>
        ))}
      </View>
    </SurfaceCard>
  );
}
