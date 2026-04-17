import { Image, Text, View } from "@tarojs/components";
import Taro, { useDidShow, useRouter } from "@tarojs/taro";
import { useState } from "react";
import { DiscoverCaseCard } from "../../../components/DiscoverCaseCard";
import { NavBar } from "../../../components/NavBar";
import { applyTitleOverrideToPublicDetail } from "../../../data/caseTitleOverride";
import rescuerAvatarFallback from "../../../assets/detail/rescuer-avatar.png";
import {
  getCanonicalBundles,
  loadHomepageCaseCardVMs,
  loadPublicDetailVMByCaseId,
  loadRescuerHomepageVM,
  type HomepageCaseCardVM,
  type RescuerHomepageVM,
} from "../../../domain/canonical/repository";
import { getHomepageCaseCardVM } from "../../../domain/canonical/selectors/getDiscoverCardVM";
import { getPublicDetailVM } from "../../../domain/canonical/selectors/getPublicDetailVM";
import type { CanonicalCaseBundle, CanonicalRescuer } from "../../../domain/canonical/types";
import "./index.scss";

type RescuerHomeVM = RescuerHomepageVM;

function applyDisplayOverrideToCard(bundle: CanonicalCaseBundle) {
  const card = getHomepageCaseCardVM(bundle);
  const detail = applyTitleOverrideToPublicDetail(getPublicDetailVM(bundle));

  if (!detail) {
    return card;
  }

  return {
    ...card,
    title: detail.title,
    statusLabel: detail.statusLabel,
    coverImageUrl: detail.heroImageUrl,
  };
}

function buildRescuerHomeVM(rescuerId?: string): RescuerHomeVM | undefined {
  const bundles = getCanonicalBundles();
  const targetRescuerId = rescuerId || bundles[0]?.rescuer.id;

  if (!targetRescuerId) {
    return undefined;
  }

  const rescuerBundles = bundles
    .filter(
      (bundle) =>
        bundle.rescuer.id === targetRescuerId &&
        bundle.case.visibility === "published",
    )
    .sort((left, right) => right.case.updatedAt.localeCompare(left.case.updatedAt));

  const rescuer = rescuerBundles[0]?.rescuer ||
    bundles.find((bundle) => bundle.rescuer.id === targetRescuerId)?.rescuer;

  if (!rescuer) {
    return undefined;
  }

  return {
    rescuer,
    cards: rescuerBundles.map(applyDisplayOverrideToCard),
    profileEntryEnabled: true,
  };
}

function getFundingStatusSummary(detail: ReturnType<typeof applyTitleOverrideToPublicDetail>) {
  if (!detail) {
    return "即将筹满";
  }

  if (detail.ledger.supportedAmount >= detail.ledger.confirmedExpenseAmount) {
    return "当前垫付已覆盖";
  }

  if (detail.ledger.confirmedExpenseAmount - detail.ledger.supportedAmount <= 2000) {
    return "即将筹满";
  }

  return "‼️ 救助人垫付较多";
}

function buildCardFromDetail(
  detail: NonNullable<ReturnType<typeof applyTitleOverrideToPublicDetail>>,
): HomepageCaseCardVM {
  const rescuerAdvanceAmount = Math.max(
    detail.ledger.confirmedExpenseAmount - detail.ledger.supportedAmount,
    0,
  );
  const fundedBaseAmount = Math.max(
    detail.ledger.confirmedExpenseAmount,
    detail.ledger.supportedAmount,
    1,
  );

  return {
    caseId: detail.caseId,
    publicCaseId: detail.publicCaseId,
    rescuerId: detail.rescuerId,
    sourceKind: "remote",
    title: detail.title,
    aboutSummary: detail.summary,
    statusLabel: detail.statusLabel,
    statusTone: detail.statusTone,
    coverImageUrl: detail.heroImageUrl,
    updatedAtLabel: detail.updatedAtLabel,
    latestStatusSummary: detail.latestTimelineSummary || detail.summary,
    fundingStatusSummary: getFundingStatusSummary(detail),
    evidenceLevel: "basic",
    homepageEligibilityStatus: "public_but_not_eligible",
    homepageEligibilityReason: "",
    progressPercent: detail.ledger.progressPercent,
    amountLabel: `${detail.ledger.supportedAmountLabel} / ${detail.ledger.targetAmountLabel}`,
    targetAmountLabel: detail.ledger.targetAmountLabel,
    supportedAmountLabel: detail.ledger.supportedAmountLabel,
    rescuerAdvanceAmountLabel: `¥${rescuerAdvanceAmount.toLocaleString("zh-CN")}`,
    supportedProgressPercent: Math.min(
      Math.round((detail.ledger.supportedAmount / fundedBaseAmount) * 100),
      100,
    ),
    rescuerAdvanceProgressPercent: Math.min(
      Math.round((rescuerAdvanceAmount / fundedBaseAmount) * 100),
      100,
    ),
  };
}

async function loadRescuerHomeVM(
  rescuerId?: string,
  caseId?: string,
): Promise<RescuerHomeVM | undefined> {
  const remoteVm = await loadRescuerHomepageVM({ rescuerId, caseId });
  if (remoteVm) {
    const cards = await Promise.all(
      remoteVm.cards.map(async (card) => {
        const detail = applyTitleOverrideToPublicDetail(
          await loadPublicDetailVMByCaseId(card.caseId),
        );

        return detail
          ? {
              ...card,
              title: detail.title,
              statusLabel: detail.statusLabel,
              coverImageUrl: detail.heroImageUrl,
            }
          : card;
      }),
    );

    return {
      ...remoteVm,
      cards,
    };
  }

  const localVm = buildRescuerHomeVM(rescuerId);
  if (localVm) {
    return localVm;
  }

  const currentDetail = applyTitleOverrideToPublicDetail(
    await loadPublicDetailVMByCaseId(caseId),
  );

  if (!currentDetail) {
    return undefined;
  }

  const homepageCards = await loadHomepageCaseCardVMs();
  const cards = homepageCards.filter(
    (card) => card.rescuerId === currentDetail.rescuer.id,
  );
  const hasCurrentCase = cards.some((card) => card.caseId === currentDetail.caseId);

  return {
    rescuer: {
      id: currentDetail.rescuer.id,
      name: currentDetail.rescuer.name,
      avatarUrl: currentDetail.rescuer.avatarUrl,
      stats: currentDetail.rescuer.stats,
    },
    cards: hasCurrentCase ? cards : [buildCardFromDetail(currentDetail), ...cards],
    profileEntryEnabled: true,
  };
}

export default function RescuerHomePage() {
  const router = useRouter();
  const [vm, setVm] = useState<RescuerHomeVM | undefined>();

  useDidShow(() => {
    loadRescuerHomeVM(router.params?.rescuerId, router.params?.caseId)
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
