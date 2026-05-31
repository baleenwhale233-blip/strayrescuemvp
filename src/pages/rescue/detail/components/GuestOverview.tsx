import { Text, View } from "@tarojs/components";
import { AppIcon } from "../../../../components/AppIcon";
import { SurfaceCard } from "../../../../components/ui";
import { RescueStatusUpdateCard } from "../../../../components/rescue";
import type { PublicDetailVM } from "../../../../domain/canonical/types";
import {
  formatSignedAmount,
  getLatestOverviewImage,
  getLatestOverviewItem,
  getSummaryParagraphs,
} from "../detailViewModels";
import "./GuestOverview.scss";

export function GuestOverview({ detail }: { detail: PublicDetailVM }) {
  const paragraphs = getSummaryParagraphs(detail);
  const latestItem = getLatestOverviewItem(detail);
  const overviewImage = getLatestOverviewImage(detail, latestItem);

  return (
    <View className="guest-tab-content">
      <SurfaceCard className="guest-section-card">
        <Text className="guest-section-card__eyebrow">关于我</Text>
        <View className="guest-section-card__paragraphs">
          {paragraphs.map((paragraph) => (
            <Text key={paragraph} className="guest-section-card__paragraph">
              {paragraph}
            </Text>
          ))}
        </View>
      </SurfaceCard>

      <View className="guest-overview-metrics">
        <SurfaceCard className="guest-metric-card">
          <View className="guest-metric-card__icon guest-metric-card__icon--expense">
            <AppIcon
              className="guest-metric-card__icon-image"
              name="receiptText"
              size={16}
              variant="danger"
            />
          </View>
          <Text className="guest-metric-card__label">总支出</Text>
          <Text className="guest-metric-card__value guest-metric-card__value--expense">
            {formatSignedAmount(detail.ledger.confirmedExpenseAmountLabel, "-")}
          </Text>
        </SurfaceCard>

        <SurfaceCard className="guest-metric-card">
          <View className="guest-metric-card__icon guest-metric-card__icon--income">
            <AppIcon
              className="guest-metric-card__icon-image"
              name="handHeart"
              size={16}
              variant="success"
            />
          </View>
          <Text className="guest-metric-card__label">总收入</Text>
          <Text className="guest-metric-card__value guest-metric-card__value--income">
            {formatSignedAmount(detail.ledger.supportedAmountLabel, "+")}
          </Text>
        </SurfaceCard>
      </View>

      {latestItem ? (
        <RescueStatusUpdateCard
          badgeLabel="最新状态"
          className="guest-section-card"
          description={latestItem.description || latestItem.title}
          images={overviewImage ? [overviewImage] : undefined}
          imageVariant="overview"
          statusLabel={detail.statusLabel}
          timestamp={latestItem.timestampLabel}
          watermarkTone="scrim"
        />
      ) : null}
    </View>
  );
}
