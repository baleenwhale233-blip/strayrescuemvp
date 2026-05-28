import { Button, Image, Text, View } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useEffect, useRef, useState } from "react";
import {
  RescueOwnerOverview,
  RescueOwnerQuickActions,
  RescueOwnerSummaryCard,
  RescueOwnerTabs,
  RescueOwnerTimeline,
} from "../../../../components/RescueOwnerShared";
import { NavBar } from "../../../../components/NavBar";
import shareMutedIcon from "../../../../assets/rescue-detail/share-muted-18.svg";
import type { OwnerDetailVM } from "../../../../domain/canonical/repository";
import type { PublicDetailVM } from "../../../../domain/canonical/types";
import {
  getOwnerFinishBarViewModel,
  reduceOwnerFinishBarMode,
  type OwnerFinishBarMode,
} from "../../../../utils/ownerFinishBarState";
import {
  getFundingCompareMetrics,
  getOwnerAnimalImage,
  getOwnerOverviewProps,
  toOwnerTimelineItems,
} from "../detailViewModels";
import type { GuestTab } from "../types";
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
  initialTab: GuestTab;
  onRenameTitle: (value: string) => void;
  onChangeCover: () => void;
}) {
  const [activeTab, setActiveTab] = useState<GuestTab>(initialTab);
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
  const fundingCompare = getFundingCompareMetrics({
    expenseAmount: ownerDetail.ledger.confirmedExpenseAmount,
    supportAmount: ownerDetail.ledger.supportedAmount,
  });

  return (
    <View className="detail-page detail-page--owner">
      <NavBar showBack title="记录管理" />

      <RescueOwnerSummaryCard
        budgetLabel={ownerDetail.ledger.targetAmountLabel}
        coverImage={getOwnerAnimalImage(publicDetail)}
        advanceProgressPercent={fundingCompare.advanceProgressPercent}
        expenseLabel={ownerDetail.ledger.confirmedExpenseAmountLabel}
        onCopy={() => {
          Taro.setClipboardData({ data: ownerDetail.publicCaseId });
        }}
        onEditCover={onChangeCover}
        onEditTitle={() => setEditingTitle(true)}
        progressPercent={fundingCompare.supportProgressPercent}
        publicCaseId={ownerDetail.publicCaseId}
        statusLabel={ownerDetail.statusLabel}
        supportLabel={ownerDetail.ledger.supportedAmountLabel}
        thirdLabel={fundingCompare.thirdLabel}
        thirdMode={fundingCompare.thirdMode}
        thirdValue={fundingCompare.thirdValue}
        title={ownerDetail.title}
      />

      <RescueOwnerQuickActions
        onBudget={() =>
          Taro.navigateTo({
            url: `/pages/rescue/budget-update/index?caseId=${ownerDetail.caseId}`,
          })
        }
        onExpense={() =>
          Taro.navigateTo({
            url: `/pages/rescue/expense/index?caseId=${ownerDetail.caseId}`,
          })
        }
        onIncome={goToManage}
        onStatus={() =>
          Taro.navigateTo({
            url: `/pages/rescue/progress-update/index?caseId=${ownerDetail.caseId}`,
          })
        }
      />

      <RescueOwnerTabs activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "overview" ? (
        <View className="owner-tab-content">
          <RescueOwnerOverview {...getOwnerOverviewProps(publicDetail)} />
        </View>
      ) : (
        <View className="owner-tab-content owner-tab-content--timeline">
          <RescueOwnerTimeline items={toOwnerTimelineItems(publicDetail)} />
        </View>
      )}

      <View className={`owner-finish owner-finish--${finishMode}`}>
        <View className="owner-finish__row">
          <Button
            className={`owner-finish__side owner-finish__side--${finishBar.sideAction}`}
            onTap={finishBar.sideAction === "finish" ? handleStartFinish : handleCancelFinish}
          >
            <Text className="owner-finish__side-text">{finishBar.sideLabel}</Text>
          </Button>
          {finishBar.primaryAction === "share" ? (
            <Button className="owner-finish__primary" openType="share">
              <Image className="owner-finish__primary-icon" mode="aspectFit" src={shareMutedIcon} />
              <Text className="owner-finish__primary-text">{finishBar.primaryLabel}</Text>
            </Button>
          ) : (
            <View className="owner-finish__swipe">
              <View
                className="owner-finish__handle"
                style={{ transform: `translateX(${finishDragX}px)` }}
                onTouchStart={handleFinishTouchStart}
                onTouchMove={handleFinishTouchMove}
                onTouchEnd={handleFinishTouchEnd}
                onTouchCancel={resetFinishSlider}
              >
                <Text>›</Text>
              </View>
              <Text
                className="owner-finish__swipe-text"
                style={{ opacity: Math.max(0.35, 1 - finishDragX / finishThreshold) }}
              >
                {finishBar.primaryLabel}
              </Text>
            </View>
          )}
        </View>
        {finishBar.hint ? <Text className="owner-finish__hint">{finishBar.hint}</Text> : null}
      </View>

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
