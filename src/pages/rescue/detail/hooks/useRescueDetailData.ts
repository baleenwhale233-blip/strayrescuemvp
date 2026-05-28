import Taro, { useDidShow } from "@tarojs/taro";
import { useState } from "react";
import {
  loadOwnerDetailVMByCaseId,
  loadPublicDetailVMByCaseId,
  loadSupportSheetDataByCaseId,
  type OwnerDetailVM,
} from "../../../../domain/canonical/repository";
import type { PublicDetailVM, SupportSheetData } from "../../../../domain/canonical/types";
import type { DetailLoadStatus } from "../types";

type RescueDetailMode = "guest" | "owner";

export function useRescueDetailData({ caseId, mode }: { caseId?: string; mode: RescueDetailMode }) {
  const [reloadSeed, setReloadSeed] = useState(0);
  const [detailStatus, setDetailStatus] = useState<DetailLoadStatus>("loading");
  const [publicDetail, setPublicDetail] = useState<PublicDetailVM | undefined>();
  const [ownerDetail, setOwnerDetail] = useState<OwnerDetailVM | undefined>();
  const [supportData, setSupportData] = useState<SupportSheetData | undefined>();

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

  useDidShow(() => {
    loadDetailPage();
  });

  return {
    detailStatus,
    publicDetail,
    ownerDetail,
    supportData,
    reloadSeed,
    setPublicDetail,
    setOwnerDetail,
    loadDetailPage,
  };
}
