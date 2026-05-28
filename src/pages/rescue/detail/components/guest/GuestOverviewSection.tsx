import type { PublicDetailVM } from "../../../../../domain/canonical/types";
import { GuestOverview } from "../GuestOverview";

export function GuestOverviewSection({ detail }: { detail: PublicDetailVM }) {
  return <GuestOverview detail={detail} />;
}
