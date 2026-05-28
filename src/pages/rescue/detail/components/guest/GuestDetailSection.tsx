import type { PublicDetailVM } from "../../../../../domain/canonical/types";
import { GuestDetailTimeline } from "../GuestDetailTimeline";

export function GuestDetailSection({ detail }: { detail: PublicDetailVM }) {
  return <GuestDetailTimeline detail={detail} />;
}
