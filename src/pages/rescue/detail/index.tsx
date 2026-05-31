import { PageMeta } from "@tarojs/components";
import Taro, { useRouter } from "@tarojs/taro";
import { useState } from "react";
import { SupportSheet } from "../../../components/rescue";
import { PageShell } from "../../../components/ui";
import { DetailPageState } from "./components/DetailPageState";
import { GuestDetail } from "./components/GuestDetail";
import { OwnerDetail } from "./components/OwnerDetail";
import { useCaseProfileActions } from "./hooks/useCaseProfileActions";
import { useGuestActionLock } from "./hooks/useGuestActionLock";
import { useRescueDetailData } from "./hooks/useRescueDetailData";
import { useRescueDetailShare } from "./hooks/useRescueDetailShare";
import "./index.scss";

export default function RescueDetailPage() {
  const router = useRouter();
  const [supportOpen, setSupportOpen] = useState(false);
  const mode = router.params?.mode === "guest" ? "guest" : "owner";
  const initialOwnerTab = router.params?.tab === "detail" ? "detail" : "overview";
  const caseId = router.params?.id;
  const { runGuestActionWithLock } = useGuestActionLock();
  const {
    detailStatus,
    publicDetail,
    ownerDetail,
    supportData,
    reloadSeed,
    setPublicDetail,
    setOwnerDetail,
    loadDetailPage,
  } = useRescueDetailData({
    caseId,
    mode,
  });

  useRescueDetailShare({
    publicDetail,
    caseId,
  });

  const { handleRenameTitle, handleChangeCover } = useCaseProfileActions({
    caseId,
    ownerDetail,
    setOwnerDetail,
    setPublicDetail,
  });

  const navigateToCaseAction = (path: string) => {
    const currentCaseId = publicDetail?.caseId || caseId;
    if (!currentCaseId) {
      return;
    }

    Taro.navigateTo({
      url: `${path}?caseId=${currentCaseId}`,
    });
  };

  const handleFinishRecord = async () => {
    const result = await Taro.showModal({
      title: "结束记录？",
      content: "请确认这条记录已经完成、已结案，或确实需要关闭。",
      confirmText: "确认结束",
      cancelText: "再等等",
    });

    if (!result.confirm) {
      return;
    }

    Taro.showToast({
      title: "结束记录链路待接入",
      icon: "none",
    });
  };

  if (detailStatus === "loading") {
    return (
      <PageShell key={reloadSeed} className="detail-page-shell">
        <DetailPageState
          loading
          title="正在加载记录明细"
          description="正在整理头图、资金状态和最新进展，请稍等片刻。"
        />
      </PageShell>
    );
  }

  if (detailStatus === "error" || !publicDetail) {
    return (
      <PageShell key={reloadSeed} className="detail-page-shell">
        <DetailPageState
          title="记录明细加载失败"
          description="当前没能拿到这条记录的明细，你可以稍后重试一次。"
          actionText="重新加载"
          onAction={loadDetailPage}
        />
      </PageShell>
    );
  }

  return (
    <PageShell key={reloadSeed} className="detail-page-shell">
      <PageMeta pageStyle={supportOpen ? "overflow: hidden;" : "overflow: visible;"} />
      {mode === "guest" ? (
        <GuestDetail
          detail={publicDetail}
          onCopyPublicCaseId={() => {
            Taro.setClipboardData({ data: publicDetail.publicCaseId });
          }}
          onOpenHomepage={() => {
            Taro.navigateTo({
              url: `/pages/rescuer/home/index?rescuerId=${publicDetail.rescuer.id}&caseId=${publicDetail.caseId}`,
            });
          }}
          onSupport={() =>
            runGuestActionWithLock(() => {
              if (supportOpen) {
                return;
              }

              setSupportOpen(true);
            })
          }
          onClaim={() =>
            runGuestActionWithLock(() =>
              Taro.navigateTo({
                url: `/pages/support/claim/index?id=${publicDetail.caseId}`,
              }),
            )
          }
        />
      ) : ownerDetail ? (
        <OwnerDetail
          initialTab={initialOwnerTab}
          onBudget={() => navigateToCaseAction("/pages/rescue/budget-update/index")}
          onChangeCover={handleChangeCover}
          onCopyPublicCaseId={() => {
            Taro.setClipboardData({ data: ownerDetail.publicCaseId });
          }}
          onExpense={() => navigateToCaseAction("/pages/rescue/expense/index")}
          onFinishRecord={handleFinishRecord}
          onIncome={() => navigateToCaseAction("/pages/support/review/index")}
          onRenameTitle={handleRenameTitle}
          onStatus={() => navigateToCaseAction("/pages/rescue/progress-update/index")}
          ownerDetail={ownerDetail}
          publicDetail={publicDetail}
        />
      ) : null}

      {supportData ? (
        <SupportSheet
          visible={supportOpen}
          support={supportData}
          onClose={() => setSupportOpen(false)}
        />
      ) : null}
    </PageShell>
  );
}
