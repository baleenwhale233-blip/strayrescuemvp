import { Image, Input, ScrollView, Text, View } from "@tarojs/components";
import Taro, { useDidHide, useDidShow, useRouter, useUnload } from "@tarojs/taro";
import { useMemo, useRef, useState } from "react";
import { NavBar } from "../../../components/NavBar";
import { showSuccessFeedback } from "../../../utils/successFeedback";
import {
  addExpenseRecord,
  buildExpenseEvidenceItems,
  saveCaseExpenseSubmission,
  type LocalExpenseSubmission,
} from "../../../domain/canonical/repository";
import addLineIcon from "../../../assets/rescue-expense/add-line-20.svg";
import addPhotoIcon from "../../../assets/rescue-expense/add-photo-22.svg";
import lineDeleteIcon from "../../../assets/rescue-expense/line-delete-12.svg";
import noteInfoIcon from "../../../assets/rescue-expense/note-info-16.svg";
import qaCatImage from "../../../assets/rescue-expense/qa-cat.png";
import qaReceiptImage from "../../../assets/rescue-expense/qa-receipt.png";
import submitArrowIcon from "../../../assets/rescue-expense/submit-arrow-16.svg";
import uploadDeleteIcon from "../../../assets/rescue-expense/upload-delete-24.svg";
import {
  createRemoteExpenseRecordByCaseId,
  formatTimelineTimestamp,
  getCurrentDraft,
  getDraftById,
  replaceDraft,
  syncCurrentDraft,
} from "../../../domain/canonical/repository";
import { uploadCaseAssetImage } from "../../../domain/canonical/repository/cloudbaseClient";
import "./index.scss";

type ExpenseLine = {
  id: string;
  order: number;
  description: string;
  amount: string;
};

type ExpenseDraftCache = {
  publicEvidenceImages: string[];
  expenseLines: ExpenseLine[];
  updatedAt: string;
};

