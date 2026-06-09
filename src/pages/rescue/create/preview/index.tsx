import { View } from "@tarojs/components";
import Taro, { useDidShow, useRouter } from "@tarojs/taro";
import { useEffect, useMemo, useRef, useState } from "react";
import { NavBar } from "../../../../components/NavBar";
import { DualActionFooter, PageShell } from "../../../../components/ui";
import { createSubmissionGuard } from "../../../../utils/submissionGuard";
import { recordCaseProfileLocalFallback } from "../../../../domain/canonical/repository";
import {
  RescueOwnerOverview,
  RescueOwnerQuickActions,
  RescueOwnerSummaryCard,
  RescueOwnerTabs,
  RescueOwnerTimeline,
  type RescueOwnerTimelineItem,
} from "../../../../components/rescue";
import coverFallback from "../../../../assets/detail/guest-hero-cat.png";
import ownerAnimalFallback from "../../../../assets/rescue-detail/owner/animal-card-cat.png";
import {
  calculateDraftLedger,
  appendDraftEntry,
  draftIdToCaseId,
  formatTimelineTimestamp,
  getCurrentDraft,
  getDraftByCaseId,
  getDraftById,
  loadOwnerDetailVMByCaseId,
  loadPublicDetailVMByCaseId,
  persistDraft,
  replaceDraft,
  saveRemoteDraftCase,
  syncCurrentDraft,
  toOwnerActionTimelineEntry,
  type OwnerDetailVM,
  type RescueCreateDraft,
  type RescueCreateEntryTone,
} from "../../../../domain/canonical/repository";
import { uploadCaseAssetImage } from "../../../../domain/canonical/repository/cloudbaseClient";
import type { PublicDetailVM } from "../../../../domain/canonical/types";
import { PreviewActionSheet } from "./components/PreviewActionSheet";
import { PreviewRenameSheet } from "./components/PreviewRenameSheet";
import "./index.scss";

type ActionType = RescueCreateEntryTone | null;
type PreviewTab = "overview" | "detail";
type PreviewTimelineEntry = {
  id: string;
  tone: RescueCreateEntryTone;
  label: string;
  title: string;
  description?: string;
  timestamp: string;
  amount?: number;
  images?: string[];
  budgetPrevious?: number;
  budgetCurrent?: number;
  sortKey: number;
};

function formatCurrency(value: number) {
  return `¥${value.toLocaleString("zh-CN")}`;
}

function getFundingCompareMetrics(input: { supportAmount: number; targetAmount: number }) {
  const diff = input.targetAmount - input.supportAmount;

  return {
    thirdLabel: "当前缺口",
    thirdValue: formatCurrency(Math.max(diff, 0)),
    thirdMode: diff > 0 ? ("gap" as const) : ("balance" as const),
  };
}

function getBudgetProgressPercent(input: { supportAmount: number; targetAmount: number }) {
  if (input.targetAmount <= 0) {
    return 0;
  }

  return Math.min(Math.round((input.supportAmount / input.targetAmount) * 100), 100);
}

function getDraftCover(draft: RescueCreateDraft) {
  return draft.coverPath || ownerAnimalFallback || coverFallback;
}

function getDraftPublicCaseId(draft: RescueCreateDraft) {
  return draft.publicCaseId || "待生成";
}

function getDraftStatusLabel(draft: RescueCreateDraft) {
  return draft.currentStatusLabel || "医疗处理中";
}

function matchesDraftRoute(
  draft: RescueCreateDraft | undefined,
  draftId?: string,
  caseId?: string,
) {
  if (!draft) {
    return false;
  }

  if (draftId && draft.id === draftId) {
    return true;
  }

  if (caseId && (draft.id === caseId || draft.publicCaseId === caseId)) {
    return true;
  }

  return !draftId && !caseId;
}

