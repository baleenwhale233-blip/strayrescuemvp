import { Image, Text, View } from "@tarojs/components";
import copyWhiteIcon from "../../../../../assets/rescue-detail/copy-white-12.svg";
import evidenceCompleteOrangeIcon from "../../../../../assets/rescue-detail/evidence-complete-orange-14.svg";
import type { PublicDetailVM } from "../../../../../domain/canonical/types";
import { getHeroImage } from "../../detailViewModels";

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
          <View className="guest-hero__status-icon">
            <Text className="guest-hero__status-emoji">🏥</Text>
          </View>
          <Text className="guest-hero__status-text">{detail.statusLabel}</Text>
        </View>
        <Text className="guest-hero__title">{detail.title}</Text>
        <View className="guest-hero__id-row">
          <Text className="guest-hero__id">ID: {detail.publicCaseId}</Text>
          <View className="guest-hero__copy" onTap={onCopyPublicCaseId}>
            <Image className="guest-hero__copy-icon" mode="aspectFit" src={copyWhiteIcon} />
          </View>
        </View>
        <View className="guest-hero__evidence">
          <Image
            className="guest-hero__evidence-icon"
            mode="aspectFit"
            src={evidenceCompleteOrangeIcon}
          />
          <Text>记录和凭证较齐</Text>
        </View>
      </View>
    </View>
  );
}
