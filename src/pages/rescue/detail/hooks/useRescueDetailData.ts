import Taro, { useDidShow } from "@tarojs/taro";
import { useState } from "react";
import {
  loadViewerCaseDetailVMByCaseId,
  type OwnerDetailVM,
} from "../../../../domain/canonical/repository";
import type { PublicDetailVM, SupportSheetData } from "../../../../domain/canonical/types";
import type { DetailLoadStatus } from "../types";

export function useRescueDetailData({ caseId }: { caseId?: string }) {
  const [reloadSeed, setReloadSeed] = useState(0);
  const [detailStatus, setDetailStatus] = useState<DetailLoadStatus>("loading");
  const [publicDetail, setPublicDetail] = useState<PublicDetailVM | undefined>();
  const [ownerDetail, setOwnerDetail] = useState<OwnerDetailVM | undefined>();
  const [supportData, setSupportData] = useState<SupportSheetData | undefined>();

  const loadDetailPage = () => {
    setDetailStatus("loading");
    setReloadSeed((value) => value + 1);

    return loadViewerCaseDetailVMByCaseId(caseId)
      .then((vm) => {
        const nextPublicDetail = vm.publicDetail;

        setPublicDetail(nextPublicDetail);
        setOwnerDetail(vm.ownerDetail);
        setSupportData(vm.supportData);
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
