import { Text, View } from "@tarojs/components";
import Taro, { useDidShow, useRouter } from "@tarojs/taro";
import { useState } from "react";
import { DiscoverCaseCard } from "../../../components/rescue";
import { Avatar, EmptyState, PageShell, SurfaceCard } from "../../../components/ui";
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
      url: `/pages/rescue/detail/index?id=${caseId}`,
    });
  };

  if (!vm) {
    return (
      <PageShell className="rescuer-home-page">
        <NavBar showBack title="记录主页" />
        <EmptyState
          className="rescuer-home-page__empty-card"
          description="可能是链接失效，或记录维护者资料暂时不可见。"
          title="暂未找到记录维护者信息"
        />
      </PageShell>
    );
  }

  return (
    <PageShell className="rescuer-home-page">
      <NavBar showBack title="记录主页" />

      <SurfaceCard className="rescuer-home-page__profile">
        <Avatar
          className="rescuer-home-page__avatar"
          fallbackSrc={rescuerAvatarFallback}
          src={vm.rescuer.avatarUrl}
          variant="raised"
        />
        <View className="rescuer-home-page__profile-copy">
          <Text className="rescuer-home-page__name">{vm.rescuer.name}</Text>
          <Text className="rescuer-home-page__meta">
            已建立 {vm.cards.length || vm.rescuer.stats.publishedCaseCount} 份记录档案 ·{" "}
            {vm.rescuer.stats.verifiedReceiptCount} 张已上传凭证
          </Text>
        </View>
      </SurfaceCard>

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
          <EmptyState
            className="rescuer-home-page__empty-card"
            description="公开后的救助记录会显示在这里，方便支持者连续查看。"
            title="还没有公开记录档案"
          />
        )}
      </View>
    </PageShell>
  );
}
