import { Image, Input, Text, Textarea, View } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useEffect, useState } from "react";
import { AppIcon } from "../../../../components/AppIcon";
import { NavBar } from "../../../../components/NavBar";
import coverFallback from "../../../../assets/detail/guest-hero-cat.png";
import {
  persistDraft,
  startDraftSession,
  updateCurrentDraft,
} from "../../../../domain/canonical/repository/localRepository";
import "./index.scss";

export default function RescueCreateBasicPage() {
  const [coverPath, setCoverPath] = useState("");
  const [name, setName] = useState("");
  const [summary, setSummary] = useState("");

  useEffect(() => {
    const draft = startDraftSession();
    setCoverPath(draft.coverPath);
    setName(draft.name);
    setSummary(draft.summary);
  }, []);

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

  const handleSaveDraft = () => {
    updateCurrentDraft({
      coverPath,
      name: name.trim(),
      summary: summary.trim(),
    });

    persistDraft("draft");

    Taro.showToast({
      title: "草稿已保存",
      icon: "none",
    });

    setTimeout(() => {
      Taro.switchTab({
        url: "/pages/rescue/index",
      });
    }, 300);
  };

  return (
    <View className="page-shell rescue-create-page">
      <NavBar showBack title="新建救助" />

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
        <View
          className="theme-button-secondary rescue-create-page__secondary"
          onTap={handleSaveDraft}
        >
          <Text>保存草稿</Text>
        </View>
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
