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
import {
  createRemoteExpenseRecordByCaseId,
  formatTimelineTimestamp,
  loadCaseRecordDetail,
  getCurrentDraft,
  getDraftById,
  replaceDraft,
  syncCurrentDraft,
  updateRemoteExpenseRecordByCaseId,
  type CaseRecordDetailVM,
} from "../../../domain/canonical/repository";
import { uploadCaseAssetImage } from "../../../domain/canonical/repository/cloudbaseClient";
import {
  clearExpenseEditSource,
  getExpenseEditSource,
  type ExpenseEditSource,
} from "./expenseEditSource";
import { getExpenseSuccessNavigation } from "./expenseSuccessNavigation";
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

function getExpenseLinesFromEditSource(source?: ExpenseEditSource) {
  if (!source?.expenseItems.length) {
    return createInitialExpenseLines();
  }

  return source.expenseItems.map((item, index) => ({
    ...createExpenseLine(index + 1),
    order: index + 1,
    description: item.description,
    amount:
      typeof item.amount === "number" && Number.isFinite(item.amount) ? String(item.amount) : "",
  }));
}

function getEvidenceFileIdMap(source?: ExpenseEditSource) {
  return Object.fromEntries(
    (source?.evidenceImages || [])
      .filter((image) => image.url && image.fileID)
      .map((image) => [image.url, image.fileID as string]),
  );
}

function mapRecordToExpenseEditSource(record: CaseRecordDetailVM): ExpenseEditSource {
  return {
    caseId: record.caseId,
    evidenceImages: record.images
      .map((image) => ({
        fileID: image.fileID,
        url: image.url,
      }))
      .filter((image) => image.url),
    expenseItems: record.expenseItems?.length
      ? record.expenseItems
      : [
          {
            amount: record.amount,
            description: record.title,
          },
        ],
    recordId: record.id,
    spentAt: record.occurredAt,
  };
}

function isCloudFileID(value: string) {
  return value.startsWith("cloud://");
}

function mapExpenseError(error: unknown) {
  const code = error instanceof Error ? error.message : "";

  if (code === "EXPENSE_EVIDENCE_REQUIRED") {
    return "请至少上传 1 张凭证图片";
  }

  if (code === "INVALID_ASSET_FILE_ID") {
    return "图片没有上传成功，请重新选择后再试";
  }

  if (code === "CASE_ASSET_UPLOAD_FAILED") {
    return "凭证上传失败，请检查网络后重试";
  }

  if (code === "EXPENSE_EDIT_REQUIRES_REMOTE" || code === "CLOUDBASE_NOT_CONFIGURED") {
    return "暂时不能修改，请检查网络后重试";
  }

  if (code === "UNKNOWN_ACTION") {
    return "当前版本暂不支持修改，请稍后再试";
  }

  if (code === "EXPENSE_EDIT_EVIDENCE_RESELECT_REQUIRED") {
    return "请重新选择凭证图片后再保存";
  }

  if (code === "RECORD_NOT_FOUND") {
    return "未找到原支出记录";
  }

  if (code === "FORBIDDEN") {
    return "只有档案维护者可以修改";
  }

  return "未能保存支出记录，请稍后重试";
}

