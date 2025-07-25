import { PendleMetadata, PendleOracle, PendleUniversalOracle } from "@objectivelabs/oracle-sdk";

import { CheckResultWithId } from "./types";
import { CHECKS, failCheck, passCheck } from "./utils";

type Params = {
  adapter: PendleOracle | PendleUniversalOracle;
  pendleMetadata: PendleMetadata | undefined;
};

export function pendlePoolOfficial({ adapter, pendleMetadata }: Params): {
  result: CheckResultWithId;
  label: string;
} {
  const matchingPendlePool = pendleMetadata?.find((pool) => pool.market === adapter.pendleMarket);
  if (matchingPendlePool) {
    return {
      result: passCheck(
        CHECKS.OFFICIAL_PENDLE_POOL,
        `Adapter is connected to an official Pendle pool: ${matchingPendlePool.symbol}.`,
      ),
      label: `${matchingPendlePool.symbol}`,
    };
  } else {
    return {
      result: failCheck(
        CHECKS.OFFICIAL_PENDLE_POOL,
        "Could not find matching Pendle pool in the official list.",
      ),
      label: `Unknown pool`,
    };
  }
}
