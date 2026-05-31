import { View } from "@tarojs/components";
import { ChoiceChipGroup, SectionHeader, type ChoiceChipOption } from "../../../../components/ui";
import stageIcon from "../../../../assets/rescue-update/stage-icon.svg";
import type { CaseCurrentStatus } from "../../../../domain/canonical/types";
import "./ProgressStageSection.scss";

export function ProgressStageSection({
  options,
  value,
  onChange,
}: {
  options: Array<ChoiceChipOption<CaseCurrentStatus>>;
  value: CaseCurrentStatus;
  onChange: (value: CaseCurrentStatus) => void;
}) {
  return (
    <View className="rescue-update-page__section">
      <SectionHeader
        className="rescue-update-page__section-head"
        iconSrc={stageIcon}
        title="当前阶段"
      />
      <ChoiceChipGroup
        className="rescue-update-page__stage-choices"
        options={options}
        value={value}
        onChange={onChange}
      />
    </View>
  );
}
