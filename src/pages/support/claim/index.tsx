import { Image, Input, Text, Textarea, View } from "@tarojs/components";
import Taro, { useRouter } from "@tarojs/taro";
import { useEffect, useState } from "react";
import { AppIcon } from "../../../components/AppIcon";
import addPhotoIcon from "../../../assets/support-claim/add-photo-22.svg";
import animalProfileExact from "../../../assets/support-claim/animal-profile-exact.png";
import { NavBar } from "../../../components/NavBar";
import { TextareaWithOverlayPlaceholder } from "../../../components/TextareaWithOverlayPlaceholder";
import { applyTitleOverrideToPublicDetail } from "../../../data/caseTitleOverride";
import { markCaseDetailRefresh } from "../../../data/caseDetailRefresh";
import { showSuccessFeedback } from "../../../utils/successFeedback";
import submitArrowIcon from "../../../assets/support-claim/submit-arrow-19.svg";
import {
  createRemoteSupportEntryByCaseId,
  loadPublicDetailVMByCaseId,
} from "../../../domain/canonical/repository";
import { uploadSupportProofImage } from "../../../domain/canonical/repository/cloudbaseClient";
import type { PublicDetailVM } from "../../../domain/canonical/types";
import "./index.scss";

type ClaimLoadStatus = "loading" | "ready" | "error";

function mapSupportError(error: unknown) {
  const code = error instanceof Error ? error.message : "";

  if (code === "DUPLICATE_SUPPORT_SCREENSHOT") {
    return "相同截图不能重复提交";
  }

  if (code === "INVALID_SCREENSHOT_FILE_ID") {
    return "凭证上传结果异常，请重新上传";
  }

  if (code === "SUPPORT_PROOF_UPLOAD_FAILED") {
    return "凭证上传失败，请检查网络后重试";
  }

  if (code === "SUPPORT_ENTRY_RATE_LIMIT_10_MIN") {
    return "10 分钟内只能提交 1 次";
  }

  if (code === "SUPPORT_ENTRY_RATE_LIMIT_24_HOUR") {
    return "24 小时内最多提交 3 次";
  }

  return "提交失败，请稍后重试";
}

function getSupportClaimCover(detail: PublicDetailVM) {
  return detail.heroImageUrl || animalProfileExact;
}

function getRescueStartedAtLabel(detail: PublicDetailVM) {
  return detail.rescueStartedAtLabel || detail.updatedAtLabel || "待补充";
}

