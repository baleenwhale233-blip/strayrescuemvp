import { Button, Image, Text, View } from "@tarojs/components";
import { BottomActionBar } from "../../../../../components/ui";
import shareMutedIcon from "../../../../../assets/rescue-detail/share-muted-18.svg";
import type {
  OwnerFinishBarMode,
  OwnerFinishBarViewModel,
} from "../../../../../utils/ownerFinishBarState";

export function OwnerFinishSection({
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
}: {
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
}) {
  return (
    <BottomActionBar className={`owner-finish owner-finish--${finishMode}`}>
      <View className="owner-finish__row">
        <Button
          className={`owner-finish__side owner-finish__side--${finishBar.sideAction}`}
          onTap={finishBar.sideAction === "finish" ? onStartFinish : onCancelFinish}
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
              onTouchStart={onFinishTouchStart}
              onTouchMove={onFinishTouchMove}
              onTouchEnd={onFinishTouchEnd}
              onTouchCancel={onFinishTouchCancel}
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
    </BottomActionBar>
  );
}
