import { CheckResultWithId } from "./types";
import { CHECKS, failCheck, passCheck } from "./utils";

type Params = {
  maxStaleness: bigint;
  heartbeat: number | undefined;
  minHeartbeatBuffer: number;
};

export function pushHeartbeat({
  maxStaleness,
  heartbeat,
  minHeartbeatBuffer,
}: Params): CheckResultWithId {
  if (!heartbeat) {
    return failCheck(CHECKS.PUSH_STALENESS_BUFFER, "Feed heartbeat is unknown");
  }
  if (maxStaleness < heartbeat + minHeartbeatBuffer) {
    return failCheck(
      CHECKS.PUSH_STALENESS_BUFFER,
      `Adapter's maximum staleness (${maxStaleness} s) is insufficient for the feed's heartbeat (${heartbeat} s). Minimum recommended value is ${
        heartbeat + minHeartbeatBuffer
      } s to ensure the adapter won't fail after the heartbeat condition is triggered.`,
    );
  }

  return passCheck(
    CHECKS.PUSH_STALENESS_BUFFER,
    `Adapter's maximum staleness (${maxStaleness} s) is sufficient for the feed's heartbeat (${heartbeat} s).`,
  );
}