function parsePreviewTimestamp(value: string) {
  if (!value) {
    return 0;
  }

  const direct = Date.parse(value);
  if (Number.isFinite(direct)) {
    return direct;
  }

  const todayMatch = value.match(/^今天\s+(\d{2}):(\d{2})$/);
  if (todayMatch) {
    const now = new Date();
    now.setHours(Number(todayMatch[1]), Number(todayMatch[2]), 0, 0);
    return now.getTime();
  }

  const monthDayTimeMatch = value.match(/^(\d{2})-(\d{2})\s+(\d{2}):(\d{2})$/);
  if (monthDayTimeMatch) {
    const now = new Date();
    return new Date(
      now.getFullYear(),
      Number(monthDayTimeMatch[1]) - 1,
      Number(monthDayTimeMatch[2]),
      Number(monthDayTimeMatch[3]),
      Number(monthDayTimeMatch[4]),
      0,
      0,
    ).getTime();
  }

  const monthDayMatch = value.match(/^(\d{2})-(\d{2})$/);
  if (monthDayMatch) {
    const now = new Date();
    return new Date(
      now.getFullYear(),
      Number(monthDayMatch[1]) - 1,
      Number(monthDayMatch[2]),
      0,
      0,
      0,
      0,
    ).getTime();
  }

  return 0;
}

function buildPreviewTimelineEntries(draft: RescueCreateDraft): PreviewTimelineEntry[] {
  const baseEntries: PreviewTimelineEntry[] = draft.timeline
    .filter((entry) => !isDraftBootstrapEntry(entry))
    .filter((entry) => entry.tone !== "expense" && entry.tone !== "income")
    .map((entry, index) => ({
      ...entry,
      sortKey: parsePreviewTimestamp(entry.timestamp) - index,
    }));

  const expenseEntries: PreviewTimelineEntry[] = draft.expenseRecords.map((record, index) => ({
    id: `expense-${record.id}`,
    tone: "expense" as const,
    label: "支出记录",
    title: `支付：${record.summary}`,
    description: record.note,
    timestamp: formatTimelineTimestamp(new Date(record.spentAt)),
    amount: record.amount,
    images: record.evidenceItems
      .map((item) => item.imageUrl)
      .filter((value): value is string => Boolean(value))
      .slice(0, 9),
    sortKey: 1000 + index,
  }));

  const supportEntries: PreviewTimelineEntry[] = draft.supportEntries
    .filter((entry) => entry.status === "confirmed")
    .map((entry, index) => ({
      id: `support-${entry.id}`,
      tone: "income" as const,
      label: "已确认支持",
      title: `${entry.supporterNameMasked || "支持者"} 的支持登记`,
      description: entry.note ? `备注：${entry.note}` : undefined,
      timestamp: formatTimelineTimestamp(new Date(entry.supportedAt)),
      amount: entry.amount,
      sortKey: Date.parse(entry.supportedAt) - index,
    }));

  return [...expenseEntries, ...baseEntries, ...supportEntries].sort(
    (left, right) => right.sortKey - left.sortKey,
  );
}

function isDraftBootstrapEntry(entry: RescueCreateDraft["timeline"][number]) {
  return (
    entry.tone === "status" &&
    entry.title === "已创建基础档案，等待补充第一条进展" &&
    entry.description === "完成封面、代号和事件简述后，就可以继续设定预算并进入档案页预览。"
  );
}

function getPreviewOverviewProps(
  draft: RescueCreateDraft,
  ledger: ReturnType<typeof calculateDraftLedger>,
) {
  const timeline = buildPreviewTimelineEntries(draft);
  const latestStatus = timeline.find((entry) => entry.tone === "status") || timeline[0];

  return {
    paragraphs: [
      draft.summary || "这份档案的情况介绍待补充。",
      `当前总预算为${formatCurrency(draft.budget || 0)}。`,
    ],
    expenseLabel: `-${formatCurrency(ledger.expense)}`,
    incomeLabel: `+${formatCurrency(ledger.income)}`,
    latestStatus: latestStatus
      ? {
          statusLabel: getDraftStatusLabel(draft),
          timestamp: latestStatus.timestamp,
          text: latestStatus.description || latestStatus.title,
          imageUrl: (latestStatus.images && latestStatus.images[0]) || getDraftCover(draft),
        }
      : undefined,
  };
}

