import { Button, Text, View } from "@tarojs/components";
import type { OwnerFinishBarMode, OwnerFinishBarViewModel } from "../../utils/ownerFinishBarState";
import { AppIcon } from "../AppIcon";
import { AppButton, BottomActionBar } from "../ui";
import "./RescueDetailActions.scss";

type RescueGuestActionBarProps = {
  onClaim: () => void;
  onSupport: () => void;
};

export function RescueGuestActionBar({ onClaim, onSupport }: RescueGuestActionBarProps) {
  return (
    <BottomActionBar className="rescue-guest-action-bar">
      <Button className="rescue-guest-action-bar__share" openType="share">
        <AppIcon
          className="rescue-guest-action-bar__share-icon-image"
          name="share"
          size={18}
          variant="muted"
        />
        <Text className="rescue-guest-action-bar__share-text">分享</Text>
      </Button>
      <AppButton className="rescue-guest-action-bar__ghost" onTap={onClaim} variant="ghost">
        登记一笔
      </AppButton>
      <AppButton className="rescue-guest-action-bar__cta" onTap={onSupport}>
        查看联系方式
      </AppButton>
    </BottomActionBar>
  );
}

type RescueOwnerFinishBarProps = {
  finishBar: OwnerFinishBarViewModel;
  finishDragX: number;
  finishMode: OwnerFinishBarMode;
  finishThreshold: number;
  onCancelFinish: () => void;
  onFinishTouchCancel: () => void;
  onFinishTouchEnd: () => void;
  onFinishTouchMove: (event: any) => void;
  onFinishTouchStart: (event: any) => void;
  onStartFinish: () => void;
};

export function RescueOwnerFinishBar({
  finishBar,
  finishDragX,
  finishMode,
  finishThreshold,
  onCancelFinish,
  onFinishTouchCancel,
  onFinishTouchEnd,
  onFinishTouchMove,
  onFinishTouchStart,
  onStartFinish,
}: RescueOwnerFinishBarProps) {
  return (
    <BottomActionBar className={`rescue-owner-finish-bar rescue-owner-finish-bar--${finishMode}`}>
      <View className="rescue-owner-finish-bar__row">
        <Button
          className={`rescue-owner-finish-bar__side rescue-owner-finish-bar__side--${finishBar.sideAction}`}
          onTap={finishBar.sideAction === "finish" ? onStartFinish : onCancelFinish}
        >
          <Text className="rescue-owner-finish-bar__side-text">{finishBar.sideLabel}</Text>
        </Button>
        {finishBar.primaryAction === "share" ? (
          <Button className="rescue-owner-finish-bar__primary" openType="share">
            <AppIcon
              className="rescue-owner-finish-bar__primary-icon"
              name="share"
              size={18}
              variant="inverse"
            />
            <Text className="rescue-owner-finish-bar__primary-text">{finishBar.primaryLabel}</Text>
          </Button>
        ) : (
          <View className="rescue-owner-finish-bar__swipe">
            <View
              className="rescue-owner-finish-bar__handle"
              style={{ transform: `translateX(${finishDragX}px)` }}
              onTouchStart={onFinishTouchStart}
              onTouchMove={onFinishTouchMove}
              onTouchEnd={onFinishTouchEnd}
              onTouchCancel={onFinishTouchCancel}
            >
              <Text>›</Text>
            </View>
            <Text
              className="rescue-owner-finish-bar__swipe-text"
              style={{ opacity: Math.max(0.35, 1 - finishDragX / finishThreshold) }}
            >
              {finishBar.primaryLabel}
            </Text>
          </View>
        )}
      </View>
      {finishBar.hint ? (
        <Text className="rescue-owner-finish-bar__hint">{finishBar.hint}</Text>
      ) : null}
    </BottomActionBar>
  );
}
