import { Image, View, Text } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useState } from "react";
import { AppIcon } from "../../components/AppIcon";
import { NavBar } from "../../components/NavBar";
import { SectionHeader } from "../../components/SectionHeader";
import { hasCompleteRescuerContactProfile } from "../../data/rescuerContactProfile";
import {
  caseIdToDraftId,
  loadMyProfile,
  loadWorkbenchVMForCurrentUser,
} from "../../domain/canonical/repository";
import { getStandardCaseStatusLabel } from "../../domain/canonical/modeling";
import type { WorkbenchCaseCardVM } from "../../domain/canonical/types";
import fallbackCoverImage from "../../assets/detail/guest-hero-cat.png";
import "./index.scss";

const WORKBENCH_STATUS_LABELS = new Set([
  "紧急送医",
  "医疗救助中",
  "康复观察",
  "寻找领养",
  "遗憾离世",
]);

function getWorkbenchStatusLabel(label?: string) {
  return label && WORKBENCH_STATUS_LABELS.has(label) ? label : "未更新状态";
}

function getProjectSubtitle(project: WorkbenchCaseCardVM) {
  if (project.visibility === "draft") {
    return project.updatedAtLabel
      ? `草稿待完善 · ${project.updatedAtLabel} 更新`
      : "草稿待完善";
  }

  return `${getWorkbenchStatusLabel(
    getStandardCaseStatusLabel({
      currentStatus: project.currentStatus,
      fallbackLabel: project.statusLabel,
    }),
  )} · ${project.updatedAtLabel} 更新`;
}

function getProjectNotice(project: WorkbenchCaseCardVM) {
  if (project.primaryNoticeLabel) {
    return project.primaryNoticeLabel;
  }

  if (project.pendingSupportEntryCount) {
    return `${project.pendingSupportEntryCount} 条支持待确认`;
  }

  if (project.unmatchedSupportEntryCount) {
    return `${project.unmatchedSupportEntryCount} 条支持待核对`;
  }

  if (
    project.homepageEligibilityStatus &&
    project.homepageEligibilityStatus !== "eligible"
  ) {
    return project.homepageEligibilityReason;
  }

  return undefined;
}

function ProjectListItem({
  project,
  compact = false,
  onTap,
}: {
  project: WorkbenchCaseCardVM;
  compact?: boolean;
  onTap: (project: WorkbenchCaseCardVM) => void;
}) {
  const notice = compact ? undefined : getProjectNotice(project);

  return (
    <View
      className={`project-list-item theme-card${notice ? " project-list-item--with-notice" : ""}`}
      onTap={() => onTap(project)}
    >
      <View className="project-list-item__main">
        <View className="project-list-item__avatar">
          <Image
            className="project-list-item__avatar-image"
            mode="aspectFill"
            src={project.coverImageUrl || fallbackCoverImage}
          />
        </View>

        <View className="project-list-item__content">
          <Text className="project-list-item__name">{project.title}</Text>
          {!compact ? (
            <Text className="project-list-item__state">
              {getProjectSubtitle(project)}
            </Text>
          ) : null}
        </View>

        <View className="project-list-item__arrow">
          <AppIcon name="chevronRight" size={16} variant="muted" />
        </View>
      </View>

      {notice ? (
        <View className="project-list-item__notice">
          <Text className="project-list-item__notice-text">{notice}</Text>
        </View>
      ) : null}
    </View>
  );
}

export default function RescuePage() {
  const [activeCases, setActiveCases] = useState<WorkbenchCaseCardVM[]>([]);
  const [draftCases, setDraftCases] = useState<WorkbenchCaseCardVM[]>([]);

  useDidShow(() => {
    loadWorkbenchVMForCurrentUser()
      .then((vm) => {
        setActiveCases(vm?.activeCases ?? []);
        setDraftCases(vm?.draftCases ?? []);
      })
      .catch(() => {
        Taro.showToast({
          title: "救助列表加载失败",
          icon: "none",
        });
      });
  });

  const handleNavigateToDetail = (
    card: WorkbenchCaseCardVM,
  ) => {
    if (card.visibility === "draft") {
      const draftId = card.draftId || caseIdToDraftId(card.caseId);
      Taro.navigateTo({
        url: `/pages/rescue/create/preview/index?id=${draftId}&caseId=${card.caseId}`,
      });
      return;
    }

    Taro.navigateTo({
      url: `/pages/rescue/detail/index?id=${card.caseId}&mode=owner`,
    });
  };

  const hasCompleteContactProfile = async () => {
    try {
      const profile = await loadMyProfile();
      if (profile?.hasContactProfile) {
        return true;
      }
    } catch {
      // Fall back to local contact profile below.
    }

    return hasCompleteRescuerContactProfile();
  };

  const handleCreate = async () => {
    if (!(await hasCompleteContactProfile())) {
      Taro.showModal({
        title: "先填写救助联系方式",
        content: "发布救助前，需要让支持者知道如何联系您和核对转账。",
        confirmText: "去填写",
        cancelText: "稍后",
      }).then((result) => {
        if (result.confirm) {
          Taro.navigateTo({
            url: "/pages/profile/contact-settings/index?redirect=create",
          });
        }
      });
      return;
    }

    Taro.navigateTo({
      url: "/pages/rescue/create/basic/index?entry=new",
    });
  };

  const activeBadge = `${activeCases.length} 进行中`;
  const draftBadge = `${draftCases.length} 草稿`;

  return (
    <View className="page-shell rescue-page">
      <NavBar title="救猫咪" />

      <View className="theme-button-primary rescue-page__primary-action" onTap={handleCreate}>
        <View className="rescue-page__primary-action-icon">
          <AppIcon name="plusCircle" size={24} variant="inverse" />
        </View>
        <Text>新建救助档案</Text>
      </View>

      <View className="rescue-page__section">
        <SectionHeader title="救助档案" badge={activeBadge} />

        <View className="rescue-page__list">
          {activeCases.length ? (
            activeCases.map((project) => (
              <ProjectListItem
                key={project.caseId}
                project={project}
                onTap={handleNavigateToDetail}
              />
            ))
          ) : (
            <Text className="rescue-page__empty">你还没有进行中的救助个案</Text>
          )}
        </View>
      </View>

      <View className="rescue-page__section">
        <SectionHeader title="草稿箱" badge={draftBadge} />
        <View className="rescue-page__list">
          {draftCases.length ? (
            draftCases.map((project) => (
              <ProjectListItem
                key={project.caseId}
                project={project}
                compact
                onTap={handleNavigateToDetail}
              />
            ))
          ) : (
            <Text className="rescue-page__empty">当前没有草稿</Text>
          )}
        </View>
      </View>
    </View>
  );
}
