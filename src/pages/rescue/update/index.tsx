import { Image, ScrollView, Text, Textarea, View } from "@tarojs/components";
import Taro, { useRouter } from "@tarojs/taro";
import { useEffect, useMemo, useState } from "react";
import { NavBar } from "../../../components/NavBar";
import { TextareaWithOverlayPlaceholder } from "../../../components/TextareaWithOverlayPlaceholder";
import { useKeyboardBottomInset } from "../../../components/useKeyboardBottomInset";
import { markCaseDetailRefresh } from "../../../data/caseDetailRefresh";
import { showSuccessFeedback } from "../../../utils/successFeedback";
import {
  markDraftStatusRefresh,
  saveCaseStatusSubmission,
  type LocalStatusSubmission,
} from "../../../data/statusUpdateSubmission";
import addPhotoIcon from "../../../assets/rescue-update/add-photo-icon.svg";
import imageSectionIcon from "../../../assets/rescue-update/image-section-icon.svg";
import imageNoticeIcon from "../../../assets/rescue-update/image-notice-icon.svg";
import stageIcon from "../../../assets/rescue-update/stage-icon.svg";
import submitArrowIcon from "../../../assets/rescue-update/footer-submit-arrow.svg";
import uploadDeleteIcon from "../../../assets/rescue-expense/upload-delete-24.svg";
import ownerAnimalFallback from "../../../assets/rescue-detail/owner/animal-card-cat.png";
import {
  getCurrentDraft,
  getDraftById,
  replaceDraft,
  syncCurrentDraft,
  type RescueCreateDraft,
  type RescueCreateEntryTone,
} from "../../../domain/canonical/repository/localRepository";
import {
  createRemoteProgressUpdateByCaseId,
  loadPublicDetailVMByCaseId,
} from "../../../domain/canonical/repository";
import { uploadCaseAssetImage } from "../../../domain/canonical/repository/cloudbaseClient";
import type { CaseCurrentStatus, PublicDetailVM } from "../../../domain/canonical/types";
import "./index.scss";

type StatusOption = {
  key: CaseCurrentStatus;
  emoji: string;
  label: string;
};

type UpdateLoadStatus = "loading" | "ready" | "error";

const STATUS_OPTIONS: StatusOption[] = [
  { key: "newly_found", emoji: "🚨", label: "紧急送医" },
  { key: "medical", emoji: "🏥", label: "医疗救助中" },
  { key: "recovery", emoji: "🏡", label: "康复观察" },
  { key: "rehoming", emoji: "💖", label: "寻找领养" },
  { key: "closed", emoji: "🌈", label: "遗憾离世" },
];

function formatTimelineTimestamp(date = new Date()) {
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `今天 ${hours}:${minutes}`;
}

function getDefaultStatusKey(label?: string) {
  return STATUS_OPTIONS.find((option) => option.label === label)?.key || "medical";
}

