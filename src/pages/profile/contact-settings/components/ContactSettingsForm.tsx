import { Input, View } from "@tarojs/components";
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
              placeholder="填写微信号"
              placeholderStyle="color:var(--color-text-tertiary);"
              value={wechatId}
              onInput={(event) => onWechatIdChange(event.detail.value)}
            />
          </SurfaceCard>
        </FormField>

        <FormField label="微信二维码（二选一即可）">
          <UploadStrip
            addIconName="imagePlus"
            addLabel="添加二维码"
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
            placeholder="如果别人联系你，有什么要先说明？"
            cursorSpacing={cursorSpacing}
            maxlength={120}
            value={note}
            onInput={(event) => onNoteChange(event.detail.value)}
          />
        </FormField>
      </View>

      <SubmitActionBar
        className="contact-settings-page__bottom"
        iconName="arrowRight"
        onTap={onSubmit}
      >
        保存联系信息
      </SubmitActionBar>
    </>
  );
}
