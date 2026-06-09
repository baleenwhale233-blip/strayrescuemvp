import { Input } from "@tarojs/components";
import { RescueCaseSummaryCard } from "../../../../components/rescue";
import {
  FormField,
  MoneyInput,
  SubmitActionBar,
  TextareaField,
  UploadStrip,
} from "../../../../components/ui";
import "./SupportClaimForm.scss";

export interface SupportClaimSummary {
  coverSrc: string;
  publicCaseId: string;
  rescueStartedAtLabel: string;
  statusLabel: string;
  title: string;
}

export function SupportClaimForm({
  amount,
  cursorSpacing,
  imagePath,
  nickname,
  note,
  summary,
  onAmountChange,
  onCoverError,
  onImageAdd,
  onImagePreview,
  onImageRemove,
  onNicknameChange,
  onNoteChange,
  onSubmit,
}: {
  amount: string;
  cursorSpacing: number;
  imagePath: string;
  nickname: string;
  note: string;
  summary: SupportClaimSummary;
  onAmountChange: (value: string) => void;
  onCoverError: () => void;
  onImageAdd: () => void;
  onImagePreview: (src: string) => void;
  onImageRemove: () => void;
  onNicknameChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <>
      <RescueCaseSummaryCard
        className="support-claim__case-summary"
        coverSrc={summary.coverSrc}
        mediaVariant="framed"
        publicCaseId={summary.publicCaseId}
        rescueStartedAtLabel={summary.rescueStartedAtLabel}
        statusLabel={summary.statusLabel}
        title={summary.title}
        onCoverError={onCoverError}
      />

      <FormField className="support-claim__field" label="支持金额">
        <MoneyInput value={amount} onValueChange={onAmountChange} />
      </FormField>

      <FormField className="support-claim__field" label="您的称呼">
        <Input
          className="support-claim__text-input"
          placeholder="昵称 / 称呼"
          value={nickname}
          onInput={(event) => onNicknameChange(event.detail.value)}
        />
      </FormField>

      <FormField
        className="support-claim__field support-claim__field--upload"
        label="支持截图/凭证"
      >
        <UploadStrip
          addIconName="imagePlus"
          addLabel="添加照片"
          className="support-claim__upload-strip"
          images={imagePath ? [imagePath] : []}
          maxImages={1}
          onAdd={onImageAdd}
          onPreview={onImagePreview}
          onRemove={onImageRemove}
        />
      </FormField>

      <FormField className="support-claim__field" label="备注">
        <TextareaField
          className="support-claim__textarea"
          placeholder="可补充留言、用途或对账备注"
          cursorSpacing={cursorSpacing}
          maxlength={120}
          value={note}
          onInput={(event) => onNoteChange(event.detail.value)}
        />
      </FormField>

      <SubmitActionBar iconName="send" onTap={onSubmit}>
        提交登记支持
      </SubmitActionBar>
    </>
  );
}
