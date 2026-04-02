import { View, Text } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useState } from "react";
import { AppIcon } from "../../components/AppIcon";
import { NavBar } from "../../components/NavBar";
import { SectionHeader } from "../../components/SectionHeader";
import { getWorkbenchVMForCurrentUser } from "../../domain/canonical/repository/localRepository";
import type { WorkbenchCaseCardVM } from "../../domain/canonical/types";
import "./index.scss";

function ProjectListItem({
  id,
  name,
  state,
  avatarLabel,
  avatarStart,
  avatarEnd,
  onTap,
}: {
  id: string;
  name: string;
  state: string;
  avatarLabel: string;
  avatarStart: string;
  avatarEnd: string;
  onTap: (id: string) => void;
}) {
  return (
    <View className="project-list-item theme-card" onTap={() => onTap(id)}>
      <View
        className="project-list-item__avatar"
        style={{
          background: `linear-gradient(135deg, ${avatarStart}, ${avatarEnd})`,
        }}
      >
        <Text className="project-list-item__avatar-label">{avatarLabel}</Text>
      </View>

      <View className="project-list-item__content">
        <Text className="project-list-item__name">{name}</Text>
        <Text className="project-list-item__state">{state}</Text>
      </View>

      <View className="project-list-item__arrow">
        <AppIcon name="chevronRight" size={16} variant="muted" />
      </View>
    </View>
  );
}

export default function RescuePage() {
  const [activeCases, setActiveCases] = useState<WorkbenchCaseCardVM[]>([]);
  const [draftCases, setDraftCases] = useState<WorkbenchCaseCardVM[]>([]);

  useDidShow(() => {
    const vm = getWorkbenchVMForCurrentUser();
    setActiveCases(vm?.activeCases ?? []);
    setDraftCases(vm?.draftCases ?? []);
  });

  const handleNavigateToDetail = (
    card: WorkbenchCaseCardVM,
  ) => {
    if (card.sourceKind === "local" && card.visibility === "draft" && card.draftId) {
      Taro.navigateTo({
        url: `/pages/rescue/create/preview/index?id=${card.draftId}`,
      });
      return;
    }

    Taro.navigateTo({
      url: `/pages/rescue/detail/index?id=${card.caseId}&mode=owner`,
    });
  };

  const handleCreate = () => {
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
        <SectionHeader title="进行中的项目" badge={activeBadge} />

        <View className="rescue-page__list">
          {activeCases.map((project) => (
            <ProjectListItem
              key={project.caseId}
              id={project.caseId}
              name={project.title}
              state={project.statusLabel}
              avatarLabel={project.title.slice(0, 2)}
              avatarStart="#F5C08B"
              avatarEnd="#A7621D"
              onTap={() => handleNavigateToDetail(project)}
            />
          ))}
        </View>
      </View>

      <View className="rescue-page__section">
        <SectionHeader title="草稿箱" badge={draftBadge} />
        <View className="rescue-page__list">
          {draftCases.map((project) => (
            <ProjectListItem
              key={project.caseId}
              id={project.caseId}
              name={project.title}
              state={project.statusLabel}
              avatarLabel={project.title.slice(0, 2)}
              avatarStart="#E0E3E8"
              avatarEnd="#9298A4"
              onTap={() => handleNavigateToDetail(project)}
            />
          ))}
        </View>
      </View>
    </View>
  );
}
