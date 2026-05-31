import { View } from "@tarojs/components";
import { AppIcon } from "../../../components/AppIcon";
import { Avatar, EmptyState, ListEntry, SectionHeader } from "../../../components/ui";
import { getStandardCaseStatusLabel } from "../../../domain/canonical/modeling";
import type { WorkbenchCaseCardVM } from "../../../domain/canonical/types";
import fallbackCoverImage from "../../../assets/detail/guest-hero-cat.png";
import "./WorkbenchProjectSections.scss";

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

function WorkbenchProjectListItem({
  compact = false,
  project,
  onTap,
}: {
  compact?: boolean;
  project: WorkbenchCaseCardVM;
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

export function WorkbenchProjectSections({
  activeCases,
  draftCases,
  onProjectTap,
}: {
  activeCases: WorkbenchCaseCardVM[];
  draftCases: WorkbenchCaseCardVM[];
  onProjectTap: (project: WorkbenchCaseCardVM) => void;
}) {
  const activeBadge = `${activeCases.length} 进行中`;
  const draftBadge = `${draftCases.length} 草稿`;

  return (
    <>
      <View className="rescue-page__section rescue-page__section--active">
        <SectionHeader
          className="rescue-page__section-header"
          title="我的档案"
          badge={activeBadge}
        />

        <View className="rescue-page__list">
          {activeCases.length ? (
            activeCases.map((project) => (
              <WorkbenchProjectListItem
                key={project.caseId}
                project={project}
                onTap={onProjectTap}
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

      <View className="rescue-page__section rescue-page__section--draft">
        <SectionHeader className="rescue-page__section-header" title="草稿箱" badge={draftBadge} />
        <View className="rescue-page__list">
          {draftCases.length ? (
            draftCases.map((project) => (
              <WorkbenchProjectListItem
                key={project.caseId}
                project={project}
                compact
                onTap={onProjectTap}
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
    </>
  );
}