function getStatusLabelByKey(key: CaseCurrentStatus) {
  return STATUS_OPTIONS.find((option) => option.key === key)?.label || "医疗救助中";
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
        title: draft.name || "未命名救助",
        statusLabel: draft.currentStatusLabel || "医疗救助中",
        publicCaseId: draft.publicCaseId || "待生成",
        rescueStartedAtLabel: "救助开始时间: 待补充",
        coverImage: draft.coverPath || ownerAnimalFallback,
      };
    }

    if (detail) {
      return {
        title: detail.title,
        statusLabel: detail.statusLabel,
        publicCaseId: detail.publicCaseId,
        rescueStartedAtLabel: `救助开始时间: ${detail.rescueStartedAtLabel || "待补充"}`,
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

  const handleSubmit = async () => {
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
      Taro.showLoading({ title: "发布中" });
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
        markDraftStatusRefresh(draftId);
      } else if (caseId) {
        const uploadedAssets = await Promise.all(
          imageUrls.map((imageUrl) =>
            uploadCaseAssetImage(caseId, imageUrl, "progress-updates"),
          ),
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
          const submission: LocalStatusSubmission = {
            id: `local-status-${Date.now()}`,
            statusLabel,
            description: description.trim(),
            timestampLabel,
            assetUrls: imageUrls.slice(0, 9),
            createdAt: occurredAt,
          };

          saveCaseStatusSubmission(caseId, submission);
        }

        markCaseDetailRefresh(caseId);
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
  };

  if (loadStatus !== "ready" || !contextCard) {
    return (
      <View
        className="page-shell rescue-update-page"
        style={{ paddingBottom: `${140 + keyboardBottomInset}px` }}
      >
        <NavBar showBack title="更新进展" />
      </View>
    );
  }

  return (
    <View
      className="page-shell rescue-update-page"
      style={{ paddingBottom: `${140 + keyboardBottomInset}px` }}
    >
      <NavBar showBack title="更新进展" />

      <View className="rescue-update-page__body">
        <View className="rescue-update-page__animal-card theme-card">
          <Image
            className="rescue-update-page__animal-cover"
            mode="aspectFill"
            src={contextCard.coverImage}
          />
          <View className="rescue-update-page__animal-copy">
            <View className="rescue-update-page__animal-title-row">
              <Text className="rescue-update-page__animal-title">{contextCard.title}</Text>
              <Text className="rescue-update-page__animal-status">{contextCard.statusLabel}</Text>
            </View>
            <Text className="rescue-update-page__animal-meta">ID: {contextCard.publicCaseId}</Text>
            <Text className="rescue-update-page__animal-meta rescue-update-page__animal-meta--muted">
              {contextCard.rescueStartedAtLabel}
            </Text>
          </View>
        </View>

        <View className="rescue-update-page__section">
          <View className="rescue-update-page__section-head">
            <Image
              className="rescue-update-page__section-icon-image"
              mode="aspectFit"
              src={stageIcon}
            />
            <Text className="rescue-update-page__section-title">救助阶段变更</Text>
          </View>
          <View className="rescue-update-page__chip-group">
            {STATUS_OPTIONS.map((option) => (
              <View
                key={option.key}
                className={`rescue-update-page__stage-chip ${
                  selectedStatus === option.key ? "rescue-update-page__stage-chip--active" : ""
                }`}
                onTap={() => setSelectedStatus(option.key)}
              >
                <Text className="rescue-update-page__stage-chip-emoji">{option.emoji}</Text>
                <Text className="rescue-update-page__stage-chip-text">{option.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className="rescue-update-page__field">
          <Text className="rescue-update-page__label">进展详情描述</Text>
          <TextareaWithOverlayPlaceholder
            wrapperClassName="rescue-update-page__textarea-wrap"
            textareaClassName="rescue-update-page__textarea"
            placeholderClassName="rescue-update-page__textarea-placeholder"
            placeholder="请详细描述当前动物救助进展"
            cursorSpacing={Math.max(180, keyboardBottomInset + 140)}
            maxlength={800}
            value={description}
            onInput={(event) => setDescription(event.detail.value)}
          />
        </View>

        <View className="rescue-update-page__image-card theme-card">
          <View className="rescue-update-page__image-head">
            <View className="rescue-update-page__image-title-wrap">
              <Image
                className="rescue-update-page__image-icon"
                mode="aspectFit"
                src={imageSectionIcon}
              />
              <Text className="rescue-update-page__image-title">近况影像记录</Text>
            </View>
            <Text className="rescue-update-page__image-limit">最多 9 张</Text>
          </View>

          <View className="rescue-update-page__image-row">
            <View className="rescue-update-page__image-trigger" onTap={handlePickImage}>
              <Image className="rescue-update-page__image-trigger-icon" mode="aspectFit" src={addPhotoIcon} />
              <Text className="rescue-update-page__image-trigger-text">添加照片</Text>
            </View>

            <ScrollView
              className="rescue-update-page__image-scroll"
              scrollX
              enhanced
              showScrollbar={false}
            >
              <View className="rescue-update-page__image-grid">
                {imageUrls.map((image, index) => (
                  <View
                    key={`${image}-${index}`}
                    className="rescue-update-page__image-item"
                    onTap={() => handlePreviewImage(image)}
                  >
                    <Image className="rescue-update-page__image" mode="aspectFill" src={image} />
                    <View
                      className="rescue-update-page__image-remove"
                      onTap={(event) => {
                        event.stopPropagation();
                        handleRemoveImage(index);
                      }}
                    >
                      <Image
                        className="rescue-update-page__image-remove-icon"
                        mode="aspectFit"
                        src={uploadDeleteIcon}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>

          <View className="rescue-update-page__notice">
            <Image className="rescue-update-page__notice-icon" mode="aspectFit" src={imageNoticeIcon} />
            <Text className="rescue-update-page__notice-text">
              请至少上传一张照片，以确保护助信息真实性
            </Text>
          </View>
        </View>
      </View>

      <View
        className="rescue-update-page__bottom"
        style={{ bottom: `${keyboardBottomInset}px` }}
      >
        <View className="theme-button-secondary rescue-update-page__bottom-cancel" onTap={handleCancel}>
          <Text>取消</Text>
        </View>
        <View className="theme-button-primary rescue-update-page__bottom-submit" onTap={handleSubmit}>
          <Text>发布进展更新</Text>
          <Image className="rescue-update-page__bottom-submit-icon" mode="aspectFit" src={submitArrowIcon} />
        </View>
      </View>
    </View>
  );
}
