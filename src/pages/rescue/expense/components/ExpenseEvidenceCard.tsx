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
        description="请上传当次支出的相关凭证，最多 9 张。"
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
        一组支出可以共用这些凭证。订单截图、支付凭证、物品使用情况照片都可以放在这里，不用为每条明细重复上传。
      </NoticeBanner>
    </SurfaceCard>
  );
}
