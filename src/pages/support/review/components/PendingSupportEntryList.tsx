import { Image, Text, View } from "@tarojs/components";
import { AppButton, EmptyState, SurfaceCard } from "../../../../components/ui";
import type { PendingSupportEntryCard } from "../types";
import "./PendingSupportEntryList.scss";

type UnmatchedReason = "duplicate_submission" | "other";

export function PendingSupportEntryList({
  entries,
  onConfirm,
  onUnmatched,
}: {
  entries: PendingSupportEntryCard[];
  onConfirm: (entryId: string) => void;
  onUnmatched: (entryId: string, reason: UnmatchedReason) => void;
}) {
  return (
    <View className="support-review-page__list">
      {entries.map((entry) => (
        <SurfaceCard key={entry.id} className="support-review-page__card">
          <View className="support-review-page__card-top">
            {entry.proofUrl ? (
              <View className="support-review-page__proof">
                <Image
                  className="support-review-page__proof-image"
                  mode="aspectFill"
                  src={entry.proofUrl}
                />
              </View>
            ) : (
              <View className="support-review-page__proof support-review-page__proof--empty">
                <Text className="support-review-page__proof-empty-text">未附凭证</Text>
              </View>
            )}

            <View className="support-review-page__card-copy">
              <View className="support-review-page__card-head">
                <Text className="support-review-page__card-name">{entry.supporterName}</Text>
                <Text className="support-review-page__card-time">{entry.latestEntryAtLabel}</Text>
              </View>
              <Text className="support-review-page__card-amount">{entry.amountLabel}</Text>
              <Text className="support-review-page__card-note">
                “{entry.note || "待处理登记记录"}”
              </Text>
            </View>
          </View>

          <View className="support-review-page__actions">
            <AppButton
              className="support-review-page__button"
              size="md"
              variant="secondary"
              onTap={() => onUnmatched(entry.id, "duplicate_submission")}
            >
              标记重复
            </AppButton>
            <View className="support-review-page__actions-right">
              <AppButton
                className="support-review-page__button"
                size="md"
                variant="secondary"
                onTap={() => onUnmatched(entry.id, "other")}
              >
                暂未匹配
              </AppButton>
              <AppButton
                className="support-review-page__button"
                size="md"
                variant="primary"
                onTap={() => onConfirm(entry.id)}
              >
                确认记录
              </AppButton>
            </View>
          </View>
        </SurfaceCard>
      ))}

      {!entries.length ? (
        <EmptyState
          className="support-review-page__empty"
          iconName="handCoins"
          title="暂时没有待处理登记"
          description="新的登记提交后，会先出现在这里等待处理。"
        />
      ) : null}
    </View>
  );
}