type ExpenseQaPreset = "design" | "";

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
  const parts = lines
    .map((line) => line.description.trim())
    .filter(Boolean);

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
  const [publicEvidenceImages, setPublicEvidenceImages] = useState<string[]>([]);
  const [expenseLines, setExpenseLines] = useState<ExpenseLine[]>(() =>
    hydrateExpenseLines(createInitialExpenseLines()),
  );

  const totalAmount = useMemo(
    () => expenseLines.reduce((sum, line) => sum + parseAmount(line.amount), 0),
    [expenseLines],
  );
  const displayedTotalAmount = qaPreset === "design" ? 342.5 : totalAmount;

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
        setPublicEvidenceImages(Array.isArray(cached.publicEvidenceImages) ? cached.publicEvidenceImages : []);
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

  const handleSubmit = async () => {
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
      Taro.showLoading({ title: "保存中" });

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
          const submission: LocalExpenseSubmission = {
            id: `local-expense-${Date.now()}`,
            title,
            amount: total,
            timestampLabel: formatTimelineTimestamp(new Date(spentAt)),
            assetUrls: publicEvidenceImages.slice(0, 9),
            createdAt: spentAt,
          };

          saveCaseExpenseSubmission(caseId, submission);
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
      showSuccessFeedback({
        title: "支出已记入账本",
      });
    } catch (error) {
      Taro.hideLoading();
      Taro.showToast({
        title: mapExpenseError(error),
        icon: "none",
      });
    }
  };

  return (
    <View
      className={`page-shell rescue-expense-page${
        qaPreset === "design" ? " rescue-expense-page--qa-design" : ""
      }`}
    >
      <NavBar showBack title="记录支出" />

      <View className="rescue-expense-page__body">
        <View className="rescue-expense-page__evidence theme-card">
          <View className="rescue-expense-page__section-copy">
            <Text className="rescue-expense-page__section-title">公共凭证</Text>
            <Text className="rescue-expense-page__section-desc">
              请上传当次支出的所有相关凭证（最多9张）
            </Text>
          </View>

          <View className="rescue-expense-page__upload-row">
            <View className="rescue-expense-page__upload-trigger" onTap={handlePickEvidence}>
              <Image
                className="rescue-expense-page__upload-trigger-icon"
                mode="aspectFit"
                src={addPhotoIcon}
              />
              <Text className="rescue-expense-page__upload-trigger-text">添加照片</Text>
            </View>

            <ScrollView
              className="rescue-expense-page__upload-scroll"
              scrollX
              enhanced
              showScrollbar={false}
            >
              <View className="rescue-expense-page__upload-grid">
                {publicEvidenceImages.map((image, index) => (
                  <View
                    key={`${image}-${index}`}
                    className="rescue-expense-page__upload-item"
                    onTap={() => handlePreviewEvidence(image)}
                  >
                    <Image
                      className="rescue-expense-page__upload-image"
                      mode="aspectFill"
                      src={image}
                    />
                    <View
                      className="rescue-expense-page__upload-remove"
                      onTap={(event) => {
                        event.stopPropagation();
                        handleRemoveEvidence(index);
                      }}
                    >
                      <Image
                        className="rescue-expense-page__upload-remove-icon"
                        mode="aspectFit"
                        src={uploadDeleteIcon}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>

          <View className="rescue-expense-page__note">
            <Image
              className="rescue-expense-page__note-icon"
              mode="aspectFit"
              src={noteInfoIcon}
            />
            <Text className="rescue-expense-page__note-copy">
              一组支出共享公共证据。订单截图、支付凭证、物品或猫咪使用支出照片可统一在此上传，无需为每个明细重复操作。
            </Text>
          </View>
        </View>

        <View className="rescue-expense-page__details">
          <View className="rescue-expense-page__details-head">
            <Text className="rescue-expense-page__details-title">支出明细</Text>
            <View className="rescue-expense-page__total">
              <Text className="rescue-expense-page__total-label">本次合计支出</Text>
              <View className="rescue-expense-page__total-value-wrap">
                <Text className="rescue-expense-page__total-currency">¥</Text>
                <Text className="rescue-expense-page__total-value">
                  {formatCurrency(displayedTotalAmount)}
                </Text>
              </View>
            </View>
          </View>

          <View className="rescue-expense-page__line-list">
            <View className="rescue-expense-page__add-line" onTap={handleAddLine}>
              <Image
                className="rescue-expense-page__add-line-icon"
                mode="aspectFit"
                src={addLineIcon}
              />
              <Text className="rescue-expense-page__add-line-text">新增一条明细</Text>
            </View>

            {expenseLines.map((line, index) => (
              <View key={line.id} className="rescue-expense-page__line theme-card">
                <View className="rescue-expense-page__line-head">
                  <Text className="rescue-expense-page__line-index">
                    支出 {String(expenseLines.length - index).padStart(2, "0")}
                  </Text>
                  <View
                    className="rescue-expense-page__line-delete"
                    onTap={() => handleRemoveLine(line.id)}
                  >
                    <Image
                      className="rescue-expense-page__line-delete-icon"
                      mode="aspectFit"
                      src={lineDeleteIcon}
                    />
                  </View>
                </View>

                <View className="rescue-expense-page__field">
                  <Text className="rescue-expense-page__label">项目描述</Text>
                  <Input
                    className="rescue-expense-page__input"
                    placeholder="例如：猫粮 5kg / 绝育费"
                    value={line.description}
                    onInput={(event) =>
                      handleLineChange(line.id, "description", event.detail.value)
                    }
                  />
                </View>

                <View className="rescue-expense-page__field">
                  <Text className="rescue-expense-page__label">金额 (¥)</Text>
                  <Input
                    className="rescue-expense-page__input"
                    type="digit"
                    placeholder="0.00"
                    value={line.amount}
                    onInput={(event) =>
                      handleLineChange(line.id, "amount", event.detail.value)
                    }
                  />
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View className="rescue-expense-page__bottom">
        <View className="theme-button-primary rescue-expense-page__submit" onTap={handleSubmit}>
          <Text>确认并挂载至账本</Text>
          <Image
            className="rescue-expense-page__submit-arrow"
            mode="aspectFit"
            src={submitArrowIcon}
          />
        </View>
      </View>
    </View>
  );
}
