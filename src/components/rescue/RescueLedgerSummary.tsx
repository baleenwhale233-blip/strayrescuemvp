import { Text, View } from "@tarojs/components";
import { ProgressBar, SectionHeader } from "../ui";
import { cx } from "../ui/classNames";
import "./RescueLedgerSummary.scss";

export type RescueLedgerMetricTone =
  | "neutral"
  | "muted"
  | "brand"
  | "danger"
  | "success"
  | "pending";
export type RescueLedgerStatusTone = "neutral" | "warning" | "danger";

export type RescueLedgerMetric = {
  align?: "start" | "end";
  label: string;
  tone?: RescueLedgerMetricTone;
  value: string;
  valueTone?: RescueLedgerMetricTone;
};

type RescueLedgerSummaryProps = {
  className?: string;
  metricLayout?: "inline" | "stacked";
  metrics: RescueLedgerMetric[];
  notice?: string;
  progressPercent: number;
  secondaryProgressPercent?: number;
  statusLabel?: string;
  statusTone?: RescueLedgerStatusTone;
  targetAmountLabel: string;
  variant?: "compact" | "detail" | "owner";
};

function toneClass(block: string, tone: string) {
  return `${block}--${tone}`;
}

export function RescueLedgerSummary({
  className,
  metricLayout = "stacked",
  metrics,
  notice,
  progressPercent,
  secondaryProgressPercent,
  statusLabel,
  statusTone = "neutral",
  targetAmountLabel,
  variant = "detail",
}: RescueLedgerSummaryProps) {
  return (
    <View
      className={cx(
        "rescue-ledger-summary",
        `rescue-ledger-summary--${variant}`,
        `rescue-ledger-summary--${metricLayout}`,
        className,
      )}
    >
      <SectionHeader
        aside={
          statusLabel ? (
            <Text
              className={cx(
                "rescue-ledger-summary__status",
                toneClass("rescue-ledger-summary__status", statusTone),
              )}
            >
              {statusLabel}
            </Text>
          ) : null
        }
        className="rescue-ledger-summary__head"
        title={`总预算 ${targetAmountLabel}`}
      />

      <ProgressBar
        className="rescue-ledger-summary__progress"
        value={progressPercent}
        secondaryValue={secondaryProgressPercent}
      />

      <View className="rescue-ledger-summary__metrics">
        {metrics.map((metric) => {
          const dotTone = metric.tone || "neutral";
          const valueTone = metric.valueTone || "neutral";

          return (
            <View
              key={`${metric.label}-${metric.value}`}
              className={cx(
                "rescue-ledger-summary__metric",
                metric.align === "end" && "rescue-ledger-summary__metric--end",
              )}
            >
              <View className="rescue-ledger-summary__metric-label">
                <View
                  className={cx(
                    "rescue-ledger-summary__dot",
                    toneClass("rescue-ledger-summary__dot", dotTone),
                  )}
                />
                <Text>{metric.label}</Text>
              </View>
              <Text
                className={cx(
                  "rescue-ledger-summary__metric-value",
                  toneClass("rescue-ledger-summary__metric-value", valueTone),
                )}
              >
                {metric.value}
              </Text>
            </View>
          );
        })}
      </View>

      {notice ? (
        <View className="rescue-ledger-summary__notice">
          <Text>{notice}</Text>
        </View>
      ) : null}
    </View>
  );
}
