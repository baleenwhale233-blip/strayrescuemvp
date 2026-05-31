import { Text } from "@tarojs/components";
import { NoticeBanner, SectionHeader, SurfaceCard, UploadStrip } from "../../../../components/ui";
import "./ProgressImageCard.scss";

export function ProgressImageCard({
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
    <SurfaceCard className="rescue-update-page__image-card">
      <SectionHeader
        aside={<Text className="rescue-update-page__image-limit">最多 9 张</Text>}
        className="rescue-update-page__image-head"
        iconName="images"
        title="近况影像记录"
      />

      <UploadStrip
        addIconName="imagePlus"
        addLabel="添加照片"
        className="rescue-update-page__image-strip"
        images={images}
        removeIconName="trash"
        onAdd={onAdd}
        onPreview={onPreview}
        onRemove={onRemove}
      />

      <NoticeBanner className="rescue-update-page__notice" iconName="info">
        请至少上传一张照片，以确保护助信息真实性
      </NoticeBanner>
    </SurfaceCard>
  );
}
