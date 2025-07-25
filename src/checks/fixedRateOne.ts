import { Asset, FixedRateOracle } from "@objectivelabs/oracle-sdk";
import { formatUnits, parseUnits } from "viem";

import { CheckResultWithId } from "./types";
import { CHECKS, failCheck, passCheck } from "./utils";

type Params = {
  adapter: FixedRateOracle;
  quoteAsset?: Asset;
};

export function fixedRateOne({ adapter, quoteAsset }: Params): CheckResultWithId {
  try {
    if (adapter.rate === parseUnits("1", quoteAsset?.decimals ?? 18)) {
      return passCheck(CHECKS.FIXED_RATE_ONE, "Adapter has a fixed rate of 1.");
    }
    return failCheck(
      CHECKS.FIXED_RATE_ONE,
      `Adapter has an unusual fixed rate: ${formatUnits(adapter.rate, quoteAsset?.decimals ?? 18)}.`,
    );
  } catch (error) {
    console.error(error);
    return failCheck(CHECKS.FIXED_RATE_ONE, "Error checking fixed rate.");
  }
}
