import { View, Text } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useState } from "react";
import { AppIcon } from "../../components/AppIcon";
import { NavBar } from "../../components/NavBar";
import { SectionHeader } from "../../components/SectionHeader";
import { getSavedDrafts } from "../../data/rescueCreateStore";
import {
  draftProjects,
  rescueProjects,
} from "../../data/mock";
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
  const [customPublishedProjects, setCustomPublishedProjects] = useState<
    Array<{
      id: string;
      status: "published";
      name: string;
      state: string;
      avatarLabel: string;
      avatarStart: string;
      avatarEnd: string;
    }>
  >([]);
  const [customDraftProjects, setCustomDraftProjects] = useState<
    Array<{
      id: string;
      status: "draft";
      name: string;
      state: string;
      avatarLabel: string;
      avatarStart: string;
      avatarEnd: string;
    }>
  >([]);

  useDidShow(() => {
    const drafts = getSavedDrafts();
    const published = drafts
      .filter((draft) => draft.status === "published")
      .map((draft) => ({
        id: draft.id,
        status: "published" as const,
        name: draft.name || "未命名救助",
        state: "救助中 • 刚刚",
        avatarLabel: (draft.name || "救助").slice(0, 2),
        avatarStart: "#F5C08B",
        avatarEnd: "#A7621D",
      }));
    const draftList = drafts
      .filter((draft) => draft.status === "draft")
      .map((draft) => ({
        id: draft.id,
        status: "draft" as const,
        name: draft.name || "未命名草稿",
        state: "草稿中 • 刚刚",
        avatarLabel: (draft.name || "草稿").slice(0, 2),
        avatarStart: "#E0E3E8",
        avatarEnd: "#9298A4",
      }));

    setCustomPublishedProjects(published);
    setCustomDraftProjects(draftList);
  });

  const handleNavigateToDetail = (
    projectId: string,
    status?: "draft" | "published",
  ) => {
    if (projectId.startsWith("custom-project-") && status === "draft") {
      Taro.navigateTo({
        url: `/pages/rescue/create/preview/index?id=${projectId}`,
      });
      return;
    }

    if (projectId.startsWith("custom-project-") && status === "published") {
      Taro.navigateTo({
        url: `/pages/rescue/detail/index?id=${projectId}&mode=owner&source=custom`,
      });
      return;
    }

    Taro.navigateTo({
      url: `/pages/rescue/detail/index?id=${projectId}&mode=owner`,
    });
  };

  const handleCreate = () => {
    Taro.navigateTo({
      url: "/pages/rescue/create/basic/index",
    });
  };

  const activeBadge = `${customPublishedProjects.length + rescueProjects.length} 进行中`;
  const draftBadge = `${customDraftProjects.length + draftProjects.length} 草稿`;

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
          {[...customPublishedProjects, ...rescueProjects].map((project) => (
            <ProjectListItem
              key={project.id}
              {...project}
              onTap={(id) =>
                handleNavigateToDetail(
                  id,
                  "status" in project ? project.status : undefined,
                )
              }
            />
          ))}
        </View>
      </View>

      <View className="rescue-page__section">
        <SectionHeader title="草稿箱" badge={draftBadge} />
        <View className="rescue-page__list">
          {[...customDraftProjects, ...draftProjects].map((project) => (
            <ProjectListItem
              key={project.id}
              {...project}
              onTap={(id) =>
                handleNavigateToDetail(
                  id,
                  "status" in project ? project.status : undefined,
                )
              }
            />
          ))}
        </View>
      </View>
    </View>
  );
}
