import { Image, Text, View } from "@tarojs/components";
import { StatusBadge, SurfaceCard } from "../ui";
import { cx } from "../ui/classNames";
import "./RescueCaseSummaryCard.scss";

type RescueCaseSummaryCardProps = {
  className?: string;
  coverSrc?: string;
  mediaVariant?: "plain" | "framed";
  onCoverError?: () => void;
  publicCaseId: string;
  rescueStartedAtLabel: string;
  statusLabel: string;
  title: string;
};

export function RescueCaseSummaryCard({
  className,
  coverSrc,
  mediaVariant = "plain",
  onCoverError,
  publicCaseId,
  rescueStartedAtLabel,
  statusLabel,
  title,
}: RescueCaseSummaryCardProps) {
  return (
    <SurfaceCard
      className={cx(
        "rescue-case-summary-card",
        mediaVariant === "framed" && "rescue-case-summary-card--framed",
        className,
      )}
    >
      <View className="rescue-case-summary-card__media">
        {coverSrc ? (
          <Image
            className="rescue-case-summary-card__image"
            mode="aspectFill"
            src={coverSrc}
            onError={onCoverError}
          />
        ) : (
          <View className="rescue-case-summary-card__placeholder" />
        )}
      </View>
      <View className="rescue-case-summary-card__copy">
        <View className="rescue-case-summary-card__head">
          <Text className="rescue-case-summary-card__title">{title}</Text>
          <StatusBadge className="rescue-case-summary-card__status" tone="brand">
            {statusLabel}
          </StatusBadge>
        </View>
        <Text className="rescue-case-summary-card__meta">ID: {publicCaseId}</Text>
        <Text className="rescue-case-summary-card__meta rescue-case-summary-card__meta--muted">
          {rescueStartedAtLabel}
        </Text>
      </View>
    </SurfaceCard>
  );
}
