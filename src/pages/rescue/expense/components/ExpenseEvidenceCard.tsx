import { NoticeBanner, SectionHeader, SurfaceCard, UploadStrip } from "../../../../components/ui";
import "./ExpenseEvidenceCard.scss";

export function ExpenseEvidenceCard({
  images,
  onAdd,
  onPreview,
  onRemove,
}: {
  images: string[];
  onAdd: () => void;
  onPreview: (current: string) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <SurfaceCard className="rescue-expense-page__evidence">
      <SectionHeader
        className="rescue-expense-page__section-copy"
        description="请上传当次支出的所有相关凭证（最多9张）"
        title="公共凭证"
      />

      <UploadStrip
        addIconName="imagePlus"
        addLabel="添加照片"
        className="rescue-expense-page__upload-strip"
        images={images}
        removeIconName="trash"
        onAdd={onAdd}
        onPreview={onPreview}
        onRemove={onRemove}
      />

      <NoticeBanner className="rescue-expense-page__note" iconName="info">
        一组支出共享公共凭证。订单截图、支付凭证、物品或猫咪使用支出照片可统一在此上传，无需为每个明细重复操作。
      </NoticeBanner>
    </SurfaceCard>
  );
}
