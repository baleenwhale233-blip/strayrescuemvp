import { DualActionFooter } from "../../../../components/ui";
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
      primaryIconName="send"
      primaryLabel="发布进展"
      secondaryLabel="取消"
      secondaryVariant="secondary"
      onPrimary={onSubmit}
      onSecondary={onCancel}
    />
  );
}
