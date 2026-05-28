import { Image, Text, View } from "@tarojs/components";
import summaryExpenseIcon from "../../../../assets/rescue-detail/summary-expense-18.svg";
import summaryIncomeIcon from "../../../../assets/rescue-detail/summary-income-17.svg";
import type { PublicDetailVM } from "../../../../domain/canonical/types";
import {
  formatSignedAmount,
  getLatestOverviewImage,
  getLatestOverviewItem,
  getSummaryParagraphs,
} from "../detailViewModels";

export function GuestOverview({ detail }: { detail: PublicDetailVM }) {
  const paragraphs = getSummaryParagraphs(detail);
  const latestItem = getLatestOverviewItem(detail);
  const overviewImage = getLatestOverviewImage(detail, latestItem);

  return (
    <View className="guest-tab-content">
      <View className="guest-section-card theme-card">
        <Text className="guest-section-card__eyebrow">关于我</Text>
        <View className="guest-section-card__paragraphs">
          {paragraphs.map((paragraph) => (
            <Text key={paragraph} className="guest-section-card__paragraph">
              {paragraph}
            </Text>
          ))}
        </View>
      </View>

      <View className="guest-overview-metrics">
        <View className="guest-metric-card theme-card">
          <View className="guest-metric-card__icon guest-metric-card__icon--expense">
            <Image
              className="guest-metric-card__icon-image"
              mode="aspectFit"
              src={summaryExpenseIcon}
            />
          </View>
          <Text className="guest-metric-card__label">总支出</Text>
          <Text className="guest-metric-card__value guest-metric-card__value--expense">
            {formatSignedAmount(detail.ledger.confirmedExpenseAmountLabel, "-")}
          </Text>
        </View>

        <View className="guest-metric-card theme-card">
          <View className="guest-metric-card__icon guest-metric-card__icon--income">
            <Image
              className="guest-metric-card__icon-image"
              mode="aspectFit"
              src={summaryIncomeIcon}
            />
          </View>
          <Text className="guest-metric-card__label">总收入</Text>
          <Text className="guest-metric-card__value guest-metric-card__value--income">
            {formatSignedAmount(detail.ledger.supportedAmountLabel, "+")}
          </Text>
        </View>
      </View>

      {latestItem ? (
        <View className="guest-section-card theme-card">
          <View className="guest-section-card__header">
            <View className="guest-section-card__badges">
              <View className="guest-section-card__badge guest-section-card__badge--status">
                <Text>最新状态</Text>
              </View>
              <View className="guest-section-card__badge guest-section-card__badge--case">
                <Text>{detail.statusLabel}</Text>
              </View>
            </View>
            <Text className="guest-section-card__time">{latestItem.timestampLabel}</Text>
          </View>

          <Text className="guest-section-card__paragraph">
            {latestItem.description || latestItem.title}
          </Text>

          {overviewImage ? (
            <View className="guest-section-card__hero-image-wrap">
              <Image
                className="guest-section-card__hero-image"
                mode="aspectFill"
                src={overviewImage}
              />
              <Text className="guest-section-card__watermark">透明账本·严禁盗用</Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
