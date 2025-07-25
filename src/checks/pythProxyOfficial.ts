import { PythOracle } from "@objectivelabs/oracle-sdk";
import { Address } from "viem";

import { CheckResultWithId } from "./types";
import { CHECKS, failCheck, passCheck } from "./utils";

type Params = {
  adapter: PythOracle;
  pythProxyAddress: Address;
};

export function pythProxyOfficial({ adapter, pythProxyAddress }: Params): CheckResultWithId {
  if (adapter.pyth === pythProxyAddress) {
    return passCheck(
      CHECKS.OFFICIAL_PYTH_PROXY,
      "Adapter is connected to the official Pyth proxy.",
    );
  } else {
    return failCheck(
      CHECKS.OFFICIAL_PYTH_PROXY,
      "Adapter is not connected to the official Pyth proxy.",
    );
  }
}
