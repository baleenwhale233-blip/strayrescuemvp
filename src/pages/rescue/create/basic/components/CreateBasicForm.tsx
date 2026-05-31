import { Input, Text, View } from "@tarojs/components";
import { AppIcon } from "../../../../../components/AppIcon";
import {
  HintActionFooter,
  StepIndicator,
  TextareaField,
  UploadStrip,
} from "../../../../../components/ui";
import "./CreateBasicForm.scss";

export function CreateBasicForm({
  coverPath,
  cursorSpacing,
  name,
  summary,
  onCoverDelete,
  onCoverPick,
  onNameChange,
  onNext,
  onSummaryChange,
}: {
  coverPath: string;
  cursorSpacing: number;
  name: string;
  summary: string;
  onCoverDelete: () => void;
  onCoverPick: () => void;
  onNameChange: (value: string) => void;
  onNext: () => void;
  onSummaryChange: (value: string) => void;
}) {
  return (
    <>
      <StepIndicator activeIndex={0} total={3} />

      <View className="rescue-create-page__upload-card">
        <UploadStrip
          addIcon={<AppIcon name="camera" size={24} variant="inverse" />}
          addLabel="拍摄正脸清晰图作为档案封面"
          images={coverPath ? [coverPath] : []}
          maxImages={1}
          removeIconName="trash"
          variant="cover"
          onAdd={onCoverPick}
          onRemove={onCoverDelete}
        />
      </View>

      <View className="rescue-create-page__form-group">
        <Text className="rescue-create-page__label">小家伙的代号</Text>
        <View className="rescue-create-page__input-card">
          <Input
            className="rescue-create-page__input"
            maxlength={24}
            placeholder="如：车祸三花 / 纸箱里的橘猫"
            placeholderStyle="color:var(--color-text-tertiary);"
            value={name}
            onInput={(event) => onNameChange(event.detail.value)}
          />
        </View>
      </View>

      <View className="rescue-create-page__form-group">
        <Text className="rescue-create-page__label">一句话事件简述</Text>
        <TextareaField
          className="rescue-create-page__textarea"
          placeholder="在哪发现的（不用太过具体）？它怎么了？"
          cursorSpacing={cursorSpacing}
          maxlength={120}
          value={summary}
          onInput={(event) => onSummaryChange(event.detail.value)}
        />
      </View>

      <HintActionFooter
        hint="所有内容都会保存在这条记录里，后续可继续补充明细和进展"
        iconName="arrowRight"
        onTap={onNext}
      >
        下一步：设定目标
      </HintActionFooter>
    </>
  );
}
