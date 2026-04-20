import { Image, Input, Text, View } from "@tarojs/components";
import Taro, { useRouter } from "@tarojs/taro";
import { useEffect, useMemo, useState } from "react";
import { NavBar } from "../../../components/NavBar";
import { TextareaWithOverlayPlaceholder } from "../../../components/TextareaWithOverlayPlaceholder";
import { useKeyboardBottomInset } from "../../../components/useKeyboardBottomInset";
import { showSuccessFeedback } from "../../../utils/successFeedback";
import {
  clearCaseBudgetAdjustments,
  saveCaseBudgetAdjustment,
  type LocalBudgetAdjustmentSubmission,
} from "../../../domain/canonical/repository";
import submitArrowIcon from "../../../assets/rescue-budget-update/footer-submit-arrow.svg";
import noteInfoIcon from "../../../assets/rescue-budget-update/notice-icon.svg";
import ownerAnimalFallback from "../../../assets/rescue-detail/owner/animal-card-cat.png";
import {
  calculateDraftLedger,
  createRemoteBudgetAdjustmentByCaseId,
  getCurrentDraft,
  getDraftById,
  loadPublicDetailVMByCaseId,
  replaceDraft,
  syncCurrentDraft,
  type RescueCreateDraft,
  type RescueCreateEntryTone,
} from "../../../domain/canonical/repository";
import type { PublicDetailVM } from "../../../domain/canonical/types";
import "./index.scss";

type BudgetUpdateLoadStatus = "loading" | "ready" | "error";

