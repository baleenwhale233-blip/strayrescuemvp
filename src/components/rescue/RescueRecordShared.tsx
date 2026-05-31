import { Image, Text, View } from "@tarojs/components";
import { cx } from "../ui/classNames";
import { StatusBadge, type StatusBadgeTone } from "../ui";
import "./RescueRecordShared.scss";

export type RescueRecordKind = "expense" | "status" | "budget" | "support";

export function getRescueRecordBadgeTone(kind: RescueRecordKind): StatusBadgeTone {
  switch (kind) {
    case "expense":
      return "danger";
    case "status":
      return "info";
    case "budget":
      return "warning";
    case "support":
      return "success";
    default:
      return "neutral";
  }
}

type RescueRecordHeaderProps = {
  badgeLabel: string;
  badgeTone?: StatusBadgeTone;
  className?: string;
  kind?: RescueRecordKind;
  statusLabel?: string;
  timestamp: string;
};

export function RescueRecordHeader({
  badgeLabel,
  badgeTone,
  className,
  kind,
  statusLabel,
  timestamp,
}: RescueRecordHeaderProps) {
  return (
    <View className={cx("rescue-record-header", className)}>
      <View className="rescue-record-header__badges">
        <StatusBadge
          className="rescue-record-header__badge"
          tone={badgeTone || (kind ? getRescueRecordBadgeTone(kind) : "neutral")}
        >
          {badgeLabel}
        </StatusBadge>
        {statusLabel ? (
          <StatusBadge className="rescue-record-header__badge" tone="brand">
            {statusLabel}
          </StatusBadge>
        ) : null}
      </View>
      <Text className="rescue-record-header__time">{timestamp}</Text>
    </View>
  );
}

type RescueBudgetComparisonProps = {
  className?: string;
  currentLabel: string;
  previousLabel: string;
};

export function RescueBudgetComparison({
  className,
  currentLabel,
  previousLabel,
}: RescueBudgetComparisonProps) {
  return (
    <View className={cx("rescue-budget-comparison", className)}>
      <View className="rescue-budget-comparison__column">
        <Text className="rescue-budget-comparison__label">原预算总计</Text>
        <Text className="rescue-budget-comparison__value rescue-budget-comparison__value--previous">
          {previousLabel}
        </Text>
      </View>
      <View className="rescue-budget-comparison__column">
        <Text className="rescue-budget-comparison__label">现预算总计</Text>
        <Text className="rescue-budget-comparison__value rescue-budget-comparison__value--current">
          {currentLabel}
        </Text>
      </View>
    </View>
  );
}

type RescueEvidenceGridVariant = "detail" | "overview" | "timeline" | "timeline-expense";

type RescueEvidenceGridProps = {
  className?: string;
  images: string[];
  onImageTap?: (src: string) => void;
  variant?: RescueEvidenceGridVariant;
  watermarkTone?: "scrim" | "strong";
};

function getEvidenceSlots(images: string[], variant: RescueEvidenceGridVariant) {
  if (variant !== "timeline-expense") {
    return images;
  }

  const slots = images.slice(0, 3);

  while (slots.length < 3) {
    slots.push("");
  }

  return slots;
}

export function RescueEvidenceGrid({
  className,
  images,
  onImageTap,
  variant = "timeline",
  watermarkTone = "strong",
}: RescueEvidenceGridProps) {
  const slots = getEvidenceSlots(images, variant);

  return (
    <View
      className={cx(
        "rescue-evidence-grid",
        `rescue-evidence-grid--${variant}`,
        slots.length === 1 && "rescue-evidence-grid--single",
        className,
      )}
    >
      {slots.map((src, index) => (
        <View
          key={src ? `${src}-${index}` : `evidence-empty-${index}`}
          className={cx("rescue-evidence-grid__item", !src && "rescue-evidence-grid__item--empty")}
          onTap={src && onImageTap ? () => onImageTap(src) : undefined}
        >
          {src ? (
            <>
              <Image className="rescue-evidence-grid__image" mode="aspectFill" src={src} />
              {variant === "detail" ? (
                <Text className="rescue-evidence-grid__count">
                  {index + 1}/{images.length}
                </Text>
              ) : null}
              <Text
                className={cx(
                  "rescue-evidence-grid__watermark",
                  `rescue-evidence-grid__watermark--${watermarkTone}`,
                )}
              >
                透明账本·严禁盗用
              </Text>
            </>
          ) : null}
        </View>
      ))}
    </View>
  );
}
