import { Image, Input, Text, View } from "@tarojs/components";
import Taro, { useRouter } from "@tarojs/taro";
import { useEffect, useState } from "react";
import { NavBar } from "../../../components/NavBar";
import { TextareaWithOverlayPlaceholder } from "../../../components/TextareaWithOverlayPlaceholder";
import { useKeyboardBottomInset } from "../../../components/useKeyboardBottomInset";
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
  const keyboardBottomInset = useKeyboardBottomInset();
  const [wechatId, setWechatId] = useState("");
  const [qrImagePath, setQrImagePath] = useState("");
  const [note, setNote] = useState("");
  const [remotePaymentQrAssetId, setRemotePaymentQrAssetId] = useState("");

  useEffect(() => {
    let cancelled = false;
    const profile = getRescuerContactProfile();
    setWechatId(profile.wechatId);
    setQrImagePath(profile.qrImagePath);
    setNote(profile.note);

    loadMyProfile()
      .then((remoteProfile) => {
        if (!remoteProfile || cancelled) {
          return;
        }

        const nextProfile = {
          wechatId: remoteProfile.wechatId || profile.wechatId,
          qrImagePath: remoteProfile.paymentQrUrl || profile.qrImagePath,
          note: remoteProfile.contactNote ?? profile.note,
        };
        setRemotePaymentQrAssetId(remoteProfile.paymentQrAssetId || "");
        saveRescuerContactProfile(nextProfile);
        setWechatId(nextProfile.wechatId);
        setQrImagePath(nextProfile.qrImagePath);
        setNote(nextProfile.note);
      })
      .catch(() => {
        // Keep local contact settings as fallback.
      });

    return () => {
      cancelled = true;
    };
  }, []);

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
        setRemotePaymentQrAssetId("");
      }
    } catch {
      // ignore cancel
    }
  };

  const handleSubmit = async () => {
    const nextWechatId = wechatId.trim();
    const hasQrImage = Boolean(qrImagePath.trim());

    if (!nextWechatId && !hasQrImage) {
      Taro.showToast({
        title: "请填写微信号或上传二维码",
        icon: "none",
      });
      return;
    }

    try {
      Taro.showLoading({ title: "保存中" });
      const isExistingRemoteQr = Boolean(
        remotePaymentQrAssetId &&
          (qrImagePath.startsWith("https://") || qrImagePath.startsWith("cloud://")),
      );
      const baseProfileSaved = await updateRemoteMyProfile({
        wechatId: nextWechatId,
        contactNote: note.trim(),
      });

      if (!baseProfileSaved) {
        saveRescuerContactProfile({
          wechatId: nextWechatId,
          qrImagePath,
          note: note.trim(),
        });
        Taro.hideLoading();
        Taro.showToast({
          title: "只保存在本机，请稍后再试",
          icon: "none",
        });
        return;
      }

      let nextQrImagePath = qrImagePath;

      if (qrImagePath && !qrImagePath.startsWith("cloud://") && !isExistingRemoteQr) {
        const uploaded = await uploadProfileAssetImage(qrImagePath, "payment-qr");
        nextQrImagePath = uploaded && !uploaded.isLocalFallback ? uploaded.fileID : qrImagePath;
      }

      if (nextQrImagePath.startsWith("cloud://") && !isExistingRemoteQr) {
        const didSyncQr = await updateRemoteMyProfile({
          wechatId: nextWechatId,
          contactNote: note.trim(),
          paymentQrFileID: nextQrImagePath,
        });

        if (!didSyncQr) {
          saveRescuerContactProfile({
            wechatId: nextWechatId,
            qrImagePath,
            note: note.trim(),
          });
          Taro.hideLoading();
          Taro.showToast({
            title: "联系方式已保存，二维码没传上去",
            icon: "none",
          });
          return;
        }
      }

      const confirmedProfile = await loadMyProfile().catch(() => undefined);
      const nextProfile = {
        wechatId: confirmedProfile?.wechatId || nextWechatId,
        qrImagePath: confirmedProfile?.paymentQrUrl || nextQrImagePath,
        note: confirmedProfile?.contactNote ?? note.trim(),
      };

      saveRescuerContactProfile({
        wechatId: nextProfile.wechatId,
        qrImagePath: nextProfile.qrImagePath,
        note: nextProfile.note,
      });
      setWechatId(nextProfile.wechatId);
      setQrImagePath(nextProfile.qrImagePath);
      setNote(nextProfile.note);
      setRemotePaymentQrAssetId(confirmedProfile?.paymentQrAssetId || "");
      Taro.hideLoading();

      if (!confirmedProfile?.hasContactProfile) {
        Taro.showToast({
          title: hasQrImage ? "二维码已保存" : "微信号已保存",
          icon: "none",
        });
        return;
      }

      Taro.showToast({
        title: "联系方式已保存",
        icon: "none",
      });
    } catch (error) {
      Taro.hideLoading();
      if (error instanceof Error && error.message === "PROFILE_ASSET_UPLOAD_FAILED") {
        saveRescuerContactProfile({
          wechatId: nextWechatId,
          qrImagePath,
          note: note.trim(),
        });
        Taro.showToast({
          title: "联系方式已保存，二维码没传上去",
          icon: "none",
        });
        return;
      }

      saveRescuerContactProfile({
        wechatId: nextWechatId,
        qrImagePath,
        note: note.trim(),
      });
      Taro.showToast({
        title: "只保存在本机，请稍后再试",
        icon: "none",
      });
      return;
    }

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
    <View
      className="page-shell contact-settings-page"
      style={{ paddingBottom: `${128 + keyboardBottomInset}px` }}
    >
      <NavBar showBack title="救助联系方式" />

      <View className="contact-settings-page__body">
        <View className="contact-settings-page__field">
          <Text className="contact-settings-page__label">微信号（二选一即可）</Text>
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
          <Text className="contact-settings-page__label">微信二维码（二选一即可）</Text>
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
            cursorSpacing={Math.max(180, keyboardBottomInset + 140)}
            maxlength={120}
            value={note}
            onInput={(event) => setNote(event.detail.value)}
          />
        </View>
      </View>

      <View
        className="contact-settings-page__bottom"
        style={{ bottom: `${keyboardBottomInset}px` }}
      >
        <View className="theme-button-primary contact-settings-page__submit" onTap={handleSubmit}>
          <Text>提交</Text>
          <Image className="contact-settings-page__submit-icon" mode="aspectFit" src={submitArrowIcon} />
        </View>
      </View>
    </View>
  );
}