export default function RescueExpensePage() {
  const router = useRouter();
  const caseId = router.params?.caseId || router.params?.id;
  const draftId = router.params?.draftId;
  const editRecordId = router.params?.editRecordId;
  const isEditMode = Boolean(caseId && editRecordId);
  const expenseContextId = draftId || caseId;
  const qaPreset = getQaPreset(router.params?.qaPreset);
  const cacheKey = getExpenseDraftCacheKey(expenseContextId);
  const hasHandledRestoreRef = useRef(false);
  const existingEvidenceFileIdsRef = useRef<Record<string, string>>({});
  const submitGuardRef = useRef(createSubmissionGuard());
  const latestScrollTopRef = useRef(0);
  const compactTotalThresholdRef = useRef(Number.POSITIVE_INFINITY);
  const [publicEvidenceImages, setPublicEvidenceImages] = useState<string[]>([]);
  const [expenseLines, setExpenseLines] = useState<ExpenseLine[]>(() =>
    hydrateExpenseLines(createInitialExpenseLines()),
  );
  const [editSource, setEditSource] = useState<ExpenseEditSource | undefined>();
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
    if (isEditMode) {
      return;
    }

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

  const applyEditSource = (source: ExpenseEditSource) => {
    existingEvidenceFileIdsRef.current = getEvidenceFileIdMap(source);
    setEditSource(source);
    setPublicEvidenceImages(source.evidenceImages.map((image) => image.url).filter(Boolean));
    setExpenseLines(hydrateExpenseLines(getExpenseLinesFromEditSource(source)));
  };

  const hydrateEditSource = async () => {
    if (!caseId || !editRecordId) {
      return;
    }

    const storedSource = getExpenseEditSource();
    if (storedSource?.caseId === caseId && storedSource.recordId === editRecordId) {
      applyEditSource(storedSource);
      return;
    }

    const remoteRecord = await loadCaseRecordDetail({
      caseId,
      recordId: editRecordId,
      recordType: "expense",
    });

    if (remoteRecord?.recordType === "expense") {
      applyEditSource(mapRecordToExpenseEditSource(remoteRecord));
    }
  };

  useDidShow(() => {
    if (hasHandledRestoreRef.current) {
      return;
    }

    hasHandledRestoreRef.current = true;
    if (isEditMode) {
      void hydrateEditSource();
      return;
    }

    if (qaPreset === "design") {
      setPublicEvidenceImages([]);
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

  const resolveEditEvidenceFileIds = async () =>
    Promise.all(
      publicEvidenceImages.map(async (imageUrl) => {
        const existingFileID = existingEvidenceFileIdsRef.current[imageUrl];
        if (existingFileID) {
          return existingFileID;
        }

        if (isCloudFileID(imageUrl)) {
          return imageUrl;
        }

        if (/^https?:\/\//.test(imageUrl)) {
          throw new Error("EXPENSE_EDIT_EVIDENCE_RESELECT_REQUIRED");
        }

        if (!caseId) {
          throw new Error("INVALID_EXPENSE_RECORD");
        }

        const uploadedAsset = await uploadCaseAssetImage(caseId, imageUrl, "expense-proofs");
        if (uploadedAsset.isLocalFallback) {
          throw new Error("EXPENSE_EDIT_REQUIRES_REMOTE");
        }

        return uploadedAsset.fileID;
      }),
    );

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
          title: "请至少上传 1 张凭证图片",
          icon: "none",
        });
        return;
      }

      const total = validLines.reduce((sum, line) => sum + parseAmount(line.amount), 0);
      const title = getExpenseSubmissionTitle(validLines);
      const spentAt = isEditMode
        ? editSource?.spentAt || new Date().toISOString()
        : new Date().toISOString();
      const evidenceItems = buildExpenseEvidenceItems(publicEvidenceImages);

      try {
        Taro.showLoading({ title: "保存中", mask: true });

        if (draftId) {
          const matchedDraft = getDraftById(draftId) || getCurrentDraft();
          if (!matchedDraft) {
            Taro.hideLoading();
            Taro.showToast({
              title: "未找到草稿，请返回后重试",
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
        } else if (caseId && isEditMode && editRecordId) {
          const evidenceFileIds = await resolveEditEvidenceFileIds();
          const didSyncRemote = await updateRemoteExpenseRecordByCaseId(caseId, {
            amount: total,
            editReason: "档案维护者修改支出",
            evidenceFileIds,
            expenseItems: validLines.map((line) => ({
              description: line.description.trim(),
              amount: parseAmount(line.amount),
            })),
            recordId: editRecordId,
            spentAt,
            summary: title,
            category: "medical",
          });

          if (!didSyncRemote) {
            throw new Error("EXPENSE_EDIT_REQUIRES_REMOTE");
          }

          clearExpenseEditSource();
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
            title: "未找到这份档案，请返回后重试",
            icon: "none",
          });
          return;
        }

        if (!isEditMode) {
          Taro.removeStorageSync(cacheKey);
        }
        Taro.hideLoading();
        const successNavigation = getExpenseSuccessNavigation(isEditMode);
        await showSuccessFeedback({
          title: isEditMode ? "支出修改已保存" : "支出记录已保存",
          navigateBack: successNavigation.feedbackShouldNavigateBack,
        });
        if (successNavigation.shouldReturnToRecordDetail) {
          Taro.navigateBack();
        }
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
          <NavBar showBack title={isEditMode ? "修改支出" : "记录支出"} />
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
          {isEditMode ? "保存修改" : "保存支出记录"}
        </AppButton>
      </BottomActionBar>
    </PageShell>
  );
}
