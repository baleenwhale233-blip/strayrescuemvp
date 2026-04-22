import { Image, Input, Text, View } from "@tarojs/components";
import Taro, { useRouter } from "@tarojs/taro";
import { useEffect, useState } from "react";
import { AppIcon } from "../../../../components/AppIcon";
import { NavBar } from "../../../../components/NavBar";
import { TextareaWithOverlayPlaceholder } from "../../../../components/TextareaWithOverlayPlaceholder";
import { useKeyboardBottomInset } from "../../../../components/useKeyboardBottomInset";
import nextArrowIcon from "../../../../assets/rescue-create/step1-next-arrow.svg";
import uploadDeleteIcon from "../../../../assets/rescue-expense/upload-delete-24.svg";
import {
  getCurrentDraft,
  startDraftSession,
  updateCurrentDraft,
} from "../../../../domain/canonical/repository";
import "./index.scss";

export default function RescueCreateBasicPage() {
  const router = useRouter();
  const keyboardBottomInset = useKeyboardBottomInset();
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

  const handleChooseImage = async () => {
    try {
      const action = await Taro.showActionSheet({
        itemList: ["拍摄", "上传图片"],
      });

      const result = await Taro.chooseImage({
        count: 1,
        sizeType: ["compressed"],
        sourceType: action.tapIndex === 0 ? ["camera"] : ["album"],
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

  const handleDeleteImage = async () => {
    const result = await Taro.showModal({
      title: "删除照片？",
      content: "删除后需要重新拍摄或上传档案图。",
      confirmText: "删除",
      cancelText: "取消",
    });

    if (!result.confirm) {
      return;
    }

    setCoverPath("");
  };

  const handleNext = () => {
    if (!name.trim()) {
      Taro.showToast({
        title: "请先填写档案代号",
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
    <View
      className="page-shell rescue-create-page"
      style={{ paddingBottom: `${164 + keyboardBottomInset}px` }}
    >
      <NavBar showBack title="新建记录" onBack={handleBack} />

      <View className="rescue-create-page__steps">
        <View className="rescue-create-page__step rescue-create-page__step--active" />
        <View className="rescue-create-page__step" />
        <View className="rescue-create-page__step" />
      </View>

      <View className="rescue-create-page__upload-card">
        <View className="rescue-create-page__upload-frame">
          {coverPath ? (
            <View className="rescue-create-page__upload-preview">
              <Image
                className="rescue-create-page__upload-image"
                mode="aspectFill"
                src={coverPath}
              />
              <View
                className="rescue-create-page__upload-remove"
                onTap={(event) => {
                  event.stopPropagation();
                  handleDeleteImage();
                }}
              >
                <Image
                  className="rescue-create-page__upload-remove-icon"
                  mode="aspectFit"
                  src={uploadDeleteIcon}
                />
              </View>
            </View>
          ) : null}

          {!coverPath ? (
            <>
              <View className="rescue-create-page__capture-button" onTap={handleChooseImage}>
                <AppIcon name="camera" size={24} variant="default" />
              </View>

              <Text className="rescue-create-page__upload-tip">
                拍摄正脸清晰图作为档案封面
              </Text>
            </>
          ) : null}
        </View>
      </View>

      <View className="rescue-create-page__form-group">
        <Text className="rescue-create-page__label">小家伙的代号</Text>
        <View className="rescue-create-page__input-card">
          <Input
            className="rescue-create-page__input"
            maxlength={24}
            placeholder="如：车祸三花 / 纸箱里的橘猫"
            placeholderStyle="color:#94A3B8;"
            value={name}
            onInput={(event) => setName(event.detail.value)}
          />
        </View>
      </View>

      <View className="rescue-create-page__form-group">
        <Text className="rescue-create-page__label">一句话事件简述</Text>
        <TextareaWithOverlayPlaceholder
          wrapperClassName="rescue-create-page__textarea-card"
          textareaClassName="rescue-create-page__textarea"
          placeholderClassName="rescue-create-page__textarea-placeholder"
          placeholder="在哪发现的（不用太过具体）？它怎么了？"
          cursorSpacing={Math.max(180, keyboardBottomInset + 140)}
          maxlength={120}
          value={summary}
          onInput={(event) => setSummary(event.detail.value)}
        />
      </View>

      <View className="rescue-create-page__footer">
        <View className="theme-button-primary rescue-create-page__primary" onTap={handleNext}>
          <Text>下一步：设定目标</Text>
          <Image
            className="rescue-create-page__primary-arrow"
            mode="aspectFit"
            src={nextArrowIcon}
          />
        </View>
        <Text className="rescue-create-page__footer-hint">
          所有内容都会保存在这条记录里，后续可继续补充明细和进展
        </Text>
      </View>
    </View>
  );
}
