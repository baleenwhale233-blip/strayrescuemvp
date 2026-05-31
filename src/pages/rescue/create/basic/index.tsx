import Taro, { useRouter } from "@tarojs/taro";
import { useEffect, useState } from "react";
import { NavBar } from "../../../../components/NavBar";
import { useKeyboardBottomInset } from "../../../../components/useKeyboardBottomInset";
import { PageShell } from "../../../../components/ui";
import {
  getCurrentDraft,
  startDraftSession,
  updateCurrentDraft,
} from "../../../../domain/canonical/repository";
import { CreateBasicForm } from "./components/CreateBasicForm";
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
    <PageShell
      className="rescue-create-page"
      style={{ paddingBottom: `${164 + keyboardBottomInset}px` }}
    >
      <NavBar showBack title="新建记录" onBack={handleBack} />

      <CreateBasicForm
        coverPath={coverPath}
        cursorSpacing={Math.max(180, keyboardBottomInset + 140)}
        name={name}
        summary={summary}
        onCoverDelete={handleDeleteImage}
        onCoverPick={handleChooseImage}
        onNameChange={setName}
        onNext={handleNext}
        onSummaryChange={setSummary}
      />
    </PageShell>
  );
}
