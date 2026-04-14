import { Image, Text, View } from "@tarojs/components";
import Taro from "@tarojs/taro";
import type { SupportSheetData } from "../domain/canonical/types";
import infoIcon from "../assets/support-sheet/info.svg";
import qrPlaceholderIcon from "../assets/support-sheet/qr-placeholder.svg";
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

  const handleCopyWechat = async () => {
    await Taro.setClipboardData({
      data: support.wechatId || "",
    });
  };

  return (
    <View className="support-sheet__overlay" onTap={onClose}>
      <View className="support-sheet__panel" onTap={(event) => event.stopPropagation()}>
        <View className="support-sheet__handle">
          <View className="support-sheet__handle-bar" />
        </View>

        <View className="support-sheet__tip">
          <Image className="support-sheet__tip-icon" mode="aspectFit" src={infoIcon} />
          <Text className="support-sheet__tip-text">
            添加救助人后，可通过微信直接沟通救助细节
          </Text>
        </View>

        <View className="support-sheet__section">
          <Text className="support-sheet__section-title">救助人微信号</Text>

          <View className="support-sheet__qr-card">
            {support.paymentQrUrl ? (
              <Image
                className="support-sheet__qr-image"
                mode="aspectFit"
                src={support.paymentQrUrl}
              />
            ) : (
              <View className="support-sheet__qr-placeholder">
                <Image
                  className="support-sheet__qr-placeholder-icon"
                  mode="aspectFit"
                  src={qrPlaceholderIcon}
                />
                <Text className="support-sheet__qr-placeholder-label">
                  WeChat QR Code Placeholder
                </Text>
              </View>
            )}
          </View>

          <Text className="support-sheet__hint">
            长按图片保存到相册，打开微信扫一扫添加好友
          </Text>
        </View>

        <View className="support-sheet__section">
          <Text className="support-sheet__section-title">救助人微信号</Text>

          <View className="support-sheet__wechat-card">
            <Text className="support-sheet__wechat-id">{support.wechatId || "暂未提供"}</Text>
            <View className="support-sheet__wechat-copy" onTap={handleCopyWechat}>
              <Text className="support-sheet__wechat-copy-text">复制微信号</Text>
            </View>
          </View>
        </View>

        <View
          className="theme-button-primary support-sheet__save-button"
          onTap={() =>
            Taro.showToast({
              title: "请长按二维码保存",
              icon: "none",
            })
          }
        >
          <Text>保存二维码</Text>
        </View>
      </View>
    </View>
  );
}
