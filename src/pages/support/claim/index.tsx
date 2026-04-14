import { Image, Input, Text, Textarea, View } from "@tarojs/components";
import Taro, { useDidShow, useRouter } from "@tarojs/taro";
import { useState } from "react";
import { NavBar } from "../../../components/NavBar";
import {
  createRemoteSupportEntryByCaseId,
  loadPublicDetailVMByCaseId,
} from "../../../domain/canonical/repository";
import { uploadSupportProofImage } from "../../../domain/canonical/repository/cloudbaseClient";
import type { PublicDetailVM } from "../../../domain/canonical/types";
import "./index.scss";

function mapSupportError(error: unknown) {
  const code = error instanceof Error ? error.message : "";

  if (code === "DUPLICATE_SUPPORT_SCREENSHOT") {
    return "相同截图不能重复提交";
  }

  if (code === "SUPPORT_ENTRY_RATE_LIMIT_10_MIN") {
    return "10 分钟内只能提交 1 次";
  }

  if (code === "SUPPORT_ENTRY_RATE_LIMIT_24_HOUR") {
    return "24 小时内最多提交 3 次";
  }

  return "提交失败，请稍后重试";
}

export default function SupportClaimPage() {
  const router = useRouter();
  const caseId = router.params?.caseId || router.params?.id;
  const [amount, setAmount] = useState("");
  const [nickname, setNickname] = useState("默认写入微信ID");
  const [supportedAt, setSupportedAt] = useState("");
  const [note, setNote] = useState("");
  const [imagePath, setImagePath] = useState("");
  const [reloadSeed, setReloadSeed] = useState(0);
  const [detail, setDetail] = useState<PublicDetailVM | undefined>();

  useDidShow(() => {
    setReloadSeed((value) => value + 1);
    loadPublicDetailVMByCaseId(caseId)
      .then(setDetail)
      .catch(() => {
        Taro.showToast({
          title: "案例加载失败",
          icon: "none",
        });
      });
  });

  if (!detail) {
    return null;
  }

  const handlePickImage = async () => {
    const result = await Taro.chooseImage({
      count: 1,
      sizeType: ["compressed"],
      sourceType: ["album", "camera"],
    });

    const picked = result.tempFilePaths?.[0];
    if (picked) {
      setImagePath(picked);
    }
  };

  const handleSubmit = async () => {
    const numericAmount = Number(amount);

    if (!numericAmount || Number.isNaN(numericAmount)) {
      Taro.showToast({
        title: "请填写支持金额",
        icon: "none",
      });
      return;
    }

    if (!supportedAt.trim()) {
      Taro.showToast({
        title: "请填写支持时间",
        icon: "none",
      });
      return;
    }

    try {
      Taro.showLoading({ title: "提交中" });
      const uploaded = imagePath
        ? await uploadSupportProofImage(caseId || "unknown-case", imagePath)
        : undefined;

      await createRemoteSupportEntryByCaseId(caseId, {
        supporterNameMasked: nickname || "默认写入微信ID",
        amount: numericAmount,
        supportedAt: supportedAt.trim(),
        note,
        screenshotFileIds: uploaded?.fileID ? [uploaded.fileID] : [],
        localScreenshotPaths: imagePath ? [imagePath] : [],
      });
      Taro.hideLoading();

      Taro.showToast({
        title: "已提交支持登记",
        icon: "none",
      });

      setTimeout(() => {
        Taro.navigateBack();
      }, 500);
    } catch (error) {
      Taro.hideLoading();
      Taro.showToast({
        title: mapSupportError(error),
        icon: "none",
      });
    }
  };

  return (
    <View key={reloadSeed} className="support-claim page-shell">
      <NavBar showBack title="登记我的支持" />

      <View className="support-claim__case-card theme-card">
        {detail.heroImageUrl ? (
          <Image className="support-claim__case-avatar" mode="aspectFill" src={detail.heroImageUrl} />
        ) : null}
        <View className="support-claim__case-copy">
          <View className="support-claim__case-head">
            <Text className="support-claim__case-title">{detail.title}</Text>
            <Text className="support-claim__case-status">{detail.statusLabel}</Text>
          </View>
          <Text className="support-claim__case-meta">ID: {detail.publicCaseId}</Text>
          <Text className="support-claim__case-meta">最近更新：{detail.updatedAtLabel}</Text>
        </View>
      </View>

      <Text className="support-claim__tip">
        感谢你的支持。请补登记本次支持，救助人核实后会展示在进度条和透明账本中。
      </Text>

      <View className="support-claim__field">
        <Text className="support-claim__label">支持金额</Text>
        <View className="support-claim__input-wrap">
          <Text className="support-claim__currency">¥</Text>
          <Input
            className="support-claim__input"
            type="digit"
            value={amount}
            onInput={(event) => setAmount(event.detail.value)}
          />
        </View>
      </View>

      <View className="support-claim__field">
        <Text className="support-claim__label">您的称呼</Text>
        <Input
          className="support-claim__text-input"
          value={nickname}
          onInput={(event) => setNickname(event.detail.value)}
        />
      </View>

      <View className="support-claim__field">
        <Text className="support-claim__label">支持时间</Text>
        <Input
          className="support-claim__text-input"
          placeholder="例如：2026-04-04 12:30"
          value={supportedAt}
          onInput={(event) => setSupportedAt(event.detail.value)}
        />
      </View>

      <View className="support-claim__field">
        <Text className="support-claim__label">转账截图/凭证</Text>
        <View className="support-claim__upload" onTap={handlePickImage}>
          {imagePath ? (
            <Image className="support-claim__upload-image" mode="aspectFill" src={imagePath} />
          ) : (
            <>
              <Text className="support-claim__upload-icon">⌲</Text>
              <Text className="support-claim__upload-text">添加照片</Text>
            </>
          )}
        </View>
      </View>

      <View className="support-claim__field">
        <Text className="support-claim__label">爱心留言/备注</Text>
        <Textarea
          className="support-claim__textarea"
          maxlength={120}
          placeholder="给毛孩子留句祝福吧，或者备注资金的具体用途"
          value={note}
          onInput={(event) => setNote(event.detail.value)}
        />
      </View>

      <View className="support-claim__bottom">
        <View className="theme-button-primary support-claim__submit" onTap={handleSubmit}>
          <Text>提交支持</Text>
          <Text className="support-claim__submit-arrow">▷</Text>
        </View>
      </View>
    </View>
  );
}
