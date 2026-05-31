import { SurfaceCard, SectionHeader } from "../../../../components/ui";
import "./RecordDetailNotice.scss";

export function RecordDetailNotice({ description }: { description: string }) {
  return (
    <SurfaceCard className="record-detail-page__notice" variant="subtle">
      <SectionHeader
        className="record-detail-page__notice-head"
        description={description}
        title="透明账本记录"
      />
    </SurfaceCard>
  );
}
