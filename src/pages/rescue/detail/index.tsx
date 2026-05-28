import { PageMeta, View } from "@tarojs/components";
import Taro, { useDidShow, useRouter, useShareAppMessage } from "@tarojs/taro";
import { useRef, useState } from "react";
import {
  clearCaseProfileLocalFallback,
  loadOwnerDetailVMByCaseId,
  loadPublicDetailVMByCaseId,
  loadSupportSheetDataByCaseId,
  recordCaseProfileLocalFallback,
  updateRemoteCaseProfileByCaseId,
  type OwnerDetailVM,
} from "../../../domain/canonical/repository";
import { SupportSheet } from "../../../components/SupportSheet";
import { createSubmissionGuard } from "../../../utils/submissionGuard";
import guestHeroCat from "../../../assets/detail/guest-hero-cat.png";
import { uploadCaseAssetImage } from "../../../domain/canonical/repository/cloudbaseClient";
import type { PublicDetailVM, SupportSheetData } from "../../../domain/canonical/types";
import { getSharePath, getShareTitle } from "./detailViewModels";
import { DetailPageState } from "./components/DetailPageState";
import { GuestDetail } from "./components/GuestDetail";
import { OwnerDetail } from "./components/OwnerDetail";
import type { DetailLoadStatus } from "./types";
import "./index.scss";

export default function RescueDetailPage() {
  const router = useRouter();
  const [supportOpen, setSupportOpen] = useState(false);
  const [reloadSeed, setReloadSeed] = useState(0);
  const [detailStatus, setDetailStatus] = useState<DetailLoadStatus>("loading");
  const [publicDetail, setPublicDetail] = useState<PublicDetailVM | undefined>();
  const [ownerDetail, setOwnerDetail] = useState<OwnerDetailVM | undefined>();
  const [supportData, setSupportData] = useState<SupportSheetData | undefined>();
  const guestActionLockRef = useRef(false);
  const submitGuardRef = useRef(createSubmissionGuard());
  const mode = router.params?.mode === "guest" ? "guest" : "owner";
  const initialOwnerTab = router.params?.tab === "detail" ? "detail" : "overview";
  const caseId = router.params?.id;

  useShareAppMessage(() => ({
    title: getShareTitle(publicDetail),
    path: getSharePath(publicDetail, caseId),
    imageUrl: publicDetail?.heroImageUrl || guestHeroCat,
  }));

  const handleRenameTitle = async (value: string) =>
    submitGuardRef.current.run(async () => {
      const nextTitle = value.trim();
      if (!nextTitle) {
        Taro.showToast({
          title: "请先填写代号",
          icon: "none",
        });
        return;
      }

      try {
        Taro.showLoading({ title: "保存中", mask: true });
        const didSyncRemote = await updateRemoteCaseProfileByCaseId(caseId, {
          animalName: nextTitle,
        });

        if (!didSyncRemote) {
          recordCaseProfileLocalFallback({
            title: nextTitle,
            caseId,
            draftId: ownerDetail?.draftId,
          });
        } else {
          clearCaseProfileLocalFallback({
            caseId,
            draftId: ownerDetail?.draftId,
            clearTitle: true,
          });
        }

        setOwnerDetail((current) =>
          current
            ? {
                ...current,
                title: nextTitle,
              }
            : current,
        );
        setPublicDetail((current) =>
          current
            ? {
                ...current,
                title: nextTitle,
              }
            : current,
        );
        Taro.hideLoading();
      } catch {
        Taro.hideLoading();
        Taro.showToast({
          title: "代号更新失败",
          icon: "none",
        });
        return;
      }

      Taro.showToast({
        title: "已更新代号",
        icon: "none",
      });
    });

  const handleChangeCover = async () =>
    submitGuardRef.current.run(async () => {
      try {
        const action = await Taro.showActionSheet({
          itemList: ["拍照", "上传图片"],
        });

        const result = await Taro.chooseImage({
          count: 1,
          sizeType: ["compressed"],
          sourceType: action.tapIndex === 0 ? ["camera"] : ["album"],
        });

        const nextPath = result.tempFilePaths?.[0];
        if (!nextPath) {
          return;
        }
        Taro.showLoading({ title: "上传中", mask: true });
        const uploaded = await uploadCaseAssetImage(
          caseId || "unknown-case",
          nextPath,
          "case-covers",
        );
        const coverFileID = uploaded && !uploaded.isLocalFallback ? uploaded.fileID : undefined;
        const didSyncRemote = coverFileID
          ? await updateRemoteCaseProfileByCaseId(caseId, { coverFileID })
          : false;

        setOwnerDetail((current) =>
          current
            ? {
                ...current,
                coverImage: nextPath,
              }
            : current,
        );
        setPublicDetail((current) =>
          current
            ? {
                ...current,
                heroImageUrl: nextPath,
              }
            : current,
        );
        if (!didSyncRemote) {
          recordCaseProfileLocalFallback({
            coverPath: nextPath,
            caseId,
            draftId: ownerDetail?.draftId,
          });
        } else {
          clearCaseProfileLocalFallback({
            caseId,
            draftId: ownerDetail?.draftId,
            clearCover: true,
          });
        }
        Taro.hideLoading();

        Taro.showToast({
          title: "已更新头像",
          icon: "none",
        });
      } catch (error) {
        Taro.hideLoading();
        if (error instanceof Error && error.message === "CASE_ASSET_UPLOAD_FAILED") {
          Taro.showToast({
            title: "头像上传失败",
            icon: "none",
          });
        }
      }
    });

  const loadDetailPage = () => {
    setDetailStatus("loading");
    setReloadSeed((value) => value + 1);

    return Promise.all([
      loadPublicDetailVMByCaseId(caseId),
      mode === "owner" ? loadOwnerDetailVMByCaseId(caseId) : Promise.resolve(undefined),
      loadSupportSheetDataByCaseId(caseId),
    ])
      .then(([nextPublicDetail, nextOwnerDetail, nextSupportData]) => {
        setPublicDetail(nextPublicDetail);
        setOwnerDetail(nextOwnerDetail);
        setSupportData(nextSupportData);
        setDetailStatus(nextPublicDetail ? "ready" : "error");
      })
      .catch(() => {
        setDetailStatus("error");
        Taro.showToast({
          title: "详情加载失败",
          icon: "none",
        });
      });
  };

  const runGuestActionWithLock = (action: () => void | Promise<unknown>) => {
    if (guestActionLockRef.current) {
      return;
    }

    guestActionLockRef.current = true;

    void Promise.resolve(action()).finally(() => {
      setTimeout(() => {
        guestActionLockRef.current = false;
      }, 300);
    });
  };

  useDidShow(() => {
    loadDetailPage();
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
