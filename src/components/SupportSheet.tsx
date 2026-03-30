import { Image, Text, View } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useEffect, useState } from "react";
import type { RescueProjectDetail } from "../data/mock";
import chevronLight from "../assets/support-sheet/chevron-light.svg";
import chevronMuted from "../assets/support-sheet/chevron-muted.svg";
import contactIcon from "../assets/support-sheet/contact.svg";
import directSupportIcon from "../assets/support-sheet/direct-support.svg";
import infoIcon from "../assets/support-sheet/info.svg";
import qrPlaceholderIcon from "../assets/support-sheet/qr-placeholder.svg";
import "./SupportSheet.scss";

type SupportSheetView = "picker" | "contact" | "direct";

type SupportSheetProps = {
  visible: boolean;
  project: RescueProjectDetail;
  onClose: () => void;
};

function QrPlaceholder({ label }: { label: string }) {
  return (
    <View className="support-sheet__qr-card">
      <View className="support-sheet__qr-surface">
        <Image
          className="support-sheet__qr-icon"
          mode="aspectFit"
          src={qrPlaceholderIcon}
        />
        <Text className="support-sheet__qr-label">{label}</Text>
      </View>
    </View>
  );
}

export function SupportSheet({
  visible,
  project,
  onClose,
}: SupportSheetProps) {
  const [view, setView] = useState<SupportSheetView>("picker");

  useEffect(() => {
    if (visible) {
      setView("picker");
    }
  }, [visible]);

  if (!visible) {
    return null;
  }

  const stopPropagation = (event: { stopPropagation: () => void }) => {
    event.stopPropagation();
  };

  const handleSavePlaceholder = (label: string) => {
    Taro.showToast({
      title: `${label}待接入真实资料后开放`,
      icon: "none",
    });
  };

  const handleCopyWeChat = async () => {
    await Taro.setClipboardData({
      data: project.support.wechatId,
    });

    Taro.showToast({
      title: "微信号已复制",
      icon: "none",
    });
  };

  const renderPicker = () => (
    <View className="support-sheet__content">
      <View className="support-sheet__title-block">
        <Text className="support-sheet__picker-title">选择支持方式</Text>
      </View>

      <View className="support-sheet__option-list">
        <View
          className="support-sheet__option-card support-sheet__option-card--primary"
          onTap={() => setView("contact")}
        >
          <View className="support-sheet__option-main">
            <View className="support-sheet__option-icon support-sheet__option-icon--primary">
              <Image mode="aspectFit" src={contactIcon} />
            </View>
            <Text className="support-sheet__option-label support-sheet__option-label--primary">
              联系救助人
            </Text>
          </View>

          <Image
            className="support-sheet__option-arrow"
            mode="aspectFit"
            src={chevronLight}
          />
        </View>

        <View
          className="support-sheet__option-card support-sheet__option-card--secondary"
          onTap={() => setView("direct")}
        >
          <View className="support-sheet__option-main">
            <View className="support-sheet__option-icon support-sheet__option-icon--secondary">
              <Image mode="aspectFit" src={directSupportIcon} />
            </View>
            <Text className="support-sheet__option-label">直接支持</Text>
          </View>

          <Image
            className="support-sheet__option-arrow"
            mode="aspectFit"
            src={chevronMuted}
          />
        </View>
      </View>

      <View className="support-sheet__disclaimer">
        <Image
          className="support-sheet__disclaimer-icon"
          mode="aspectFit"
          src={infoIcon}
        />
        <Text className="support-sheet__disclaimer-text">
          平台不参与资金监管，请直接通过下方渠道与救助人联系。
        </Text>
      </View>
    </View>
  );

  const renderDetail = () => {
    const isContact = view === "contact";

    return (
      <View className="support-sheet__detail">
        <View className="support-sheet__header">
          <Text className="support-sheet__detail-title">救助支持</Text>
        </View>

        <View className="support-sheet__tabs">
          <View
            className={`support-sheet__tab ${
              isContact ? "support-sheet__tab--active" : ""
            }`}
            onTap={() => setView("contact")}
          >
            <Text>联系救助人</Text>
          </View>
          <View
            className={`support-sheet__tab ${
              !isContact ? "support-sheet__tab--active" : ""
            }`}
            onTap={() => setView("direct")}
          >
            <Text>直接支持</Text>
          </View>
        </View>

        <View className="support-sheet__detail-body">
          <Text className="support-sheet__section-title">
            {isContact ? "救助人微信二维码" : "救助人收款码"}
          </Text>

          <QrPlaceholder
            label={isContact ? "WeChat QR Code Placeholder" : "QR Code Image Placeholder"}
          />

          <Text className="support-sheet__hint">
            {isContact
              ? project.support.contactHint
              : project.support.directHint}
          </Text>

          {isContact ? (
            <View className="support-sheet__wechat-section">
              <Text className="support-sheet__wechat-label">
                救助人微信号
              </Text>

              <View className="support-sheet__wechat-card">
                <Text className="support-sheet__wechat-id">
                  {project.support.wechatId}
                </Text>

                <View
                  className="support-sheet__copy-button"
                  onTap={handleCopyWeChat}
                >
                  <Text>复制微信号</Text>
                </View>
              </View>
            </View>
          ) : null}

          <View className="support-sheet__tip-card">
            <Image
              className="support-sheet__tip-icon"
              mode="aspectFit"
              src={infoIcon}
            />

            <View className="support-sheet__tip-copy">
              {isContact ? (
                <Text className="support-sheet__tip-text">
                  {project.support.contactTip}
                </Text>
              ) : (
                <Text className="support-sheet__tip-text">
                  支持完成后，请回到页面点击
                  <Text className="support-sheet__tip-highlight">
                    “我已支持，去认领”
                  </Text>
                  以更新透明账本。
                </Text>
              )}
            </View>
          </View>

          <View
            className="theme-button-primary support-sheet__action-button"
            onTap={() =>
              handleSavePlaceholder(isContact ? "二维码" : "付款码")
            }
          >
            <Text>{isContact ? "保存二维码" : "保存付款码"}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View className="support-sheet__overlay" onTap={onClose}>
      <View className="support-sheet__panel" onTap={stopPropagation}>
        <View className="support-sheet__handle">
          <View className="support-sheet__handle-bar" />
        </View>

        {view === "picker" ? renderPicker() : renderDetail()}
      </View>
    </View>
  );
}
