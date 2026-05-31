import { Text, View } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useState } from "react";
import { AppIcon } from "../../components/AppIcon";
import { NavBar } from "../../components/NavBar";
import {
  AppButton,
  Avatar,
  EmptyState,
  ListEntry,
  PageShell,
  SectionHeader,
} from "../../components/ui";
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
  "医疗处理中",
  "康复观察",
  "寻找领养",
  "遗憾离世",
]);

function getWorkbenchStatusLabel(label?: string) {
  return label && WORKBENCH_STATUS_LABELS.has(label) ? label : "未更新状态";
}

function getProjectSubtitle(project: WorkbenchCaseCardVM) {
  if (project.visibility === "draft") {
    return project.updatedAtLabel ? `草稿待完善 · ${project.updatedAtLabel} 更新` : "草稿待完善";
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
    return `${project.pendingSupportEntryCount} 条登记待处理`;
  }

  if (project.unmatchedSupportEntryCount) {
    return `${project.unmatchedSupportEntryCount} 条登记待核对`;
  }

  if (project.homepageEligibilityStatus && project.homepageEligibilityStatus !== "eligible") {
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
    <ListEntry
      className={`project-list-item${notice ? " project-list-item--with-notice" : ""}`}
      leading={
        <Avatar
          className="project-list-item__avatar"
          fallbackSrc={fallbackCoverImage}
          src={project.coverImageUrl}
        />
      }
      notice={notice}
      onTap={() => onTap(project)}
      subtitle={!compact ? getProjectSubtitle(project) : undefined}
      title={project.title}
      trailing={<AppIcon name="chevronRight" size={16} variant="muted" />}
    />
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
          title: "记录列表加载失败",
          icon: "none",
        });
      });
  });

  const handleNavigateToDetail = (card: WorkbenchCaseCardVM) => {
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
        title: "先填写联系信息",
        content: "公开记录前，需要让查看的人知道如何联系您和核对信息。",
        confirmText: "去完善",
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
    <PageShell className="rescue-page">
      <NavBar title="我的记录" />

      <AppButton className="rescue-page__primary-action" onTap={handleCreate}>
        <View className="rescue-page__primary-action-icon">
          <AppIcon name="plusCircle" size={24} variant="inverse" />
        </View>
        <Text>新建记录</Text>
      </AppButton>

      <View className="rescue-page__section">
        <SectionHeader
          className="rescue-page__section-header"
          title="我的档案"
          badge={activeBadge}
        />

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
            <EmptyState
              className="rescue-page__empty"
              title="你还没有进行中的记录"
              description="新建公开记录后，会显示在这里继续维护。"
            />
          )}
        </View>
      </View>

      <View className="rescue-page__section">
        <SectionHeader className="rescue-page__section-header" title="草稿箱" badge={draftBadge} />
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
            <EmptyState
              className="rescue-page__empty"
              title="当前没有草稿"
              description="未发布的记录会先保存在草稿箱。"
            />
          )}
        </View>
      </View>
    </PageShell>
  );
}
