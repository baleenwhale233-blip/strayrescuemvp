import Taro from "@tarojs/taro";
import { useEffect, useState } from "react";
import { NavBar } from "../../../../components/NavBar";
import { useKeyboardBottomInset } from "../../../../components/useKeyboardBottomInset";
import { PageShell } from "../../../../components/ui";
import { getCurrentDraft, updateCurrentDraft } from "../../../../domain/canonical/repository";
import { CreateBudgetForm } from "./components/CreateBudgetForm";
import "./index.scss";

export default function RescueCreateBudgetPage() {
  const keyboardBottomInset = useKeyboardBottomInset();
  const [coverPath, setCoverPath] = useState("");
  const [name, setName] = useState("");
  const [budget, setBudget] = useState("");
  const [budgetNote, setBudgetNote] = useState("");

  useEffect(() => {
    const draft = getCurrentDraft();

    if (!draft) {
      Taro.redirectTo({
        url: "/pages/rescue/create/basic/index",
      });
      return;
    }

    setCoverPath(draft.coverPath);
    setName(draft.name);
    setBudget(draft.budget ? `${draft.budget}` : "");
    setBudgetNote(draft.budgetNote);
  }, []);

  const handleNext = () => {
    const numericBudget = Number(budget);

    if (!numericBudget || Number.isNaN(numericBudget) || numericBudget <= 0) {
      Taro.showToast({
        title: "请填写预估金额",
        icon: "none",
      });
      return;
    }

    updateCurrentDraft({
      budget: numericBudget,
      budgetNote: budgetNote.trim(),
    });

    Taro.navigateTo({
      url: "/pages/rescue/create/preview/index",
    });
  };

  const handleBack = () => {
    updateCurrentDraft({
      budget: Number(budget || 0),
      budgetNote: budgetNote.trim(),
    });
    Taro.navigateBack();
  };

  return (
    <PageShell
      className="rescue-budget-page"
      style={{ paddingBottom: `${164 + keyboardBottomInset}px` }}
    >
      <NavBar showBack title="新建档案" onBack={handleBack} />

      <CreateBudgetForm
        budget={budget}
        budgetNote={budgetNote}
        coverPath={coverPath}
        cursorSpacing={Math.max(180, keyboardBottomInset + 140)}
        name={name}
        onBudgetChange={setBudget}
        onBudgetNoteChange={setBudgetNote}
        onNext={handleNext}
      />
    </PageShell>
  );
}
