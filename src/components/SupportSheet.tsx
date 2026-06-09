import { Image, ScrollView, Text, View } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useRef, useState } from "react";
import type { SupportSheetData } from "../domain/canonical/types";
import infoIcon from "../assets/support-sheet/info.svg";
import "./SupportSheet.scss";

type SupportSheetProps = {
  visible: boolean;
  support: SupportSheetData;
  onClose: () => void;
};

const DRAG_CLOSE_DISTANCE = 96;

export function SupportSheet({ visible, support, onClose }: SupportSheetProps) {
  const dragStartYRef = useRef(0);
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  if (!visible) {
    return null;
  }

  const hasWechatId = Boolean(support.wechatId?.trim());
  const hasPaymentQr = Boolean(support.paymentQrUrl?.trim());
  const contactNote = support.contactNote?.trim();
  const hasContactNote = Boolean(contactNote);

  const handleCopyWechat = async () => {
    if (!hasWechatId) {
      return;
    }

    await Taro.setClipboardData({
      data: support.wechatId || "",
    });
  };

  const handlePrimaryAction = async () => {
    if (hasPaymentQr) {
      Taro.showToast({
        title: "请长按二维码保存，稍后可在微信里联系",
        icon: "none",
      });
      return;
    }

    if (hasWechatId) {
      await handleCopyWechat();
      return;
    }

    onClose();
  };

  const handleDragStart = (event: any) => {
    dragStartYRef.current = event.touches?.[0]?.clientY || 0;
    setIsDragging(true);
  };

  const handleDragMove = (event: any) => {
    if (!isDragging) {
      return;
    }

    const currentY = event.touches?.[0]?.clientY || dragStartYRef.current;
    const deltaY = Math.max(0, currentY - dragStartYRef.current);
    setDragOffsetY(Math.min(deltaY, 180));
  };

  const handleDragEnd = () => {
    if (dragOffsetY >= DRAG_CLOSE_DISTANCE) {
      setIsDragging(false);
      setDragOffsetY(0);
      onClose();
      return;
    }

    setIsDragging(false);
    setDragOffsetY(0);
  };

  return (
    <View
      className="support-sheet__overlay"
      catchMove
      onTap={onClose}
      onTouchMove={(event) => event.stopPropagation()}
    >
      <View
        className="support-sheet__panel"
        catchMove
        style={{
          transform: `translateY(${dragOffsetY}px)`,
          transition: isDragging ? "none" : "transform 180ms ease-out",
        }}
        onTap={(event) => event.stopPropagation()}
        onTouchMove={(event) => event.stopPropagation()}
      >
        <View
          className="support-sheet__header"
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
          onTouchCancel={handleDragEnd}
        >
          <View className="support-sheet__handle">
            <View className="support-sheet__handle-bar" />
          </View>

          <View className="support-sheet__title-row">
            <Text className="support-sheet__title">联系信息</Text>
            <View className="support-sheet__close" onTap={onClose}>
              <Text className="support-sheet__close-text">×</Text>
            </View>
          </View>
        </View>

        <ScrollView className="support-sheet__scroll" scrollY showScrollbar={false}>
          <View className="support-sheet__content">
            <View className="support-sheet__tip">
              <Image className="support-sheet__tip-icon" mode="aspectFit" src={infoIcon} />
              <Text className="support-sheet__tip-text">{support.contactTip}</Text>
            </View>

            {hasPaymentQr ? (
              <View className="support-sheet__section">
                <Text className="support-sheet__section-title">联系二维码</Text>

                <View className="support-sheet__qr-card">
                  <Image
                    className="support-sheet__qr-image"
                    mode="aspectFit"
                    src={support.paymentQrUrl!}
                  />
                </View>

                <Text className="support-sheet__hint">{support.directHint}</Text>
              </View>
            ) : null}

            {hasWechatId ? (
              <View className="support-sheet__section">
                <Text className="support-sheet__section-title">联系微信号</Text>

                <View className="support-sheet__wechat-card">
                  <Text className="support-sheet__wechat-id">{support.wechatId}</Text>
                  <View className="support-sheet__wechat-copy" onTap={handleCopyWechat}>
                    <Text className="support-sheet__wechat-copy-text">复制微信号</Text>
                  </View>
                </View>

                <Text className="support-sheet__hint">{support.contactHint}</Text>
              </View>
            ) : null}

            {hasContactNote ? (
              <View className="support-sheet__section">
                <Text className="support-sheet__section-title">联系备注</Text>
                <View className="support-sheet__contact-note-card">
                  <Text className="support-sheet__contact-note-text">{contactNote}</Text>
                </View>
              </View>
            ) : null}

            <View className="support-sheet__note-card">
              <Text className="support-sheet__note-text">{support.directTip}</Text>
            </View>
          </View>
        </ScrollView>

        <View
          className="support-sheet__footer"
          catchMove
          onTap={(event) => event.stopPropagation()}
        >
          <View
            className="theme-button-primary support-sheet__save-button"
            onTap={handlePrimaryAction}
          >
            <Text>{hasPaymentQr ? "保存二维码" : hasWechatId ? "复制微信号" : "关闭"}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