function formatCurrency(value: number) {
  return `¥${value.toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function parseBudgetAmount(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatTimelineTimestamp(date = new Date()) {
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `今天 ${hours}:${minutes}`;
}

function buildDraftBudgetEntry(input: {
  previousTargetAmount: number;
  currentTargetAmount: number;
  reason: string;
}) {
  return {
    id: `entry-${Date.now()}`,
    tone: "budget" as RescueCreateEntryTone,
    label: "预算调整",
    title: input.reason,
    description: input.reason,
    timestamp: formatTimelineTimestamp(),
    budgetPrevious: input.previousTargetAmount,
    budgetCurrent: input.currentTargetAmount,
  };
}

export default function RescueBudgetUpdatePage() {
  const router = useRouter();
  const keyboardBottomInset = useKeyboardBottomInset();
  const caseId = router.params?.caseId || router.params?.id;
  const draftId = router.params?.draftId;
  const [loadStatus, setLoadStatus] = useState<BudgetUpdateLoadStatus>("loading");
  const [detail, setDetail] = useState<PublicDetailVM | null>(null);
  const [draft, setDraft] = useState<RescueCreateDraft | null>(null);
  const [budget, setBudget] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadContext() {
      try {
        if (draftId) {
          const matchedDraft = getDraftById(draftId) || getCurrentDraft();
          if (!matchedDraft) {
            if (!cancelled) {
              setLoadStatus("error");
            }
            return;
          }

          if (!cancelled) {
            setDraft(matchedDraft);
            setBudget(matchedDraft.budget ? `${matchedDraft.budget}` : "");
            setLoadStatus("ready");
          }
          return;
        }

        const nextDetail = await loadPublicDetailVMByCaseId(caseId);
        if (!cancelled) {
          setDetail(nextDetail || null);
          setBudget(nextDetail ? `${nextDetail.ledger.targetAmount}` : "");
          setLoadStatus(nextDetail ? "ready" : "error");
        }
      } catch {
        if (!cancelled) {
          setLoadStatus("error");
        }
      }
    }

    loadContext();

    return () => {
      cancelled = true;
    };
  }, [caseId, draftId]);

  const contextCard = useMemo(() => {
    if (draft) {
      return {
        title: draft.name || "未命名档案",
        statusLabel: draft.currentStatusLabel || "医疗处理中",
        publicCaseId: draft.publicCaseId || "待生成",
        rescueStartedAtLabel: "记录开始时间: 待补充",
        coverImage: draft.coverPath || ownerAnimalFallback,
        supportedAmountLabel: formatCurrency(calculateDraftLedger(draft).income),
        previousBudget: draft.budget || 0,
      };
    }

    if (detail) {
      return {
        title: detail.title,
        statusLabel: detail.statusLabel,
        publicCaseId: detail.publicCaseId,
        rescueStartedAtLabel: `记录开始时间: ${detail.rescueStartedAtLabel || "待补充"}`,
        coverImage: detail.heroImageUrl || ownerAnimalFallback,
        supportedAmountLabel: detail.supportSummary.confirmedSupportAmountLabel,
        previousBudget: detail.ledger.targetAmount,
      };
    }

    return null;
  }, [detail, draft]);

  const handleSubmit = async () => {
    if (!contextCard) {
      return;
    }

    const numericBudget = parseBudgetAmount(budget);
    if (!numericBudget || numericBudget <= 0) {
      Taro.showToast({
        title: "请填写新预估总金额",
        icon: "none",
      });
      return;
    }

    if (!reason.trim()) {
      Taro.showToast({
        title: "请填写追加原因",
        icon: "none",
      });
      return;
    }

    const timestampLabel = formatTimelineTimestamp();
    const occurredAt = new Date().toISOString();

    try {
      Taro.showLoading({ title: "提交中" });

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

        const nextDraft: RescueCreateDraft = {
          ...matchedDraft,
          budget: numericBudget,
          budgetNote: reason.trim(),
          timeline: [
            buildDraftBudgetEntry({
              previousTargetAmount: matchedDraft.budget || 0,
              currentTargetAmount: numericBudget,
              reason: reason.trim(),
            }),
            ...matchedDraft.timeline,
          ],
          updatedAt: occurredAt,
        };

        replaceDraft(nextDraft);
        syncCurrentDraft(nextDraft);
      } else if (caseId) {
        const didSyncRemote = await createRemoteBudgetAdjustmentByCaseId(caseId, {
          previousTargetAmount: contextCard.previousBudget,
          newTargetAmount: numericBudget,
          reason: reason.trim(),
          occurredAt,
        });

        if (!didSyncRemote) {
          const submission: LocalBudgetAdjustmentSubmission = {
            id: `local-budget-${Date.now()}`,
            previousTargetAmount: contextCard.previousBudget,
            currentTargetAmount: numericBudget,
            reason: reason.trim(),
            timestampLabel,
            createdAt: occurredAt,
          };

          saveCaseBudgetAdjustment(caseId, submission);
        } else {
          clearCaseBudgetAdjustments(caseId);
        }
      } else {
        Taro.hideLoading();
        Taro.showToast({
          title: "当前案例上下文缺失",
          icon: "none",
        });
        return;
      }

      Taro.hideLoading();
      showSuccessFeedback({
        title: "预算已更新",
      });
    } catch {
      Taro.hideLoading();
      Taro.showToast({
        title: "预算追加失败",
        icon: "none",
      });
    }
  };

  if (loadStatus !== "ready" || !contextCard) {
    return (
      <View
        className="page-shell rescue-budget-update-page"
        style={{ paddingBottom: `${140 + keyboardBottomInset}px` }}
      >
        <NavBar showBack title="追加预算" />
      </View>
    );
  }

  return (
    <View
      className="page-shell rescue-budget-update-page"
      style={{ paddingBottom: `${140 + keyboardBottomInset}px` }}
    >
      <NavBar showBack title="追加预算" />

      <View className="rescue-budget-update-page__body">
        <View className="rescue-budget-update-page__animal-card theme-card">
          <Image
            className="rescue-budget-update-page__animal-cover"
            mode="aspectFill"
            src={contextCard.coverImage}
          />
          <View className="rescue-budget-update-page__animal-copy">
            <View className="rescue-budget-update-page__animal-title-row">
              <Text className="rescue-budget-update-page__animal-title">{contextCard.title}</Text>
              <Text className="rescue-budget-update-page__animal-status">{contextCard.statusLabel}</Text>
            </View>
            <Text className="rescue-budget-update-page__animal-meta">ID: {contextCard.publicCaseId}</Text>
            <Text className="rescue-budget-update-page__animal-meta rescue-budget-update-page__animal-meta--muted">
              {contextCard.rescueStartedAtLabel}
            </Text>
          </View>
        </View>

        <View className="rescue-budget-update-page__field">
          <Text className="rescue-budget-update-page__label">新预估总金额</Text>
          <View className="rescue-budget-update-page__amount-input">
            <Text className="rescue-budget-update-page__amount-prefix">¥</Text>
            <Input
              className="rescue-budget-update-page__amount-control"
              type="digit"
              placeholder="0.00"
              value={budget}
              onInput={(event) => setBudget(event.detail.value)}
            />
          </View>
          <Text className="rescue-budget-update-page__hint">
            当前已登记：{contextCard.supportedAmountLabel}
          </Text>
        </View>

        <View className="rescue-budget-update-page__field">
          <Text className="rescue-budget-update-page__label">追加原因/说明</Text>
          <TextareaWithOverlayPlaceholder
            wrapperClassName="rescue-budget-update-page__textarea-wrap"
            textareaClassName="rescue-budget-update-page__textarea"
            placeholderClassName="rescue-budget-update-page__textarea-placeholder"
            placeholder="请说明为什么要追加预算，如：病情反复需要额手术、住院时间延长等"
            cursorSpacing={Math.max(180, keyboardBottomInset + 140)}
            maxlength={160}
            value={reason}
            onInput={(event) => setReason(event.detail.value)}
          />
        </View>

        <View className="rescue-budget-update-page__notice">
          <Image className="rescue-budget-update-page__notice-icon" mode="aspectFit" src={noteInfoIcon} />
          <Text className="rescue-budget-update-page__notice-text">
            预算追加后将自动生成一条进展动态，并在这条记录的时间轴中公示。
          </Text>
        </View>
      </View>

      <View className="rescue-budget-update-page__bottom">
        <View className="theme-button-primary rescue-budget-update-page__bottom-submit" onTap={handleSubmit}>
          <Text>确认追加并更新时间线</Text>
          <Image className="rescue-budget-update-page__bottom-submit-icon" mode="aspectFit" src={submitArrowIcon} />
        </View>
      </View>
    </View>
  );
}
