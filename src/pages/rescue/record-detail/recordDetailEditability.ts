import type { RescueReadonlyRecordDetail } from "../../../components/rescue";
import type { CaseRecordDetailVM } from "../../../domain/canonical/repository";

export function canEditExpenseRecord(
  record?: Pick<RescueReadonlyRecordDetail, "editable" | "kind">,
  remoteRecord?: Pick<CaseRecordDetailVM, "editable">,
) {
  return record?.kind === "expense" && Boolean(record.editable || remoteRecord?.editable);
}
