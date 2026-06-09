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
      title: "结束档案？",
      content: "请确认这份档案已经完成、已结案，或确实需要关闭。",
      confirmText: "确认结束",
      cancelText: "再等等",
    });

    if (!result.confirm) {
      return;
    }

    Taro.showToast({
      title: "结束档案链路待接入",
      icon: "none",
    });
  };

  if (detailStatus === "loading") {
    return (
      <PageShell key={reloadSeed} className="detail-page-shell">
        <DetailPageState
          loading
          title="正在加载档案详情"
          description="正在整理头图、资金状态和最新进展，请稍等片刻。"
        />
      </PageShell>
    );
  }

  if (detailStatus === "error" || !publicDetail) {
    return (
      <PageShell key={reloadSeed} className="detail-page-shell">
        <DetailPageState
          title="档案详情加载失败"
          description="暂时没能加载这份档案的详情，你可以稍后重试一次。"
          actionText="重新加载"
          onAction={loadDetailPage}
        />
      </PageShell>
    );
  }

  return (
    <PageShell key={reloadSeed} className="detail-page-shell">
      <PageMeta pageStyle={supportOpen ? "overflow: hidden;" : "overflow: visible;"} />
      {ownerDetail ? (
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
      ) : (
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
      )}

      {supportData ? (
        <SupportSheet
          visible={supportOpen}
          support={supportData}
          onClose={() => setSupportOpen(false)}
          onCopyWechat={(wechatId) => {
            Taro.setClipboardData({ data: wechatId });
          }}
          onSaveQrHint={() => {
            Taro.showToast({
              title: "请长按二维码保存，稍后可在微信里联系",
              icon: "none",
            });
          }}
        />
      ) : null}
    </PageShell>
  );
}
