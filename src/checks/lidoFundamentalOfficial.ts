import { LidoFundamentalOracle } from "@objectivelabs/oracle-sdk";

import { CheckResultWithId } from "./types";
import { CHECKS, failCheck, passCheck } from "./utils";

type Params = {
  adapter: LidoFundamentalOracle;
};

export function lidoFundamentalOfficial({ adapter }: Params): CheckResultWithId {
  if (
    adapter.chainId === 1 &&
    adapter.WSTETH === "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0" &&
    adapter.STETH === "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84" &&
    adapter.WETH === "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
  ) {
    return passCheck(
      CHECKS.OFFICIAL_LIDO_ORACLE,
      "Adapter is connected to the official Lido contracts on Ethereum.",
    );
  }
  return failCheck(
    CHECKS.OFFICIAL_LIDO_ORACLE,
    "Adapter is not connected to the official Lido addresses on Ethereum.",
  );
}
