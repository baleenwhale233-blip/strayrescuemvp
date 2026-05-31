import { View } from "@tarojs/components";
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
import { openReadonlyRecordDetail } from "../../record-detail/readonlyRecordDetail";
import { getOwnerOverviewProps, toOwnerTimelineItems } from "../detailViewModels";
import type { DetailTab } from "../types";
import { OwnerActionSection } from "./owner/OwnerActionSection";
import { OwnerDetailSection } from "./owner/OwnerDetailSection";
import { OwnerHeroSection } from "./owner/OwnerHeroSection";
import { OwnerOverviewSection } from "./owner/OwnerOverviewSection";
import { OwnerTabs } from "./owner/OwnerTabs";
import { RenameSheet } from "./RenameSheet";
import "./OwnerDetail.scss";

export function OwnerDetail({
  ownerDetail,
  publicDetail,
  initialTab,
  onRenameTitle,
  onChangeCover,
  onBudget,
  onCopyPublicCaseId,
  onExpense,
  onFinishRecord,
  onIncome,
  onStatus,
}: {
  ownerDetail: OwnerDetailVM;
  publicDetail: PublicDetailVM;
  initialTab: DetailTab;
  onRenameTitle: (value: string) => void;
  onChangeCover: () => void;
  onBudget: () => void;
  onCopyPublicCaseId: () => void;
  onExpense: () => void;
  onFinishRecord: () => Promise<void>;
  onIncome: () => void;
  onStatus: () => void;
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

    resetFinishSlider();
    setFinishMode("idle");
    await onFinishRecord();
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
        onCopy={onCopyPublicCaseId}
        onEditCover={onChangeCover}
        onEditTitle={() => setEditingTitle(true)}
      />

      <OwnerActionSection
        onBudget={onBudget}
        onExpense={onExpense}
        onIncome={onIncome}
        onStatus={onStatus}
      />

      <OwnerTabs activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "overview" ? (
        <OwnerOverviewSection overview={ownerOverview} />
      ) : (
        <OwnerDetailSection
          items={ownerTimelineItems}
          onReadonlyRecordTap={openReadonlyRecordDetail}
        />
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
