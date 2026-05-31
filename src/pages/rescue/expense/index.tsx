import { View } from "@tarojs/components";
import Taro, { useDidHide, useDidShow, usePageScroll, useRouter, useUnload } from "@tarojs/taro";
import { useEffect, useMemo, useRef, useState } from "react";
import { NavBar } from "../../../components/NavBar";
import { AppButton, BottomActionBar, PageShell } from "../../../components/ui";
import { createSubmissionGuard } from "../../../utils/submissionGuard";
import { showSuccessFeedback } from "../../../utils/successFeedback";
import {
  addExpenseRecord,
  buildExpenseEvidenceItems,
  clearCaseContentWriteLocalFallback,
  recordCaseContentWriteLocalFallback,
} from "../../../domain/canonical/repository";
import qaCatImage from "../../../assets/rescue-expense/qa-cat.png";
import qaReceiptImage from "../../../assets/rescue-expense/qa-receipt.png";
import {
  createRemoteExpenseRecordByCaseId,
  formatTimelineTimestamp,
  getCurrentDraft,
  getDraftById,
  replaceDraft,
  syncCurrentDraft,
} from "../../../domain/canonical/repository";
import { uploadCaseAssetImage } from "../../../domain/canonical/repository/cloudbaseClient";
import { ExpenseCompactTotal } from "./components/ExpenseCompactTotal";
import { ExpenseDetailsSection } from "./components/ExpenseDetailsSection";
import { ExpenseEvidenceCard } from "./components/ExpenseEvidenceCard";
import { getCompactTotalThreshold, shouldShowCompactTotal } from "./stickyTotal";
import type { ExpenseLine } from "./types";
import "./index.scss";

type ExpenseDraftCache = {
  publicEvidenceImages: string[];
  expenseLines: ExpenseLine[];
  updatedAt: string;
};

type ExpenseQaPreset = "design" | "";

type NativeRect = {
  top?: number;
  height?: number;
};

function hasValidExpenseLineOrder(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function createExpenseLine(order = Date.now()): ExpenseLine {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    order,
    description: "",
    amount: "",
  };
}

