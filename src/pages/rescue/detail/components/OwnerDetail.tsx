import { View } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useEffect, useRef, useState } from "react";
import { NavBar } from "../../../../components/NavBar";
import { RescueOwnerFinishBar } from "../../../../components/rescue";
import type { OwnerDetailVM } from "../../../../domain/canonical/repository";
import type { PublicDetailVM } from "../../../../domain/canonical/types";
import {
  getOwnerFinishBarViewModel,
  reduceOwnerFinishBarMode,
  type OwnerFinishBarMode,
} from "../../../../utils/ownerFinishBarState";
import { getOwnerOverviewProps, toOwnerTimelineItems } from "../detailViewModels";
import type { DetailTab } from "../types";
import { OwnerActionSection } from "./owner/OwnerActionSection";
import { OwnerDetailSection } from "./owner/OwnerDetailSection";
import { OwnerHeroSection } from "./owner/OwnerHeroSection";
import { OwnerOverviewSection } from "./owner/OwnerOverviewSection";
import { OwnerTabs } from "./owner/OwnerTabs";
import { RenameSheet } from "./RenameSheet";

export function OwnerDetail({
  ownerDetail,
  publicDetail,
  initialTab,
  onRenameTitle,
  onChangeCover,
}: {
  ownerDetail: OwnerDetailVM;
  publicDetail: PublicDetailVM;
  initialTab: DetailTab;
  onRenameTitle: (value: string) => void;
  onChangeCover: () => void;
}) {
  const [activeTab, setActiveTab] = useState<DetailTab>(initialTab);
  const [editingTitle, setEditingTitle] = useState(false);
  const [finishMode, setFinishMode] = useState<OwnerFinishBarMode>("idle");
  const [finishDragX, setFinishDragX] = useState(0);
  const [finishDragging, setFinishDragging] = useState(false);
  const finishStartXRef = useRef(0);
  const finishMaxX = 198;
  const finishThreshold = 148;

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const goToManage = () => {
    Taro.navigateTo({
      url: `/pages/support/review/index?id=${ownerDetail.caseId}`,
    });
  };

  const goToBudget = () => {
    Taro.navigateTo({
      url: `/pages/rescue/budget-update/index?caseId=${ownerDetail.caseId}`,
    });
  };

  const goToExpense = () => {
    Taro.navigateTo({
      url: `/pages/rescue/expense/index?caseId=${ownerDetail.caseId}`,
    });
  };

  const goToStatus = () => {
    Taro.navigateTo({
      url: `/pages/rescue/progress-update/index?caseId=${ownerDetail.caseId}`,
    });
  };

  const resetFinishSlider = () => {
    setFinishDragging(false);
    setFinishDragX(0);
  };

  const handleStartFinish = () => {
    resetFinishSlider();
    setFinishMode((mode) => reduceOwnerFinishBarMode(mode, "startFinish"));
  };

  const handleCancelFinish = () => {
    resetFinishSlider();
    setFinishMode((mode) => reduceOwnerFinishBarMode(mode, "cancelFinish"));
  };

  const handleFinishTouchStart = (event: any) => {
    finishStartXRef.current = event.touches?.[0]?.clientX || 0;
    setFinishDragging(true);
  };

  const handleFinishTouchMove = (event: any) => {
    if (!finishDragging) {
      return;
    }

    const currentX = event.touches?.[0]?.clientX || finishStartXRef.current;
    const deltaX = Math.max(0, currentX - finishStartXRef.current);
    setFinishDragX(Math.min(deltaX, finishMaxX));
  };

  const handleFinishTouchEnd = async () => {
    if (finishDragX < finishThreshold) {
      resetFinishSlider();
      return;
    }

    const result = await Taro.showModal({
      title: "结束记录？",
      content: "请确认这条记录已经完成、已结案，或确实需要关闭。",
      confirmText: "确认结束",
      cancelText: "再等等",
    });

    resetFinishSlider();
    setFinishMode("idle");

    if (!result.confirm) {
      return;
    }

    Taro.showToast({
      title: "结束记录链路待接入",
      icon: "none",
    });
  };
  const finishBar = getOwnerFinishBarViewModel(finishMode);
  const ownerOverview = getOwnerOverviewProps(publicDetail);
  const ownerTimelineItems = toOwnerTimelineItems(publicDetail);

  return (
    <View className="detail-page detail-page--owner">
      <NavBar showBack title="记录管理" />

      <OwnerHeroSection
        ownerDetail={ownerDetail}
        publicDetail={publicDetail}
        onCopy={() => {
          Taro.setClipboardData({ data: ownerDetail.publicCaseId });
        }}
        onEditCover={onChangeCover}
        onEditTitle={() => setEditingTitle(true)}
      />

      <OwnerActionSection
        onBudget={goToBudget}
        onExpense={goToExpense}
        onIncome={goToManage}
        onStatus={goToStatus}
      />

      <OwnerTabs activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "overview" ? (
        <OwnerOverviewSection overview={ownerOverview} />
      ) : (
        <OwnerDetailSection items={ownerTimelineItems} />
      )}

      <RescueOwnerFinishBar
        finishBar={finishBar}
        finishDragX={finishDragX}
        finishMode={finishMode}
        finishThreshold={finishThreshold}
        onCancelFinish={handleCancelFinish}
        onFinishTouchCancel={resetFinishSlider}
        onFinishTouchEnd={handleFinishTouchEnd}
        onFinishTouchMove={handleFinishTouchMove}
        onFinishTouchStart={handleFinishTouchStart}
        onStartFinish={handleStartFinish}
      />

      {editingTitle ? (
        <RenameSheet
          initialValue={ownerDetail.title}
          onClose={() => setEditingTitle(false)}
          onSave={(value) => {
            onRenameTitle(value);
            setEditingTitle(false);
          }}
        />
      ) : null}
    </View>
  );
}
