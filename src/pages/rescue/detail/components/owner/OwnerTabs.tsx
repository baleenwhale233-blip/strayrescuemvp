import { RescueOwnerTabs } from "../../../../../components/RescueOwnerShared";
import type { DetailTab } from "../../types";

export function OwnerTabs({
  activeTab,
  onChange,
}: {
  activeTab: DetailTab;
  onChange: (tab: DetailTab) => void;
}) {
  return <RescueOwnerTabs activeTab={activeTab} onChange={onChange} />;
}
