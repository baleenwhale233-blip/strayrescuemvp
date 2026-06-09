import Taro, { useDidShow, useRouter } from "@tarojs/taro";
import { useEffect, useRef, useState } from "react";
import { NavBar } from "../../../components/NavBar";
import { PageShell, SegmentedTabs } from "../../../components/ui";
import { createSubmissionGuard } from "../../../utils/submissionGuard";
import { showSuccessFeedback } from "../../../utils/successFeedback";
import {
  createRemoteManualSupportEntryByCaseId,
  draftIdToCaseId,
  getDraftByCaseId,
  getDraftById,
  loadPublicDetailVMByCaseId,
  reviewRemoteSupportEntryByCaseId,
  type RescueCreateDraft,
} from "../../../domain/canonical/repository";
import type { PublicDetailVM } from "../../../domain/canonical/types";
import { ManualSupportEntryForm } from "./components/ManualSupportEntryForm";
import { PendingSupportEntryList } from "./components/PendingSupportEntryList";
import type { PendingSupportEntryCard } from "./types";
import "./index.scss";

type ReviewTab = "pending" | "manual";

function formatCurrencyLabel(amount: number) {
  return `¥${amount.toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getDraftPendingEntries(draft?: RescueCreateDraft): PendingSupportEntryCard[] {
  if (!draft) {
    return [];
  }

  const threadMap = new Map(draft.supportThreads.map((thread) => [thread.id, thread]));

  return draft.supportEntries
    .filter((entry) => entry.status === "pending")
    .sort((left, right) => right.supportedAt.localeCompare(left.supportedAt))
    .map((entry) => ({
      id: entry.id,
      supporterName:
        threadMap.get(entry.supportThreadId)?.supporterNameMasked ||
        entry.supporterNameMasked ||
        "爱心人士",
      latestEntryAtLabel: entry.supportedAt
        ? entry.supportedAt.slice(5, 16).replace("T", " ")
        : "待确认",
      amountLabel: formatCurrencyLabel(entry.amount),
      note: entry.note,
      proofUrl: entry.screenshotItems[0]?.imageUrl,
    }));
}

export default function SupportReviewPage() {
  const router = useRouter();
  const draftId = router.params?.draftId;
  const caseId =
    router.params?.id || router.params?.caseId || (draftId ? draftIdToCaseId(draftId) : undefined);
  const requestedTab = router.params?.tab === "manual" ? "manual" : "pending";
  const [reloadSeed, setReloadSeed] = useState(0);
  const [detail, setDetail] = useState<PublicDetailVM | undefined>();
  const [draft, setDraft] = useState<RescueCreateDraft | undefined>();
  const [activeTab, setActiveTab] = useState<ReviewTab>(requestedTab);
  const [manualAmount, setManualAmount] = useState("");
  const [manualSupporter, setManualSupporter] = useState("");
  const submitGuardRef = useRef(createSubmissionGuard());

  useEffect(() => {
    setActiveTab(requestedTab);
  }, [requestedTab]);

  const reloadDetail = async () => {
    const [nextDetail, nextDraft] = await Promise.all([
      loadPublicDetailVMByCaseId(caseId).catch(() => undefined),
      Promise.resolve(draftId ? getDraftById(draftId) || getDraftByCaseId(caseId) : undefined),
    ]);
    setDetail(nextDetail);
    setDraft(nextDraft);
  };

  useDidShow(() => {
    setReloadSeed((value) => value + 1);
    reloadDetail().catch(() => {
      Taro.showToast({
        title: "支持登记加载失败",
        icon: "none",
      });
    });
  });

  if (!caseId || (!detail && !draft)) {
    return null;
  }

  const handleConfirm = async (entryId: string) =>
    submitGuardRef.current.run(async () => {
      try {
        Taro.showLoading({ title: "处理中", mask: true });
        await reviewRemoteSupportEntryByCaseId(caseId, {
          entryId,
          status: "confirmed",
        });
        Taro.hideLoading();
        await showSuccessFeedback({
          title: "已确认支持",
          navigateBack: false,
        });
        await reloadDetail();
        setReloadSeed((value) => value + 1);
      } catch {
        Taro.hideLoading();
        Taro.showToast({ title: "未能确认支持，请稍后重试", icon: "none" });
      }
    });

  const handleUnmatched = async (entryId: string, reason: "duplicate_submission" | "other") =>
    submitGuardRef.current.run(async () => {
      try {
        Taro.showLoading({ title: "处理中", mask: true });
        await reviewRemoteSupportEntryByCaseId(caseId, {
          entryId,
          status: "unmatched",
          reason,
          note: reason === "duplicate_submission" ? "重复登记" : "暂未匹配",
        });
        Taro.hideLoading();
        await showSuccessFeedback({
          title: "已标记未匹配",
          navigateBack: false,
        });
        await reloadDetail();
        setReloadSeed((value) => value + 1);
      } catch {
        Taro.hideLoading();
        Taro.showToast({ title: "未能标记未匹配，请稍后重试", icon: "none" });
      }
    });

  const handleSubmitManual = async () =>
    submitGuardRef.current.run(async () => {
      const numericAmount = Number(manualAmount);

      if (!numericAmount || Number.isNaN(numericAmount) || numericAmount <= 0) {
        Taro.showToast({ title: "请填写支持金额", icon: "none" });
        return;
      }

      try {
        Taro.showLoading({ title: "提交中", mask: true });
        await createRemoteManualSupportEntryByCaseId(caseId, {
          supporterNameMasked: manualSupporter.trim() || "线下记录",
          amount: numericAmount,
          supportedAt: new Date().toISOString(),
          note: "档案维护者手动登记支持",
        });
        Taro.hideLoading();
        setManualAmount("");
        setManualSupporter("");
        await showSuccessFeedback({
          title: "已记入已确认支持",
        });
      } catch {
        Taro.hideLoading();
        Taro.showToast({ title: "未能登记支持，请稍后重试", icon: "none" });
      }
    });

  const pendingEntries = (detail?.supportSummary.threads || []).flatMap((thread) =>
    thread.entries
      .filter((entry) => entry.status === "pending")
      .map((entry) => ({
        id: entry.id,
        supporterName: thread.supporterNameMasked || "爱心人士",
        latestEntryAtLabel: thread.latestEntryAtLabel,
        amountLabel: entry.amountLabel,
        note: entry.note,
        proofUrl: entry.screenshotUrls[0],
      })),
  );
  const fallbackPendingEntries = getDraftPendingEntries(draft);
  const displayedPendingEntries = pendingEntries.length ? pendingEntries : fallbackPendingEntries;
  const pendingBadgeCount =
    detail?.supportSummary.pendingSupportEntryCount || fallbackPendingEntries.length;

  return (
    <PageShell key={reloadSeed} className="support-review-page">
      <NavBar showBack title="处理支持登记" />

      <SegmentedTabs
        className="support-review-page__tabs"
        value={activeTab}
        items={[
          {
            label: "待处理支持",
            value: "pending",
            badge: activeTab === "pending" ? `${pendingBadgeCount}` : undefined,
          },
          { label: "手动登记支持", value: "manual" },
        ]}
        onChange={(value) => setActiveTab(value as ReviewTab)}
      />

      {activeTab === "pending" ? (
        <PendingSupportEntryList
          entries={displayedPendingEntries}
          onConfirm={handleConfirm}
          onUnmatched={handleUnmatched}
        />
      ) : (
        <ManualSupportEntryForm
          amount={manualAmount}
          supporter={manualSupporter}
          onAmountChange={setManualAmount}
          onSubmit={handleSubmitManual}
          onSupporterChange={setManualSupporter}
        />
      )}
    </PageShell>
  );
}
