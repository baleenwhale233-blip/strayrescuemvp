import { Image, Input, Text, Textarea, View } from "@tarojs/components";
import Taro, { useRouter } from "@tarojs/taro";
import { useEffect, useState } from "react";
import { AppIcon } from "../../../../components/AppIcon";
import { NavBar } from "../../../../components/NavBar";
import coverFallback from "../../../../assets/detail/guest-hero-cat.png";
import {
  getCurrentDraft,
  startDraftSession,
  updateCurrentDraft,
} from "../../../../domain/canonical/repository/localRepository";
import "./index.scss";

export default function RescueCreateBasicPage() {
  const router = useRouter();
  const [coverPath, setCoverPath] = useState("");
  const [name, setName] = useState("");
  const [summary, setSummary] = useState("");

  useEffect(() => {
    let isMounted = true;

    const hydrateFromDraft = async () => {
      const currentDraft = getCurrentDraft();
      const hasInProgressDraft = Boolean(
        currentDraft &&
          currentDraft.status === "draft" &&
          (currentDraft.coverPath ||
            currentDraft.name.trim() ||
            currentDraft.summary.trim() ||
            currentDraft.budget > 0 ||
            currentDraft.budgetNote.trim()),
      );

      let draft = currentDraft;

      if (router.params?.entry === "new") {
        if (hasInProgressDraft) {
          const result = await Taro.showModal({
            title: "继续上次编辑？",
            content: "检测到上次未完成的内容，可以继续编辑或重新开始。",
            confirmText: "继续编辑",
            cancelText: "重新开始",
          });

          draft = result.confirm ? currentDraft : startDraftSession();
        } else {
          draft = startDraftSession();
        }
      }

      if (!draft) {
        draft = startDraftSession();
      }

      if (!isMounted) {
        return;
      }

      setCoverPath(draft.coverPath);
      setName(draft.name);
      setSummary(draft.summary);
    };

    hydrateFromDraft();

    return () => {
      isMounted = false;
    };
  }, [router.params?.entry]);

  const handleChooseImage = async (sourceType: Array<"album" | "camera">) => {
    try {
      const result = await Taro.chooseImage({
        count: 1,
        sizeType: ["compressed"],
        sourceType,
      });

      const nextPath = result.tempFilePaths[0] ?? "";
      if (!nextPath) {
        return;
      }

      setCoverPath(nextPath);
    } catch {
      // Ignore cancel actions from the native picker.
    }
  };

  const handleNext = () => {
    if (!name.trim()) {
      Taro.showToast({
        title: "请先填写救助对象代号",
        icon: "none",
      });
      return;
    }

    if (!summary.trim()) {
      Taro.showToast({
        title: "请补充一句话情况说明",
        icon: "none",
      });
      return;
    }

    updateCurrentDraft({
      coverPath,
      name: name.trim(),
      summary: summary.trim(),
    });

    Taro.navigateTo({
      url: "/pages/rescue/create/budget/index",
    });
  };

  const handleBack = async () => {
    updateCurrentDraft({
      coverPath,
      name: name.trim(),
      summary: summary.trim(),
    });
    Taro.navigateBack();
  };

  return (
    <View className="page-shell rescue-create-page">
      <NavBar showBack title="新建救助" onBack={handleBack} />

      <View className="rescue-create-page__steps">
        <View className="rescue-create-page__step rescue-create-page__step--active" />
        <View className="rescue-create-page__step" />
        <View className="rescue-create-page__step" />
      </View>

      <View className="rescue-create-page__upload-card">
        <View className="rescue-create-page__upload-frame">
          {coverPath ? (
            <Image
              className="rescue-create-page__upload-image"
              mode="aspectFill"
              src={coverPath}
            />
          ) : (
            <Image
              className="rescue-create-page__upload-image rescue-create-page__upload-image--placeholder"
              mode="aspectFill"
              src={coverFallback}
            />
          )}

          <View
            className="rescue-create-page__capture-button"
            onTap={() => handleChooseImage(["camera"])}
          >
            <AppIcon name="camera" size={24} variant="default" />
          </View>

          <View
            className="rescue-create-page__album-button"
            onTap={() => handleChooseImage(["album"])}
          >
            <Text>相册导入</Text>
          </View>

          <Text className="rescue-create-page__upload-tip">
            拍摄正脸清晰图作为数字档案卡
          </Text>
        </View>
      </View>

      <View className="rescue-create-page__form-group">
        <Text className="rescue-create-page__label">小家伙的代号</Text>
        <View className="rescue-create-page__input-card">
          <Input
            className="rescue-create-page__input"
            maxlength={24}
            placeholder="如：车祸三花 / 纸箱里的橘猫"
            value={name}
            onInput={(event) => setName(event.detail.value)}
          />
        </View>
      </View>

      <View className="rescue-create-page__form-group">
        <Text className="rescue-create-page__label">一句话事件简述</Text>
        <View className="rescue-create-page__textarea-card">
          <Textarea
            className="rescue-create-page__textarea"
            maxlength={120}
            placeholder="在哪发现的（不用太过具体）？它怎么了？"
            value={summary}
            onInput={(event) => setSummary(event.detail.value)}
          />
        </View>
      </View>

      <View className="rescue-create-page__footer">
        <View className="theme-button-primary rescue-create-page__primary" onTap={handleNext}>
          <Text>下一步：设定目标</Text>
          <Text className="rescue-create-page__primary-arrow">→</Text>
        </View>
        <Text className="rescue-create-page__footer-hint">
          所有数据将记录在流浪动物透明账本区块链中
        </Text>
      </View>
    </View>
  );
}
