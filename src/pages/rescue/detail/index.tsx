import { PageMeta, View } from "@tarojs/components";
import Taro, { useRouter } from "@tarojs/taro";
import { useState } from "react";
import { SupportSheet } from "../../../components/SupportSheet";
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

  if (detailStatus === "loading") {
    return (
      <View key={reloadSeed} className="page-shell detail-page-shell">
        <DetailPageState
          loading
          title="正在加载记录明细"
          description="正在整理头图、资金状态和最新进展，请稍等片刻。"
        />
      </View>
    );
  }

  if (detailStatus === "error" || !publicDetail) {
    return (
      <View key={reloadSeed} className="page-shell detail-page-shell">
        <DetailPageState
          title="记录明细加载失败"
          description="当前没能拿到这条记录的明细，你可以稍后重试一次。"
          actionText="重新加载"
          onAction={loadDetailPage}
        />
      </View>
    );
  }

  return (
    <View key={reloadSeed} className="page-shell detail-page-shell">
      <PageMeta pageStyle={supportOpen ? "overflow: hidden;" : "overflow: visible;"} />
      {mode === "guest" ? (
        <GuestDetail
          detail={publicDetail}
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
          onChangeCover={handleChangeCover}
          onRenameTitle={handleRenameTitle}
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
    </View>
  );
}
