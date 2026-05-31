import { DualActionFooter } from "../../../../components/ui";
import submitArrowIcon from "../../../../assets/rescue-update/footer-submit-arrow.svg";
import "./ProgressUpdateFooter.scss";

export function ProgressUpdateFooter({
  onCancel,
  onSubmit,
}: {
  onCancel: () => void;
  onSubmit: () => void;
}) {
  return (
    <DualActionFooter
      className="rescue-update-page__bottom"
      primaryIconSrc={submitArrowIcon}
      primaryLabel="发布进展"
      secondaryLabel="取消"
      secondaryVariant="secondary"
      onPrimary={onSubmit}
      onSecondary={onCancel}
    />
  );
}
