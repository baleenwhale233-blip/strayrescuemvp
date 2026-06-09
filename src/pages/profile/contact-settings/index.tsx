import Taro, { useRouter } from "@tarojs/taro";
import { useEffect, useRef, useState } from "react";
import { NavBar } from "../../../components/NavBar";
import { PageShell } from "../../../components/ui";
import { useKeyboardBottomInset } from "../../../components/useKeyboardBottomInset";
import { createSubmissionGuard } from "../../../utils/submissionGuard";
import {
  getRescuerContactProfile,
  saveRescuerContactProfile,
} from "../../../data/rescuerContactProfile";
import { loadMyProfile, updateRemoteMyProfile } from "../../../domain/canonical/repository";
import { uploadProfileAssetImage } from "../../../domain/canonical/repository/cloudbaseClient";
import { ContactSettingsForm } from "./components/ContactSettingsForm";
import "./index.scss";

export default function ContactSettingsPage() {
  const router = useRouter();
  const keyboardBottomInset = useKeyboardBottomInset();
  const [wechatId, setWechatId] = useState("");
  const [qrImagePath, setQrImagePath] = useState("");
  const [note, setNote] = useState("");
  const [remotePaymentQrAssetId, setRemotePaymentQrAssetId] = useState("");
  const submitGuardRef = useRef(createSubmissionGuard());

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

  const handleSubmit = async () =>
    submitGuardRef.current.run(async () => {
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
        Taro.showLoading({ title: "保存中", mask: true });
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
            title: "已保存在本机，稍后再同步",
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
              title: "联系方式已保存，二维码未同步",
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
            title: "联系方式已保存，二维码未同步",
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
          title: "已保存在本机，稍后再同步",
          icon: "none",
        });
        return;
      }

      await new Promise<void>((resolve) => {
        setTimeout(() => {
          if (router.params?.redirect === "create") {
            void Taro.navigateTo({
              url: "/pages/rescue/create/basic/index?entry=new",
            });
            resolve();
            return;
          }

          void Taro.navigateBack();
          resolve();
        }, 350);
      });
    });

  return (
    <PageShell
      className="contact-settings-page"
      style={{ paddingBottom: `${128 + keyboardBottomInset}px` }}
    >
      <NavBar showBack title="联系信息" />

      <ContactSettingsForm
        cursorSpacing={Math.max(180, keyboardBottomInset + 140)}
        note={note}
        qrImagePath={qrImagePath}
        wechatId={wechatId}
        onNoteChange={setNote}
        onPickQrImage={handlePickQrImage}
        onSubmit={handleSubmit}
        onWechatIdChange={setWechatId}
      />
    </PageShell>
  );
}
