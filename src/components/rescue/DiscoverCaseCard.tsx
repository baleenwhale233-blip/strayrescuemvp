import { Image, Text, View } from "@tarojs/components";
import evidenceCompleteIcon from "../../assets/icons/evidence-complete-14.svg";
import { SurfaceCard } from "../ui";
import type { HomepageCaseCardVM } from "../../domain/canonical/repository";
import { RescueLedgerSummary, type RescueLedgerStatusTone } from "./RescueLedgerSummary";
import "./DiscoverCaseCard.scss";

function getStatusEmoji(statusLabel: string) {
  if (statusLabel.includes("紧急")) {
    return "🚨";
  }

  if (statusLabel.includes("康复") || statusLabel.includes("恢复")) {
    return "🏡";
  }

  if (statusLabel.includes("领养") || statusLabel.includes("安置")) {
    return "💖";
  }

  if (statusLabel.includes("遗憾离世")) {
    return "🌈";
  }

  return "🏥";
}

function EvidenceLabel({ level }: { level: HomepageCaseCardVM["evidenceLevel"] }) {
  const labelMap = {
    complete: "记录和凭证较齐",
    basic: "已有基础凭证",
    needs_attention: "还要补凭证",
  } as const;

  return (
    <View className="discover-card__evidence">
      {level === "complete" ? (
        <Image
          className="discover-card__evidence-icon"
          mode="aspectFit"
          src={evidenceCompleteIcon}
        />
      ) : (
        <View className="discover-card__evidence-dot" />
      )}
      <Text>{labelMap[level]}</Text>
    </View>
  );
}

function getFundingTone(fundingStatusSummary: string): RescueLedgerStatusTone {
  if (fundingStatusSummary === "当前垫付已覆盖") {
    return "neutral";
  }

  if (fundingStatusSummary === "即将筹满") {
    return "warning";
  }

  return "danger";
}

export function DiscoverCaseCard({
  item,
  onTap,
}: {
  item: HomepageCaseCardVM;
  onTap?: () => void;
}) {
  return (
    <SurfaceCard className="discover-card" interactive onTap={onTap}>
      <View className="discover-card__cover">
        {item.coverImageUrl ? (
          <Image
            className="discover-card__cover-image"
            mode="aspectFill"
            src={item.coverImageUrl}
          />
        ) : null}
        <View className="discover-card__status">
          <Text className="discover-card__status-emoji">{getStatusEmoji(item.statusLabel)}</Text>
          <Text className="discover-card__status-text">{item.statusLabel}</Text>
        </View>
      </View>

      <View className="discover-card__body">
        <View className="discover-card__title-row">
          <Text className="discover-card__title">{item.title}</Text>
          <Text className="discover-card__id">ID: {item.publicCaseId}</Text>
        </View>

        <View className="discover-card__copy-group">
          <Text className="discover-card__line">
            <Text className="discover-card__line-label">关于我：</Text>
            <Text>{item.aboutSummary}</Text>
          </Text>

          <Text className="discover-card__line">
            <Text className="discover-card__line-label">当前进展：</Text>
            <Text>{item.latestStatusSummary}</Text>
          </Text>
        </View>

        <RescueLedgerSummary
          className="discover-card__ledger"
          metricLayout="inline"
          metrics={[
            {
              label: "已确认登记",
              tone: "brand",
              value: item.supportedAmountLabel,
            },
            {
              align: "end",
              label: "已确认垫付",
              tone: "pending",
              value: item.rescuerAdvanceAmountLabel,
            },
          ]}
          progressPercent={item.supportedProgressPercent}
          secondaryProgressPercent={
            item.supportedProgressPercent + item.rescuerAdvanceProgressPercent
          }
          statusLabel={item.fundingStatusSummary}
          statusTone={getFundingTone(item.fundingStatusSummary)}
          targetAmountLabel={item.targetAmountLabel}
          variant="compact"
        />

        <View className="discover-card__footer">
          <EvidenceLabel level={item.evidenceLevel} />
          <Text className="discover-card__updated">{item.updatedAtLabel}</Text>
        </View>
      </View>
    </SurfaceCard>
  );
}