function toPreviewTimelineItems(draft: RescueCreateDraft): RescueOwnerTimelineItem[] {
  return buildPreviewTimelineEntries(draft).map((entry) => ({
    id: entry.id,
    caseId: draftIdToCaseId(draft.id),
    recordType:
      entry.tone === "income"
        ? "support"
        : entry.tone === "budget"
          ? "budget_adjustment"
          : entry.tone === "expense"
            ? "expense"
            : "progress_update",
    recordId: entry.id,
    kind:
      entry.tone === "income"
        ? "income"
        : entry.tone === "budget"
          ? "budget"
          : entry.tone === "expense"
            ? "expense"
            : "status",
    badgeLabel:
      entry.tone === "income"
        ? "已确认支持"
        : entry.tone === "budget"
          ? "预算调整"
          : entry.tone === "expense"
            ? "支出记录"
            : "状态更新",
    statusLabel: entry.tone === "status" ? getDraftStatusLabel(draft) : undefined,
    timestamp: entry.timestamp,
    title: entry.title,
    description: entry.description,
    amountLabel:
      typeof entry.amount === "number"
        ? `${entry.tone === "income" ? "+" : "-"}${formatCurrency(entry.amount)}`
        : undefined,
    images: entry.images,
    budgetPreviousLabel:
      typeof entry.budgetPrevious === "number" ? formatCurrency(entry.budgetPrevious) : undefined,
    budgetCurrentLabel:
      typeof entry.budgetCurrent === "number" ? formatCurrency(entry.budgetCurrent) : undefined,
  }));
}

