import { Input, View } from "@tarojs/components";
import addPhotoIcon from "../../../../assets/rescue-expense/add-photo-22.svg";
import submitArrowIcon from "../../../../assets/rescue-create/step1-next-arrow.svg";
import {
  FormField,
  SubmitActionBar,
  SurfaceCard,
  TextareaField,
  UploadStrip,
} from "../../../../components/ui";
import "./ContactSettingsForm.scss";

export function ContactSettingsForm({
  cursorSpacing,
  note,
  qrImagePath,
  wechatId,
  onNoteChange,
  onPickQrImage,
  onSubmit,
  onWechatIdChange,
}: {
  cursorSpacing: number;
  note: string;
  qrImagePath: string;
  wechatId: string;
  onNoteChange: (value: string) => void;
  onPickQrImage: () => void;
  onSubmit: () => void;
  onWechatIdChange: (value: string) => void;
}) {
  return (
    <>
      <View className="contact-settings-page__body">
        <FormField label="微信号（二选一即可）">
          <SurfaceCard className="contact-settings-page__input-card">
            <Input
              className="contact-settings-page__input"
              placeholder="请填写微信号"
              placeholderStyle="color:var(--color-text-tertiary);"
              value={wechatId}
              onInput={(event) => onWechatIdChange(event.detail.value)}
            />
          </SurfaceCard>
        </FormField>

        <FormField label="微信二维码（二选一即可）">
          <UploadStrip
            addIconSrc={addPhotoIcon}
            addLabel="添加照片"
            className="contact-settings-page__qr-upload"
            images={qrImagePath ? [qrImagePath] : []}
            maxImages={1}
            onAdd={onPickQrImage}
            onPreview={onPickQrImage}
          />
        </FormField>

        <FormField label="备注（选填）">
          <TextareaField
            className="contact-settings-page__textarea"
            placeholder="如果需要联系您，有什么要提前说明的"
            cursorSpacing={cursorSpacing}
            maxlength={120}
            value={note}
            onInput={(event) => onNoteChange(event.detail.value)}
          />
        </FormField>
      </View>

      <SubmitActionBar
        className="contact-settings-page__bottom"
        iconSrc={submitArrowIcon}
        onTap={onSubmit}
      >
        保存
      </SubmitActionBar>
    </>
  );
}
