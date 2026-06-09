import { SegmentedTabs } from "../../../../../components/ui";
import type { DetailTab } from "../../types";
import "./GuestTabs.scss";

export function GuestTabs({
  activeTab,
  onChange,
}: {
  activeTab: DetailTab;
  onChange: (tab: DetailTab) => void;
}) {
  return (
    <SegmentedTabs
      className="detail-tabs"
      value={activeTab}
      items={[
        { label: "档案摘要", value: "overview" },
        { label: "档案详情", value: "detail" },
      ]}
      onChange={(value) => onChange(value as DetailTab)}
    />
  );
}
