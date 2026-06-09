import Taro from "@tarojs/taro";
import { useRef, type Dispatch, type SetStateAction } from "react";
import {
  clearCaseProfileLocalFallback,
  recordCaseProfileLocalFallback,
  updateRemoteCaseProfileByCaseId,
  type OwnerDetailVM,
} from "../../../../domain/canonical/repository";
import { uploadCaseAssetImage } from "../../../../domain/canonical/repository/cloudbaseClient";
import type { PublicDetailVM } from "../../../../domain/canonical/types";
import { createSubmissionGuard } from "../../../../utils/submissionGuard";

export function useCaseProfileActions({
  caseId,
  ownerDetail,
  setOwnerDetail,
  setPublicDetail,
}: {
  caseId?: string;
  ownerDetail?: OwnerDetailVM;
  setOwnerDetail: Dispatch<SetStateAction<OwnerDetailVM | undefined>>;
  setPublicDetail: Dispatch<SetStateAction<PublicDetailVM | undefined>>;
}) {
  const submitGuardRef = useRef(createSubmissionGuard());

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
          title: "未能更新代号，请稍后重试",
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
          title: "封面已更新",
          icon: "none",
        });
      } catch (error) {
        Taro.hideLoading();
        if (error instanceof Error && error.message === "CASE_ASSET_UPLOAD_FAILED") {
          Taro.showToast({
            title: "封面上传失败",
            icon: "none",
          });
        }
      }
    });

  return {
    handleRenameTitle,
    handleChangeCover,
  };
}