export default function SupportClaimPage() {
  const router = useRouter();
  const caseId = router.params?.caseId || router.params?.id;
  const [amount, setAmount] = useState("");
  const [nickname, setNickname] = useState("默认写入微信ID");
  const [note, setNote] = useState("");
  const [imagePath, setImagePath] = useState("");
  const [detail, setDetail] = useState<PublicDetailVM | undefined>();
  const [loadStatus, setLoadStatus] = useState<ClaimLoadStatus>("loading");
  const [caseCoverSrc, setCaseCoverSrc] = useState<string>(animalProfileExact);

  useEffect(() => {
    setLoadStatus("loading");
    loadPublicDetailVMByCaseId(caseId)
      .then((nextDetail) => {
        const resolvedDetail = applyTitleOverrideToPublicDetail(nextDetail);
        setDetail(resolvedDetail);
        setCaseCoverSrc(
          resolvedDetail ? getSupportClaimCover(resolvedDetail) : animalProfileExact,
        );
        setLoadStatus(resolvedDetail ? "ready" : "error");
      })
      .catch(() => {
        setLoadStatus("error");
        Taro.showToast({
          title: "案例加载失败",
          icon: "none",
        });
      });
  }, [caseId]);

  if (loadStatus === "loading") {
    return (
      <View className="support-claim page-shell">
        <NavBar showBack title="认领支持" />
        <View className="support-claim__state">
          <View className="support-claim__state-icon">
            <AppIcon name="handCoins" size={24} />
          </View>
          <Text className="support-claim__state-title">正在加载案例信息</Text>
          <Text className="support-claim__state-copy">先把案例卡片和登记表单准备好，请稍等片刻。</Text>
        </View>
      </View>
    );
  }

  if (loadStatus === "error" || !detail) {
    return (
      <View className="support-claim page-shell">
        <NavBar showBack title="认领支持" />
        <View className="support-claim__state">
          <View className="support-claim__state-icon">
            <AppIcon name="fileText" size={24} />
          </View>
          <Text className="support-claim__state-title">案例信息加载失败</Text>
          <Text className="support-claim__state-copy">当前没能拿到案例信息，你可以返回上一页后稍后再试。</Text>
        </View>
      </View>
    );
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

    try {
      Taro.showLoading({ title: "提交中" });
      const uploaded = imagePath
        ? await uploadSupportProofImage(caseId || "unknown-case", imagePath)
        : undefined;
      const screenshotFileIds =
        uploaded && !uploaded.isLocalFallback ? [uploaded.fileID] : [];
      const localScreenshotPaths =
        imagePath && (!uploaded || uploaded.isLocalFallback) ? [imagePath] : [];

      await createRemoteSupportEntryByCaseId(caseId, {
        supporterNameMasked: nickname || "默认写入微信ID",
        amount: numericAmount,
        supportedAt: new Date().toISOString(),
        note,
        screenshotFileIds,
        localScreenshotPaths,
      });
      Taro.hideLoading();

      markCaseDetailRefresh(caseId);
      showSuccessFeedback({
        title: "已提交，待确认",
        delay: 900,
      });
    } catch (error) {
      Taro.hideLoading();
      Taro.showToast({
        title: mapSupportError(error),
        icon: "none",
      });
    }
  };

  return (
    <View className="support-claim page-shell">
      <NavBar showBack title="认领支持" />

      <View className="support-claim__case-card theme-card">
        <View className="support-claim__case-avatar-wrap">
          <Image
            className="support-claim__case-avatar"
            mode="aspectFill"
            src={caseCoverSrc}
            onError={() => setCaseCoverSrc(animalProfileExact)}
          />
        </View>
        <View className="support-claim__case-copy">
          <View className="support-claim__case-head">
            <Text className="support-claim__case-title">{detail.title}</Text>
            <Text className="support-claim__case-status">{detail.statusLabel}</Text>
          </View>
          <Text className="support-claim__case-meta">ID: {detail.publicCaseId}</Text>
          <Text className="support-claim__case-meta">
            救助开始时间: {getRescueStartedAtLabel(detail)}
          </Text>
        </View>
      </View>

      <View className="support-claim__field">
        <Text className="support-claim__label">支持金额</Text>
        <View className="support-claim__single-input support-claim__single-input--amount">
          <Text className="support-claim__currency">¥</Text>
          <Input
            className="support-claim__text-input support-claim__text-input--amount"
            type="digit"
            placeholder="0.00"
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

      <View className="support-claim__field support-claim__field--upload">
        <Text className="support-claim__label">转账截图/凭证</Text>
        <View className="support-claim__upload" onTap={handlePickImage}>
          {imagePath ? (
            <Image className="support-claim__upload-image" mode="aspectFill" src={imagePath} />
          ) : (
            <>
              <View className="support-claim__upload-icon">
                <Image className="support-claim__upload-icon-image" mode="aspectFit" src={addPhotoIcon} />
              </View>
              <Text className="support-claim__upload-text">添加照片</Text>
            </>
          )}
        </View>
      </View>

      <View className="support-claim__field">
        <Text className="support-claim__label">爱心留言/备注</Text>
        <TextareaWithOverlayPlaceholder
          wrapperClassName="support-claim__textarea-wrap"
          textareaClassName="support-claim__textarea"
          placeholderClassName="support-claim__textarea-placeholder"
          placeholder="给毛孩子留句祝福吧，或者备注资金的具体用途"
          maxlength={120}
          value={note}
          onInput={(event) => setNote(event.detail.value)}
        />
      </View>

      <View className="support-claim__bottom">
        <View className="theme-button-primary support-claim__submit" onTap={handleSubmit}>
          <Text>提交支持</Text>
          <Image className="support-claim__submit-arrow" mode="aspectFit" src={submitArrowIcon} />
        </View>
      </View>
    </View>
  );
}
