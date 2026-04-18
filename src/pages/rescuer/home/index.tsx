import { Image, Text, View } from "@tarojs/components";
import Taro, { useDidShow, useRouter } from "@tarojs/taro";
import { useState } from "react";
import { DiscoverCaseCard } from "../../../components/DiscoverCaseCard";
import { NavBar } from "../../../components/NavBar";
import rescuerAvatarFallback from "../../../assets/detail/rescuer-avatar.png";
import {
  loadRescuerHomepageVM,
  type RescuerHomepageVM,
} from "../../../domain/canonical/repository";
import "./index.scss";

type RescuerHomeVM = RescuerHomepageVM;

export default function RescuerHomePage() {
  const router = useRouter();
  const [vm, setVm] = useState<RescuerHomeVM | undefined>();

  useDidShow(() => {
    loadRescuerHomepageVM({
      rescuerId: router.params?.rescuerId,
      caseId: router.params?.caseId,
    })
      .then(setVm)
      .catch(() => setVm(undefined));
  });

  const handleOpenCase = (caseId: string) => {
    Taro.navigateTo({
      url: `/pages/rescue/detail/index?id=${caseId}&mode=guest`,
    });
  };

  if (!vm) {
    return (
      <View className="page-shell rescuer-home-page">
        <NavBar showBack title="救助人主页" />
        <Text className="rescuer-home-page__empty">暂未找到救助人信息</Text>
      </View>
    );
  }

  return (
    <View className="page-shell rescuer-home-page">
      <NavBar showBack title="救助人主页" />

      <View className="rescuer-home-page__profile">
        <Image
          className="rescuer-home-page__avatar"
          mode="aspectFill"
          src={vm.rescuer.avatarUrl || rescuerAvatarFallback}
        />
        <View className="rescuer-home-page__profile-copy">
          <Text className="rescuer-home-page__name">{vm.rescuer.name}</Text>
          <Text className="rescuer-home-page__meta">
            已建立 {vm.cards.length || vm.rescuer.stats.publishedCaseCount} 份救助档案 · 上传{" "}
            {vm.rescuer.stats.verifiedReceiptCount} 张真实凭证
          </Text>
        </View>
      </View>

      <View className="rescuer-home-page__list">
        {vm.cards.length ? (
          vm.cards.map((card) => (
            <DiscoverCaseCard
              key={card.caseId}
              item={card}
              onTap={() => handleOpenCase(card.caseId)}
            />
          ))
        ) : (
          <Text className="rescuer-home-page__empty">还没有公开救助档案</Text>
        )}
      </View>
    </View>
  );
}