function buildDraftFromOwnerAndPublicDetail(
  caseId: string,
  ownerDetail: OwnerDetailVM,
  publicDetail: PublicDetailVM,
): RescueCreateDraft {
  const timeline: RescueCreateDraft["timeline"] = ownerDetail.timeline.map((entry) => {
    const tone: RescueCreateEntryTone =
      entry.type === "expense"
        ? "expense"
        : entry.type === "support"
          ? "income"
          : entry.type === "budget_adjustment"
            ? "budget"
            : "status";

    return {
      id: entry.id,
      tone,
      label: entry.label,
      title: entry.title,
      description: entry.description,
      timestamp: entry.timestampLabel,
      amount: entry.amountLabel ? Number(entry.amountLabel.replace(/[^\d.-]/g, "")) : undefined,
      images: entry.assetUrls,
      budgetPrevious:
        entry.type === "budget_adjustment" ? publicDetail.ledger.targetAmount : undefined,
      budgetCurrent:
        entry.type === "budget_adjustment" ? ownerDetail.ledger.targetAmount : undefined,
    };
  });

  return {
    id: caseId,
    publicCaseId: ownerDetail.publicCaseId,
    name: ownerDetail.title,
    summary: publicDetail.summary,
    coverPath: ownerDetail.coverImage || publicDetail.heroImageUrl || "",
    budget: ownerDetail.ledger.targetAmount,
    budgetNote: "",
    currentStatusLabel: ownerDetail.statusLabel,
    foundLocationText: publicDetail.locationText,
    rescuerName: publicDetail.rescuer.name,
    rescuerAvatarUrl: publicDetail.rescuer.avatarUrl,
    rescuerWechatId: publicDetail.rescuer.wechatId,
    rescuerVerifiedLevel: publicDetail.rescuer.verifiedLevel,
    rescuerJoinedAt: publicDetail.rescuer.joinedAtLabel,
    rescuerStats: publicDetail.rescuer.stats,
    paymentQrUrl: publicDetail.rescuer.paymentQrUrl,
    status: "draft",
    timeline,
    sharedEvidenceGroups: [],
    expenseRecords: [],
    supportThreads: ownerDetail.supportThreads || [],
    supportEntries: [],
    homepageEligibility: {
      status: ownerDetail.homepageEligibilityStatus || "public_but_not_eligible",
      reason: ownerDetail.homepageEligibilityReason || "",
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export default function RescueCreatePreviewPage() {
  const router = useRouter();
  const [draft, setDraft] = useState<RescueCreateDraft | null>(null);
  const [activeAction, setActiveAction] = useState<ActionType>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const initialTab: PreviewTab = router.params?.tab === "overview" ? "overview" : "detail";
  const [activeTab, setActiveTab] = useState<PreviewTab>(initialTab);
  const submitGuardRef = useRef(createSubmissionGuard());

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    let cancelled = false;

    const loadDraft = async () => {
      const routeDraftId = router.params?.id;
      const routeCaseId = router.params?.caseId;
      const savedDraft = getDraftById(routeDraftId);
      const caseDraft = getDraftByCaseId(routeCaseId);
      const currentDraft = getCurrentDraft();
      const matchedCurrentDraft = matchesDraftRoute(
        currentDraft || undefined,
        routeDraftId,
        routeCaseId,
      )
        ? currentDraft
        : undefined;
      let nextDraft = savedDraft ?? caseDraft ?? matchedCurrentDraft;

      if (!nextDraft && routeCaseId) {
        const [ownerDetail, publicDetail] = await Promise.all([
          loadOwnerDetailVMByCaseId(routeCaseId),
          loadPublicDetailVMByCaseId(routeCaseId),
        ]);

        if (ownerDetail && publicDetail) {
          nextDraft = buildDraftFromOwnerAndPublicDetail(routeCaseId, ownerDetail, publicDetail);
        }
      }

      if (!nextDraft) {
        Taro.redirectTo({
          url: "/pages/rescue/create/basic/index",
        });
        return;
      }

      if (nextDraft.status === "published") {
        Taro.redirectTo({
          url: `/pages/rescue/detail/index?id=${nextDraft.id}`,
        });
        return;
      }

      if (cancelled) {
        return;
      }

      if (!nextDraft) {
        return;
      }

      syncCurrentDraft(nextDraft);
      setDraft(nextDraft);
    };

    loadDraft().catch(() => {
      Taro.showToast({
        title: "草稿加载失败",
        icon: "none",
      });
    });

    return () => {
      cancelled = true;
    };
  }, [router.params?.caseId, router.params?.id]);

  useDidShow(() => {
    const routeDraftId = router.params?.id;
    const routeCaseId = router.params?.caseId;

    const refreshedDraft =
      getDraftById(routeDraftId) || getDraftByCaseId(routeCaseId) || getCurrentDraft();

    if (refreshedDraft) {
      setDraft(refreshedDraft);
    }
  });

  const ledger = useMemo(() => (draft ? calculateDraftLedger(draft) : null), [draft]);

  if (!draft || !ledger) {
    return null;
  }

  const budget = draft.budget || 0;
  const fundingCompare = getFundingCompareMetrics({
    supportAmount: ledger.income,
    targetAmount: budget,
  });
  const supportBudgetProgressPercent = getBudgetProgressPercent({
    supportAmount: ledger.income,
    targetAmount: budget,
  });

  const handleSaveAction = (values: { title: string; description: string; amount: string }) => {
    if (!activeAction) {
      return;
    }

    if (!values.title.trim()) {
      Taro.showToast({
        title: "请先填写标题",
        icon: "none",
      });
      return;
    }

    const numericAmount = Number(values.amount || 0);
    if (
      (activeAction === "expense" || activeAction === "income" || activeAction === "budget") &&
      (!numericAmount || Number.isNaN(numericAmount))
    ) {
      Taro.showToast({
        title: "请填写有效金额",
        icon: "none",
      });
      return;
    }

    let nextDraft = draft;

    if (activeAction === "budget") {
      nextDraft = replaceDraft({
        ...draft,
        budget: numericAmount,
      });

      const entry = toOwnerActionTimelineEntry({
        action: "budget",
        title: values.title.trim(),
        description: values.description.trim(),
        previousTargetAmount: draft.budget,
        currentTargetAmount: numericAmount,
        timestampLabel: formatTimelineTimestamp(),
      });

      nextDraft = appendDraftEntry(nextDraft, entry);
    } else {
      const entry = toOwnerActionTimelineEntry({
        action:
          activeAction === "expense" ? "receipt" : activeAction === "income" ? "income" : "update",
        title: values.title.trim(),
        description: values.description.trim(),
        timestampLabel: formatTimelineTimestamp(),
        amount: activeAction === "expense" || activeAction === "income" ? numericAmount : undefined,
        imageUrls:
          activeAction === "status" || activeAction === "expense"
            ? [draft.coverPath || coverFallback]
            : undefined,
      });

      nextDraft = appendDraftEntry(draft, entry);
    }

    setDraft(nextDraft);
    setActiveAction(null);
    Taro.showToast({
      title: "记录已添加到预览",
      icon: "none",
    });
  };

  const handleSaveDraft = async () =>
    submitGuardRef.current.run(async () => {
      const saved = persistDraft("draft");
      setDraft(saved);
      try {
        Taro.showLoading({ title: "保存中", mask: true });
        await saveRemoteDraftCase(saved, "draft");
      } catch {
        Taro.hideLoading();
        Taro.showToast({
          title: "草稿已保存在本机，暂未同步",
          icon: "none",
        });
        return;
      }
      Taro.hideLoading();

      Taro.showToast({
        title: "草稿已保存",
        icon: "none",
      });

      await new Promise<void>((resolve) => {
        setTimeout(() => {
          void Taro.switchTab({
            url: "/pages/rescue/index",
          });
          resolve();
        }, 300);
      });
    });

  const handlePublish = async () =>
    submitGuardRef.current.run(async () => {
      const saved = persistDraft("published");
      setDraft(saved);

      let remoteDraft = saved;

      Taro.showLoading({ title: "发布中", mask: true });

      if (
        saved.coverPath &&
        !saved.coverPath.startsWith("cloud://") &&
        !saved.coverPath.startsWith("http://") &&
        !saved.coverPath.startsWith("https://")
      ) {
        try {
          const uploadedCover = await uploadCaseAssetImage(
            draftIdToCaseId(saved.id),
            saved.coverPath,
            "case-covers",
          );

          if (!uploadedCover.isLocalFallback) {
            remoteDraft = {
              ...saved,
              coverPath: uploadedCover.fileID,
            };
          }
        } catch (error) {
          if (error instanceof Error && error.message === "CASE_ASSET_UPLOAD_FAILED") {
            Taro.hideLoading();
            Taro.showToast({
              title: "封面上传失败，请重试",
              icon: "none",
            });
            return;
          }
        }
      }

      try {
        await saveRemoteDraftCase(remoteDraft, "published");
      } catch {
        Taro.hideLoading();
        Taro.showToast({
          title: "档案已保存在本机，暂未同步",
          icon: "none",
        });
        return;
      }
      Taro.hideLoading();

      Taro.showToast({
        title: saved.status === "published" ? "档案已发布" : "档案已更新",
        icon: "none",
      });

      await new Promise<void>((resolve) => {
        setTimeout(() => {
          void Taro.switchTab({
            url: "/pages/rescue/index",
          });
          resolve();
        }, 300);
      });
    });

  const handleSaveTitle = (value: string) => {
    const nextName = value.trim();
    if (!nextName) {
      Taro.showToast({
        title: "请先填写代号",
        icon: "none",
      });
      return;
    }

    const nextDraft = replaceDraft({
      ...draft,
      name: nextName,
    });
    recordCaseProfileLocalFallback({
      title: nextName,
      draftId: draft.id,
      caseId: draftIdToCaseId(draft.id),
    });

    setDraft(nextDraft);
    setEditingTitle(false);
    Taro.showToast({
      title: "已更新代号",
      icon: "none",
    });
  };

  const handleChangeCover = async () => {
    try {
      const action = await Taro.showActionSheet({
        itemList: ["拍照", "上传图片"],
      });

      const result = await Taro.chooseImage({
        count: 1,
        sizeType: ["compressed"],
        sourceType: action.tapIndex === 0 ? ["camera"] : ["album"],
      });

      const nextPath = result.tempFilePaths?.[0];
      if (!nextPath) {
        return;
      }

      const nextDraft = replaceDraft({
        ...draft,
        coverPath: nextPath,
      });

      recordCaseProfileLocalFallback({
        coverPath: nextPath,
        draftId: draft.id,
        caseId: draftIdToCaseId(draft.id),
      });

      setDraft(nextDraft);
      Taro.showToast({
        title: "封面已更新",
        icon: "none",
      });
    } catch {
      // ignore cancel
    }
  };

  return (
    <PageShell className="rescue-preview-page">
      <NavBar showBack title="档案管理" />

      <RescueOwnerSummaryCard
        budgetLabel={formatCurrency(budget)}
        coverImage={getDraftCover(draft)}
        expenseLabel={formatCurrency(ledger.expense)}
        onCopy={() => {
          Taro.setClipboardData({ data: getDraftPublicCaseId(draft) });
        }}
        progressPercent={supportBudgetProgressPercent}
        publicCaseId={getDraftPublicCaseId(draft)}
        statusLabel={getDraftStatusLabel(draft)}
        supportLabel={formatCurrency(ledger.income)}
        thirdLabel={fundingCompare.thirdLabel}
        thirdMode={fundingCompare.thirdMode}
        thirdValue={fundingCompare.thirdValue}
        title={draft.name || "未命名档案"}
        onEditCover={handleChangeCover}
        onEditTitle={() => setEditingTitle(true)}
      />

      <RescueOwnerQuickActions
        onBudget={() =>
          Taro.navigateTo({
            url: `/pages/rescue/budget-update/index?draftId=${draft.id}`,
          })
        }
        onExpense={() =>
          Taro.navigateTo({
            url: `/pages/rescue/expense/index?draftId=${draft.id}`,
          })
        }
        onIncome={() =>
          Taro.navigateTo({
            url: `/pages/support/review/index?caseId=${draftIdToCaseId(draft.id)}&draftId=${draft.id}&tab=manual`,
          })
        }
        onStatus={() =>
          Taro.navigateTo({
            url: `/pages/rescue/progress-update/index?draftId=${draft.id}`,
          })
        }
      />

      <RescueOwnerTabs activeTab={activeTab} onChange={setActiveTab} />

      <View className="rescue-preview__tab-panel">
        {activeTab === "overview" ? (
          <RescueOwnerOverview {...getPreviewOverviewProps(draft, ledger)} />
        ) : (
          <RescueOwnerTimeline
            emptyState={{
              title: "还没有第一条记录",
              description: "可以先记录一笔支出、更新进展，或者补上一笔支持登记。",
            }}
            items={toPreviewTimelineItems(draft)}
          />
        )}
      </View>

      <DualActionFooter
        primaryIconName="arrowRight"
        primaryLabel="发布档案"
        secondaryLabel="保存草稿"
        onPrimary={handlePublish}
        onSecondary={handleSaveDraft}
      />

      {activeAction ? (
        <PreviewActionSheet
          action={activeAction}
          onClose={() => setActiveAction(null)}
          onSave={handleSaveAction}
        />
      ) : null}

      {editingTitle ? (
        <PreviewRenameSheet
          initialValue={draft.name}
          onClose={() => setEditingTitle(false)}
          onSave={handleSaveTitle}
        />
      ) : null}
    </PageShell>
  );
}
