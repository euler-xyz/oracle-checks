import { PythOracle } from "@objectivelabs/oracle-sdk";

import { CheckResultWithId } from "./types";
import { CHECKS, failCheck, passCheck } from "./utils";

type Params = {
  adapter: PythOracle;
  lowerBound: number;
  upperBound: number;
};

export function pythStalenessRange({ adapter, lowerBound, upperBound }: Params): CheckResultWithId {
  if (adapter.maxStaleness < lowerBound) {
    return failCheck(
      CHECKS.PYTH_STALENESS_RANGE,
      `The adapter's maximum staleness parameter (${adapter.maxStaleness} s) is too low. The recommended range is (${lowerBound} - ${upperBound} s).`,
    );
  } else if (adapter.maxStaleness > upperBound) {
    return failCheck(
      CHECKS.PYTH_STALENESS_RANGE,
      `The adapter's maximum staleness parameter (${adapter.maxStaleness} s) is too high. The recommended range is (${lowerBound} - ${upperBound} s).`,
    );
  } else {
    return passCheck(
      CHECKS.PYTH_STALENESS_RANGE,
      `The adapter's maximum staleness parameter is within the recommended range (${lowerBound} - ${upperBound} s).`,
    );
  }
}
