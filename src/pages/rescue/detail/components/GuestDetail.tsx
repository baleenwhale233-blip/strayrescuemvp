import { View } from "@tarojs/components";
import { useState } from "react";
import { NavBar } from "../../../../components/NavBar";
import { RescueGuestActionBar } from "../../../../components/rescue";
import type { PublicDetailVM } from "../../../../domain/canonical/types";
import type { DetailTab } from "../types";
import { GuestDetailSection } from "./guest/GuestDetailSection";
import { GuestFundingCard } from "./guest/GuestFundingCard";
import { GuestHeroSection } from "./guest/GuestHeroSection";
import { GuestOverviewSection } from "./guest/GuestOverviewSection";
import { GuestRescuerCard } from "./guest/GuestRescuerCard";
import { GuestTabs } from "./guest/GuestTabs";
import "./GuestDetail.scss";

export function GuestDetail({
  detail,
  onSupport,
  onClaim,
  onCopyPublicCaseId,
  onOpenHomepage,
}: {
  detail: PublicDetailVM;
  onSupport: () => void;
  onClaim: () => void;
  onCopyPublicCaseId: () => void;
  onOpenHomepage: () => void;
}) {
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");

  return (
    <View className="detail-page detail-page--guest">
      <NavBar showBack title="档案详情" />

      <GuestHeroSection detail={detail} onCopyPublicCaseId={onCopyPublicCaseId} />

      <View className="detail-page__body">
        <GuestFundingCard detail={detail} />

        <GuestRescuerCard detail={detail} onOpenHomepage={onOpenHomepage} />

        <GuestTabs activeTab={activeTab} onChange={setActiveTab} />

        {activeTab === "overview" ? (
          <GuestOverviewSection detail={detail} />
        ) : (
          <GuestDetailSection detail={detail} />
        )}
      </View>

      <RescueGuestActionBar onClaim={onClaim} onSupport={onSupport} />
    </View>
  );
}
