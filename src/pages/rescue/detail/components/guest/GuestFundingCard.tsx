import { Image, Text, View } from "@tarojs/components";
import infoMutedIcon from "../../../../../assets/rescue-detail/info-muted-13.svg";
import type { PublicDetailVM } from "../../../../../domain/canonical/types";
import { getFundingStatusText } from "../../detailViewModels";

export function GuestFundingCard({ detail }: { detail: PublicDetailVM }) {
  return (
    <View className="detail-card theme-card">
      <View className="detail-card__head">
        <Text className="detail-card__title">记录资金状态</Text>
        <Image className="detail-card__info-icon" mode="aspectFit" src={infoMutedIcon} />
      </View>

      <View className="detail-card__budget-row">
        <Text className="detail-card__budget-text">总预算 {detail.ledger.targetAmountLabel}</Text>
      </View>

      <View className="detail-card__progress">
        <View
          className="detail-card__progress-fill"
          style={{ width: `${Math.min(detail.ledger.progressPercent, 100)}%` }}
        />
      </View>

      <View className="detail-card__metric">
        <View className="detail-card__metric-label">
          <View className="detail-card__metric-dot detail-card__metric-dot--slate" />
          <Text>当前垫付</Text>
        </View>
        <Text className="detail-card__metric-value">
          {detail.ledger.confirmedExpenseAmountLabel}
        </Text>
      </View>
      <View className="detail-card__metric">
        <View className="detail-card__metric-label">
          <View className="detail-card__metric-dot detail-card__metric-dot--brand" />
          <Text>已确认登记</Text>
        </View>
        <Text className="detail-card__metric-value detail-card__metric-value--brand">
          {detail.ledger.supportedAmountLabel}
        </Text>
      </View>
      <View className="detail-card__metric">
        <View className="detail-card__metric-label">
          <View className="detail-card__metric-dot detail-card__metric-dot--danger" />
          <Text>当前差额</Text>
        </View>
        <Text className="detail-card__metric-value detail-card__metric-value--danger">
          {detail.ledger.verifiedGapAmountLabel}
        </Text>
      </View>

      <View className="detail-card__notice">
        <Text>{getFundingStatusText(detail)}</Text>
      </View>
    </View>
  );
}
