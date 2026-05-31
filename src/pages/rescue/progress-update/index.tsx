import { View } from "@tarojs/components";
import Taro, { useRouter } from "@tarojs/taro";
import { useEffect, useMemo, useRef, useState } from "react";
import { NavBar } from "../../../components/NavBar";
import { RescueCaseSummaryCard } from "../../../components/rescue";
import { type ChoiceChipOption, PageShell } from "../../../components/ui";
import { useKeyboardBottomInset } from "../../../components/useKeyboardBottomInset";
import { createSubmissionGuard } from "../../../utils/submissionGuard";
import { showSuccessFeedback } from "../../../utils/successFeedback";
import {
  clearCaseContentWriteLocalFallback,
  recordCaseContentWriteLocalFallback,
} from "../../../domain/canonical/repository";
import ownerAnimalFallback from "../../../assets/rescue-detail/owner/animal-card-cat.png";
import {
  createRemoteProgressUpdateByCaseId,
  getCurrentDraft,
  getDraftById,
  loadPublicDetailVMByCaseId,
  replaceDraft,
  syncCurrentDraft,
  type RescueCreateDraft,
  type RescueCreateEntryTone,
} from "../../../domain/canonical/repository";
import { uploadCaseAssetImage } from "../../../domain/canonical/repository/cloudbaseClient";
import type { CaseCurrentStatus, PublicDetailVM } from "../../../domain/canonical/types";
import { ProgressDescriptionField } from "./components/ProgressDescriptionField";
import { ProgressImageCard } from "./components/ProgressImageCard";
import { ProgressStageSection } from "./components/ProgressStageSection";
import { ProgressUpdateFooter } from "./components/ProgressUpdateFooter";
import "./index.scss";

type UpdateLoadStatus = "loading" | "ready" | "error";

const STATUS_OPTIONS: Array<ChoiceChipOption<CaseCurrentStatus>> = [
  { value: "newly_found", leading: "🚨", label: "紧急送医" },
  { value: "medical", leading: "🏥", label: "医疗处理中" },
  { value: "recovery", leading: "🏡", label: "康复观察" },
  { value: "rehoming", leading: "💖", label: "寻找领养" },
  { value: "closed", leading: "🌈", label: "遗憾离世" },
];

function formatTimelineTimestamp(date = new Date()) {
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `今天 ${hours}:${minutes}`;
}

function getDefaultStatusKey(label?: string) {
  return STATUS_OPTIONS.find((option) => option.label === label)?.value || "medical";
}

function getStatusLabelByKey(key: CaseCurrentStatus) {
  return STATUS_OPTIONS.find((option) => option.value === key)?.label || "医疗处理中";
}

function buildDraftStatusEntry(input: {
  statusKey: CaseCurrentStatus;
  description: string;
  imageUrls: string[];
}) {
  return {
    id: `entry-${Date.now()}`,
    tone: "status" as RescueCreateEntryTone,
    label: "状态更新",
    title: input.description,
    description: undefined,
    timestamp: formatTimelineTimestamp(),
    images: input.imageUrls,
  };
}

