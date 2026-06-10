import { useShareAppMessage } from "@tarojs/taro";
import type { PublicDetailVM } from "../../../../domain/canonical/types";
import { getSharePath, getShareTitle } from "../detailViewModels";

export function useRescueDetailShare({
  publicDetail,
  caseId,
}: {
  publicDetail?: PublicDetailVM;
  caseId?: string;
}) {
  useShareAppMessage(() => ({
    title: getShareTitle(publicDetail),
    path: getSharePath(publicDetail, caseId),
    ...(publicDetail?.heroImageUrl ? { imageUrl: publicDetail.heroImageUrl } : {}),
  }));
}
