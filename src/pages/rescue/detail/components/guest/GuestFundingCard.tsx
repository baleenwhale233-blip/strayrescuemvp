import { Text, View } from "@tarojs/components";
import { AppIcon } from "../../../../../components/AppIcon";
import { RescueLedgerSummary } from "../../../../../components/rescue";
import { SurfaceCard } from "../../../../../components/ui";
import type { PublicDetailVM } from "../../../../../domain/canonical/types";
import { getFundingStatusText } from "../../detailViewModels";
import "./GuestFundingCard.scss";

export function GuestFundingCard({ detail }: { detail: PublicDetailVM }) {
  return (
    <SurfaceCard className="detail-card">
      <View className="detail-card__head">
        <Text className="detail-card__title">档案资金状态</Text>
        <AppIcon className="detail-card__info-icon" name="info" size={14} variant="muted" />
      </View>

      <RescueLedgerSummary
        className="detail-card__ledger"
        metrics={[
          {
            label: "已确认支出",
            tone: "neutral",
            value: detail.ledger.confirmedExpenseAmountLabel,
          },
          {
            label: "已确认支持",
            tone: "brand",
            value: detail.ledger.supportedAmountLabel,
            valueTone: "brand",
          },
          {
            label: "当前缺口",
            tone: "danger",
            value: detail.ledger.remainingTargetAmountLabel,
            valueTone: "danger",
          },
        ]}
        notice={getFundingStatusText(detail)}
        progressPercent={detail.ledger.progressPercent}
        targetAmountLabel={detail.ledger.targetAmountLabel}
      />
    </SurfaceCard>
  );
}