export default function RescueStatusUpdatePage() {
  const router = useRouter();
  const keyboardBottomInset = useKeyboardBottomInset();
  const caseId = router.params?.caseId || router.params?.id;
  const draftId = router.params?.draftId;
  const [loadStatus, setLoadStatus] = useState<UpdateLoadStatus>("loading");
  const [detail, setDetail] = useState<PublicDetailVM | null>(null);
  const [draft, setDraft] = useState<RescueCreateDraft | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<CaseCurrentStatus>("medical");
  const [description, setDescription] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const submitGuardRef = useRef(createSubmissionGuard());

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
            setSelectedStatus(getDefaultStatusKey(matchedDraft.currentStatusLabel));
            setLoadStatus("ready");
          }
          return;
        }

        const nextDetail = await loadPublicDetailVMByCaseId(caseId);
        if (!cancelled) {
          setDetail(nextDetail || null);
          setSelectedStatus(getDefaultStatusKey(nextDetail?.statusLabel));
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
      };
    }

    if (detail) {
      return {
        title: detail.title,
        statusLabel: detail.statusLabel,
        publicCaseId: detail.publicCaseId,
        rescueStartedAtLabel: `记录开始时间: ${detail.rescueStartedAtLabel || "待补充"}`,
        coverImage: detail.heroImageUrl || ownerAnimalFallback,
      };
    }

    return null;
  }, [detail, draft]);

  const handlePickImage = async () => {
    const remaining = Math.max(9 - imageUrls.length, 0);
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

    setImageUrls((current) => [...nextImages.slice().reverse(), ...current].slice(0, 9));
  };

  const handlePreviewImage = (current: string) => {
    if (!imageUrls.length) {
      return;
    }

    Taro.previewImage({
      current,
      urls: imageUrls,
    });
  };

  const handleRemoveImage = (index: number) => {
    setImageUrls((current) => current.filter((_, currentIndex) => currentIndex !== index));
  };

  const handleCancel = async () => {
    const result = await Taro.showModal({
      title: "放弃本次编辑？",
      content: "当前填写的进展内容不会被保存。",
      confirmText: "放弃",
      cancelText: "继续编辑",
    });

    if (result.confirm) {
      Taro.navigateBack();
    }
  };

  const handleSubmit = async () =>
    submitGuardRef.current.run(async () => {
      if (!description.trim()) {
        Taro.showToast({
          title: "请填写进展详情",
          icon: "none",
        });
        return;
      }

      const statusLabel = getStatusLabelByKey(selectedStatus);
      const timestampLabel = formatTimelineTimestamp();

      try {
        Taro.showLoading({ title: "发布中", mask: true });
        const occurredAt = new Date().toISOString();

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
            currentStatus: selectedStatus,
            currentStatusLabel: statusLabel,
            timeline: [
              buildDraftStatusEntry({
                statusKey: selectedStatus,
                description: description.trim(),
                imageUrls,
              }),
              ...matchedDraft.timeline,
            ],
            updatedAt: occurredAt,
          };

          replaceDraft(nextDraft);
          syncCurrentDraft(nextDraft);
        } else if (caseId) {
          const uploadedAssets = await Promise.all(
            imageUrls.map((imageUrl) => uploadCaseAssetImage(caseId, imageUrl, "progress-updates")),
          );
          const assetFileIds = uploadedAssets
            .filter((asset) => !asset.isLocalFallback)
            .map((asset) => asset.fileID);
          const didSyncRemote = await createRemoteProgressUpdateByCaseId(caseId, {
            status: selectedStatus,
            statusLabel,
            text: description.trim(),
            occurredAt,
            assetFileIds,
          });

          if (!didSyncRemote) {
            recordCaseContentWriteLocalFallback({
              caseId,
              kind: "status",
              submission: {
                id: `local-status-${Date.now()}`,
                statusLabel,
                description: description.trim(),
                timestampLabel,
                assetUrls: imageUrls.slice(0, 9),
                createdAt: occurredAt,
              },
            });
          } else {
            clearCaseContentWriteLocalFallback({ caseId, kind: "status" });
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
        await showSuccessFeedback({
          title: "进展已发布",
        });
      } catch (error) {
        Taro.hideLoading();
        Taro.showToast({
          title:
            error instanceof Error && error.message === "CASE_ASSET_UPLOAD_FAILED"
              ? "图片上传失败，请重试"
              : "进展发布失败",
          icon: "none",
        });
      }
    });

  if (loadStatus !== "ready" || !contextCard) {
    return (
      <PageShell
        className="rescue-update-page"
        style={{ paddingBottom: `${140 + keyboardBottomInset}px` }}
      >
        <NavBar showBack title="更新进展" />
      </PageShell>
    );
  }

  return (
    <PageShell
      className="rescue-update-page"
      style={{ paddingBottom: `${140 + keyboardBottomInset}px` }}
    >
      <NavBar showBack title="更新进展" />

      <View className="rescue-update-page__body">
        <RescueCaseSummaryCard
          coverSrc={contextCard.coverImage}
          publicCaseId={contextCard.publicCaseId}
          rescueStartedAtLabel={contextCard.rescueStartedAtLabel}
          statusLabel={contextCard.statusLabel}
          title={contextCard.title}
        />

        <ProgressStageSection
          options={STATUS_OPTIONS}
          value={selectedStatus}
          onChange={setSelectedStatus}
        />

        <ProgressDescriptionField
          cursorSpacing={Math.max(180, keyboardBottomInset + 140)}
          value={description}
          onChange={setDescription}
        />

        <ProgressImageCard
          images={imageUrls}
          onAdd={handlePickImage}
          onPreview={handlePreviewImage}
          onRemove={handleRemoveImage}
        />
      </View>

      <ProgressUpdateFooter onCancel={handleCancel} onSubmit={handleSubmit} />
    </PageShell>
  );
}
