import Taro, { useDidShow, useRouter } from "@tarojs/taro";
import { useEffect, useRef, useState } from "react";
import { NavBar } from "../../../components/NavBar";
import { EmptyState, PageShell } from "../../../components/ui";
import { useKeyboardBottomInset } from "../../../components/useKeyboardBottomInset";
import { createSubmissionGuard } from "../../../utils/submissionGuard";
import { showSuccessFeedback } from "../../../utils/successFeedback";
import {
  createRemoteSupportEntryByCaseId,
  loadMyProfile,
  loadPublicDetailVMByCaseId,
} from "../../../domain/canonical/repository";
import { uploadSupportProofImage } from "../../../domain/canonical/repository/cloudbaseClient";
import type { PublicDetailVM } from "../../../domain/canonical/types";
import { SupportClaimForm } from "./components/SupportClaimForm";
import { normalizeSupporterNameForSubmit, resolveDefaultSupporterName } from "./supporterIdentity";
import "./index.scss";

type ClaimLoadStatus = "loading" | "ready" | "error";
const PROFILE_USER_KEY = "profile-user:v1";

function mapSupportError(error: unknown) {
  const code = error instanceof Error ? error.message : "";

  if (code === "DUPLICATE_SUPPORT_SCREENSHOT") {
    return "相同截图不能重复登记";
  }

  if (code === "INVALID_SCREENSHOT_FILE_ID") {
    return "凭证没有上传成功，请重新选择后再试";
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

  return "未能登记支持，请稍后重试";
}

function getSupportClaimCover(detail: PublicDetailVM) {
  return detail.heroImageUrl || "";
}

function getRescueStartedAtLabel(detail: PublicDetailVM) {
  return detail.rescueStartedAtLabel || detail.updatedAtLabel || "待补充";
}

function getStoredProfileNickname() {
  const stored = Taro.getStorageSync(PROFILE_USER_KEY);

  if (!stored || typeof stored !== "object") {
    return "";
  }

  const candidate = stored as { nickName?: string };
  return String(candidate.nickName || "").trim();
}

export default function SupportClaimPage() {
  const router = useRouter();
  const keyboardBottomInset = useKeyboardBottomInset();
  const caseId = router.params?.caseId || router.params?.id;
  const [amount, setAmount] = useState("");
  const [nickname, setNickname] = useState("");
  const [note, setNote] = useState("");
  const [imagePath, setImagePath] = useState("");
  const [detail, setDetail] = useState<PublicDetailVM | undefined>();
  const [loadStatus, setLoadStatus] = useState<ClaimLoadStatus>("loading");
  const [caseCoverSrc, setCaseCoverSrc] = useState<string>("");
  const nicknameDirtyRef = useRef(false);
  const defaultNameRequestRef = useRef(0);
  const submitGuardRef = useRef(createSubmissionGuard());

  useEffect(() => {
    setLoadStatus("loading");
    loadPublicDetailVMByCaseId(caseId)
      .then((nextDetail) => {
        setDetail(nextDetail);
        setCaseCoverSrc(nextDetail ? getSupportClaimCover(nextDetail) : "");
        setLoadStatus(nextDetail ? "ready" : "error");
      })
      .catch(() => {
        setLoadStatus("error");
        Taro.showToast({
          title: "档案加载失败",
          icon: "none",
        });
      });
  }, [caseId]);

  useDidShow(() => {
    const requestId = defaultNameRequestRef.current + 1;
    defaultNameRequestRef.current = requestId;
    const localNickname = getStoredProfileNickname();
    const applyDefaultName = (nextName: string) => {
      if (requestId === defaultNameRequestRef.current && nextName && !nicknameDirtyRef.current) {
        setNickname(nextName);
      }
    };

    applyDefaultName(resolveDefaultSupporterName({ localNickname }));

    loadMyProfile()
      .then((profile) => {
        applyDefaultName(resolveDefaultSupporterName({ localNickname, profile }));
      })
      .catch(() => {
        // Keep the local nickname or empty field as fallback.
      });
  });

  if (loadStatus === "loading") {
    return (
      <PageShell
        className="support-claim"
        style={{ paddingBottom: `${120 + keyboardBottomInset}px` }}
      >
        <NavBar showBack title="登记支持" />
        <EmptyState
          className="support-claim__state"
          iconName="handCoins"
          title="正在加载档案信息"
          description="先把档案卡片和登记支持表单准备好，请稍等片刻。"
        />
      </PageShell>
    );
  }

  if (loadStatus === "error" || !detail) {
    return (
      <PageShell
        className="support-claim"
        style={{ paddingBottom: `${120 + keyboardBottomInset}px` }}
      >
        <NavBar showBack title="登记支持" />
        <EmptyState
          className="support-claim__state"
          iconName="fileText"
          title="档案信息加载失败"
          description="暂时没能加载档案信息，你可以返回上一页后稍后再试。"
        />
      </PageShell>
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
          title: "请填写支持金额",
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
          supporterNameMasked: normalizeSupporterNameForSubmit(nickname),
          amount: numericAmount,
          supportedAt: new Date().toISOString(),
          note,
          screenshotFileIds,
          localScreenshotPaths,
        });
        Taro.hideLoading();

        await showSuccessFeedback({
          title: "支持已登记，等待确认",
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
    <PageShell
      className="support-claim"
      style={{ paddingBottom: `${120 + keyboardBottomInset}px` }}
    >
      <NavBar showBack title="登记支持" />

      <SupportClaimForm
        amount={amount}
        cursorSpacing={Math.max(180, keyboardBottomInset + 140)}
        imagePath={imagePath}
        nickname={nickname}
        note={note}
        summary={{
          coverSrc: caseCoverSrc,
          publicCaseId: detail.publicCaseId,
          rescueStartedAtLabel: `救助开始时间: ${getRescueStartedAtLabel(detail)}`,
          statusLabel: detail.statusLabel,
          title: detail.title,
        }}
        onAmountChange={setAmount}
        onCoverError={() => setCaseCoverSrc("")}
        onImageAdd={handlePickImage}
        onImagePreview={handlePreviewImage}
        onImageRemove={() => setImagePath("")}
        onNicknameChange={(value) => {
          nicknameDirtyRef.current = true;
          setNickname(value);
        }}
        onNoteChange={setNote}
        onSubmit={handleSubmit}
      />
    </PageShell>
  );
}
