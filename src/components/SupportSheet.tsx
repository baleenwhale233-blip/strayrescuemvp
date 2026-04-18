import { Image, ScrollView, Text, View } from "@tarojs/components";
import Taro from "@tarojs/taro";
import type { SupportSheetData } from "../domain/canonical/types";
import infoIcon from "../assets/support-sheet/info.svg";
import "./SupportSheet.scss";

type SupportSheetProps = {
  visible: boolean;
  support: SupportSheetData;
  onClose: () => void;
};

export function SupportSheet({ visible, support, onClose }: SupportSheetProps) {
  if (!visible) {
    return null;
  }

  const hasWechatId = Boolean(support.wechatId?.trim());
  const hasPaymentQr = Boolean(support.paymentQrUrl?.trim());

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
        title: "请长按二维码保存",
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

  return (
    <View
      className="support-sheet__overlay"
      onTap={onClose}
      onTouchMove={(event) => event.stopPropagation()}
    >
      <View
        className="support-sheet__panel"
        onTap={(event) => event.stopPropagation()}
        onTouchMove={(event) => event.stopPropagation()}
      >
        <View className="support-sheet__handle">
          <View className="support-sheet__handle-bar" />
        </View>

        <ScrollView className="support-sheet__scroll" scrollY showScrollbar={false}>
          <View className="support-sheet__content">
            <View className="support-sheet__tip">
              <Image className="support-sheet__tip-icon" mode="aspectFit" src={infoIcon} />
              <Text className="support-sheet__tip-text">{support.contactTip}</Text>
            </View>

            {hasPaymentQr ? (
              <View className="support-sheet__section">
                <Text className="support-sheet__section-title">救助人二维码</Text>

                <View className="support-sheet__qr-card">
                  <Image
                    className="support-sheet__qr-image"
                    mode="aspectFit"
                    src={support.paymentQrUrl!}
                  />
                </View>

                <Text className="support-sheet__hint">{support.directHint}</Text>
              </View>
            ) : (
              <View className="support-sheet__section">
                <Text className="support-sheet__section-title">救助人二维码</Text>
                <View className="support-sheet__empty-card">
                  <Text className="support-sheet__empty-text">暂未提供二维码</Text>
                </View>
                <Text className="support-sheet__hint">{support.directHint}</Text>
              </View>
            )}

            {hasWechatId ? (
              <View className="support-sheet__section">
                <Text className="support-sheet__section-title">救助人微信号</Text>

                <View className="support-sheet__wechat-card">
                  <Text className="support-sheet__wechat-id">{support.wechatId}</Text>
                  <View className="support-sheet__wechat-copy" onTap={handleCopyWechat}>
                    <Text className="support-sheet__wechat-copy-text">复制微信号</Text>
                  </View>
                </View>

                <Text className="support-sheet__hint">{support.contactHint}</Text>
              </View>
            ) : null}

            <View className="support-sheet__note-card">
              <Text className="support-sheet__note-text">{support.directTip}</Text>
            </View>
          </View>
        </ScrollView>

        <View
          className="support-sheet__footer"
          onTap={(event) => event.stopPropagation()}
        >
          <View className="theme-button-primary support-sheet__save-button" onTap={handlePrimaryAction}>
            <Text>
              {hasPaymentQr
                ? "保存二维码"
                : hasWechatId
                  ? "复制微信号"
                  : "关闭"}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
