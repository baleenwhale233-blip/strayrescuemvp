import { Image, Input, Text, View } from "@tarojs/components";
import Taro, { useRouter } from "@tarojs/taro";
import { useEffect, useRef, useState } from "react";
import addPhotoIcon from "../../../assets/support-claim/add-photo-22.svg";
import animalProfileExact from "../../../assets/support-claim/animal-profile-exact.png";
import { NavBar } from "../../../components/NavBar";
import { TextareaWithOverlayPlaceholder } from "../../../components/TextareaWithOverlayPlaceholder";
import {
  AppButton,
  BottomActionBar,
  EmptyState,
  FormField,
  StatusBadge,
  SurfaceCard,
  UploadStrip,
} from "../../../components/ui";
import { useKeyboardBottomInset } from "../../../components/useKeyboardBottomInset";
import { createSubmissionGuard } from "../../../utils/submissionGuard";
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
    return "相同截图不能重复登记";
  }

  if (code === "INVALID_SCREENSHOT_FILE_ID") {
    return "凭证上传结果异常，请重新上传";
  }

  if (code === "SUPPORT_PROOF_UPLOAD_FAILED") {
    return "凭证上传失败，请检查网络后重试";
  }

  if (code === "SUPPORT_ENTRY_RATE_LIMIT_10_MIN") {
    return "10 分钟内只能登记 1 次";
  }

  if (code === "SUPPORT_ENTRY_RATE_LIMIT_24_HOUR") {
    return "24 小时内最多登记 3 次";
  }

  return "登记失败，请稍后重试";
}

function getSupportClaimCover(detail: PublicDetailVM) {
  return detail.heroImageUrl || animalProfileExact;
}

function getRescueStartedAtLabel(detail: PublicDetailVM) {
  return detail.rescueStartedAtLabel || detail.updatedAtLabel || "待补充";
}

export default function SupportClaimPage() {
  const router = useRouter();
  const keyboardBottomInset = useKeyboardBottomInset();
  const caseId = router.params?.caseId || router.params?.id;
  const [amount, setAmount] = useState("");
  const [nickname, setNickname] = useState("默认写入微信ID");
  const [note, setNote] = useState("");
  const [imagePath, setImagePath] = useState("");
  const [detail, setDetail] = useState<PublicDetailVM | undefined>();
  const [loadStatus, setLoadStatus] = useState<ClaimLoadStatus>("loading");
  const [caseCoverSrc, setCaseCoverSrc] = useState<string>(animalProfileExact);
  const submitGuardRef = useRef(createSubmissionGuard());

  useEffect(() => {
    setLoadStatus("loading");
    loadPublicDetailVMByCaseId(caseId)
      .then((nextDetail) => {
        setDetail(nextDetail);
        setCaseCoverSrc(nextDetail ? getSupportClaimCover(nextDetail) : animalProfileExact);
        setLoadStatus(nextDetail ? "ready" : "error");
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
      <View
        className="support-claim page-shell"
        style={{ paddingBottom: `${120 + keyboardBottomInset}px` }}
      >
        <NavBar showBack title="登记一笔" />
        <EmptyState
          className="support-claim__state"
          iconName="handCoins"
          title="正在加载档案信息"
          description="先把档案卡片和登记表单准备好，请稍等片刻。"
        />
      </View>
    );
  }

  if (loadStatus === "error" || !detail) {
    return (
      <View
        className="support-claim page-shell"
        style={{ paddingBottom: `${120 + keyboardBottomInset}px` }}
      >
        <NavBar showBack title="登记一笔" />
        <EmptyState
          className="support-claim__state"
          iconName="fileText"
          title="档案信息加载失败"
          description="当前没能拿到档案信息，你可以返回上一页后稍后再试。"
        />
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

  const handlePreviewImage = (src: string) => {
    Taro.previewImage({
      current: src,
      urls: [src],
    });
  };

  const handleSubmit = async () =>
    submitGuardRef.current.run(async () => {
      const numericAmount = Number(amount);

      if (!numericAmount || Number.isNaN(numericAmount)) {
        Taro.showToast({
          title: "请填写登记金额",
          icon: "none",
        });
        return;
      }

      try {
        Taro.showLoading({ title: "提交中", mask: true });
        const uploaded = imagePath
          ? await uploadSupportProofImage(caseId || "unknown-case", imagePath)
          : undefined;
        const screenshotFileIds = uploaded && !uploaded.isLocalFallback ? [uploaded.fileID] : [];
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

        await showSuccessFeedback({
          title: "已登记，待处理",
          delay: 900,
        });
      } catch (error) {
        Taro.hideLoading();
        Taro.showToast({
          title: mapSupportError(error),
          icon: "none",
        });
      }
    });

  return (
    <View
      className="support-claim page-shell"
      style={{ paddingBottom: `${120 + keyboardBottomInset}px` }}
    >
      <NavBar showBack title="登记一笔" />

      <SurfaceCard className="support-claim__case-card">
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
            <StatusBadge className="support-claim__case-status" tone="brand">
              {detail.statusLabel}
            </StatusBadge>
          </View>
          <Text className="support-claim__case-meta">ID: {detail.publicCaseId}</Text>
          <Text className="support-claim__case-meta">
            记录开始时间: {getRescueStartedAtLabel(detail)}
          </Text>
        </View>
      </SurfaceCard>

      <FormField className="support-claim__field" label="登记金额">
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
      </FormField>

      <FormField className="support-claim__field" label="您的称呼">
        <Input
          className="support-claim__text-input"
          value={nickname}
          onInput={(event) => setNickname(event.detail.value)}
        />
      </FormField>

      <FormField
        className="support-claim__field support-claim__field--upload"
        label="相关截图/凭证"
      >
        <UploadStrip
          className="support-claim__upload-strip"
          addIconSrc={addPhotoIcon}
          addLabel="添加照片"
          images={imagePath ? [imagePath] : []}
          maxImages={1}
          onAdd={handlePickImage}
          onPreview={(src) => handlePreviewImage(src)}
          onRemove={() => setImagePath("")}
        />
      </FormField>

      <FormField className="support-claim__field" label="备注">
        <TextareaWithOverlayPlaceholder
          wrapperClassName="support-claim__textarea-wrap"
          textareaClassName="support-claim__textarea"
          placeholderClassName="support-claim__textarea-placeholder"
          placeholder="可补充留言、用途或对账备注"
          cursorSpacing={Math.max(180, keyboardBottomInset + 140)}
          maxlength={120}
          value={note}
          onInput={(event) => setNote(event.detail.value)}
        />
      </FormField>

      <BottomActionBar className="support-claim__bottom">
        <AppButton className="support-claim__submit" iconSrc={submitArrowIcon} onTap={handleSubmit}>
          提交登记
        </AppButton>
      </BottomActionBar>
    </View>
  );
}