function formatCurrency(value: number) {
  return value.toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function parseAmount(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function createInitialExpenseLines() {
  return [createExpenseLine(1), createExpenseLine(2)];
}

function getExpenseDraftCacheKey(caseId?: string) {
  return `rescue-expense-draft:${caseId || "unknown-case"}`;
}

function hasDraftContent(cache: Pick<ExpenseDraftCache, "publicEvidenceImages" | "expenseLines">) {
  if (cache.publicEvidenceImages.length) {
    return true;
  }

  return cache.expenseLines.some(
    (line) => line.description.trim().length > 0 || line.amount.trim().length > 0,
  );
}

function getQaPreset(value?: string): ExpenseQaPreset {
  return value === "design" ? "design" : "";
}

function getRectNumber(rect: NativeRect | null | undefined, key: keyof NativeRect) {
  const value = rect?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function buildDesignPresetLines() {
  return [
    {
      id: createExpenseLine().id,
      order: 1,
      description: "",
      amount: "",
    },
    {
      id: createExpenseLine().id,
      order: 2,
      description: "",
      amount: "",
    },
  ];
}

function getExpenseSubmissionTitle(lines: ExpenseLine[]) {
  const parts = lines.map((line) => line.description.trim()).filter(Boolean);

  if (!parts.length) {
    return "支付：支出记录";
  }

  return `支付：${parts.join(" + ")}`;
}

function hydrateExpenseLines(lines?: ExpenseLine[]) {
  if (!Array.isArray(lines) || !lines.length) {
    return createInitialExpenseLines();
  }

  return lines.map((line, index) => ({
    ...line,
    order: hasValidExpenseLineOrder(line.order) ? line.order : index + 1,
    description: typeof line.description === "string" ? line.description : "",
    amount: typeof line.amount === "string" ? line.amount : "",
  }));
}

function mapExpenseError(error: unknown) {
  const code = error instanceof Error ? error.message : "";

  if (code === "EXPENSE_EVIDENCE_REQUIRED") {
    return "请至少上传 1 张图片";
  }

  if (code === "INVALID_ASSET_FILE_ID") {
    return "图片上传结果异常，请重新上传";
  }

  if (code === "CASE_ASSET_UPLOAD_FAILED") {
    return "凭证上传失败，请重试";
  }

  return "记账保存失败";
}

export default function RescueExpensePage() {
  const router = useRouter();
  const caseId = router.params?.caseId || router.params?.id;
  const draftId = router.params?.draftId;
  const expenseContextId = draftId || caseId;
  const qaPreset = getQaPreset(router.params?.qaPreset);
  const cacheKey = getExpenseDraftCacheKey(expenseContextId);
  const hasHandledRestoreRef = useRef(false);
  const submitGuardRef = useRef(createSubmissionGuard());
  const latestScrollTopRef = useRef(0);
  const compactTotalThresholdRef = useRef(Number.POSITIVE_INFINITY);
  const [publicEvidenceImages, setPublicEvidenceImages] = useState<string[]>([]);
  const [expenseLines, setExpenseLines] = useState<ExpenseLine[]>(() =>
    hydrateExpenseLines(createInitialExpenseLines()),
  );
  const [showCompactTotal, setShowCompactTotal] = useState(false);

  const totalAmount = useMemo(
    () => expenseLines.reduce((sum, line) => sum + parseAmount(line.amount), 0),
    [expenseLines],
  );
  const displayedTotalAmount = qaPreset === "design" ? 342.5 : totalAmount;
  const displayedTotalLabel = formatCurrency(displayedTotalAmount);

  const measureCompactTotalThreshold = () => {
    const query = Taro.createSelectorQuery();

    query.select(".rescue-expense-page__sticky-nav").boundingClientRect();
    query.select(".rescue-expense-page__details-head").boundingClientRect();
    query.exec((rects) => {
      const [stickyNavRect, detailsHeadRect] = rects as Array<NativeRect | null | undefined>;

      if (!stickyNavRect || !detailsHeadRect) {
        return;
      }

      const threshold = getCompactTotalThreshold({
        detailsHeadTop: getRectNumber(detailsHeadRect, "top"),
        scrollTop: latestScrollTopRef.current,
        stickyHeaderHeight: getRectNumber(stickyNavRect, "height"),
        revealOffset: 8,
      });
      const shouldShow = shouldShowCompactTotal({
        scrollTop: latestScrollTopRef.current,
        threshold,
      });

      compactTotalThresholdRef.current = threshold;
      setShowCompactTotal((current) => (current === shouldShow ? current : shouldShow));
    });
  };

  useEffect(() => {
    Taro.nextTick(measureCompactTotalThreshold);
  }, [publicEvidenceImages.length, expenseLines.length, qaPreset]);

  usePageScroll((event) => {
    latestScrollTopRef.current = event.scrollTop;

    const shouldShow = shouldShowCompactTotal({
      scrollTop: event.scrollTop,
      threshold: compactTotalThresholdRef.current,
    });

    setShowCompactTotal((current) => (current === shouldShow ? current : shouldShow));
  });

  const persistDraftSilently = () => {
    const nextCache: ExpenseDraftCache = {
      publicEvidenceImages,
      expenseLines,
      updatedAt: new Date().toISOString(),
    };

    if (hasDraftContent(nextCache)) {
      Taro.setStorageSync(cacheKey, nextCache);
      return;
    }

    Taro.removeStorageSync(cacheKey);
  };

  useDidShow(() => {
    if (hasHandledRestoreRef.current) {
      return;
    }

    hasHandledRestoreRef.current = true;
    if (qaPreset === "design") {
      setPublicEvidenceImages([qaReceiptImage, qaCatImage, qaCatImage]);
      setExpenseLines(buildDesignPresetLines());
      return;
    }

    const cached = Taro.getStorageSync(cacheKey) as ExpenseDraftCache | undefined;
    if (!cached || !hasDraftContent(cached)) {
      Taro.removeStorageSync(cacheKey);
      return;
    }

    void Taro.showModal({
      title: "继续上次录入？",
      content: "检测到你上次离开时有未提交的记账内容。",
      confirmText: "继续录入",
      cancelText: "新的录入",
    }).then((result) => {
      if (result.confirm) {
        setPublicEvidenceImages(
          Array.isArray(cached.publicEvidenceImages) ? cached.publicEvidenceImages : [],
        );
        setExpenseLines(hydrateExpenseLines(cached.expenseLines));
        return;
      }

      Taro.removeStorageSync(cacheKey);
      setPublicEvidenceImages([]);
      setExpenseLines(createInitialExpenseLines());
    });
  });

  useDidHide(() => {
    if (qaPreset) {
      return;
    }
    persistDraftSilently();
  });

  useUnload(() => {
    if (qaPreset) {
      return;
    }
    persistDraftSilently();
  });

  const handlePickEvidence = async () => {
    const remaining = Math.max(9 - publicEvidenceImages.length, 0);
    if (!remaining) {
      Taro.showToast({
        title: "最多上传 9 张",
        icon: "none",
      });
      return;
    }

    const result = await Taro.chooseImage({
      count: remaining,
      sizeType: ["compressed"],
      sourceType: ["album", "camera"],
    });

    const nextImages = result.tempFilePaths || [];
    if (!nextImages.length) {
      return;
    }

    setPublicEvidenceImages((current) => [...nextImages.slice().reverse(), ...current].slice(0, 9));
  };

  const handlePreviewEvidence = (current: string) => {
    if (!publicEvidenceImages.length) {
      return;
    }

    Taro.previewImage({
      current,
      urls: publicEvidenceImages,
    });
  };

  const handleRemoveEvidence = (index: number) => {
    setPublicEvidenceImages((current) =>
      current.filter((_, currentIndex) => currentIndex !== index),
    );
  };

  const handleLineChange = (
    lineId: string,
    field: keyof Pick<ExpenseLine, "description" | "amount">,
    value: string,
  ) => {
    setExpenseLines((current) =>
      current.map((line) => (line.id === lineId ? { ...line, [field]: value } : line)),
    );
  };

  const handleAddLine = () => {
    setExpenseLines((current) => {
      const hydratedCurrent = hydrateExpenseLines(current);
      const nextOrder =
        hydratedCurrent.reduce((maxOrder, line) => Math.max(maxOrder, line.order), 0) + 1;

      return [
        {
          ...createExpenseLine(nextOrder),
          order: nextOrder,
        },
        ...hydratedCurrent,
      ];
    });
  };

  const handleRemoveLine = (lineId: string) => {
    setExpenseLines((current) => {
      if (current.length <= 1) {
        return current;
      }

      return current.filter((line) => line.id !== lineId);
    });
  };

  const handleSubmit = async () =>
    submitGuardRef.current.run(async () => {
      const validLines = expenseLines.filter(
        (line) => line.description.trim() && parseAmount(line.amount) > 0,
      );

      if (!validLines.length) {
        Taro.showToast({
          title: "请先填写至少一条支出明细",
          icon: "none",
        });
        return;
      }

      if (!publicEvidenceImages.length) {
        Taro.showToast({
          title: "请至少上传 1 张图片",
          icon: "none",
        });
        return;
      }

      const total = validLines.reduce((sum, line) => sum + parseAmount(line.amount), 0);
      const title = getExpenseSubmissionTitle(validLines);
      const spentAt = new Date().toISOString();
      const evidenceItems = buildExpenseEvidenceItems(publicEvidenceImages);

      try {
        Taro.showLoading({ title: "保存中", mask: true });

        if (draftId) {
          const matchedDraft = getDraftById(draftId) || getCurrentDraft();
          if (!matchedDraft) {
            Taro.hideLoading();
            Taro.showToast({
              title: "草稿上下文丢失",
              icon: "none",
            });
            return;
          }

          const { draft: nextDraft } = addExpenseRecord(matchedDraft, {
            amount: total,
            spentAt,
            category: "medical",
            summary: title,
            evidenceItems,
            verificationStatus: "manual",
          });

          replaceDraft(nextDraft);
          syncCurrentDraft(nextDraft);
        } else if (caseId) {
          const uploadedAssets = await Promise.all(
            publicEvidenceImages.map((imageUrl) =>
              uploadCaseAssetImage(caseId, imageUrl, "expense-proofs"),
            ),
          );
          const evidenceFileIds = uploadedAssets
            .filter((asset) => !asset.isLocalFallback)
            .map((asset) => asset.fileID);
          const didSyncRemote = await createRemoteExpenseRecordByCaseId(caseId, {
            amount: total,
            spentAt,
            summary: title,
            category: "medical",
            evidenceFileIds,
            expenseItems: validLines.map((line) => ({
              description: line.description.trim(),
              amount: parseAmount(line.amount),
            })),
          });

          if (!didSyncRemote) {
            recordCaseContentWriteLocalFallback({
              caseId,
              kind: "expense",
              submission: {
                id: `local-expense-${Date.now()}`,
                title,
                amount: total,
                timestampLabel: formatTimelineTimestamp(new Date(spentAt)),
                assetUrls: publicEvidenceImages.slice(0, 9),
                createdAt: spentAt,
              },
            });
          } else {
            clearCaseContentWriteLocalFallback({ caseId, kind: "expense" });
          }
        } else {
          Taro.hideLoading();
          Taro.showToast({
            title: "当前案例上下文缺失",
            icon: "none",
          });
          return;
        }

        Taro.removeStorageSync(cacheKey);
        Taro.hideLoading();
        await showSuccessFeedback({
          title: "支出已记入账本",
        });
      } catch (error) {
        Taro.hideLoading();
        Taro.showToast({
          title: mapExpenseError(error),
          icon: "none",
        });
      }
    });

  return (
    <PageShell
      className={`rescue-expense-page${
        qaPreset === "design" ? " rescue-expense-page--qa-design" : ""
      }`}
    >
      <View className="rescue-expense-page__sticky-head">
        <View className="rescue-expense-page__sticky-nav">
          <NavBar showBack title="记录支出" />
        </View>

        <ExpenseCompactTotal amountLabel={displayedTotalLabel} visible={showCompactTotal} />
      </View>

      <View className="rescue-expense-page__body">
        <ExpenseEvidenceCard
          images={publicEvidenceImages}
          onAdd={handlePickEvidence}
          onPreview={handlePreviewEvidence}
          onRemove={handleRemoveEvidence}
        />

        <ExpenseDetailsSection
          amountLabel={displayedTotalLabel}
          lines={expenseLines}
          onAdd={handleAddLine}
          onLineChange={handleLineChange}
          onRemove={handleRemoveLine}
        />
      </View>

      <BottomActionBar className="rescue-expense-page__bottom">
        <AppButton
          className="rescue-expense-page__submit"
          iconName="arrowRight"
          onTap={handleSubmit}
        >
          确认并挂载至账本
        </AppButton>
      </BottomActionBar>
    </PageShell>
  );
}
