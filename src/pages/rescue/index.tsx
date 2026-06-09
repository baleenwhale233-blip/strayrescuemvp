import Taro, { useDidShow } from "@tarojs/taro";
import { useState } from "react";
import { NavBar } from "../../components/NavBar";
import { PageShell } from "../../components/ui";
import { hasCompleteRescuerContactProfile } from "../../data/rescuerContactProfile";
import {
  caseIdToDraftId,
  loadMyProfile,
  loadWorkbenchVMForCurrentUser,
} from "../../domain/canonical/repository";
import type { WorkbenchCaseCardVM } from "../../domain/canonical/types";
import { WorkbenchCreateAction } from "./components/WorkbenchCreateAction";
import { WorkbenchProjectSections } from "./components/WorkbenchProjectSections";
import "./index.scss";

export default function RescuePage() {
  const [activeCases, setActiveCases] = useState<WorkbenchCaseCardVM[]>([]);
  const [draftCases, setDraftCases] = useState<WorkbenchCaseCardVM[]>([]);

  useDidShow(() => {
    loadWorkbenchVMForCurrentUser()
      .then((vm) => {
        setActiveCases(vm?.activeCases ?? []);
        setDraftCases(vm?.draftCases ?? []);
      })
      .catch(() => {
        Taro.showToast({
          title: "记录列表加载失败",
          icon: "none",
        });
      });
  });

  const handleNavigateToDetail = (card: WorkbenchCaseCardVM) => {
    if (card.visibility === "draft") {
      const draftId = card.draftId || caseIdToDraftId(card.caseId);
      Taro.navigateTo({
        url: `/pages/rescue/create/preview/index?id=${draftId}&caseId=${card.caseId}`,
      });
      return;
    }

    Taro.navigateTo({
      url: `/pages/rescue/detail/index?id=${card.caseId}`,
    });
  };

  const hasCompleteContactProfile = async () => {
    try {
      const profile = await loadMyProfile();
      if (profile?.hasContactProfile) {
        return true;
      }
    } catch {
      // Fall back to local contact profile below.
    }

    return hasCompleteRescuerContactProfile();
  };

  const handleCreate = async () => {
    if (!(await hasCompleteContactProfile())) {
      Taro.showModal({
        title: "先填写联系信息",
        content: "公开记录前，需要让查看的人知道如何联系你和核对信息。",
        confirmText: "去完善",
        cancelText: "稍后",
      }).then((result) => {
        if (result.confirm) {
          Taro.navigateTo({
            url: "/pages/profile/contact-settings/index?redirect=create",
          });
        }
      });
      return;
    }

    Taro.navigateTo({
      url: "/pages/rescue/create/basic/index?entry=new",
    });
  };

  return (
    <PageShell className="rescue-page">
      <NavBar title="我的记录" />

      <WorkbenchCreateAction onTap={handleCreate} />
      <WorkbenchProjectSections
        activeCases={activeCases}
        draftCases={draftCases}
        onProjectTap={handleNavigateToDetail}
      />
    </PageShell>
  );
}
