import { Image, Input, Text, View } from "@tarojs/components";
import Taro, { useDidShow, useRouter } from "@tarojs/taro";
import { useState } from "react";
import { NavBar } from "../../../components/NavBar";
import { TextareaWithOverlayPlaceholder } from "../../../components/TextareaWithOverlayPlaceholder";
import addPhotoIcon from "../../../assets/rescue-expense/add-photo-22.svg";
import submitArrowIcon from "../../../assets/rescue-create/step1-next-arrow.svg";
import {
  getRescuerContactProfile,
  saveRescuerContactProfile,
} from "../../../data/rescuerContactProfile";
import {
  loadMyProfile,
  updateRemoteMyProfile,
} from "../../../domain/canonical/repository";
import { uploadProfileAssetImage } from "../../../domain/canonical/repository/cloudbaseClient";
import "./index.scss";

export default function ContactSettingsPage() {
  const router = useRouter();
  const [wechatId, setWechatId] = useState("");
  const [qrImagePath, setQrImagePath] = useState("");
  const [note, setNote] = useState("");

  useDidShow(() => {
    const profile = getRescuerContactProfile();
    setWechatId(profile.wechatId);
    setQrImagePath(profile.qrImagePath);
    setNote(profile.note);
    loadMyProfile()
      .then((remoteProfile) => {
        if (!remoteProfile) {
          return;
        }

        const nextProfile = {
          wechatId: remoteProfile.wechatId || profile.wechatId,
          qrImagePath: remoteProfile.paymentQrUrl || profile.qrImagePath,
          note: remoteProfile.contactNote || profile.note,
        };
        saveRescuerContactProfile(nextProfile);
        setWechatId(nextProfile.wechatId);
        setQrImagePath(nextProfile.qrImagePath);
        setNote(nextProfile.note);
      })
      .catch(() => {
        // Keep local contact settings as fallback.
      });
  });

  const handlePickQrImage = async () => {
    try {
      const result = await Taro.chooseImage({
        count: 1,
        sizeType: ["compressed"],
        sourceType: ["album", "camera"],
      });

      const nextPath = result.tempFilePaths?.[0];
      if (nextPath) {
        setQrImagePath(nextPath);
      }
    } catch {
      // ignore cancel
    }
  };

  const handleSubmit = async () => {
    const nextWechatId = wechatId.trim();

    if (!nextWechatId) {
      Taro.showToast({
        title: "请填写微信号",
        icon: "none",
      });
      return;
    }

    if (!qrImagePath) {
      Taro.showToast({
        title: "请上传微信二维码",
        icon: "none",
      });
      return;
    }

    try {
      Taro.showLoading({ title: "保存中" });
      const uploaded =
        qrImagePath && !qrImagePath.startsWith("cloud://")
          ? await uploadProfileAssetImage(qrImagePath, "payment-qr")
          : undefined;
      const nextQrImagePath =
        uploaded && !uploaded.isLocalFallback ? uploaded.fileID : qrImagePath;

      await updateRemoteMyProfile({
        wechatId: nextWechatId,
        contactNote: note.trim(),
        paymentQrFileID:
          nextQrImagePath.startsWith("cloud://") ? nextQrImagePath : undefined,
      });

      saveRescuerContactProfile({
        wechatId: nextWechatId,
        qrImagePath: nextQrImagePath,
        note: note.trim(),
      });
      setQrImagePath(nextQrImagePath);
      Taro.hideLoading();
    } catch (error) {
      Taro.hideLoading();
      if (error instanceof Error && error.message === "PROFILE_ASSET_UPLOAD_FAILED") {
        Taro.showToast({
          title: "二维码上传失败",
          icon: "none",
        });
        return;
      }

      saveRescuerContactProfile({
        wechatId: nextWechatId,
        qrImagePath,
        note: note.trim(),
      });
    }

    Taro.showToast({
      title: "已保存联系方式",
      icon: "none",
    });

    setTimeout(() => {
      if (router.params?.redirect === "create") {
        Taro.navigateTo({
          url: "/pages/rescue/create/basic/index?entry=new",
        });
        return;
      }

      Taro.navigateBack();
    }, 350);
  };

  return (
    <View className="page-shell contact-settings-page">
      <NavBar showBack title="救助联系方式" />

      <View className="contact-settings-page__body">
        <View className="contact-settings-page__field">
          <Text className="contact-settings-page__label">微信号</Text>
          <View className="contact-settings-page__input-card">
            <Input
              className="contact-settings-page__input"
              placeholder="请填写微信号"
              placeholderStyle="color:#94A3B8;"
              value={wechatId}
              onInput={(event) => setWechatId(event.detail.value)}
            />
          </View>
        </View>

        <View className="contact-settings-page__field">
          <Text className="contact-settings-page__label">微信二维码</Text>
          <View className="contact-settings-page__qr-trigger" onTap={handlePickQrImage}>
            {qrImagePath ? (
              <Image
                className="contact-settings-page__qr-image"
                mode="aspectFill"
                src={qrImagePath}
              />
            ) : (
              <>
                <Image
                  className="contact-settings-page__qr-icon"
                  mode="aspectFit"
                  src={addPhotoIcon}
                />
                <Text className="contact-settings-page__qr-text">添加照片</Text>
              </>
            )}
          </View>
        </View>

        <View className="contact-settings-page__field">
          <Text className="contact-settings-page__label">备注（选填）</Text>
          <TextareaWithOverlayPlaceholder
            wrapperClassName="contact-settings-page__textarea-card"
            textareaClassName="contact-settings-page__textarea"
            placeholderClassName="contact-settings-page__textarea-placeholder"
            placeholder="如果要联系您有什么特别的注意事项"
            maxlength={120}
            value={note}
            onInput={(event) => setNote(event.detail.value)}
          />
        </View>
      </View>

      <View className="contact-settings-page__bottom">
        <View className="theme-button-primary contact-settings-page__submit" onTap={handleSubmit}>
          <Text>提交</Text>
          <Image className="contact-settings-page__submit-icon" mode="aspectFit" src={submitArrowIcon} />
        </View>
      </View>
    </View>
  );
}
