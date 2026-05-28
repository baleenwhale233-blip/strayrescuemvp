import { View } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useState } from "react";
import { NavBar } from "../../../../components/NavBar";
import type { PublicDetailVM } from "../../../../domain/canonical/types";
import type { DetailTab } from "../types";
import { GuestActionBar } from "./guest/GuestActionBar";
import { GuestDetailSection } from "./guest/GuestDetailSection";
import { GuestFundingCard } from "./guest/GuestFundingCard";
import { GuestHeroSection } from "./guest/GuestHeroSection";
import { GuestOverviewSection } from "./guest/GuestOverviewSection";
import { GuestRescuerCard } from "./guest/GuestRescuerCard";
import { GuestTabs } from "./guest/GuestTabs";

export function GuestDetail({
  detail,
  onSupport,
  onClaim,
}: {
  detail: PublicDetailVM;
  onSupport: () => void;
  onClaim: () => void;
}) {
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");

  const handleCopyPublicCaseId = () => {
    Taro.setClipboardData({ data: detail.publicCaseId });
  };

  const handleOpenHomepage = () => {
    Taro.navigateTo({
      url: `/pages/rescuer/home/index?rescuerId=${detail.rescuer.id}&caseId=${detail.caseId}`,
    });
  };

  return (
    <View className="detail-page detail-page--guest">
      <NavBar showBack title="记录明细" />

      <GuestHeroSection detail={detail} onCopyPublicCaseId={handleCopyPublicCaseId} />

      <View className="detail-page__body">
        <GuestFundingCard detail={detail} />

        <GuestRescuerCard detail={detail} onOpenHomepage={handleOpenHomepage} />

        <GuestTabs activeTab={activeTab} onChange={setActiveTab} />

        {activeTab === "overview" ? (
          <GuestOverviewSection detail={detail} />
        ) : (
          <GuestDetailSection detail={detail} />
        )}
      </View>

      <GuestActionBar onClaim={onClaim} onSupport={onSupport} />
    </View>
  );
}
