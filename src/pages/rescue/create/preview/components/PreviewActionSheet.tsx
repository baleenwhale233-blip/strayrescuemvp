import { Input, Text, View } from "@tarojs/components";
import { useState } from "react";
import { AppButton, TextareaField } from "../../../../../components/ui";
import type { RescueCreateEntryTone } from "../../../../../domain/canonical/repository";
import { PreviewSheetFrame } from "./PreviewSheetFrame";

const ACTION_SHEET_COPY = {
  expense: {
    title: "记一笔支出",
    titlePlaceholder: "如：清创手术费 + 抗生素",
    descriptionPlaceholder: "补充票据说明或支出背景",
    amountPlaceholder: "850.00",
    amountLabel: "支出金额",
  },
  status: {
    title: "写进展更新",
    titlePlaceholder: "如：完成首次清创，精神状态尚可",
    descriptionPlaceholder: "补充医生建议、恢复情况或下一步安排",
    amountPlaceholder: "",
    amountLabel: "",
  },
  income: {
    title: "手动登记支持",
    titlePlaceholder: "如：线下支持已确认",
    descriptionPlaceholder: "可补充来源、留言或对账说明",
    amountPlaceholder: "200.00",
    amountLabel: "支持金额",
  },
  budget: {
    title: "修改预算",
    titlePlaceholder: "如：新增后期康复理疗预算",
    descriptionPlaceholder: "说明为什么需要提高预算或调整阶段目标",
    amountPlaceholder: "5250.00",
    amountLabel: "新预算金额",
  },
} as const;

export function PreviewActionSheet({
  action,
  onClose,
  onSave,
}: {
  action: RescueCreateEntryTone;
  onClose: () => void;
  onSave: (values: { title: string; description: string; amount: string }) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const copy = ACTION_SHEET_COPY[action];

  return (
    <PreviewSheetFrame title={copy.title} onClose={onClose}>
      <View className="rescue-preview__sheet-field">
        <Text className="rescue-preview__sheet-label">标题</Text>
        <View className="rescue-preview__sheet-input-card">
          <Input
            className="rescue-preview__sheet-input"
            maxlength={40}
            placeholder={copy.titlePlaceholder}
            value={title}
            onInput={(event) => setTitle(event.detail.value)}
          />
        </View>
      </View>

      {copy.amountLabel ? (
        <View className="rescue-preview__sheet-field">
          <Text className="rescue-preview__sheet-label">{copy.amountLabel}</Text>
          <View className="rescue-preview__sheet-input-card">
            <Input
              className="rescue-preview__sheet-input"
              type="digit"
              placeholder={copy.amountPlaceholder}
              value={amount}
              onInput={(event) => setAmount(event.detail.value)}
            />
          </View>
        </View>
      ) : null}

      <View className="rescue-preview__sheet-field">
        <Text className="rescue-preview__sheet-label">补充说明</Text>
        <TextareaField
          className="rescue-preview__sheet-textarea"
          placeholder={copy.descriptionPlaceholder}
          maxlength={160}
          value={description}
          onInput={(event) => setDescription(event.detail.value)}
        />
      </View>

      <AppButton
        className="rescue-preview__sheet-button"
        onTap={() => onSave({ title, description, amount })}
      >
        保存记录
      </AppButton>
    </PreviewSheetFrame>
  );
}
