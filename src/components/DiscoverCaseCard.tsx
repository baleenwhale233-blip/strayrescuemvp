import { Image, Text, View } from "@tarojs/components";
import evidenceCompleteIcon from "../assets/icons/evidence-complete-14.svg";
import type { HomepageCaseCardVM } from "../domain/canonical/repository";
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
    complete: "证据链完整",
    basic: "仅基础证据链",
    needs_attention: "证据待补充",
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

function getFundingToneClass(fundingStatusSummary: string) {
  if (fundingStatusSummary === "当前垫付已覆盖") {
    return "discover-card__funding--covered";
  }

  if (fundingStatusSummary === "即将筹满") {
    return "discover-card__funding--almost";
  }

  return "discover-card__funding--pressure";
}

function getProgressWidth(percent: number) {
  return `${Math.min(Math.max(percent, 0), 100)}%`;
}

export function DiscoverCaseCard({
  item,
  onTap,
}: {
  item: HomepageCaseCardVM;
  onTap?: () => void;
}) {
  return (
    <View className="discover-card theme-card" onTap={onTap}>
      <View className="discover-card__cover">
        {item.coverImageUrl ? (
          <Image
            className="discover-card__cover-image"
            mode="aspectFill"
            src={item.coverImageUrl}
          />
        ) : null}
        <View className="discover-card__status">
          <Text className="discover-card__status-emoji">
            {getStatusEmoji(item.statusLabel)}
          </Text>
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

        <View className="discover-card__ledger-head">
          <Text className="discover-card__budget">总预算 {item.targetAmountLabel}</Text>
          <Text
            className={`discover-card__funding ${getFundingToneClass(item.fundingStatusSummary)}`}
          >
            {item.fundingStatusSummary}
          </Text>
        </View>

        <View className="discover-card__progress">
          <View
            className="discover-card__progress-advance"
            style={{
              width: getProgressWidth(
                item.supportedProgressPercent + item.rescuerAdvanceProgressPercent,
              ),
            }}
          />
          <View
            className="discover-card__progress-fill"
            style={{ width: getProgressWidth(item.supportedProgressPercent) }}
          />
        </View>

        <View className="discover-card__ledger-meta">
          <View className="discover-card__ledger-meta-item">
            <View className="discover-card__ledger-meta-dot discover-card__ledger-meta-dot--brand" />
            <Text className="discover-card__ledger-meta-label">已确认支持</Text>
            <Text className="discover-card__ledger-meta-value">{item.supportedAmountLabel}</Text>
          </View>
          <View className="discover-card__ledger-meta-item discover-card__ledger-meta-item--end">
            <View className="discover-card__ledger-meta-dot discover-card__ledger-meta-dot--slate" />
            <Text className="discover-card__ledger-meta-label">已确认垫付</Text>
            <Text className="discover-card__ledger-meta-value">{item.rescuerAdvanceAmountLabel}</Text>
          </View>
        </View>

        <View className="discover-card__footer">
          <EvidenceLabel level={item.evidenceLevel} />
          <Text className="discover-card__updated">{item.updatedAtLabel}</Text>
        </View>
      </View>
    </View>
  );
}
