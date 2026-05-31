import { Text, View } from "@tarojs/components";
import { AppIcon } from "../AppIcon";
import { SurfaceCard } from "../ui";
import { cx } from "../ui/classNames";
import { RescueEvidenceGrid, RescueRecordHeader } from "./RescueRecordShared";
import "./RescueStatusUpdateCard.scss";

type RescueStatusUpdateImageVariant = "overview" | "timeline";

export type RescueStatusUpdateCardProps = {
  actionLabel?: string;
  badgeLabel: string;
  className?: string;
  description?: string;
  imageVariant?: RescueStatusUpdateImageVariant;
  images?: string[];
  onTap?: () => void;
  statusLabel?: string;
  timestamp: string;
  title?: string;
  watermarkTone?: "scrim" | "strong";
};

export function RescueStatusUpdateCard({
  actionLabel,
  badgeLabel,
  className,
  description,
  imageVariant = "timeline",
  images,
  onTap,
  statusLabel,
  timestamp,
  title,
  watermarkTone,
}: RescueStatusUpdateCardProps) {
  const evidenceImages = images?.filter(Boolean) || [];

  return (
    <SurfaceCard
      className={cx(
        "rescue-status-update-card",
        `rescue-status-update-card--${imageVariant}`,
        onTap && "rescue-status-update-card--clickable",
        className,
      )}
      onTap={onTap}
    >
      <RescueRecordHeader
        badgeLabel={badgeLabel}
        badgeTone="info"
        statusLabel={statusLabel}
        timestamp={timestamp}
      />

      {title ? <Text className="rescue-status-update-card__title">{title}</Text> : null}

      {description ? (
        <Text className="rescue-status-update-card__description">{description}</Text>
      ) : null}

      {evidenceImages.length ? (
        <RescueEvidenceGrid
          images={evidenceImages}
          variant={imageVariant}
          watermarkTone={watermarkTone}
        />
      ) : null}

      {actionLabel ? (
        <View className="rescue-status-update-card__action">
          <Text className="rescue-status-update-card__action-label">{actionLabel}</Text>
          <AppIcon
            className="rescue-status-update-card__action-icon"
            name="chevronRight"
            size={12}
            variant="brand"
          />
        </View>
      ) : null}
    </SurfaceCard>
  );
}
