import { Image, Text, View } from "@tarojs/components";
import { AppIcon, type IconName } from "../../../../../components/AppIcon";
import type { PublicDetailVM } from "../../../../../domain/canonical/types";
import { getHeroImage } from "../../detailViewModels";
import "./GuestHeroSection.scss";

function getStatusIconName(statusLabel: string): IconName {
  if (statusLabel.includes("紧急")) {
    return "siren";
  }

  if (statusLabel.includes("康复") || statusLabel.includes("恢复")) {
    return "home";
  }

  if (statusLabel.includes("领养") || statusLabel.includes("安置")) {
    return "heartHandshake";
  }

  if (statusLabel.includes("遗憾离世")) {
    return "rainbow";
  }

  return "stethoscope";
}

export function GuestHeroSection({
  detail,
  onCopyPublicCaseId,
}: {
  detail: PublicDetailVM;
  onCopyPublicCaseId: () => void;
}) {
  return (
    <View className="guest-hero">
      <Image className="guest-hero__image" mode="aspectFill" src={getHeroImage(detail)} />
      <View className="guest-hero__mask" />
      <View className="guest-hero__content">
        <View className="guest-hero__status">
          <AppIcon
            className="guest-hero__status-icon"
            name={getStatusIconName(detail.statusLabel)}
            size={14}
            variant="inverse"
          />
          <Text className="guest-hero__status-text">{detail.statusLabel}</Text>
        </View>
        <Text className="guest-hero__title">{detail.title}</Text>
        <View className="guest-hero__id-row">
          <Text className="guest-hero__id">ID: {detail.publicCaseId}</Text>
          <View className="guest-hero__copy" onTap={onCopyPublicCaseId}>
            <AppIcon className="guest-hero__copy-icon" name="copy" size={12} variant="inverse" />
          </View>
        </View>
        <View className="guest-hero__evidence">
          <AppIcon
            className="guest-hero__evidence-icon"
            name="badgeCheck"
            size={14}
            variant="brand"
          />
          <Text>已上传多项记录</Text>
        </View>
      </View>
    </View>
  );
}
